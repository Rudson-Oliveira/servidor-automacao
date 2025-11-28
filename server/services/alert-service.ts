import nodemailer from "nodemailer";
import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "../db";
import { alertConfigs, alertHistory, alertTemplates, type InsertAlertHistory } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

/**
 * Serviço de Alertas Proativos Multi-Canal
 * 
 * Funcionalidades:
 * - Envio de email via nodemailer
 * - Envio de WhatsApp via webhook
 * - Notificações push via sistema interno
 * - Throttling inteligente (evita spam)
 * - Templates personalizáveis
 * - Histórico completo
 */

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertType = "anomaly" | "prediction" | "error" | "performance" | "custom";

export interface AlertPayload {
  userId: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  sourceType?: string;
  sourceId?: number;
}

export interface AlertConfig {
  emailEnabled: boolean;
  emailAddress?: string;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  pushEnabled: boolean;
  minSeverity: AlertSeverity;
  anomalyAlerts: boolean;
  predictionAlerts: boolean;
  errorAlerts: boolean;
  performanceAlerts: boolean;
  throttleMinutes: number;
  allowedHours?: { start: string; end: string };
  allowedDays?: number[];
}

// Configuração do transporter de email
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (!emailTransporter) {
    // Configuração SMTP (pode ser Gmail, SendGrid, etc)
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return emailTransporter;
}

/**
 * Verifica se o alerta deve ser enviado baseado em throttling
 */
async function shouldThrottle(
  userId: number,
  type: AlertType,
  throttleMinutes: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const cutoffTime = new Date(Date.now() - throttleMinutes * 60 * 1000);

  const recentAlerts = await db
    .select()
    .from(alertHistory)
    .where(
      and(
        eq(alertHistory.userId, userId),
        eq(alertHistory.type, type),
        gte(alertHistory.sentAt, cutoffTime)
      )
    )
    .limit(1);

  return recentAlerts.length > 0;
}

/**
 * Verifica se está dentro do horário permitido
 */
function isWithinAllowedHours(allowedHours?: { start: string; end: string }): boolean {
  if (!allowedHours) return true;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = allowedHours.start.split(":").map(Number);
  const [endHour, endMinute] = allowedHours.end.split(":").map(Number);

  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Verifica se está em um dia permitido
 */
function isWithinAllowedDays(allowedDays?: number[]): boolean {
  if (!allowedDays || allowedDays.length === 0) return true;
  
  const today = new Date().getDay();
  return allowedDays.includes(today);
}

/**
 * Compara severidades (retorna true se alert >= config)
 */
function severityMeetsThreshold(alertSeverity: AlertSeverity, minSeverity: AlertSeverity): boolean {
  const levels = { low: 0, medium: 1, high: 2, critical: 3 };
  return levels[alertSeverity] >= levels[minSeverity];
}

/**
 * Busca configuração de alertas do usuário
 */
async function getUserAlertConfig(userId: number): Promise<AlertConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const configs = await db
    .select()
    .from(alertConfigs)
    .where(eq(alertConfigs.userId, userId))
    .limit(1);

  if (configs.length === 0) return null;

  const config = configs[0];
  return {
    emailEnabled: config.emailEnabled,
    emailAddress: config.emailAddress || undefined,
    whatsappEnabled: config.whatsappEnabled,
    whatsappNumber: config.whatsappNumber || undefined,
    pushEnabled: config.pushEnabled,
    minSeverity: config.minSeverity,
    anomalyAlerts: config.anomalyAlerts,
    predictionAlerts: config.predictionAlerts,
    errorAlerts: config.errorAlerts,
    performanceAlerts: config.performanceAlerts,
    throttleMinutes: config.throttleMinutes,
    allowedHours: config.allowedHours || undefined,
    allowedDays: config.allowedDays || undefined,
  };
}

/**
 * Envia email
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { success: false, error: "SMTP não configurado" };
    }

    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || text,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Envia WhatsApp via webhook
 */
async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.WHATSAPP_WEBHOOK_URL) {
      return { success: false, error: "WhatsApp webhook não configurado" };
    }

    const response = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação push (usando sistema interno)
 */
async function sendPush(
  userId: number,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Usa o sistema de notificações do owner
    const success = await notifyOwner({
      title,
      content: body,
    });

    return { success };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Renderiza template com variáveis
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(value));
  }
  
  return result;
}

/**
 * Busca template de alerta
 */
async function getAlertTemplate(type: AlertType, severity: AlertSeverity) {
  const db = await getDb();
  if (!db) return null;

  const templates = await db
    .select()
    .from(alertTemplates)
    .where(
      and(
        eq(alertTemplates.type, type),
        eq(alertTemplates.severity, severity),
        eq(alertTemplates.isActive, true)
      )
    )
    .limit(1);

  return templates.length > 0 ? templates[0] : null;
}

/**
 * Função principal: Envia alerta multi-canal
 */
export async function sendAlert(payload: AlertPayload): Promise<{
  success: boolean;
  channels: string[];
  errors: Record<string, string>;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, channels: [], errors: { db: "Database não disponível" } };
  }

  // 1. Buscar configuração do usuário
  const config = await getUserAlertConfig(payload.userId);
  if (!config) {
    return { success: false, channels: [], errors: { config: "Usuário sem configuração de alertas" } };
  }

  // 2. Verificar se tipo de alerta está habilitado
  const typeEnabled = {
    anomaly: config.anomalyAlerts,
    prediction: config.predictionAlerts,
    error: config.errorAlerts,
    performance: config.performanceAlerts,
    custom: true,
  };

  if (!typeEnabled[payload.type]) {
    return { success: false, channels: [], errors: { type: `Alertas de ${payload.type} desabilitados` } };
  }

  // 3. Verificar severidade mínima
  if (!severityMeetsThreshold(payload.severity, config.minSeverity)) {
    return { success: false, channels: [], errors: { severity: "Severidade abaixo do threshold" } };
  }

  // 4. Verificar throttling
  if (await shouldThrottle(payload.userId, payload.type, config.throttleMinutes)) {
    return { success: false, channels: [], errors: { throttle: "Alerta throttled (muito recente)" } };
  }

  // 5. Verificar horário e dia permitidos
  if (!isWithinAllowedHours(config.allowedHours)) {
    return { success: false, channels: [], errors: { time: "Fora do horário permitido" } };
  }

  if (!isWithinAllowedDays(config.allowedDays)) {
    return { success: false, channels: [], errors: { day: "Fora dos dias permitidos" } };
  }

  // 6. Buscar template (opcional)
  const template = await getAlertTemplate(payload.type, payload.severity);

  // 7. Preparar variáveis para template
  const templateVars = {
    title: payload.title,
    message: payload.message,
    severity: payload.severity,
    type: payload.type,
    timestamp: new Date().toLocaleString("pt-BR"),
    ...payload.metadata,
  };

  // 8. Enviar por canais habilitados
  const channels: string[] = [];
  const errors: Record<string, string> = {};

  let emailSent = false;
  let emailError: string | undefined;
  let whatsappSent = false;
  let whatsappError: string | undefined;
  let pushSent = false;
  let pushError: string | undefined;

  // Email
  if (config.emailEnabled && config.emailAddress) {
    const subject = template?.emailSubject 
      ? renderTemplate(template.emailSubject, templateVars)
      : `[${payload.severity.toUpperCase()}] ${payload.title}`;
    
    const body = template?.emailBody
      ? renderTemplate(template.emailBody, templateVars)
      : payload.message;

    const html = template?.emailHtml
      ? renderTemplate(template.emailHtml, templateVars)
      : undefined;

    const result = await sendEmail(config.emailAddress, subject, body, html);
    emailSent = result.success;
    emailError = result.error;

    if (result.success) {
      channels.push("email");
    } else {
      errors.email = result.error || "Erro desconhecido";
    }
  }

  // WhatsApp
  if (config.whatsappEnabled && config.whatsappNumber) {
    const message = template?.whatsappMessage
      ? renderTemplate(template.whatsappMessage, templateVars)
      : `*${payload.title}*\n\n${payload.message}`;

    const result = await sendWhatsApp(config.whatsappNumber, message);
    whatsappSent = result.success;
    whatsappError = result.error;

    if (result.success) {
      channels.push("whatsapp");
    } else {
      errors.whatsapp = result.error || "Erro desconhecido";
    }
  }

  // Push
  if (config.pushEnabled) {
    const title = template?.pushTitle
      ? renderTemplate(template.pushTitle, templateVars)
      : payload.title;

    const body = template?.pushBody
      ? renderTemplate(template.pushBody, templateVars)
      : payload.message;

    const result = await sendPush(payload.userId, title, body);
    pushSent = result.success;
    pushError = result.error;

    if (result.success) {
      channels.push("push");
    } else {
      errors.push = result.error || "Erro desconhecido";
    }
  }

  // 9. Salvar no histórico
  const historyEntry: InsertAlertHistory = {
    userId: payload.userId,
    type: payload.type,
    severity: payload.severity,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata,
    channels,
    emailSent,
    emailError,
    whatsappSent,
    whatsappError,
    pushSent,
    pushError,
    sourceType: payload.sourceType,
    sourceId: payload.sourceId,
    sentAt: new Date(),
  };

  await db.insert(alertHistory).values(historyEntry);

  return {
    success: channels.length > 0,
    channels,
    errors,
  };
}

/**
 * Busca histórico de alertas
 */
export async function getAlertHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.userId, userId))
    .orderBy(desc(alertHistory.sentAt))
    .limit(limit);
}

/**
 * Cria configuração padrão para novo usuário
 */
export async function createDefaultAlertConfig(userId: number, email?: string) {
  const db = await getDb();
  if (!db) return null;

  const defaultConfig = {
    userId,
    emailEnabled: true,
    emailAddress: email,
    whatsappEnabled: false,
    pushEnabled: true,
    minSeverity: "medium" as AlertSeverity,
    anomalyAlerts: true,
    predictionAlerts: true,
    errorAlerts: true,
    performanceAlerts: true,
    throttleMinutes: 15,
  };

  await db.insert(alertConfigs).values(defaultConfig);
  return defaultConfig;
}
