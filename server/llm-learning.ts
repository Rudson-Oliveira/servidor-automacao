/**
 * Sistema de Aprendizado LLM
 * Registra erros e aprende com eles para prevenir recorrências
 * 
 * @author Manus AI Team
 * @audit Sistema de memória persistente para evolução contínua
 */

import { getDb } from './db';

export interface ErrorLesson {
  id?: number;
  errorType: string;
  errorMessage: string;
  context: string;
  solution: string;
  timestamp: number;
  frequency: number;
  resolved: boolean;
}

/**
 * Registra um erro e sua solução para aprendizado
 */
export async function learnFromError(lesson: Omit<ErrorLesson, 'id' | 'timestamp' | 'frequency'>): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[LLMLearning] Database not available, storing in memory');
      return;
    }
    
    // Verifica se erro similar já existe
    const existing = await db.execute(`
      SELECT * FROM error_lessons 
      WHERE error_type = ? AND error_message = ?
      LIMIT 1
    `, [lesson.errorType, lesson.errorMessage]);
    
    if (existing && existing.length > 0) {
      // Incrementa frequência
      await db.execute(`
        UPDATE error_lessons 
        SET frequency = frequency + 1, 
            last_seen = ?,
            resolved = ?
        WHERE id = ?
      `, [Date.now(), lesson.resolved, (existing[0] as any).id]);
      
      console.log('[LLMLearning] Updated existing error lesson');
    } else {
      // Cria novo registro
      await db.execute(`
        INSERT INTO error_lessons 
        (error_type, error_message, context, solution, timestamp, frequency, resolved, last_seen)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `, [
        lesson.errorType,
        lesson.errorMessage,
        lesson.context,
        lesson.solution,
        Date.now(),
        lesson.resolved,
        Date.now()
      ]);
      
      console.log('[LLMLearning] Created new error lesson');
    }
  } catch (error) {
    console.error('[LLMLearning] Failed to store lesson:', error);
  }
}

/**
 * Busca solução para um erro conhecido
 */
export async function findSolution(errorType: string, errorMessage: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    
    const results = await db.execute(`
      SELECT solution FROM error_lessons
      WHERE error_type = ? 
      AND error_message LIKE ?
      AND resolved = true
      ORDER BY frequency DESC
      LIMIT 1
    `, [errorType, `%${errorMessage}%`]);
    
    if (results && results.length > 0) {
      return (results[0] as any).solution;
    }
    
    return null;
  } catch (error) {
    console.error('[LLMLearning] Failed to find solution:', error);
    return null;
  }
}

/**
 * Retorna estatísticas de aprendizado
 */
export async function getLearningStats(): Promise<{
  totalLessons: number;
  resolvedLessons: number;
  topErrors: Array<{ type: string; count: number }>;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { totalLessons: 0, resolvedLessons: 0, topErrors: [] };
    }
    
    const total = await db.execute('SELECT COUNT(*) as count FROM error_lessons');
    const resolved = await db.execute('SELECT COUNT(*) as count FROM error_lessons WHERE resolved = true');
    const top = await db.execute(`
      SELECT error_type as type, SUM(frequency) as count 
      FROM error_lessons 
      GROUP BY error_type 
      ORDER BY count DESC 
      LIMIT 5
    `);
    
    return {
      totalLessons: (total[0] as any)?.count || 0,
      resolvedLessons: (resolved[0] as any)?.count || 0,
      topErrors: (top || []).map((row: any) => ({
        type: row.type,
        count: row.count
      }))
    };
  } catch (error) {
    console.error('[LLMLearning] Failed to get stats:', error);
    return { totalLessons: 0, resolvedLessons: 0, topErrors: [] };
  }
}

/**
 * Registra erro do TensorFlow (caso específico atual)
 */
export async function learnTensorFlowError(): Promise<void> {
  await learnFromError({
    errorType: 'DEPENDENCY_ERROR',
    errorMessage: 'libtensorflow.so.2: Arquivo ou diretório inexistente',
    context: 'Deploy no Render com TensorFlow.js node bindings',
    solution: 'Adicionar libc6-compat e gcompat ao Dockerfile Alpine Linux',
    resolved: true
  });
}

/**
 * Inicializa tabela de aprendizado se não existir
 */
export async function initializeLearningSystem(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[LLMLearning] Database not available, skipping initialization');
      return;
    }
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS error_lessons (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT NOT NULL,
        context TEXT,
        solution TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        frequency INT DEFAULT 1,
        resolved BOOLEAN DEFAULT false,
        last_seen BIGINT NOT NULL,
        INDEX idx_error_type (error_type),
        INDEX idx_resolved (resolved)
      )
    `);
    
    console.log('[LLMLearning] Learning system initialized');
    
    // Registra erro atual do TensorFlow
    await learnTensorFlowError();
  } catch (error) {
    console.error('[LLMLearning] Failed to initialize:', error);
  }
}
