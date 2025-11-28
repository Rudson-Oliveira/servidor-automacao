import * as tf from "@tensorflow/tfjs-node";
import { getDb } from "../db";
import { telemetryMetrics, mlPredictions } from "../../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

/**
 * Serviço de Machine Learning Preditivo
 * 
 * Funcionalidades:
 * - Treinamento de modelo LSTM para séries temporais
 * - Predição de anomalias em CPU/memória
 * - Retreinamento automático com novos dados
 * - Avaliação de acurácia do modelo
 * - Persistência do modelo treinado
 */

interface TimeSeriesData {
  timestamps: number[];
  values: number[];
}

interface PredictionResult {
  timestamp: number;
  predictedValue: number;
  confidence: number;
  isAnomaly: boolean;
  threshold: number;
}

interface ModelMetrics {
  loss: number;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  accuracy: number;
}

// Configurações do modelo
const MODEL_CONFIG = {
  sequenceLength: 20, // Número de pontos históricos para predição
  predictionHorizon: 5, // Quantos pontos à frente prever
  lstmUnits: 50,
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
  anomalyThreshold: 2.0, // Desvios padrão para considerar anomalia
};

const MODEL_PATH = "/home/ubuntu/servidor-automacao/ml-models";

/**
 * Normaliza dados para range [0, 1]
 */
function normalizeData(data: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const normalized = data.map((val) => (val - min) / range);

  return { normalized, min, max };
}

/**
 * Desnormaliza dados
 */
function denormalizeData(normalized: number[], min: number, max: number): number[] {
  const range = max - min;
  return normalized.map((val) => val * range + min);
}

/**
 * Cria sequências de treinamento (sliding window)
 */
function createSequences(
  data: number[],
  sequenceLength: number,
  predictionHorizon: number
): { inputs: number[][]; outputs: number[] } {
  const inputs: number[][] = [];
  const outputs: number[] = [];

  for (let i = 0; i < data.length - sequenceLength - predictionHorizon + 1; i++) {
    inputs.push(data.slice(i, i + sequenceLength));
    outputs.push(data[i + sequenceLength + predictionHorizon - 1]);
  }

  return { inputs, outputs };
}

/**
 * Cria modelo LSTM
 */
function createLSTMModel(sequenceLength: number): tf.Sequential {
  const model = tf.sequential();

  // Camada LSTM
  model.add(
    tf.layers.lstm({
      units: MODEL_CONFIG.lstmUnits,
      returnSequences: false,
      inputShape: [sequenceLength, 1],
    })
  );

  // Dropout para evitar overfitting
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // Camada densa de saída
  model.add(tf.layers.dense({ units: 1 }));

  // Compilar modelo
  model.compile({
    optimizer: tf.train.adam(MODEL_CONFIG.learningRate),
    loss: "meanSquaredError",
    metrics: ["mae"],
  });

  return model;
}

/**
 * Treina modelo com dados históricos
 */
export async function trainModel(
  metricName: string,
  component: string = "system"
): Promise<ModelMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  // 1. Buscar dados históricos (últimos 1000 pontos)
  const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias

  const metrics = await db
    .select()
    .from(telemetryMetrics)
    .where(
      eq(telemetryMetrics.name, metricName)
    )
    .orderBy(desc(telemetryMetrics.timestamp))
    .limit(1000);

  if (metrics.length < MODEL_CONFIG.sequenceLength + MODEL_CONFIG.predictionHorizon) {
    throw new Error(`Dados insuficientes para treinamento (mínimo: ${MODEL_CONFIG.sequenceLength + MODEL_CONFIG.predictionHorizon})`);
  }

  // 2. Preparar dados
  const values = metrics.reverse().map((m) => m.value);
  const { normalized, min, max } = normalizeData(values);

  // 3. Criar sequências
  const { inputs, outputs } = createSequences(
    normalized,
    MODEL_CONFIG.sequenceLength,
    MODEL_CONFIG.predictionHorizon
  );

  // 4. Converter para tensores
  const inputTensor = tf.tensor3d(
    inputs.map((seq) => seq.map((val) => [val])),
    [inputs.length, MODEL_CONFIG.sequenceLength, 1]
  );

  const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

  // 5. Dividir em treino e validação (80/20)
  const splitIndex = Math.floor(inputs.length * 0.8);

  const trainX = inputTensor.slice([0, 0, 0], [splitIndex, -1, -1]);
  const trainY = outputTensor.slice([0, 0], [splitIndex, -1]);

  const valX = inputTensor.slice([splitIndex, 0, 0], [-1, -1, -1]);
  const valY = outputTensor.slice([splitIndex, 0], [-1, -1]);

  // 6. Criar e treinar modelo
  const model = createLSTMModel(MODEL_CONFIG.sequenceLength);

  console.log(`[ML] Iniciando treinamento para ${metricName}...`);

  const history = await model.fit(trainX, trainY, {
    epochs: MODEL_CONFIG.epochs,
    batchSize: MODEL_CONFIG.batchSize,
    validationData: [valX, valY],
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`[ML] Epoch ${epoch}: loss=${logs?.loss.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}`);
        }
      },
    },
  });

  // 7. Avaliar modelo
  const evaluation = model.evaluate(valX, valY) as tf.Scalar[];
  const loss = await evaluation[0].data();
  const mae = await evaluation[1].data();

  // Calcular RMSE
  const rmse = Math.sqrt(loss[0]);

  // Calcular acurácia (baseado em threshold de erro)
  const predictions = model.predict(valX) as tf.Tensor;
  const predValues = await predictions.data();
  const actualValues = await valY.data();

  let correct = 0;
  const threshold = 0.1; // 10% de erro aceitável

  for (let i = 0; i < predValues.length; i++) {
    const error = Math.abs(predValues[i] - actualValues[i]);
    if (error < threshold) correct++;
  }

  const accuracy = correct / predValues.length;

  // 8. Salvar modelo
  const modelPath = `file://${MODEL_PATH}/${metricName}-${component}`;
  await model.save(modelPath);

  console.log(`[ML] Modelo treinado e salvo em ${modelPath}`);
  console.log(`[ML] Métricas: loss=${loss[0].toFixed(4)}, mae=${mae[0].toFixed(4)}, rmse=${rmse.toFixed(4)}, accuracy=${(accuracy * 100).toFixed(2)}%`);

  // 9. Limpar memória
  inputTensor.dispose();
  outputTensor.dispose();
  trainX.dispose();
  trainY.dispose();
  valX.dispose();
  valY.dispose();
  predictions.dispose();
  model.dispose();

  return {
    loss: loss[0],
    mae: mae[0],
    rmse,
    accuracy,
  };
}

/**
 * Carrega modelo treinado
 */
async function loadModel(metricName: string, component: string = "system"): Promise<tf.LayersModel | null> {
  try {
    const modelPath = `file://${MODEL_PATH}/${metricName}-${component}`;
    return await tf.loadLayersModel(`${modelPath}/model.json`);
  } catch (error) {
    console.warn(`[ML] Modelo não encontrado para ${metricName}-${component}`);
    return null;
  }
}

/**
 * Faz predição usando modelo treinado
 */
export async function predict(
  metricName: string,
  component: string = "system"
): Promise<PredictionResult[]> {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  // 1. Carregar modelo
  let model = await loadModel(metricName, component);

  // Se modelo não existe, treinar primeiro
  if (!model) {
    console.log(`[ML] Modelo não encontrado, treinando...`);
    await trainModel(metricName, component);
    model = await loadModel(metricName, component);

    if (!model) {
      throw new Error("Falha ao treinar modelo");
    }
  }

  // 2. Buscar dados recentes
  const metrics = await db
    .select()
    .from(telemetryMetrics)
    .where(eq(telemetryMetrics.name, metricName))
    .orderBy(desc(telemetryMetrics.timestamp))
    .limit(MODEL_CONFIG.sequenceLength);

  if (metrics.length < MODEL_CONFIG.sequenceLength) {
    throw new Error(`Dados insuficientes para predição (mínimo: ${MODEL_CONFIG.sequenceLength})`);
  }

  // 3. Preparar dados
  const values = metrics.reverse().map((m) => m.value);
  const { normalized, min, max } = normalizeData(values);

  // 4. Criar tensor de entrada
  const inputSequence = normalized.map((val) => [val]);
  const inputTensor = tf.tensor3d([inputSequence], [1, MODEL_CONFIG.sequenceLength, 1]);

  // 5. Fazer predição
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const predValue = await prediction.data();

  // 6. Desnormalizar
  const denormalized = denormalizeData([predValue[0]], min, max);
  const predictedValue = denormalized[0];

  // 7. Calcular confiança (baseado em variância dos dados)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - predictedValue, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0, Math.min(1, 1 - stdDev / (max - min)));

  // 8. Detectar anomalia
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const threshold = mean + MODEL_CONFIG.anomalyThreshold * stdDev;
  const isAnomaly = predictedValue > threshold;

  // 9. Salvar predição no banco
  const now = Date.now();
  const futureTimestamp = now + MODEL_CONFIG.predictionHorizon * 60 * 1000; // 5 minutos à frente

  await db.insert(mlPredictions).values({
    metricName,
    component,
    predictedValue,
    confidence,
    isAnomaly,
    threshold,
    predictedAt: new Date(now),
    predictedFor: new Date(futureTimestamp),
    actualValue: null, // Será preenchido quando o valor real chegar
  });

  // 10. Limpar memória
  inputTensor.dispose();
  prediction.dispose();
  model.dispose();

  return [
    {
      timestamp: futureTimestamp,
      predictedValue,
      confidence,
      isAnomaly,
      threshold,
    },
  ];
}

/**
 * Retreina modelo automaticamente se acurácia cair
 */
export async function autoRetrain(metricName: string, component: string = "system"): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Buscar predições recentes e comparar com valores reais
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h

  const predictions = await db
    .select()
    .from(mlPredictions)
    .where(
      and(
        eq(mlPredictions.metricName, metricName),
        eq(mlPredictions.component, component),
        gte(mlPredictions.predictedAt, cutoffTime)
      )
    )
    .limit(100);

  if (predictions.length < 10) {
    return false; // Dados insuficientes
  }

  // Calcular acurácia real
  let correct = 0;
  let total = 0;

  for (const pred of predictions) {
    if (pred.actualValue !== null) {
      total++;
      const error = Math.abs(pred.predictedValue - pred.actualValue) / pred.predictedValue;
      if (error < 0.1) correct++; // 10% de erro aceitável
    }
  }

  const accuracy = total > 0 ? correct / total : 1;

  console.log(`[ML] Acurácia atual: ${(accuracy * 100).toFixed(2)}%`);

  // Se acurácia < 70%, retreinar
  if (accuracy < 0.7) {
    console.log(`[ML] Acurácia baixa (${(accuracy * 100).toFixed(2)}%), retreinando modelo...`);
    await trainModel(metricName, component);
    return true;
  }

  return false;
}

/**
 * Atualiza predição com valor real
 */
export async function updatePredictionWithActual(
  predictionId: number,
  actualValue: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(mlPredictions)
    .set({ actualValue })
    .where(eq(mlPredictions.id, predictionId));
}
