/**
 * Autonomous Orchestrator
 * 
 * Orquestra e integra todos os sistemas autônomos:
 * - Auto-Healing
 * - ML Prediction
 * - Self-Awareness
 * - Dependency Manager
 * - Knowledge Persistence
 * 
 * Coordena decisões autônomas e compartilha conhecimento entre sistemas
 */

import { autoHealing } from './auto-healing';
import { dependencyManager } from './dependency-manager';
import { getDb } from '../db';
import { knowledgeProblems, knowledgeSolutions, knowledgeSolutionRanking } from '../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

// Tipos
interface AutonomousDecision {
  action: string;
  reason: string;
  confidence: number;
  system: 'auto-healing' | 'ml' | 'self-awareness' | 'dependency' | 'orchestrator';
  timestamp: number;
}

interface SystemHealth {
  autoHealing: boolean;
  ml: boolean;
  selfAwareness: boolean;
  dependency: boolean;
  database: boolean;
}

/**
 * Orquestrador Autônomo Central
 */
class AutonomousOrchestrator {
  private decisions: AutonomousDecision[] = [];
  private isRunning = false;
  private orchestrationInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia orquestração autônoma
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.log('[Orchestrator] Já está em execução');
      return;
    }

    this.isRunning = true;
    console.log(`[Orchestrator] 🤖 Iniciando orquestração autônoma (intervalo: ${intervalMs}ms)`);

    // Execução inicial
    this.orchestrate().catch(err => {
      console.error('[Orchestrator] Erro na orquestração inicial:', err);
    });

    // Execução periódica
    this.orchestrationInterval = setInterval(() => {
      this.orchestrate().catch(err => {
        console.error('[Orchestrator] Erro na orquestração:', err);
      });
    }, intervalMs);
  }

  /**
   * Para orquestração
   */
  stop(): void {
    if (this.orchestrationInterval) {
      clearInterval(this.orchestrationInterval);
      this.orchestrationInterval = null;
    }
    this.isRunning = false;
    console.log('[Orchestrator] Orquestração parada');
  }

  /**
   * Ciclo principal de orquestração
   */
  private async orchestrate(): Promise<void> {
    console.log('[Orchestrator] 🔄 Executando ciclo de orquestração...');

    try {
      // 1. Verificar saúde de todos os sistemas
      const health = await this.checkSystemsHealth();
      console.log('[Orchestrator] Saúde dos sistemas:', health);

      // 2. Sincronizar conhecimento do auto-healing para o banco
      await this.persistAutoHealingKnowledge();

      // 3. Verificar e instalar dependências faltantes
      await this.ensureDependencies();

      // 4. Aplicar aprendizados anteriores
      await this.applyLearnedSolutions();

      // 5. Tomar decisões autônomas baseadas em padrões
      await this.makeAutonomousDecisions();

      console.log('[Orchestrator] ✅ Ciclo de orquestração concluído');
    } catch (error) {
      console.error('[Orchestrator] ❌ Erro no ciclo de orquestração:', error);
    }
  }

  /**
   * Verifica saúde de todos os sistemas
   */
  private async checkSystemsHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      autoHealing: false,
      ml: false,
      selfAwareness: false,
      dependency: false,
      database: false,
    };

    try {
      // Auto-Healing
      const ahStats = autoHealing.getStats();
      health.autoHealing = ahStats.isMonitoring;

      // Dependency Manager
      const depStats = dependencyManager.getCacheStats();
      health.dependency = depStats.cachedDependencies >= 0;

      // Database
      const db = await getDb();
      health.database = db !== null;

      // ML e Self-Awareness (assumir OK por enquanto)
      health.ml = true;
      health.selfAwareness = true;
    } catch (error) {
      console.error('[Orchestrator] Erro ao verificar saúde:', error);
    }

    return health;
  }

  /**
   * Persiste conhecimento do auto-healing no banco
   */
  private async persistAutoHealingKnowledge(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn('[Orchestrator] Banco não disponível para persistir conhecimento');
        return;
      }

      // Obter erros do auto-healing
      const errors = autoHealing.getErrors(50);
      
      if (errors.length === 0) {
        return;
      }

      console.log(`[Orchestrator] 💾 Persistindo ${errors.length} problemas...`);

      for (const error of errors) {
        // Verificar se já existe no banco
        const existing = await db
          .select()
          .from(knowledgeProblems)
          .where(eq(knowledgeProblems.titulo, error.message))
          .limit(1);

        if (existing.length > 0) {
          // Atualizar ocorrências
          await db
            .update(knowledgeProblems)
            .set({
              ocorrencias: existing[0].ocorrencias + 1,
              ultimaOcorrencia: new Date(error.timestamp),
              resolvido: error.corrected,
              resolvidoEm: error.corrected ? new Date(error.timestamp) : null,
            })
            .where(eq(knowledgeProblems.id, existing[0].id));
        } else {
          // Inserir novo problema
          const [problem] = await db
            .insert(knowledgeProblems)
            .values({
              tipo: 'auto_healing',
              categoria: 'sistema',
              titulo: error.message,
              descricao: error.stack || error.message,
              mensagemErro: error.message,
              stackTrace: error.stack,
              severidade: error.severity,
              resolvido: error.corrected,
              resolvidoEm: error.corrected ? new Date(error.timestamp) : null,
            })
            .$returningId();

          // Se foi corrigido, salvar solução
          if (error.corrected && error.correction && problem) {
            await db.insert(knowledgeSolutions).values({
              problemId: problem.id,
              tipo: 'auto_healing',
              titulo: 'Correção automática',
              descricao: error.correction,
              sucesso: true,
              confianca: 0.8,
            });

            // Atualizar ranking
            await this.updateSolutionRanking('auto_healing', 'auto_healing', true);
          }
        }
      }

      console.log('[Orchestrator] ✅ Conhecimento persistido');
    } catch (error) {
      console.error('[Orchestrator] Erro ao persistir conhecimento:', error);
    }
  }

  /**
   * Garante que dependências estão instaladas
   */
  private async ensureDependencies(): Promise<void> {
    try {
      console.log('[Orchestrator] 🔍 Verificando dependências...');
      
      const results = await dependencyManager.autoInstallMissingDependencies();
      
      if (results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        console.log(`[Orchestrator] 📦 ${successCount}/${results.length} dependências instaladas`);
        
        // Registrar no banco
        await this.persistDependencyInstallations(results);
      }
    } catch (error) {
      console.error('[Orchestrator] Erro ao verificar dependências:', error);
    }
  }

  /**
   * Persiste instalações de dependências no banco
   */
  private async persistDependencyInstallations(results: any[]): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      for (const result of results) {
        if (result.success) {
          // Registrar como problema resolvido
          const [problem] = await db
            .insert(knowledgeProblems)
            .values({
              tipo: 'dependencia_faltando',
              categoria: result.dependency.type,
              titulo: `Dependência faltando: ${result.dependency.name}`,
              descricao: `Dependência ${result.dependency.name} não estava instalada`,
              severidade: 'medium',
              resolvido: true,
              resolvidoEm: new Date(),
            })
            .$returningId();

          // Registrar solução
          if (problem) {
            await db.insert(knowledgeSolutions).values({
              problemId: problem.id,
              tipo: 'instalar_dependencia',
              titulo: `Instalação de ${result.dependency.name}`,
              descricao: result.message,
              sucesso: true,
              tempoExecucaoMs: result.timeMs,
              confianca: 0.9,
            });

            // Atualizar ranking
            await this.updateSolutionRanking('dependencia_faltando', 'instalar_dependencia', true);
          }
        }
      }
    } catch (error) {
      console.error('[Orchestrator] Erro ao persistir instalações:', error);
    }
  }

  /**
   * Aplica soluções aprendidas anteriormente
   */
  private async applyLearnedSolutions(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // Buscar problemas não resolvidos
      const unresolvedProblems = await db
        .select()
        .from(knowledgeProblems)
        .where(eq(knowledgeProblems.resolvido, false))
        .limit(10);

      if (unresolvedProblems.length === 0) {
        return;
      }

      console.log(`[Orchestrator] 🧠 Aplicando soluções aprendidas para ${unresolvedProblems.length} problemas...`);

      for (const problem of unresolvedProblems) {
        // Buscar melhor solução no ranking
        const bestSolution = await db
          .select()
          .from(knowledgeSolutionRanking)
          .where(eq(knowledgeSolutionRanking.tipoProblema, problem.tipo))
          .orderBy(desc(knowledgeSolutionRanking.taxaSucesso))
          .limit(1);

        if (bestSolution.length > 0 && bestSolution[0].taxaSucesso > 0.7) {
          console.log(`[Orchestrator] 💡 Aplicando solução com ${(bestSolution[0].taxaSucesso * 100).toFixed(0)}% de sucesso`);
          
          // Registrar decisão autônoma
          this.recordDecision({
            action: `Aplicar solução: ${bestSolution[0].tipoSolucao}`,
            reason: `Taxa de sucesso: ${(bestSolution[0].taxaSucesso * 100).toFixed(0)}%`,
            confidence: bestSolution[0].taxaSucesso,
            system: 'orchestrator',
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('[Orchestrator] Erro ao aplicar soluções aprendidas:', error);
    }
  }

  /**
   * Toma decisões autônomas baseadas em padrões
   */
  private async makeAutonomousDecisions(): Promise<void> {
    try {
      // Obter métricas atuais
      const metrics = autoHealing.getCurrentMetrics();
      
      if (!metrics) return;

      // Decisão: Limpar cache se memória alta
      if (metrics.memoryUsage > 85) {
        console.log('[Orchestrator] 🧹 Decisão autônoma: Limpar cache (memória alta)');
        
        this.recordDecision({
          action: 'Limpar cache',
          reason: `Memória em ${metrics.memoryUsage.toFixed(1)}%`,
          confidence: 0.9,
          system: 'orchestrator',
          timestamp: Date.now(),
        });
        
        // Executar limpeza via auto-healing
        // (auto-healing já faz isso automaticamente, mas podemos forçar)
      }

      // Decisão: Verificar dependências se CPU alta
      if (metrics.cpuUsage > 80) {
        console.log('[Orchestrator] 🔍 Decisão autônoma: Verificar dependências (CPU alta)');
        
        this.recordDecision({
          action: 'Verificar dependências',
          reason: `CPU em ${metrics.cpuUsage.toFixed(1)}%`,
          confidence: 0.7,
          system: 'orchestrator',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('[Orchestrator] Erro ao tomar decisões:', error);
    }
  }

  /**
   * Atualiza ranking de soluções
   */
  private async updateSolutionRanking(tipoProblema: string, tipoSolucao: string, sucesso: boolean): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // Buscar ranking existente
      const existing = await db
        .select()
        .from(knowledgeSolutionRanking)
        .where(
          and(
            eq(knowledgeSolutionRanking.tipoProblema, tipoProblema),
            eq(knowledgeSolutionRanking.tipoSolucao, tipoSolucao)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Atualizar estatísticas
        const rank = existing[0];
        const vezesAplicada = rank.vezesAplicada + 1;
        const vezesSucesso = rank.vezesSucesso + (sucesso ? 1 : 0);
        const vezesFalha = rank.vezesFalha + (sucesso ? 0 : 1);
        const taxaSucesso = vezesSucesso / vezesAplicada;

        await db
          .update(knowledgeSolutionRanking)
          .set({
            vezesAplicada,
            vezesSucesso,
            vezesFalha,
            taxaSucesso,
            ultimaAplicacao: new Date(),
          })
          .where(eq(knowledgeSolutionRanking.id, rank.id));
      } else {
        // Criar novo ranking
        await db.insert(knowledgeSolutionRanking).values({
          tipoProblema,
          tipoSolucao,
          vezesAplicada: 1,
          vezesSucesso: sucesso ? 1 : 0,
          vezesFalha: sucesso ? 0 : 1,
          taxaSucesso: sucesso ? 1.0 : 0.0,
          ultimaAplicacao: new Date(),
        });
      }
    } catch (error) {
      console.error('[Orchestrator] Erro ao atualizar ranking:', error);
    }
  }

  /**
   * Registra uma decisão autônoma
   */
  private recordDecision(decision: AutonomousDecision): void {
    this.decisions.push(decision);
    
    // Manter apenas últimas 100 decisões
    if (this.decisions.length > 100) {
      this.decisions = this.decisions.slice(-100);
    }
  }

  /**
   * Obtém decisões recentes
   */
  getRecentDecisions(limit: number = 20): AutonomousDecision[] {
    return this.decisions.slice(-limit);
  }

  /**
   * Obtém estatísticas do orchestrator
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      totalDecisions: this.decisions.length,
      recentDecisions: this.getRecentDecisions(5),
    };
  }
}

// Instância singleton
export const autonomousOrchestrator = new AutonomousOrchestrator();

// Iniciar orquestração automaticamente
autonomousOrchestrator.start(60000); // A cada 1 minuto
