import os from 'os';
import { invokeLLM } from './llm';
import { healthChecker } from './health-checks';
import { retryManager, retryWithBackoff } from './retry-handler';

/**
 * Sistema de Auto-Healing
 * Monitora saúde do sistema, diagnostica erros e aplica correções automaticamente
 */

// Tipos
interface Metrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  memoryFree: number;
}

interface ErrorRecord {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  diagnosed: boolean;
  corrected: boolean;
  diagnosis?: string;
  correction?: string;
}

interface Diagnosis {
  causaRaiz: string;
  confianca: number;
  acaoRecomendada: string;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
}

// Estado do sistema
class AutoHealingSystem {
  private metrics: Metrics[] = [];
  private errors: ErrorRecord[] = [];
  private isMonitoring: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly MAX_METRICS = 100; // Manter apenas últimas 100 métricas
  private readonly MAX_ERRORS = 50; // Manter apenas últimos 50 erros

  /**
   * Inicia o monitoramento contínuo
   */
  startMonitoring(intervalMs: number = 30000): void {
    // Iniciar health checks integrados
    healthChecker.startPeriodicChecks(intervalMs);
    if (this.isMonitoring) {
      console.log('[Auto-Healing] Monitoramento já está ativo');
      return;
    }

    this.isMonitoring = true;
    console.log(`[Auto-Healing] Iniciando monitoramento (intervalo: ${intervalMs}ms)`);

    // Coleta inicial
    this.collectMetrics();

    // Coleta periódica
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAnomalies();
    }, intervalMs);
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('[Auto-Healing] Monitoramento parado');
  }

  /**
   * Coleta métricas do sistema
   */
  private collectMetrics(): void {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const metrics: Metrics = {
      timestamp: Date.now(),
      cpuUsage: this.getCPUUsage(),
      memoryUsage: (usedMem / totalMem) * 100,
      memoryTotal: totalMem,
      memoryFree: freeMem,
    };

    this.metrics.push(metrics);

    // Manter apenas as últimas N métricas
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Calcula uso de CPU (simplificado)
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle / total);

    return Math.round(usage * 100) / 100;
  }

  /**
   * Verifica anomalias nas métricas
   */
  private checkAnomalies(): void {
    if (this.metrics.length < 10) return; // Precisa de histórico mínimo

    const latest = this.metrics[this.metrics.length - 1];
    
    // Detectar uso crítico de memória
    if (latest && latest.memoryUsage > 90) {
      this.registerError({
        message: `Memória crítica: ${latest.memoryUsage.toFixed(2)}% em uso`,
        severity: 'critical',
        stack: `Total: ${(latest.memoryTotal / 1024 / 1024 / 1024).toFixed(2)}GB, Livre: ${(latest.memoryFree / 1024 / 1024 / 1024).toFixed(2)}GB`,
      });
    }

    // Detectar uso alto de CPU
    if (latest && latest.cpuUsage > 80) {
      this.registerError({
        message: `CPU alta: ${latest.cpuUsage.toFixed(2)}% em uso`,
        severity: 'high',
      });
    }
  }

  /**
   * Registra um erro no sistema
   */
  registerError(error: { message: string; stack?: string; severity?: ErrorRecord['severity'] }): void {
    const errorRecord: ErrorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      severity: error.severity || 'medium',
      diagnosed: false,
      corrected: false,
    };

    this.errors.push(errorRecord);

    // Manter apenas os últimos N erros
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }

    console.log(`[Auto-Healing] Erro registrado: ${error.message} (${error.severity})`);

    // Tentar diagnosticar e corrigir automaticamente
    this.diagnoseAndCorrect(errorRecord).catch(err => {
      console.error('[Auto-Healing] Erro ao diagnosticar:', err);
    });
  }

  /**
   * Diagnostica e corrige um erro automaticamente
   */
  private async diagnoseAndCorrect(error: ErrorRecord): Promise<void> {
    try {
      // Diagnóstico com IA
      const diagnosis = await this.diagnoseError(error);
      error.diagnosis = JSON.stringify(diagnosis);
      error.diagnosed = true;

      console.log(`[Auto-Healing] Diagnóstico: ${diagnosis.causaRaiz} (confiança: ${diagnosis.confianca}%)`);

      // Aplicar correção se urgência for alta ou crítica
      if (diagnosis.urgencia === 'alta' || diagnosis.urgencia === 'critica') {
        const correctionResult = await this.applyCorrection(error, diagnosis);
        error.correction = correctionResult;
        error.corrected = true;

        console.log(`[Auto-Healing] Correção aplicada: ${correctionResult}`);
      }
    } catch (err) {
      console.error('[Auto-Healing] Erro ao diagnosticar/corrigir:', err);
    }
  }

  /**
   * Diagnostica um erro usando IA
   */
  private async diagnoseError(error: ErrorRecord): Promise<Diagnosis> {
    const prompt = `Analise o seguinte erro do sistema e forneça um diagnóstico:

Erro: ${error.message}
Severidade: ${error.severity}
Stack: ${error.stack || 'N/A'}

Forneça a resposta em JSON com os campos:
- causaRaiz: string (descrição da causa raiz)
- confianca: number (0-100, confiança no diagnóstico)
- acaoRecomendada: string (ação recomendada para corrigir)
- urgencia: "baixa" | "media" | "alta" | "critica"`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'Você é um especialista em diagnóstico de sistemas. Responda sempre em JSON válido.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content || '{}';
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    
    try {
      return JSON.parse(contentStr);
    } catch {
      // Fallback se JSON inválido
      return {
        causaRaiz: contentStr.substring(0, 200),
        confianca: 50,
        acaoRecomendada: 'Investigar manualmente',
        urgencia: error.severity === 'critical' ? 'critica' : 'media',
      };
    }
  }

  /**
   * Aplica uma correção automática
   */
  private async applyCorrection(error: ErrorRecord, diagnosis: Diagnosis): Promise<string> {
    console.log(`[Auto-Healing] Aplicando correção para: ${error.message}`);

    // Correções automáticas baseadas no tipo de erro
    if (error.message.includes('Memória crítica')) {
      return await this.corrigirMemoriaCritica();
    }

    if (error.message.includes('CPU alta')) {
      return await this.corrigirCPUAlta();
    }

    if (error.message.includes('Serviço não responsivo') || error.message.includes('timeout')) {
      return await this.reiniciarServico(error.message);
    }

    if (error.message.includes('Cache')) {
      return await this.limparCache();
    }

    return `Correção recomendada: ${diagnosis.acaoRecomendada}`;
  }

  /**
   * Corrige memória crítica
   */
  private async corrigirMemoriaCritica(): Promise<string> {
    const acoes: string[] = [];

    // 1. Tentar garbage collection
    if (global.gc) {
      global.gc();
      acoes.push('Garbage collection executado');
    } else {
      acoes.push('GC não disponível (executar Node com --expose-gc)');
    }

    // 2. Limpar cache
    const cacheResult = await this.limparCache();
    acoes.push(cacheResult);

    return acoes.join(' + ');
  }

  /**
   * Corrige CPU alta
   */
  private async corrigirCPUAlta(): Promise<string> {
    // Por enquanto apenas monitora
    // Futuramente pode implementar:
    // - Reduzir workers
    // - Pausar tarefas não críticas
    // - Escalar horizontalmente
    return 'CPU alta detectada - monitoramento ativo';
  }

  /**
   * Reinicia um serviço usando PM2 com retry inteligente
   */
  private async reiniciarServico(errorMessage: string): Promise<string> {
    console.log(`[Auto-Healing] Tentando reiniciar serviço com retry...`);

    // Usar retry com backoff exponencial
    const result = await retryManager.executeWithRetry(
      'pm2-restart',
      async () => {
        return await this.executarReinicializacao();
      },
      {
        maxAttempts: 3, // 3 tentativas
        initialDelayMs: 2000, // Começar com 2s
        backoffMultiplier: 2, // 2s, 4s, 8s
        onRetry: (attempt, error) => {
          console.warn(`[Auto-Healing] Tentativa ${attempt} de reinicialização falhou:`, error.message);
        },
      }
    );

    if (result.success) {
      return `Serviço reiniciado com sucesso após ${result.attempts} tentativa(s) em ${result.totalTimeMs}ms`;
    } else {
      return `Falha ao reiniciar após ${result.attempts} tentativas: ${result.error?.message}`;
    }
  }

  /**
   * Executa reinicialização real (chamado pelo retry handler)
   */
  private async executarReinicializacao(): Promise<string> {
    try {
      // Verificar se PM2 está disponível
      const { execSync } = require('child_process');
      
      try {
        // Verificar se PM2 está instalado
        execSync('which pm2', { stdio: 'ignore' });
        
        // Verificar se servidor está rodando com PM2
        const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' });
        const processes = JSON.parse(pm2List);
        const servidorProcess = processes.find((p: any) => p.name === 'servidor-automacao');
        
        if (servidorProcess) {
          console.log('[Auto-Healing] Reiniciando via PM2...');
          execSync('pm2 restart servidor-automacao --update-env', { stdio: 'inherit' });
          return 'Serviço reiniciado com sucesso via PM2';
        } else {
          console.warn('[Auto-Healing] Servidor não está rodando com PM2');
          return 'Servidor não gerenciado por PM2 - reinicialização manual necessária';
        }
      } catch (pm2Error) {
        throw new Error(`PM2 não disponível: ${pm2Error}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[Auto-Healing] Erro ao reiniciar serviço:', errorMsg);
      return `Falha ao reiniciar: ${errorMsg}`;
    }
  }

  /**
   * Limpa cache do sistema
   */
  private async limparCache(): Promise<string> {
    const acoes: string[] = [];

    try {
      // Limpar variáveis temporárias antigas
      const metricsAntes = this.metrics.length;
      const errorsAntes = this.errors.length;

      // Manter apenas os últimos 50 registros
      if (this.metrics.length > 50) {
        this.metrics = this.metrics.slice(-50);
        acoes.push(`Métricas reduzidas: ${metricsAntes} → ${this.metrics.length}`);
      }

      if (this.errors.length > 30) {
        this.errors = this.errors.slice(-30);
        acoes.push(`Erros reduzidos: ${errorsAntes} → ${this.errors.length}`);
      }

      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc();
        acoes.push('GC executado');
      }

      return acoes.length > 0 ? `Cache limpo: ${acoes.join(', ')}` : 'Cache já estava limpo';
    } catch (err) {
      return `Erro ao limpar cache: ${err}`;
    }
  }

  /**
   * Obtém métricas atuais
   */
  getCurrentMetrics(): Metrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * Obtém histórico de métricas
   */
  getMetricsHistory(limit: number = 50): Metrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Obtém erros registrados
   */
  getErrors(limit: number = 20): ErrorRecord[] {
    return this.errors.slice(-limit);
  }

  /**
   * Obtém estatísticas gerais
   */
  getStats() {
    const totalErrors = this.errors.length;
    const diagnosed = this.errors.filter(e => e.diagnosed).length;
    const corrected = this.errors.filter(e => e.corrected).length;

    const bySeverity = {
      low: this.errors.filter(e => e.severity === 'low').length,
      medium: this.errors.filter(e => e.severity === 'medium').length,
      high: this.errors.filter(e => e.severity === 'high').length,
      critical: this.errors.filter(e => e.severity === 'critical').length,
    };

    return {
      isMonitoring: this.isMonitoring,
      totalMetrics: this.metrics.length,
      totalErrors,
      diagnosed,
      corrected,
      correctionRate: totalErrors > 0 ? (corrected / totalErrors) * 100 : 0,
      bySeverity,
    };
  }
}

// Instância singleton
export const autoHealing = new AutoHealingSystem();

// Iniciar monitoramento automaticamente
autoHealing.startMonitoring(30000); // A cada 30 segundos
