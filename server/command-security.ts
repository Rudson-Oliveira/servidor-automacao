import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import {
  commandWhitelist,
  commandBlacklist,
  commandAudit,
  type InsertCommandAudit,
} from "../drizzle/schema-security";

/**
 * 🛡️ SERVIÇO DE VALIDAÇÃO DE SEGURANÇA PARA COMANDOS SHELL
 * 
 * Valida comandos antes de serem executados, prevenindo execução de
 * comandos perigosos e mantendo auditoria completa.
 */

// Comandos perigosos padrão (hardcoded para garantir segurança básica)
const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\s+\//, // rm -rf /
  /\bformat\b/i, // format
  /\bdd\s+if=/i, // dd if=
  /\bdel\s+\/s\s+\/q/i, // del /s /q (Windows)
  /\brd\s+\/s\s+\/q/i, // rd /s /q (Windows)
  /:\(\)\{\s*:\|\:&\s*\};:/, // Fork bomb
  />\s*\/dev\/sda/, // Escrever direto no disco
  /\bmkfs\b/i, // Formatar partição
  /\bfdisk\b/i, // Manipular partições
  /\bshutdown\b/i, // Desligar sistema
  /\breboot\b/i, // Reiniciar sistema
  /\bsudo\s+rm/i, // sudo rm
  /\bsudo\s+dd/i, // sudo dd
];

// Comandos que requerem confirmação (mas não são bloqueados)
const CONFIRMATION_PATTERNS = [
  /\brm\s+-r/i, // rm -r (recursivo)
  /\bdel\s+\/s/i, // del /s (Windows recursivo)
  /\bnpm\s+uninstall/i, // Desinstalar pacotes
  /\bpip\s+uninstall/i, // Desinstalar pacotes Python
  /\bgit\s+reset\s+--hard/i, // Git reset hard
  /\bgit\s+clean\s+-fd/i, // Git clean
];

export interface ValidationResult {
  isAllowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  matchedRule?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

/**
 * Valida um comando shell antes de executá-lo
 */
export async function validateCommand(
  command: string,
  userId: number,
  agentId: number
): Promise<ValidationResult> {
  const db = await getDb();

  // 1. Verificar padrões perigosos hardcoded
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      const result: ValidationResult = {
        isAllowed: false,
        requiresConfirmation: false,
        reason: "Comando bloqueado por conter padrão perigoso",
        matchedRule: pattern.source,
        severity: "critical",
      };

      // Registrar auditoria
      await auditCommand(command, userId, agentId, "blocked", result.reason, result.matchedRule, result.severity);

      return result;
    }
  }

  // 2. Verificar blacklist do banco de dados
  if (db) {
    try {
      const blacklistRules = await db
        .select()
        .from(commandBlacklist)
        .where(eq(commandBlacklist.isActive, "yes"));

      for (const rule of blacklistRules) {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(command)) {
          const result: ValidationResult = {
            isAllowed: false,
            requiresConfirmation: rule.requiresConfirmation === "yes",
            reason: rule.description || "Comando bloqueado por regra de blacklist",
            matchedRule: rule.pattern,
            severity: rule.severity,
          };

          // Registrar auditoria
          await auditCommand(command, userId, agentId, "blocked", result.reason, result.matchedRule, result.severity);

          return result;
        }
      }
    } catch (error) {
      console.error("[CommandSecurity] Erro ao verificar blacklist:", error);
    }
  }

  // 3. Verificar se requer confirmação
  for (const pattern of CONFIRMATION_PATTERNS) {
    if (pattern.test(command)) {
      const result: ValidationResult = {
        isAllowed: true,
        requiresConfirmation: true,
        reason: "Comando requer confirmação manual",
        matchedRule: pattern.source,
        severity: "medium",
      };

      // Registrar auditoria
      await auditCommand(command, userId, agentId, "confirmed", result.reason, result.matchedRule, result.severity);

      return result;
    }
  }

  // 4. Verificar whitelist (opcional - se existir, permite sem confirmação)
  if (db) {
    try {
      const whitelistRules = await db
        .select()
        .from(commandWhitelist)
        .where(eq(commandWhitelist.isActive, "yes"));

      for (const rule of whitelistRules) {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(command)) {
          const result: ValidationResult = {
            isAllowed: true,
            requiresConfirmation: false,
            reason: "Comando permitido por regra de whitelist",
            matchedRule: rule.pattern,
          };

          // Registrar auditoria
          await auditCommand(command, userId, agentId, "allowed", result.reason, result.matchedRule);

          return result;
        }
      }
    } catch (error) {
      console.error("[CommandSecurity] Erro ao verificar whitelist:", error);
    }
  }

  // 5. Comando não está em nenhuma lista - permitir com confirmação padrão
  const result: ValidationResult = {
    isAllowed: true,
    requiresConfirmation: false,
    reason: "Comando não encontrado em listas de segurança",
  };

  // Registrar auditoria
  await auditCommand(command, userId, agentId, "allowed", result.reason);

  return result;
}

/**
 * Registra uma tentativa de execução de comando na auditoria
 */
export async function auditCommand(
  command: string,
  userId: number,
  agentId: number,
  action: "allowed" | "blocked" | "confirmed",
  reason?: string,
  matchedRule?: string,
  severity?: "low" | "medium" | "high" | "critical",
  commandId?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[CommandSecurity] Database not available for audit");
    return;
  }

  try {
    await db.insert(commandAudit).values({
      userId,
      agentId,
      commandId,
      command,
      action,
      reason,
      matchedRule,
      severity,
      ipAddress,
      userAgent,
    });

    console.log(`[CommandSecurity] Auditoria registrada: ${action} - ${command.substring(0, 50)}`);
  } catch (error) {
    console.error("[CommandSecurity] Erro ao registrar auditoria:", error);
  }
}

/**
 * Lista regras de whitelist
 */
export async function listWhitelist(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rules = await db
      .select()
      .from(commandWhitelist)
      .where(eq(commandWhitelist.createdBy, userId));

    return rules;
  } catch (error) {
    console.error("[CommandSecurity] Erro ao listar whitelist:", error);
    return [];
  }
}

/**
 * Lista regras de blacklist
 */
export async function listBlacklist(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rules = await db
      .select()
      .from(commandBlacklist)
      .where(eq(commandBlacklist.createdBy, userId));

    return rules;
  } catch (error) {
    console.error("[CommandSecurity] Erro ao listar blacklist:", error);
    return [];
  }
}

/**
 * Lista auditoria de comandos
 */
export async function listAudit(
  userId: number,
  agentId?: number,
  action?: "allowed" | "blocked" | "confirmed",
  limit: number = 100
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [eq(commandAudit.userId, userId)];

    if (agentId !== undefined) {
      conditions.push(eq(commandAudit.agentId, agentId));
    }

    if (action !== undefined) {
      conditions.push(eq(commandAudit.action, action));
    }

    const audit = await db
      .select()
      .from(commandAudit)
      .where(and(...conditions))
      .limit(limit)
      .orderBy(commandAudit.createdAt);

    return audit;
  } catch (error) {
    console.error("[CommandSecurity] Erro ao listar auditoria:", error);
    return [];
  }
}

/**
 * Adiciona regra à whitelist
 */
export async function addWhitelistRule(
  pattern: string,
  description: string,
  category: string,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(commandWhitelist).values({
      pattern,
      description,
      category,
      createdBy: userId,
      isActive: "yes",
    });

    console.log(`[CommandSecurity] Regra de whitelist adicionada: ${pattern}`);
    return true;
  } catch (error) {
    console.error("[CommandSecurity] Erro ao adicionar whitelist:", error);
    return false;
  }
}

/**
 * Adiciona regra à blacklist
 */
export async function addBlacklistRule(
  pattern: string,
  description: string,
  severity: "low" | "medium" | "high" | "critical",
  requiresConfirmation: boolean,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(commandBlacklist).values({
      pattern,
      description,
      severity,
      requiresConfirmation: requiresConfirmation ? "yes" : "no",
      createdBy: userId,
      isActive: "yes",
    });

    console.log(`[CommandSecurity] Regra de blacklist adicionada: ${pattern}`);
    return true;
  } catch (error) {
    console.error("[CommandSecurity] Erro ao adicionar blacklist:", error);
    return false;
  }
}
