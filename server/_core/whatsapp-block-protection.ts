/**
 * Sistema de Proteção Contra Bloqueios WhatsApp
 * Detecta e previne bloqueios automaticamente
 */

import { getDb } from '../db';
import { whatsappBlacklist, whatsappSendHistory, whatsappBlockAlerts } from '../../drizzle/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { notifyOwner } from './notification';

export interface BlockDetectionResult {
  isBlocked: boolean;
  reason?: 'blocked' | 'reported' | 'invalid' | 'high_failure_rate';
  details?: string;
  shouldBlacklist: boolean;
}

export interface ContactRiskScore {
  phone: string;
  riskScore: number; // 0-100
  factors: string[];
  recommendation: 'safe' | 'caution' | 'high_risk' | 'blacklist';
}

export class WhatsAppBlockProtection {
  /**
   * Verifica se um número está na blacklist
   */
  async isBlacklisted(phone: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const result = await db
      .select()
      .from(whatsappBlacklist)
      .where(eq(whatsappBlacklist.phone, phone))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Adiciona número à blacklist
   */
  async addToBlacklist(
    phone: string,
    reason: 'blocked' | 'reported' | 'invalid' | 'opt_out' | 'manual',
    details?: string,
    blockedNumber?: string,
    contactName?: string,
    lastCampaign?: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      console.warn('[Block Protection] Cannot add to blacklist: database not available');
      return;
    }

    try {
      // Verificar se já está na blacklist
      const existing = await db
        .select()
        .from(whatsappBlacklist)
        .where(eq(whatsappBlacklist.phone, phone))
        .limit(1);

      if (existing.length > 0) {
        console.log(`[Block Protection] ${phone} já está na blacklist`);
        return;
      }

      // Adicionar à blacklist
      await db.insert(whatsappBlacklist).values({
        phone,
        reason,
        details,
        blockedNumber,
        contactName,
        lastCampaign,
        blockedAt: new Date(),
      });

      console.log(`[Block Protection] ✅ ${phone} adicionado à blacklist (motivo: ${reason})`);

      // Notificar owner
      await this.notifyBlocklistAddition(phone, reason, details);
    } catch (error) {
      console.error('[Block Protection] Erro ao adicionar à blacklist:', error);
    }
  }

  /**
   * Remove número da blacklist
   */
  async removeFromBlacklist(phone: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    try {
      const result = await db
        .delete(whatsappBlacklist)
        .where(eq(whatsappBlacklist.phone, phone));

      console.log(`[Block Protection] ${phone} removido da blacklist`);
      return true;
    } catch (error) {
      console.error('[Block Protection] Erro ao remover da blacklist:', error);
      return false;
    }
  }

  /**
   * Registra envio de mensagem no histórico
   */
  async logMessageSent(
    messageId: string,
    senderNumber: string,
    recipientPhone: string,
    templateId?: string,
    campaign?: string,
    messagePreview?: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      await db.insert(whatsappSendHistory).values({
        messageId,
        senderNumber,
        recipientPhone,
        status: 'sent',
        templateId,
        campaign,
        messagePreview: messagePreview?.substring(0, 500),
        sentAt: new Date(),
      });
    } catch (error) {
      console.error('[Block Protection] Erro ao registrar envio:', error);
    }
  }

  /**
   * Atualiza status de mensagem (delivered, read, failed, blocked)
   */
  async updateMessageStatus(
    messageId: string,
    status: 'delivered' | 'read' | 'failed' | 'blocked',
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const updateData: any = { status };

      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (status === 'read') {
        updateData.readAt = new Date();
      } else if (status === 'failed' || status === 'blocked') {
        updateData.errorCode = errorCode;
        updateData.errorMessage = errorMessage;
      }

      await db
        .update(whatsappSendHistory)
        .set(updateData)
        .where(eq(whatsappSendHistory.messageId, messageId));

      // Se bloqueado, adicionar à blacklist automaticamente
      if (status === 'blocked') {
        const message = await db
          .select()
          .from(whatsappSendHistory)
          .where(eq(whatsappSendHistory.messageId, messageId))
          .limit(1);

        if (message.length > 0) {
          await this.addToBlacklist(
            message[0]!.recipientPhone,
            'blocked',
            errorMessage,
            message[0]!.senderNumber,
            undefined,
            message[0]!.campaign || undefined
          );
        }
      }
    } catch (error) {
      console.error('[Block Protection] Erro ao atualizar status:', error);
    }
  }

  /**
   * Detecta se mensagem foi bloqueada baseado em padrões
   */
  async detectBlockFromResponse(
    messageId: string,
    responseCode?: string,
    responseMessage?: string
  ): Promise<BlockDetectionResult> {
    // Padrões que indicam bloqueio
    const blockPatterns = [
      'blocked',
      'bloqueado',
      'spam',
      'reported',
      'denunciado',
      'invalid number',
      'número inválido',
      'not found',
      'não encontrado',
      'user not registered',
      'usuário não registrado',
    ];

    const lowerMessage = (responseMessage || '').toLowerCase();
    const lowerCode = (responseCode || '').toLowerCase();

    const isBlocked = blockPatterns.some(
      pattern => lowerMessage.includes(pattern) || lowerCode.includes(pattern)
    );

    if (isBlocked) {
      // Determinar motivo específico
      let reason: 'blocked' | 'reported' | 'invalid' = 'blocked';

      if (lowerMessage.includes('spam') || lowerMessage.includes('reported')) {
        reason = 'reported';
      } else if (
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('not found') ||
        lowerMessage.includes('not registered')
      ) {
        reason = 'invalid';
      }

      await this.updateMessageStatus(messageId, 'blocked', responseCode, responseMessage);

      return {
        isBlocked: true,
        reason,
        details: responseMessage,
        shouldBlacklist: true,
      };
    }

    return {
      isBlocked: false,
      shouldBlacklist: false,
    };
  }

  /**
   * Calcula score de risco de um contato
   */
  async calculateRiskScore(phone: string): Promise<ContactRiskScore> {
    const db = await getDb();
    if (!db) {
      return {
        phone,
        riskScore: 0,
        factors: [],
        recommendation: 'safe',
      };
    }

    let riskScore = 0;
    const factors: string[] = [];

    // Verificar histórico de envios
    const history = await db
      .select()
      .from(whatsappSendHistory)
      .where(eq(whatsappSendHistory.recipientPhone, phone))
      .orderBy(desc(whatsappSendHistory.createdAt))
      .limit(10);

    if (history.length === 0) {
      // Novo contato - risco baixo
      return {
        phone,
        riskScore: 10,
        factors: ['Novo contato (sem histórico)'],
        recommendation: 'safe',
      };
    }

    // Calcular taxa de falha
    const failedCount = history.filter(h => h.status === 'failed' || h.status === 'blocked').length;
    const failureRate = failedCount / history.length;

    if (failureRate > 0.5) {
      riskScore += 40;
      factors.push(`Alta taxa de falha (${(failureRate * 100).toFixed(0)}%)`);
    } else if (failureRate > 0.3) {
      riskScore += 20;
      factors.push(`Taxa de falha moderada (${(failureRate * 100).toFixed(0)}%)`);
    }

    // Verificar se já bloqueou antes
    const blockedHistory = history.filter(h => h.status === 'blocked');
    if (blockedHistory.length > 0) {
      riskScore += 50;
      factors.push(`Já bloqueou ${blockedHistory.length} vez(es)`);
    }

    // Verificar mensagens não entregues recentes
    const recentFailed = history.slice(0, 3).filter(h => h.status === 'failed');
    if (recentFailed.length >= 2) {
      riskScore += 30;
      factors.push('Múltiplas falhas recentes');
    }

    // Verificar se nunca respondeu/leu
    const readCount = history.filter(h => h.status === 'read').length;
    if (readCount === 0 && history.length >= 3) {
      riskScore += 15;
      factors.push('Nunca leu mensagens');
    }

    // Determinar recomendação
    let recommendation: 'safe' | 'caution' | 'high_risk' | 'blacklist';
    if (riskScore >= 70) {
      recommendation = 'blacklist';
    } else if (riskScore >= 50) {
      recommendation = 'high_risk';
    } else if (riskScore >= 30) {
      recommendation = 'caution';
    } else {
      recommendation = 'safe';
    }

    return {
      phone,
      riskScore: Math.min(riskScore, 100),
      factors,
      recommendation,
    };
  }

  /**
   * Detecta múltiplos bloqueios em curto período
   */
  async detectMultipleBlocks(
    affectedNumber: string,
    periodHours: number = 24
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - periodHours);

    // Contar bloqueios recentes
    const recentBlocks = await db
      .select()
      .from(whatsappBlacklist)
      .where(
        and(
          eq(whatsappBlacklist.blockedNumber, affectedNumber),
          gte(whatsappBlacklist.blockedAt, cutoffTime)
        )
      );

    const blockCount = recentBlocks.length;

    if (blockCount >= 3) {
      // Criar alerta
      await this.createBlockAlert(
        affectedNumber,
        'multiple_blocks',
        blockCount >= 5 ? 'critical' : 'high',
        blockCount,
        periodHours,
        `${blockCount} bloqueios detectados em ${periodHours}h`
      );

      return true;
    }

    return false;
  }

  /**
   * Cria alerta de bloqueio
   */
  async createBlockAlert(
    affectedNumber: string,
    alertType: 'multiple_blocks' | 'high_failure_rate' | 'spam_detected' | 'number_at_risk',
    severity: 'low' | 'medium' | 'high' | 'critical',
    count: number,
    periodHours: number,
    details: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      await db.insert(whatsappBlockAlerts).values({
        affectedNumber,
        alertType,
        severity,
        count,
        periodHours,
        details,
        status: 'active',
      });

      console.warn(
        `[Block Protection] 🚨 ALERTA ${severity.toUpperCase()}: ${alertType} - ${details}`
      );

      // Notificar owner se crítico
      if (severity === 'critical' || severity === 'high') {
        await notifyOwner({
          title: `🚨 Alerta WhatsApp: ${alertType}`,
          content: `Número: ${affectedNumber}\nSeveridade: ${severity}\n\n${details}`,
        });

        // Marcar como notificado
        await db
          .update(whatsappBlockAlerts)
          .set({
            ownerNotified: 1,
            notifiedAt: new Date(),
          })
          .where(
            and(
              eq(whatsappBlockAlerts.affectedNumber, affectedNumber),
              eq(whatsappBlockAlerts.alertType, alertType),
              eq(whatsappBlockAlerts.status, 'active')
            )
          );
      }
    } catch (error) {
      console.error('[Block Protection] Erro ao criar alerta:', error);
    }
  }

  /**
   * Notifica owner sobre adição à blacklist
   */
  private async notifyBlocklistAddition(
    phone: string,
    reason: string,
    details?: string
  ): Promise<void> {
    const reasonText = {
      blocked: 'bloqueou nosso número',
      reported: 'denunciou como spam',
      invalid: 'número inválido/inexistente',
      opt_out: 'pediu para não receber mais',
      manual: 'adicionado manualmente',
    };

    await notifyOwner({
      title: '📱 Número Removido da Lista',
      content: `Número: ${phone}\nMotivo: ${reasonText[reason as keyof typeof reasonText] || reason}\n${details ? `\nDetalhes: ${details}` : ''}\n\n✅ Número foi automaticamente adicionado à blacklist e não receberá mais mensagens.`,
    });
  }

  /**
   * Obtém estatísticas de bloqueios
   */
  async getBlockStats(days: number = 7): Promise<{
    totalBlocked: number;
    byReason: Record<string, number>;
    recentBlocks: any[];
    activeAlerts: number;
  }> {
    const db = await getDb();
    if (!db) {
      return {
        totalBlocked: 0,
        byReason: {},
        recentBlocks: [],
        activeAlerts: 0,
      };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Total bloqueados
    const allBlocked = await db.select().from(whatsappBlacklist);

    // Bloqueios recentes
    const recentBlocks = await db
      .select()
      .from(whatsappBlacklist)
      .where(gte(whatsappBlacklist.blockedAt, cutoffDate))
      .orderBy(desc(whatsappBlacklist.blockedAt))
      .limit(20);

    // Contar por motivo
    const byReason: Record<string, number> = {};
    for (const block of allBlocked) {
      byReason[block.reason] = (byReason[block.reason] || 0) + 1;
    }

    // Alertas ativos
    const activeAlerts = await db
      .select()
      .from(whatsappBlockAlerts)
      .where(eq(whatsappBlockAlerts.status, 'active'));

    return {
      totalBlocked: allBlocked.length,
      byReason,
      recentBlocks,
      activeAlerts: activeAlerts.length,
    };
  }

  /**
   * Limpa blacklist de números que pediram opt-out há mais de X dias
   */
  async cleanOldOptOuts(daysOld: number = 90): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await db
        .delete(whatsappBlacklist)
        .where(
          and(
            eq(whatsappBlacklist.reason, 'opt_out'),
            gte(whatsappBlacklist.blockedAt, cutoffDate)
          )
        );

      console.log(`[Block Protection] Removidos ${result} opt-outs antigos (>${daysOld} dias)`);
      return 0; // TODO: retornar count real
    } catch (error) {
      console.error('[Block Protection] Erro ao limpar opt-outs:', error);
      return 0;
    }
  }
}

// Singleton global
export const blockProtection = new WhatsAppBlockProtection();
