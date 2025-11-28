/**
 * Script para gerar dados sintéticos de telemetria
 * Usado para treinar modelos ML quando não há dados históricos suficientes
 */

import { getDb } from "../db";
import { telemetryMetrics } from "../../drizzle/schema";

/**
 * Gera série temporal sintética com padrão realista
 */
function generateTimeSeriesData(
  baseValue: number,
  variance: number,
  trend: number,
  seasonality: number,
  points: number
): number[] {
  const data: number[] = [];
  
  for (let i = 0; i < points; i++) {
    // Tendência linear
    const trendValue = trend * i;
    
    // Sazonalidade (ciclo de 24 pontos = 1 dia se coletado a cada hora)
    const seasonalValue = seasonality * Math.sin((2 * Math.PI * i) / 24);
    
    // Ruído aleatório
    const noise = (Math.random() - 0.5) * variance;
    
    // Valor final
    const value = Math.max(0, baseValue + trendValue + seasonalValue + noise);
    
    data.push(value);
  }
  
  return data;
}

/**
 * Insere dados sintéticos no banco
 */
async function seedTelemetryData() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database não disponível");
  }

  console.log("[Seed] Gerando dados sintéticos de telemetria...");

  const now = Date.now();
  const intervalMs = 30 * 1000; // 30 segundos entre cada ponto
  const pointsToGenerate = 100; // 100 pontos = ~50 minutos de dados

  // Gerar dados para CPU Usage (0-100%)
  console.log("[Seed] Gerando cpu_usage...");
  const cpuData = generateTimeSeriesData(
    45, // Base: 45%
    15, // Variância: ±15%
    0.05, // Tendência: +0.05% por ponto
    10, // Sazonalidade: ±10%
    pointsToGenerate
  );

  const cpuRecords = cpuData.map((value, index) => ({
    name: "cpu_usage",
    type: "gauge" as const,
    value: value.toFixed(2),
    unit: "percent",
    tags: JSON.stringify({ component: "system" }),
    timestamp: new Date(now - (pointsToGenerate - index) * intervalMs),
  }));

  await db.insert(telemetryMetrics).values(cpuRecords);
  console.log(`[Seed] ✅ Inseridos ${cpuRecords.length} pontos de cpu_usage`);

  // Gerar dados para Memory Usage (0-100%)
  console.log("[Seed] Gerando memory_usage...");
  const memoryData = generateTimeSeriesData(
    60, // Base: 60%
    12, // Variância: ±12%
    0.08, // Tendência: +0.08% por ponto (memória tende a crescer)
    8, // Sazonalidade: ±8%
    pointsToGenerate
  );

  const memoryRecords = memoryData.map((value, index) => ({
    name: "memory_usage",
    type: "gauge" as const,
    value: value.toFixed(2),
    unit: "percent",
    tags: JSON.stringify({ component: "system" }),
    timestamp: new Date(now - (pointsToGenerate - index) * intervalMs),
  }));

  await db.insert(telemetryMetrics).values(memoryRecords);
  console.log(`[Seed] ✅ Inseridos ${memoryRecords.length} pontos de memory_usage`);

  console.log("[Seed] ✅ Dados sintéticos gerados com sucesso!");
  console.log(`[Seed] Total: ${cpuRecords.length + memoryRecords.length} registros`);
  console.log(`[Seed] Período: ${new Date(now - pointsToGenerate * intervalMs).toLocaleString()} até ${new Date(now).toLocaleString()}`);
}

// Executar se chamado diretamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedTelemetryData()
    .then(() => {
      console.log("[Seed] Concluído!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[Seed] Erro:", error);
      process.exit(1);
    });
}

export { seedTelemetryData };
