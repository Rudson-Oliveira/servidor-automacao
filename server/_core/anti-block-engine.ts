/**
 * Motor Anti-Bloqueio Dinâmico
 * Calcula risco de bloqueio em tempo real e determina tempo de pausa necessário
 */

import { getDb } from '../db';
import { whatsappSendHistory, whatsappBlacklist } from '../../drizzle/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

export interface RiskAssessment {
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  shouldPause: boolean;
  pauseDuration: number; // segundos
  reasons: string[];
  recommendations: string[];
}

export interface SendingStats {
  totalSent: number;
  totalBlocked: number;
  blockRate: number;
  recentSends: number; // últimas 24h
  recentBlocks: number; // últimas 24h
  averageInterval: number; // segundos entre envios
}

export class AntiBlockEngine {
  /**
   * Avalia risco de bloqueio para um número WhatsApp
   */
  async assessRisk(whatsappNumber: string): Promise<RiskAssessment> {
    const stats = await this.getSendingStats(whatsappNumber);
    const numberAge = await this.getNumberAge(whatsappNumber);

    let riskScore = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Fator 1: Taxa de bloqueio (peso: 40%)
    if (stats.blockRate > 0.10) {
      // >10% de bloqueios
      riskScore += 40;
      reasons.push(`Taxa de bloqueio alta: ${(stats.blockRate * 100).toFixed(1)}%`);
      recommendations.push('Reduza o volume de envios e revise as mensagens');
    } else if (stats.blockRate > 0.05) {
      // >5% de bloqueios
      riskScore += 25;
      reasons.push(`Taxa de bloqueio moderada: ${(stats.blockRate * 100).toFixed(1)}%`);
      recommendations.push('Monitore a taxa de bloqueio de perto');
    } else if (stats.blockRate > 0.02) {
      // >2% de bloqueios
      riskScore += 10;
      reasons.push(`Taxa de bloqueio aceitável: ${(stats.blockRate * 100).toFixed(1)}%`);
    }

    // Fator 2: Volume recente (peso: 30%)
    const hourlyRate = stats.recentSends / 24;
    if (hourlyRate > 100) {
      // >100 mensagens/hora
      riskScore += 30;
      reasons.push(`Volume muito alto: ${hourlyRate.toFixed(0)} msgs/hora`);
      recommendations.push('Reduza para no máximo 60 mensagens por hora');
    } else if (hourlyRate > 60) {
      // >60 mensagens/hora
      riskScore += 20;
      reasons.push(`Volume alto: ${hourlyRate.toFixed(0)} msgs/hora`);
      recommendations.push('Reduza para 40-50 mensagens por hora');
    } else if (hourlyRate > 40) {
      // >40 mensagens/hora
      riskScore += 10;
      reasons.push(`Volume moderado: ${hourlyRate.toFixed(0)} msgs/hora`);
    }

    // Fator 3: Idade do número (peso: 15%)
    if (numberAge < 7) {
      // <7 dias
      riskScore += 15;
      reasons.push(`Número muito novo: ${numberAge} dias`);
      recommendations.push('Números novos devem enviar no máximo 20 msgs/dia nos primeiros 7 dias');
    } else if (numberAge < 30) {
      // <30 dias
      riskScore += 8;
      reasons.push(`Número recente: ${numberAge} dias`);
      recommendations.push('Aumente o volume gradualmente');
    }

    // Fator 4: Intervalo entre mensagens (peso: 15%)
    if (stats.averageInterval < 5) {
      // <5 segundos
      riskScore += 15;
      reasons.push(`Intervalo muito curto: ${stats.averageInterval.toFixed(1)}s`);
      recommendations.push('Aumente o intervalo para 10-30 segundos');
    } else if (stats.averageInterval < 10) {
      // <10 segundos
      riskScore += 8;
      reasons.push(`Intervalo curto: ${stats.averageInterval.toFixed(1)}s`);
      recommendations.push('Aumente o intervalo para 15-30 segundos');
    }

    // Determinar nível de risco
    let riskLevel: RiskAssessment['riskLevel'];
    if (riskScore >= 80) {
      riskLevel = 'critical';
    } else if (riskScore >= 60) {
      riskLevel = 'high';
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
    } else if (riskScore >= 20) {
      riskLevel = 'low';
    } else {
      riskLevel = 'safe';
    }

    // Calcular tempo de pausa necessário
    const shouldPause = riskScore >= 60; // High ou Critical
    const pauseDuration = this.calculatePauseDuration(riskScore, stats, numberAge);

    if (shouldPause) {
      recommendations.push(
        `PAUSA OBRIGATÓRIA: Aguarde ${this.formatDuration(pauseDuration)} antes de continuar`
      );
    }

    return {
      riskLevel,
      riskScore,
      shouldPause,
      pauseDuration,
      reasons,
      recommendations,
    };
  }

  /**
   * Calcula duração de pausa necessária (em segundos)
   */
  private calculatePauseDuration(
    riskScore: number,
    stats: SendingStats,
    numberAge: number
  ): number {
    if (riskScore < 60) return 0; // Sem pausa necessária

    // Base: 1 hora para risco high, 3 horas para critical
    let baseDuration = riskScore >= 80 ? 3 * 3600 : 1 * 3600;

    // Ajustar baseado em taxa de bloqueio
    if (stats.blockRate > 0.15) {
      baseDuration *= 2; // Dobrar se taxa >15%
    } else if (stats.blockRate > 0.10) {
      baseDuration *= 1.5; // 50% a mais se taxa >10%
    }

    // Ajustar baseado em volume recente
    const hourlyRate = stats.recentSends / 24;
    if (hourlyRate > 100) {
      baseDuration *= 1.5;
    }

    // Ajustar baseado em idade do número
    if (numberAge < 7) {
      baseDuration *= 2; // Números novos precisam mais tempo
    } else if (numberAge < 30) {
      baseDuration *= 1.3;
    }

    // Mínimo: 30 minutos, Máximo: 24 horas
    return Math.max(30 * 60, Math.min(baseDuration, 24 * 3600));
  }

  /**
   * Obtém estatísticas de envio de um número
   */
  private async getSendingStats(whatsappNumber: string): Promise<SendingStats> {
    const db = await getDb();
    if (!db) {
      return {
        totalSent: 0,
        totalBlocked: 0,
        blockRate: 0,
        recentSends: 0,
        recentBlocks: 0,
        averageInterval: 30,
      };
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Total de envios
    const totalSentResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(whatsappSendHistory)
      .where(eq(whatsappSendHistory.senderNumber, whatsappNumber));

    const totalSent = Number(totalSentResult[0]?.count ?? 0);

    // Total de bloqueios
    const totalBlockedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(whatsappBlacklist)
      .where(eq(whatsappBlacklist.blockedNumber, whatsappNumber));

    const totalBlocked = Number(totalBlockedResult[0]?.count || 0);

    // Envios recentes (últimas 24h)
    const recentSendsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(whatsappSendHistory)
      .where(
        and(
          eq(whatsappSendHistory.senderNumber, whatsappNumber),
          gte(whatsappSendHistory.sentAt, last24h)
        )
      );

    const recentSends = Number(recentSendsResult[0]?.count ?? 0);

    // Bloqueios recentes (últimas 24h)
    const recentBlocksResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(whatsappBlacklist)
      .where(
        and(
          eq(whatsappBlacklist.blockedNumber, whatsappNumber),
          gte(whatsappBlacklist.blockedAt, last24h)
        )
      );

    const recentBlocks = Number(recentBlocksResult[0]?.count || 0);

    // Calcular intervalo médio entre envios (últimas 100 mensagens)
    const recentMessages = await db
      .select({ sentAt: whatsappSendHistory.sentAt })
      .from(whatsappSendHistory)
      .where(eq(whatsappSendHistory.senderNumber, whatsappNumber))
      .orderBy(desc(whatsappSendHistory.sentAt))
      .limit(100);

    let averageInterval = 30; // default: 30 segundos
    if (recentMessages.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < recentMessages.length - 1; i++) {
        const msg1 = recentMessages[i];
        const msg2 = recentMessages[i + 1];
        if (!msg1 || !msg2 || !msg1.sentAt || !msg2.sentAt) continue;
        const diff = msg1.sentAt.getTime() - msg2.sentAt.getTime();
        intervals.push(diff / 1000); // converter para segundos
      }
      averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    const blockRate = totalSent > 0 ? totalBlocked / totalSent : 0;

    return {
      totalSent,
      totalBlocked,
      blockRate,
      recentSends,
      recentBlocks,
      averageInterval,
    };
  }

  /**
   * Obtém idade do número em dias (desde primeiro envio)
   */
  private async getNumberAge(whatsappNumber: string): Promise<number> {
    const db = await getDb();
    if (!db) return 999; // Assumir número antigo se DB indisponível

    const firstSendResult = await db
      .select({ sentAt: whatsappSendHistory.sentAt })
      .from(whatsappSendHistory)
      .where(eq(whatsappSendHistory.senderNumber, whatsappNumber))
      .orderBy(whatsappSendHistory.sentAt)
      .limit(1);

    if (firstSendResult.length === 0) return 0; // Número nunca usado

    const firstSend = firstSendResult[0];
    if (!firstSend || !firstSend.sentAt) return 0;
    const ageMs = Date.now() - firstSend.sentAt.getTime();
    return Math.floor(ageMs / (24 * 60 * 60 * 1000)); // dias
  }

  /**
   * Formata duração em texto legível
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Registra pausa de segurança
   */
  async recordPause(whatsappNumber: string, duration: number, reason: string): Promise<void> {
    console.log(
      `[Anti-Block] Pausa registrada para ${whatsappNumber}: ${this.formatDuration(duration)} - ${reason}`
    );
    // TODO: Salvar em tabela de pausas se necessário
  }

  /**
   * Verifica se número está em pausa obrigatória
   */
  async isInPause(whatsappNumber: string): Promise<boolean> {
    const assessment = await this.assessRisk(whatsappNumber);
    return assessment.shouldPause;
  }
}

// Singleton global
export const antiBlockEngine = new AntiBlockEngine();
