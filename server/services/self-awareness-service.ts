/**
 * Serviço de Auto-Conhecimento
 * 
 * Permite ao sistema analisar seu próprio código, performance e comportamento
 * para identificar oportunidades de melhoria e otimização.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { getDb } from '../db';
import { telemetryMetrics, telemetryEvents } from '../../drizzle/schema';
import { desc, sql, and, gte } from 'drizzle-orm';

interface CodeAnalysis {
  totalFiles: number;
  totalLines: number;
  filesByType: Record<string, number>;
  largestFiles: Array<{ path: string; lines: number }>;
  duplicateCode: Array<{ pattern: string; occurrences: number }>;
  complexity: {
    high: number;
    medium: number;
    low: number;
  };
}

interface PerformanceInsights {
  slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
  mostUsedEndpoints: Array<{ endpoint: string; count: number }>;
  errorProneEndpoints: Array<{ endpoint: string; errorRate: number }>;
  peakUsageHours: number[];
}

interface OptimizationSuggestions {
  caching: Array<{ endpoint: string; reason: string; estimatedImprovement: string }>;
  indexing: Array<{ table: string; column: string; reason: string }>;
  refactoring: Array<{ file: string; issue: string; suggestion: string }>;
  architecture: Array<{ component: string; issue: string; suggestion: string }>;
}

/**
 * Analisa estrutura do código-fonte
 */
export async function analyzeCodebase(): Promise<CodeAnalysis> {
  const projectRoot = path.join(__dirname, '../..');
  console.log('[Self-Awareness] Analisando projeto em:', projectRoot);
  const analysis: CodeAnalysis = {
    totalFiles: 0,
    totalLines: 0,
    filesByType: {},
    largestFiles: [],
    duplicateCode: [],
    complexity: { high: 0, medium: 0, low: 0 },
  };

  async function analyzeDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Ignorar node_modules, .git, dist, etc
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'ml-models') {
        continue;
      }

      if (entry.isDirectory()) {
        await analyzeDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        
        // Analisar apenas arquivos de código
        if (['.ts', '.tsx', '.js', '.jsx', '.sql', '.json'].includes(ext)) {
          analysis.totalFiles++;
          
          // Contar por tipo
          analysis.filesByType[ext] = (analysis.filesByType[ext] || 0) + 1;

          // Contar linhas
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n').length;
          analysis.totalLines += lines;

          // Rastrear arquivos grandes
          const relativePath = path.relative(projectRoot, fullPath);
          analysis.largestFiles.push({ path: relativePath, lines });

          // Análise de complexidade simples (baseado em tamanho)
          if (lines > 500) analysis.complexity.high++;
          else if (lines > 200) analysis.complexity.medium++;
          else analysis.complexity.low++;
        }
      }
    }
  }

  await analyzeDirectory(projectRoot);

  // Ordenar maiores arquivos
  analysis.largestFiles.sort((a, b) => b.lines - a.lines);
  analysis.largestFiles = analysis.largestFiles.slice(0, 10);

  return analysis;
}

/**
 * Analisa performance e uso do sistema
 */
export async function analyzePerformance(daysBack: number = 7): Promise<PerformanceInsights> {
  const db = await getDb();
  if (!db) throw new Error("Database não disponível");

  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  // Buscar métricas de API
  const apiMetrics = await db
    .select()
    .from(telemetryMetrics)
    .where(
      and(
        gte(telemetryMetrics.timestamp, cutoffDate),
        sql`${telemetryMetrics.name} LIKE 'api.%'`
      )
    )
    .orderBy(desc(telemetryMetrics.timestamp))
    .limit(10000);

  // Agrupar por endpoint
  const endpointStats: Record<string, { times: number[]; errors: number; total: number }> = {};

  for (const metric of apiMetrics) {
    const tags = metric.tags as any;
    const endpoint = tags?.endpoint || 'unknown';

    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = { times: [], errors: 0, total: 0 };
    }

    endpointStats[endpoint].total++;

    if (metric.name === 'api.response_time') {
      endpointStats[endpoint].times.push(Number(metric.value));
    } else if (metric.name === 'api.error') {
      endpointStats[endpoint].errors++;
    }
  }

  // Calcular insights
  const slowestEndpoints = Object.entries(endpointStats)
    .map(([endpoint, stats]) => ({
      endpoint,
      avgTime: stats.times.length > 0 
        ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length 
        : 0,
    }))
    .filter(e => e.avgTime > 0)
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10);

  const mostUsedEndpoints = Object.entries(endpointStats)
    .map(([endpoint, stats]) => ({
      endpoint,
      count: stats.total,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const errorProneEndpoints = Object.entries(endpointStats)
    .map(([endpoint, stats]) => ({
      endpoint,
      errorRate: stats.total > 0 ? stats.errors / stats.total : 0,
    }))
    .filter(e => e.errorRate > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 10);

  // Análise de horários de pico (simplificado)
  const peakUsageHours = [9, 10, 11, 14, 15, 16]; // Horário comercial típico

  return {
    slowestEndpoints,
    mostUsedEndpoints,
    errorProneEndpoints,
    peakUsageHours,
  };
}

/**
 * Gera sugestões de otimização baseadas em análises
 */
export async function generateOptimizationSuggestions(
  codeAnalysis: CodeAnalysis,
  performanceInsights: PerformanceInsights
): Promise<OptimizationSuggestions> {
  const suggestions: OptimizationSuggestions = {
    caching: [],
    indexing: [],
    refactoring: [],
    architecture: [],
  };

  // Sugestões de cache para endpoints mais usados
  for (const endpoint of performanceInsights.mostUsedEndpoints.slice(0, 5)) {
    if (endpoint.count > 100) {
      suggestions.caching.push({
        endpoint: endpoint.endpoint,
        reason: `Endpoint chamado ${endpoint.count} vezes - candidato a cache`,
        estimatedImprovement: '30-50% redução de latência',
      });
    }
  }

  // Sugestões de indexação para endpoints lentos
  for (const endpoint of performanceInsights.slowestEndpoints.slice(0, 3)) {
    if (endpoint.avgTime > 500) {
      suggestions.indexing.push({
        table: 'telemetry_metrics',
        column: 'timestamp, name',
        reason: `Endpoint ${endpoint.endpoint} lento (${endpoint.avgTime.toFixed(0)}ms) - provavelmente query sem índice`,
      });
    }
  }

  // Sugestões de refactoring para arquivos grandes
  for (const file of codeAnalysis.largestFiles.slice(0, 3)) {
    if (file.lines > 500) {
      suggestions.refactoring.push({
        file: file.path,
        issue: `Arquivo muito grande (${file.lines} linhas)`,
        suggestion: 'Considere dividir em módulos menores ou extrair lógica para serviços separados',
      });
    }
  }

  // Sugestões de arquitetura
  if (codeAnalysis.complexity.high > 10) {
    suggestions.architecture.push({
      component: 'Codebase',
      issue: `${codeAnalysis.complexity.high} arquivos com alta complexidade`,
      suggestion: 'Considere aplicar padrões de design (Repository, Service Layer) para reduzir complexidade',
    });
  }

  if (performanceInsights.errorProneEndpoints.length > 5) {
    suggestions.architecture.push({
      component: 'Error Handling',
      issue: `${performanceInsights.errorProneEndpoints.length} endpoints com taxa de erro significativa`,
      suggestion: 'Implementar retry automático, circuit breaker e melhor tratamento de erros',
    });
  }

  return suggestions;
}

/**
 * Executa análise completa de auto-conhecimento
 */
export async function runSelfAwarenessAnalysis() {
  console.log('[Self-Awareness] Iniciando análise completa...');

  const codeAnalysis = await analyzeCodebase();
  console.log(`[Self-Awareness] Código analisado: ${codeAnalysis.totalFiles} arquivos, ${codeAnalysis.totalLines} linhas`);

  const performanceInsights = await analyzePerformance(7);
  console.log(`[Self-Awareness] Performance analisada: ${performanceInsights.mostUsedEndpoints.length} endpoints`);

  const suggestions = await generateOptimizationSuggestions(codeAnalysis, performanceInsights);
  console.log(`[Self-Awareness] Geradas ${suggestions.caching.length + suggestions.indexing.length + suggestions.refactoring.length + suggestions.architecture.length} sugestões`);

  return {
    codeAnalysis,
    performanceInsights,
    suggestions,
    timestamp: new Date(),
  };
}
