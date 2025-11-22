/**
 * Sistema Anti-Alucinação
 * 
 * Este módulo detecta e previne respostas fictícias/alucinadas,
 * garantindo que apenas dados reais sejam reportados.
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

// Tabela de auditoria de execuções
export interface AuditLog {
  id?: number;
  timestamp: Date;
  endpoint: string;
  input: string;
  output: string;
  validationScore: number;
  isHallucination: boolean;
  realDataVerified: boolean;
  discrepancies: string[];
  executionTimeMs: number;
}

// Padrões conhecidos de alucinações
const HALLUCINATION_PATTERNS = [
  // Arquivos fictícios comuns
  'arquivo_teste_1.txt',
  'documento_importante.md',
  'config_sistema.json',
  'imagem_teste.png',
  'relatorio_dados.xlsx',
  'backup_projeto.zip',
  
  // Frases genéricas
  'Este é um arquivo de teste',
  'Documentação de Integração',
  'COMET_MANUS_INTEGRATION',
  
  // Timestamps suspeitos (muito precisos ou padrão)
  '3.247 segundos',
  '98.2%',
  'Taxa de Sucesso: 98.2%',
];

// Blacklist de nomes de arquivos fictícios
const FAKE_FILE_BLACKLIST = new Set([
  'arquivo_teste_1.txt',
  'documento_importante.md',
  'config_sistema.json',
  'imagem_teste.png',
  'relatorio_dados.xlsx',
  'backup_projeto.zip',
  'exemplo.txt',
  'teste.md',
  'sample.json',
]);

/**
 * Detecta se uma resposta contém alucinações
 */
export function detectHallucination(response: string): {
  isHallucination: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let suspicionScore = 0;
  
  // Verificar padrões conhecidos de alucinação
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (response.includes(pattern)) {
      reasons.push(`Padrão de alucinação detectado: "${pattern}"`);
      suspicionScore += 20;
    }
  }
  
  // Verificar arquivos na blacklist
  for (const fakeFile of Array.from(FAKE_FILE_BLACKLIST)) {
    if (response.includes(fakeFile)) {
      reasons.push(`Arquivo fictício detectado: "${fakeFile}"`);
      suspicionScore += 30;
    }
  }
  
  // Verificar múltiplos arquivos com tamanhos muito redondos
  const sizeMatches = response.match(/(\d+\.?\d*)\s*(KB|MB|GB)/gi);
  if (sizeMatches && sizeMatches.length > 3) {
    const roundSizes = sizeMatches.filter(m => {
      const num = parseFloat(m);
      return num === Math.round(num) || num.toString().endsWith('.0');
    });
    if (roundSizes.length > 2) {
      reasons.push('Múltiplos tamanhos de arquivo suspeitos (muito redondos)');
      suspicionScore += 15;
    }
  }
  
  // Verificar timestamps muito precisos
  if (response.match(/\d+\.\d{3}\s*segundos/)) {
    reasons.push('Timestamp muito preciso (suspeito)');
    suspicionScore += 10;
  }
  
  // Verificar estrutura muito perfeita (JSON formatado, markdown perfeito)
  const jsonBlocks = response.match(/```json[\s\S]*?```/g);
  const mdBlocks = response.match(/```markdown[\s\S]*?```/g);
  if (jsonBlocks && jsonBlocks.length > 1) {
    reasons.push('Múltiplos blocos JSON formatados (suspeito)');
    suspicionScore += 15;
  }
  
  const confidence = Math.min(suspicionScore, 100);
  const isHallucination = confidence >= 50;
  
  return {
    isHallucination,
    confidence,
    reasons,
  };
}

/**
 * Valida se um arquivo realmente existe
 */
export async function validateFileExists(filePath: string): Promise<boolean> {
  // Esta função deve ser implementada para verificar arquivos reais
  // Por enquanto, retorna false para forçar validação real
  
  // TODO: Implementar verificação real de arquivos
  // Opções:
  // 1. Usar fs.existsSync() se tiver acesso ao sistema de arquivos
  // 2. Consultar banco de dados de arquivos indexados
  // 3. Chamar API externa de validação
  
  return false; // Forçar falha até implementar validação real
}

/**
 * Calcula score de confiabilidade de uma resposta
 */
export function calculateConfidenceScore(response: string, metadata: {
  executionTimeMs: number;
  filesReported: number;
  filesValidated: number;
}): number {
  let score = 100;
  
  // Penalizar por alucinações detectadas
  const hallucination = detectHallucination(response);
  if (hallucination.isHallucination) {
    score -= hallucination.confidence;
  }
  
  // Penalizar se arquivos não foram validados
  if (metadata.filesReported > 0) {
    const validationRate = metadata.filesValidated / metadata.filesReported;
    score *= validationRate;
  }
  
  // Penalizar tempos de execução muito rápidos (suspeito)
  if (metadata.executionTimeMs < 100) {
    score -= 20;
  }
  
  // Penalizar tempos muito precisos
  if (metadata.executionTimeMs.toString().includes('.')) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Registra log de auditoria no banco de dados
 */
export async function logAudit(log: AuditLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Anti-Hallucination] Banco de dados não disponível para log de auditoria');
    return;
  }
  
  try {
    await db.execute(sql`
      INSERT INTO audit_logs (
        timestamp,
        endpoint,
        input,
        output,
        validation_score,
        is_hallucination,
        real_data_verified,
        discrepancies,
        execution_time_ms
      ) VALUES (
        ${log.timestamp},
        ${log.endpoint},
        ${log.input},
        ${log.output},
        ${log.validationScore},
        ${log.isHallucination},
        ${log.realDataVerified},
        ${JSON.stringify(log.discrepancies)},
        ${log.executionTimeMs}
      )
    `);
  } catch (error) {
    console.error('[Anti-Hallucination] Erro ao registrar log de auditoria:', error);
  }
}

/**
 * Middleware de validação para Express
 */
export function antiHallucinationMiddleware(req: any, res: any, next: any) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    const startTime = Date.now();
    
    // Converter resposta para string para análise
    const responseStr = JSON.stringify(body);
    
    // Detectar alucinações
    const hallucination = detectHallucination(responseStr);
    
    if (hallucination.isHallucination) {
      console.warn('[Anti-Hallucination] ⚠️ ALUCINAÇÃO DETECTADA!');
      console.warn('Endpoint:', req.path);
      console.warn('Confiança:', hallucination.confidence + '%');
      console.warn('Razões:', hallucination.reasons);
      
      // Adicionar aviso na resposta
      body._antiHallucinationWarning = {
        detected: true,
        confidence: hallucination.confidence,
        reasons: hallucination.reasons,
        message: 'Esta resposta pode conter dados fictícios. Validação necessária.',
      };
      
      // Registrar log de auditoria
      logAudit({
        timestamp: new Date(),
        endpoint: req.path,
        input: JSON.stringify(req.body || req.query),
        output: responseStr,
        validationScore: 100 - hallucination.confidence,
        isHallucination: true,
        realDataVerified: false,
        discrepancies: hallucination.reasons,
        executionTimeMs: Date.now() - startTime,
      });
    }
    
    return originalJson(body);
  };
  
  next();
}

/**
 * Valida resposta antes de enviar
 */
export function validateResponse(response: any): {
  isValid: boolean;
  score: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  const responseStr = JSON.stringify(response);
  const hallucination = detectHallucination(responseStr);
  
  if (hallucination.isHallucination) {
    warnings.push(...hallucination.reasons);
  }
  
  const score = calculateConfidenceScore(responseStr, {
    executionTimeMs: 0,
    filesReported: 0,
    filesValidated: 0,
  });
  
  return {
    isValid: score >= 70,
    score,
    warnings,
  };
}

export default {
  detectHallucination,
  validateFileExists,
  calculateConfidenceScore,
  logAudit,
  antiHallucinationMiddleware,
  validateResponse,
};
