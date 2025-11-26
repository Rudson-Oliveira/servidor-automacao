/**
 * SISTEMA IMUNOLÓGICO PREVENTIVO
 * ===============================
 * 
 * Detecta sintomas precoces de falhas e aplica correções preventivas
 * antes que se tornem crises críticas.
 * 
 * Baseado nas orientações do LLM (Gemini 2.5 Flash)
 * Implementa:
 * - Banco de Anticorpos (Knowledge Base)
 * - Detecção Precoce com EWMA (Exponentially Weighted Moving Average)
 * - Sistema de Feedback e Aprendizado
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { getDb } from "../db";
import { anticorpos, feedbackCorrecoes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./llm";

// ============================================================================
// TIPOS
// ============================================================================

export interface Symptom {
  metric: string;
  threshold: number;
  duration: string; // "5m", "10m", etc
}

export interface PreventiveFix {
  type: "limpar_cache" | "otimizar_query" | "reiniciar_servico" | "ajustar_config" | "escalar_recursos";
  params: Record<string, any>;
}

export interface Anticorpo {
  id: number;
  patternName: string;
  symptoms: Symptom[];
  rootCauseTags: string[];
  severity: "critico" | "alto" | "medio" | "baixo";
  preventiveFix: PreventiveFix;
  effectivenessScore: number;
  timesApplied: number;
  timesSuccessful: number;
  lastApplied: Date | null;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
}

export interface EWMAState {
  metric: string;
  ewma: number;
  variance: number;
  lastUpdate: Date;
}

// ============================================================================
// EWMA (Exponentially Weighted Moving Average)
// ============================================================================

/**
 * Classe para cálculo de EWMA (Média Móvel Exponencialmente Ponderada)
 * Dá mais peso aos dados recentes para detectar mudanças rapidamente
 */
class EWMACalculator {
  private states: Map<string, EWMAState> = new Map();
  private alpha: number; // Fator de suavização (0-1)

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  /**
   * Atualiza EWMA para uma métrica
   */
  update(metric: string, value: number): EWMAState {
    const state = this.states.get(metric);

    if (!state) {
      // Primeira observação
      const newState: EWMAState = {
        metric,
        ewma: value,
        variance: 0,
        lastUpdate: new Date(),
      };
      this.states.set(metric, newState);
      return newState;
    }

    // Atualizar EWMA: EWMA_t = α * X_t + (1 - α) * EWMA_{t-1}
    const newEWMA = this.alpha * value + (1 - this.alpha) * state.ewma;

    // Atualizar variância: Var_t = α * (X_t - EWMA_t)^2 + (1 - α) * Var_{t-1}
    const newVariance = this.alpha * Math.pow(value - newEWMA, 2) + (1 - this.alpha) * state.variance;

    const newState: EWMAState = {
      metric,
      ewma: newEWMA,
      variance: newVariance,
      lastUpdate: new Date(),
    };

    this.states.set(metric, newState);
    return newState;
  }

  /**
   * Verifica se métrica está em estado anormal (sintoma)
   * Retorna true se desvio > threshold * sigma
   */
  isAnomalous(metric: string, value: number, sigmaThreshold: number = 1.5): boolean {
    const state = this.states.get(metric);
    if (!state) return false;

    const sigma = Math.sqrt(state.variance);
    const deviation = Math.abs(value - state.ewma);

    return deviation > sigmaThreshold * sigma;
  }

  /**
   * Obtém estado atual de uma métrica
   */
  getState(metric: string): EWMAState | undefined {
    return this.states.get(metric);
  }
}

// ============================================================================
// SISTEMA IMUNOLÓGICO
// ============================================================================

export class SistemaImunologico {
  private ewmaCalculator: EWMACalculator;
  private symptomHistory: Map<string, Date[]> = new Map(); // Histórico de sintomas detectados

  constructor() {
    this.ewmaCalculator = new EWMACalculator(0.3);
  }

  /**
   * Carrega anticorpos do banco de dados
   */
  async carregarAnticorpos(): Promise<Anticorpo[]> {
    const db = await getDb();
    if (!db) return [];

    const rows = await db.select().from(anticorpos);

    return rows.map((row) => ({
      id: row.id,
      patternName: row.patternName,
      symptoms: JSON.parse(row.symptoms),
      rootCauseTags: JSON.parse(row.rootCauseTags),
      severity: row.severity,
      preventiveFix: JSON.parse(row.preventiveFix),
      effectivenessScore: row.effectivenessScore,
      timesApplied: row.timesApplied,
      timesSuccessful: row.timesSuccessful,
      lastApplied: row.lastApplied,
    }));
  }

  /**
   * Adiciona novo anticorpo ao banco de conhecimento
   */
  async adicionarAnticorpo(anticorpo: Omit<Anticorpo, "id" | "timesApplied" | "timesSuccessful" | "lastApplied">): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const result = await db.insert(anticorpos).values({
      patternName: anticorpo.patternName,
      symptoms: JSON.stringify(anticorpo.symptoms),
      rootCauseTags: JSON.stringify(anticorpo.rootCauseTags),
      severity: anticorpo.severity,
      preventiveFix: JSON.stringify(anticorpo.preventiveFix),
      effectivenessScore: anticorpo.effectivenessScore,
      timesApplied: 0,
      timesSuccessful: 0,
    });

    return result[0].insertId;
  }

  /**
   * Verifica sintomas e retorna ações preventivas recomendadas
   */
  async verificarSintomas(metricas: MetricData[]): Promise<{
    sintomasDetectados: string[];
    acoesRecomendadas: { anticorpo: Anticorpo; confianca: number }[];
  }> {
    const sintomasDetectados: string[] = [];
    const acoesRecomendadas: { anticorpo: Anticorpo; confianca: number }[] = [];

    // Atualizar EWMA para todas as métricas
    for (const metrica of metricas) {
      this.ewmaCalculator.update(metrica.name, metrica.value);
    }

    // Carregar anticorpos
    const todosAnticorpos = await this.carregarAnticorpos();

    // Verificar cada anticorpo
    for (const anticorpo of todosAnticorpos) {
      let sintomasEncontrados = 0;

      for (const sintoma of anticorpo.symptoms) {
        const metrica = metricas.find((m) => m.name === sintoma.metric);
        if (!metrica) continue;

        // Verificar se métrica está anômala
        const isAnomalo = this.ewmaCalculator.isAnomalous(sintoma.metric, metrica.value, 1.5);

        if (isAnomalo && metrica.value > sintoma.threshold) {
          // Verificar duração do sintoma
          const duracao = this.parseDuration(sintoma.duration);
          if (this.sintomaPersistePor(sintoma.metric, duracao)) {
            sintomasEncontrados++;
            sintomasDetectados.push(`${sintoma.metric} > ${sintoma.threshold} por ${sintoma.duration}`);
          }
        }
      }

      // Se encontrou todos os sintomas do padrão, recomendar ação
      if (sintomasEncontrados === anticorpo.symptoms.length) {
        acoesRecomendadas.push({
          anticorpo,
          confianca: anticorpo.effectivenessScore,
        });
      }
    }

    // Ordenar por confiança (effectiveness score)
    acoesRecomendadas.sort((a, b) => b.confianca - a.confianca);

    return {
      sintomasDetectados,
      acoesRecomendadas,
    };
  }

  /**
   * Aplica correção preventiva
   */
  async aplicarCorrecaoPreventiva(anticorpo: Anticorpo, erroId: string): Promise<{
    sucesso: boolean;
    tempoExecucao: number;
    observacoes: string;
  }> {
    const inicio = Date.now();
    let sucesso = false;
    let observacoes = "";

    try {
      const fix = anticorpo.preventiveFix;

      switch (fix.type) {
        case "limpar_cache":
          // Forçar garbage collection
          if (global.gc) {
            global.gc();
            sucesso = true;
            observacoes = "Cache limpo com garbage collection";
          } else {
            observacoes = "Garbage collection não disponível";
          }
          break;

        case "otimizar_query":
          // Placeholder - implementar otimização de queries
          observacoes = "Otimização de query não implementada ainda";
          break;

        case "reiniciar_servico":
          // Placeholder - implementar reinicialização de serviços
          observacoes = "Reinicialização de serviço não implementada ainda";
          break;

        case "ajustar_config":
          // Placeholder - implementar ajuste de configurações
          observacoes = "Ajuste de configuração não implementado ainda";
          break;

        case "escalar_recursos":
          // Placeholder - implementar escalamento de recursos
          observacoes = "Escalamento de recursos não implementado ainda";
          break;

        default:
          observacoes = `Tipo de correção desconhecido: ${fix.type}`;
      }

      // Atualizar estatísticas do anticorpo
      const db = await getDb();
      if (db) {
        await db
          .update(anticorpos)
          .set({
            timesApplied: anticorpo.timesApplied + 1,
            timesSuccessful: sucesso ? anticorpo.timesSuccessful + 1 : anticorpo.timesSuccessful,
            lastApplied: new Date(),
          })
          .where(eq(anticorpos.id, anticorpo.id));
      }

      // Registrar feedback
      await this.registrarFeedback({
        anticorpoId: anticorpo.id,
        erroId,
        tipoCorrecao: fix.type,
        sucesso,
        tempoExecucao: Date.now() - inicio,
        metricasAntes: {}, // TODO: capturar métricas antes
        metricasDepois: sucesso ? {} : null, // TODO: capturar métricas depois
        rollback: false,
        observacoes,
      });

      return {
        sucesso,
        tempoExecucao: Date.now() - inicio,
        observacoes,
      };
    } catch (error) {
      const tempoExecucao = Date.now() - inicio;
      const observacoesErro = error instanceof Error ? error.message : "Erro desconhecido";

      // Registrar feedback de falha
      await this.registrarFeedback({
        anticorpoId: anticorpo.id,
        erroId,
        tipoCorrecao: anticorpo.preventiveFix.type,
        sucesso: false,
        tempoExecucao,
        metricasAntes: {},
        metricasDepois: null,
        rollback: false,
        observacoes: observacoesErro,
      });

      return {
        sucesso: false,
        tempoExecucao,
        observacoes: observacoesErro,
      };
    }
  }

  /**
   * Registra feedback de correção para aprendizado
   */
  async registrarFeedback(feedback: {
    anticorpoId: number | null;
    erroId: string;
    tipoCorrecao: string;
    sucesso: boolean;
    tempoExecucao: number;
    metricasAntes: Record<string, any>;
    metricasDepois: Record<string, any> | null;
    rollback: boolean;
    observacoes: string;
  }): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(feedbackCorrecoes).values({
      anticorpoId: feedback.anticorpoId,
      erroId: feedback.erroId,
      tipoCorrecao: feedback.tipoCorrecao,
      sucesso: feedback.sucesso,
      tempoExecucao: feedback.tempoExecucao,
      metricasAntes: JSON.stringify(feedback.metricasAntes),
      metricasDepois: feedback.metricasDepois ? JSON.stringify(feedback.metricasDepois) : null,
      rollback: feedback.rollback,
      observacoes: feedback.observacoes,
    });
  }

  /**
   * Atualiza effectiveness score de um anticorpo baseado em feedback
   */
  async atualizarEfetividade(anticorpoId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const anticorpo = await db.select().from(anticorpos).where(eq(anticorpos.id, anticorpoId)).limit(1);

    if (anticorpo.length === 0) return;

    const { timesApplied, timesSuccessful } = anticorpo[0];

    if (timesApplied === 0) return;

    // Calcular novo effectiveness score
    const novoScore = timesSuccessful / timesApplied;

    await db.update(anticorpos).set({ effectivenessScore: novoScore }).where(eq(anticorpos.id, anticorpoId));
  }

  /**
   * Aprende novo padrão de erro usando LLM
   */
  async aprenderNovoPadrao(erro: {
    mensagem: string;
    stackTrace: string;
    metricas: Record<string, number>;
  }): Promise<Anticorpo | null> {
    try {
      const prompt = `Analise este erro e sugira um padrão de detecção precoce e correção preventiva:

**Erro:**
${erro.mensagem}

**Stack Trace:**
${erro.stackTrace}

**Métricas no momento do erro:**
${JSON.stringify(erro.metricas, null, 2)}

Retorne um JSON com:
{
  "patternName": "nome_descritivo_do_padrao",
  "symptoms": [{"metric": "nome_metrica", "threshold": valor, "duration": "5m"}],
  "rootCauseTags": ["tag1", "tag2"],
  "severity": "critico|alto|medio|baixo",
  "preventiveFix": {"type": "limpar_cache|otimizar_query|reiniciar_servico|ajustar_config|escalar_recursos", "params": {}}
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de erros e criação de padrões de detecção preventiva.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "error_pattern",
            strict: true,
            schema: {
              type: "object",
              properties: {
                patternName: { type: "string" },
                symptoms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      threshold: { type: "number" },
                      duration: { type: "string" },
                    },
                    required: ["metric", "threshold", "duration"],
                    additionalProperties: false,
                  },
                },
                rootCauseTags: {
                  type: "array",
                  items: { type: "string" },
                },
                severity: {
                  type: "string",
                  enum: ["critico", "alto", "medio", "baixo"],
                },
                preventiveFix: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    params: { type: "object" },
                  },
                  required: ["type", "params"],
                  additionalProperties: false,
                },
              },
              required: ["patternName", "symptoms", "rootCauseTags", "severity", "preventiveFix"],
              additionalProperties: false,
            },
          },
        },
      });

      const conteudo = response.choices[0].message.content;
      if (!conteudo || typeof conteudo !== 'string') return null;

      const padrao = JSON.parse(conteudo);

      // Adicionar ao banco de conhecimento
      const id = await this.adicionarAnticorpo({
        ...padrao,
        effectivenessScore: 0.5, // Score inicial neutro
      });

      return {
        id,
        ...padrao,
        timesApplied: 0,
        timesSuccessful: 0,
        lastApplied: null,
      };
    } catch (error) {
      console.error("[Sistema Imunológico] Erro ao aprender novo padrão:", error);
      return null;
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Converte string de duração para milissegundos
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  /**
   * Verifica se sintoma persiste por duração mínima
   */
  private sintomaPersistePor(metric: string, duracao: number): boolean {
    const historico = this.symptomHistory.get(metric) || [];
    const agora = new Date();

    // Adicionar detecção atual
    historico.push(agora);

    // Remover detecções antigas (fora da janela de duração)
    const historicoRecente = historico.filter((timestamp) => agora.getTime() - timestamp.getTime() < duracao);

    this.symptomHistory.set(metric, historicoRecente);

    // Sintoma persiste se há pelo menos 2 detecções na janela
    return historicoRecente.length >= 2;
  }
}

// ============================================================================
// EXPORTAR INSTÂNCIA SINGLETON
// ============================================================================

export const sistemaImunologico = new SistemaImunologico();
