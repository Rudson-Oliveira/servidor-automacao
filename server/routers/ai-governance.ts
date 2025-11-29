import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes, createHash } from "crypto";
import { getDb } from "../db";
import { webhookService } from "../_core/ai-governance-webhooks";
import { 
  aiClients, 
  aiPolicies, 
  aiSessions, 
  aiViolations,
  aiTrustScoreHistory 
} from "../../drizzle/schema-ai-governance";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * Router de Governança para IAs Externas
 * 
 * Gerencia registro, políticas, sessões e trust score de IAs clientes
 */

// Política atual (versão hardcoded - pode vir do banco)
const CURRENT_POLICY_VERSION = "1.0.0";
const CURRENT_POLICIES = {
  rateLimit: {
    requests: 100,
    window: "1m" // 100 requisições por minuto
  },
  allowedEndpoints: [
    "/api/comet/*",
    "/api/skills/*",
    "/api/executar",
    "/api/conversar"
  ],
  forbiddenActions: [
    "delete_user",
    "modify_system_config",
    "access_other_ai_data"
  ],
  requiredHeaders: [
    "X-AI-Client-ID",
    "X-AI-Session-Token"
  ],
  dataRetention: "30 days",
  securityRequirements: [
    "Todas as requisições devem usar HTTPS",
    "Tokens devem ser renovados a cada 24h",
    "Dados sensíveis devem ser criptografados",
    "Logs de auditoria são obrigatórios"
  ]
};

export const aiGovernanceRouter = router({
  // Obter políticas atuais (público - qualquer IA pode consultar)
  getPolicies: publicProcedure
    .query(async () => {
      return {
        version: CURRENT_POLICY_VERSION,
        effectiveFrom: new Date("2025-01-01"),
        gracePeriodDays: 7,
        policies: CURRENT_POLICIES,
        summary: "Políticas de uso para IAs externas conectadas ao servidor Manus"
      };
    }),

  // Registrar nova IA
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      version: z.string().optional(),
      provider: z.string().optional(),
      capabilities: z.array(z.string()).optional(),
      limitations: z.string().optional(),
      contactEmail: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Gerar client ID e secret únicos
      const clientId = randomBytes(32).toString("hex");
      const clientSecret = randomBytes(64).toString("hex");
      const clientSecretHash = createHash("sha256").update(clientSecret).digest("hex");

      const [newClient] = await db.insert(aiClients).values({
        name: input.name,
        version: input.version,
        provider: input.provider,
        clientId,
        clientSecret: clientSecretHash,
        capabilities: input.capabilities || [],
        limitations: input.limitations,
        contactEmail: input.contactEmail,
        status: "pending", // Requer aprovação manual
        trustScore: 50,
        tier: "bronze"
      });

      return {
        success: true,
        message: "IA registrada com sucesso. Aguardando aprovação do administrador.",
        clientId,
        clientSecret, // IMPORTANTE: Mostrar apenas uma vez!
        warning: "Guarde o client_secret em local seguro. Ele não será mostrado novamente."
      };
    }),

  // Aceitar termos de uso
  acceptTerms: publicProcedure
    .input(z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      policiesVersion: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Validar credenciais
      const secretHash = createHash("sha256").update(input.clientSecret).digest("hex");
      const [client] = await db
        .select()
        .from(aiClients)
        .where(and(
          eq(aiClients.clientId, input.clientId),
          eq(aiClients.clientSecret, secretHash)
        ))
        .limit(1);

      if (!client) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }

      if (client.status === "banned") {
        throw new TRPCError({ code: "FORBIDDEN", message: "IA banida do sistema" });
      }

      // Atualizar aceitação de políticas
      await db
        .update(aiClients)
        .set({
          acceptedPoliciesVersion: input.policiesVersion,
          acceptedPoliciesAt: new Date(),
        })
        .where(eq(aiClients.id, client.id));

      return {
        success: true,
        message: "Termos aceitos com sucesso",
        currentPolicies: CURRENT_POLICIES
      };
    }),

  // Criar nova sessão
  createSession: publicProcedure
    .input(z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      context: z.object({
        conversationId: z.string().optional(),
        userId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Validar credenciais
      const secretHash = createHash("sha256").update(input.clientSecret).digest("hex");
      const [client] = await db
        .select()
        .from(aiClients)
        .where(and(
          eq(aiClients.clientId, input.clientId),
          eq(aiClients.clientSecret, secretHash)
        ))
        .limit(1);

      if (!client) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }

      if (client.status !== "active") {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: `IA não está ativa. Status: ${client.status}` 
        });
      }

      // Verificar se aceitou políticas atuais
      if (client.acceptedPoliciesVersion !== CURRENT_POLICY_VERSION) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Você precisa aceitar a versão mais recente das políticas",
          cause: {
            currentVersion: CURRENT_POLICY_VERSION,
            acceptedVersion: client.acceptedPoliciesVersion
          }
        });
      }

      // Gerar session token
      const sessionToken = randomBytes(64).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await db.insert(aiSessions).values({
        clientId: input.clientId,
        sessionToken,
        context: input.context || {},
        policiesVersion: CURRENT_POLICY_VERSION,
        policiesAcknowledged: true,
        expiresAt,
        status: "active"
      });

      // Atualizar lastSeenAt
      await db
        .update(aiClients)
        .set({ lastSeenAt: new Date() })
        .where(eq(aiClients.id, client.id));

      return {
        success: true,
        sessionToken,
        expiresAt,
        policies: {
          version: CURRENT_POLICY_VERSION,
          rules: CURRENT_POLICIES
        },
        reminder: "Estas políticas devem ser seguidas durante toda a sessão"
      };
    }),

  // Validar sessão (middleware usa isso)
  validateSession: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [session] = await db
        .select()
        .from(aiSessions)
        .where(eq(aiSessions.sessionToken, input.sessionToken))
        .limit(1);

      if (!session) {
        return { valid: false, reason: "Sessão não encontrada" };
      }

      if (session.status !== "active") {
        return { valid: false, reason: `Sessão ${session.status}` };
      }

      if (new Date() > session.expiresAt) {
        await db
          .update(aiSessions)
          .set({ status: "expired" })
          .where(eq(aiSessions.id, session.id));
        return { valid: false, reason: "Sessão expirada" };
      }

      // Atualizar última atividade
      await db
        .update(aiSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(aiSessions.id, session.id));

      return {
        valid: true,
        clientId: session.clientId,
        policiesVersion: session.policiesVersion
      };
    }),

  // Registrar violação
  reportViolation: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      sessionId: z.number().optional(),
      violationType: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string(),
      endpoint: z.string().optional(),
      requestData: z.any().optional(),
      actionTaken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(aiViolations).values(input);

      // Emitir evento de violação
      await webhookService.emitEvent({
        type: 'violation_detected',
        timestamp: new Date(),
        aiId: input.clientId,
        data: {
          violationType: input.violationType,
          severity: input.severity,
          description: input.description,
          endpoint: input.endpoint,
        },
      });

      // Atualizar trust score do cliente
      const [client] = await db
        .select()
        .from(aiClients)
        .where(eq(aiClients.clientId, input.clientId))
        .limit(1);

      if (client) {
        const newViolationCount = client.totalViolations + 1;
        await db
          .update(aiClients)
          .set({ totalViolations: newViolationCount })
          .where(eq(aiClients.id, client.id));

        // Ajustar trust score baseado na severidade
        let scoreChange = 0;
        switch (input.severity) {
          case "low": scoreChange = -2; break;
          case "medium": scoreChange = -5; break;
          case "high": scoreChange = -10; break;
          case "critical": scoreChange = -20; break;
        }

        const newScore = Math.max(0, Math.min(100, client.trustScore + scoreChange));
        await db
          .update(aiClients)
          .set({ trustScore: newScore })
          .where(eq(aiClients.id, client.id));

        // Registrar histórico
        await db.insert(aiTrustScoreHistory).values({
          clientId: input.clientId,
          previousScore: client.trustScore,
          newScore,
          change: scoreChange,
          reason: `Violação: ${input.violationType}`,
          details: input.description,
          factors: { violationCount: newViolationCount }
        });

        // Suspender se score muito baixo
        if (newScore < 20) {
          await db
            .update(aiClients)
            .set({ status: "suspended" })
            .where(eq(aiClients.id, client.id));
        }
      }

      return { success: true };
    }),

  // Listar IAs registradas (admin)
  listClients: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const clients = await db
        .select()
        .from(aiClients)
        .orderBy(desc(aiClients.createdAt));

      return clients;
    }),

  // Obter detalhes de uma IA (admin)
  getClientDetails: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [client] = await db
        .select()
        .from(aiClients)
        .where(eq(aiClients.clientId, input.clientId))
        .limit(1);

      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "IA não encontrada" });
      }

      // Buscar violações recentes
      const violations = await db
        .select()
        .from(aiViolations)
        .where(eq(aiViolations.clientId, input.clientId))
        .orderBy(desc(aiViolations.createdAt))
        .limit(10);

      // Buscar histórico de trust score
      const scoreHistory = await db
        .select()
        .from(aiTrustScoreHistory)
        .where(eq(aiTrustScoreHistory.clientId, input.clientId))
        .orderBy(desc(aiTrustScoreHistory.createdAt))
        .limit(20);

      return {
        client,
        violations,
        scoreHistory
      };
    }),

  // Aprovar IA (admin)
  approveClient: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(aiClients)
        .set({ status: "active" })
        .where(eq(aiClients.clientId, input.clientId));

      return { success: true, message: "IA aprovada com sucesso" };
    }),

  // Suspender IA (admin)
  suspendClient: protectedProcedure
    .input(z.object({ 
      clientId: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(aiClients)
        .set({ status: "suspended" })
        .where(eq(aiClients.clientId, input.clientId));

      // Registrar violação
      await db.insert(aiViolations).values({
        clientId: input.clientId,
        violationType: "admin_suspension",
        severity: "critical",
        description: input.reason,
        actionTaken: "suspended"
      });

      // Emitir evento de suspensão
      await webhookService.emitEvent({
        type: 'session_suspended',
        timestamp: new Date(),
        aiId: input.clientId,
        data: {
          reason: input.reason,
        },
      });

      return { success: true, message: "IA suspensa com sucesso" };
    }),
});
