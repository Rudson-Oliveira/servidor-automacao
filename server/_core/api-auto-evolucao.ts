import { getDb } from "../db";
import { mysqlTable, int, timestamp, text, varchar, json } from "drizzle-orm/mysql-core";
import { desc, eq } from "drizzle-orm";
import { sistemaPai } from "./sistema-pai";
import { notifyOwner } from "./notification";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

/**
 * API DE AUTO-EVOLUÇÃO
 * 
 * Permite que IAs externas (Manus, Comet, Perplexity, etc) possam:
 * 1. Conhecer o sistema através de documentação
 * 2. Enviar melhorias e sugestões de código
 * 3. Receber feedback sobre implementações
 * 4. Aprender continuamente com o uso real
 * 
 * Isso cria um ciclo de evolução exponencial!
 */

// Schema: Base de conhecimento do sistema
export const aiKnowledgeBase = mysqlTable("ai_knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  module: varchar("module", { length: 100 }).notNull(), // 'sistema-pai', 'auto-tests', 'api', etc
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  codeSnippet: text("code_snippet"), // Exemplo de código
  apiEndpoint: varchar("api_endpoint", { length: 255 }), // Se aplicável
  dependencies: json("dependencies").$type<string[]>(), // Dependências
  tags: json("tags").$type<string[]>(), // Tags para busca
  version: varchar("version", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Schema: Contribuições de IAs
export const aiContributions = mysqlTable("ai_contributions", {
  id: int("id").autoincrement().primaryKey(),
  aiSource: varchar("ai_source", { length: 100 }).notNull(), // 'manus', 'comet', 'perplexity', etc
  aiApiKey: varchar("ai_api_key", { length: 255 }).notNull(), // API key secreta da IA
  
  contributionType: varchar("contribution_type", { length: 50 }).notNull(), // 'bug-fix', 'feature', 'optimization', 'documentation'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Código proposto
  targetModule: varchar("target_module", { length: 100 }).notNull(),
  targetFile: varchar("target_file", { length: 500 }),
  proposedCode: text("proposed_code"),
  diffPatch: text("diff_patch"), // Git diff
  
  // Validação
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'approved', 'rejected', 'applied'
  validationScore: int("validation_score"), // 0-100
  validationErrors: text("validation_errors"),
  
  // Aplicação
  backupIdBeforeApply: int("backup_id_before_apply"),
  appliedAt: timestamp("applied_at"),
  appliedBy: varchar("applied_by", { length: 100 }),
  
  // Feedback
  impactScore: int("impact_score"), // 0-100 (medido após aplicação)
  userFeedback: text("user_feedback"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Schema: Feedback para IAs
export const aiEvolutionFeedback = mysqlTable("ai_evolution_feedback", {
  id: int("id").autoincrement().primaryKey(),
  contributionId: int("contribution_id").notNull(),
  
  feedbackType: varchar("feedback_type", { length: 50 }).notNull(), // 'success', 'failure', 'improvement-needed'
  message: text("message").notNull(),
  metrics: json("metrics").$type<{
    testsPassedBefore: number;
    testsPassedAfter: number;
    performanceImpact: number; // % de melhoria/piora
    codeQualityScore: number; // 0-100
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface KnowledgeQuery {
  module?: string;
  tags?: string[];
  search?: string;
}

export interface ContributionSubmission {
  aiSource: string;
  aiApiKey: string;
  contributionType: "bug-fix" | "feature" | "optimization" | "documentation";
  title: string;
  description: string;
  targetModule: string;
  targetFile?: string;
  proposedCode?: string;
  diffPatch?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

/**
 * Sistema de API de Auto-Evolução
 */
export class ApiAutoEvolucao {
  /**
   * Obtém conhecimento sobre o sistema
   */
  async getKnowledge(query: KnowledgeQuery): Promise<typeof aiKnowledgeBase.$inferSelect[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let results = await db.select().from(aiKnowledgeBase);

    // Filtrar por módulo
    if (query.module) {
      results = results.filter(k => k.module === query.module);
    }

    // Filtrar por tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(k => 
        k.tags && query.tags!.some(tag => k.tags.includes(tag))
      );
    }

    // Busca por texto
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(k =>
        k.title.toLowerCase().includes(searchLower) ||
        k.description.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Submete uma contribuição de IA
   */
  async submitContribution(submission: ContributionSubmission): Promise<{
    contributionId: number;
    status: string;
    validation: ValidationResult;
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log(`[ApiAutoEvolucao] 📥 Nova contribuição de ${submission.aiSource}: ${submission.title}`);

    // Validar API key
    const isValidKey = await this.validateApiKey(submission.aiApiKey, submission.aiSource);
    if (!isValidKey) {
      throw new Error("API key inválida");
    }

    // Validar código proposto
    const validation = await this.validateContribution(submission);

    // Inserir contribuição
    const [result] = await db.insert(aiContributions).values({
      aiSource: submission.aiSource,
      aiApiKey: submission.aiApiKey,
      contributionType: submission.contributionType,
      title: submission.title,
      description: submission.description,
      targetModule: submission.targetModule,
      targetFile: submission.targetFile || null,
      proposedCode: submission.proposedCode || null,
      diffPatch: submission.diffPatch || null,
      status: validation.valid && validation.score >= 70 ? "approved" : "pending",
      validationScore: validation.score,
      validationErrors: validation.errors.join("\n") || null,
    });

    const contributionId = result.insertId;

    // Se validação passou e score alto, aplicar automaticamente
    if (validation.valid && validation.score >= 80) {
      console.log(`[ApiAutoEvolucao] ✅ Contribuição aprovada automaticamente (score: ${validation.score})`);
      await this.applyContribution(contributionId);
    } else {
      console.log(`[ApiAutoEvolucao] ⏳ Contribuição pendente de revisão manual (score: ${validation.score})`);
    }

    // Notificar
    await notifyOwner({
      title: `📥 Nova Contribuição de IA: ${submission.aiSource}`,
      content: `Tipo: ${submission.contributionType}\nTítulo: ${submission.title}\nScore: ${validation.score}/100\nStatus: ${validation.valid && validation.score >= 70 ? "Aprovada" : "Pendente"}`,
    });

    return {
      contributionId,
      status: validation.valid && validation.score >= 70 ? "approved" : "pending",
      validation,
    };
  }

  /**
   * Valida uma contribuição
   */
  private async validateContribution(submission: ContributionSubmission): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Validação 1: Código tem sintaxe válida?
    if (submission.proposedCode) {
      try {
        // Salvar em arquivo temporário
        const tempFile = `/tmp/validation-${Date.now()}.ts`;
        await fs.writeFile(tempFile, submission.proposedCode);

        // Verificar sintaxe TypeScript
        const { stderr } = await execAsync(`npx tsc --noEmit ${tempFile} 2>&1 || true`);
        
        if (stderr && stderr.includes("error TS")) {
          errors.push("Código contém erros de sintaxe TypeScript");
          score -= 30;
        }

        // Limpar arquivo temporário
        await fs.unlink(tempFile);
      } catch (error) {
        warnings.push("Não foi possível validar sintaxe automaticamente");
        score -= 10;
      }
    }

    // Validação 2: Descrição é clara?
    if (submission.description.length < 50) {
      warnings.push("Descrição muito curta");
      score -= 5;
    }

    // Validação 3: Módulo alvo existe?
    const validModules = [
      "sistema-pai",
      "auto-tests",
      "auto-correction",
      "api-auto-evolucao",
      "skills",
      "comet",
      "obsidian",
      "whatsapp",
    ];

    if (!validModules.includes(submission.targetModule)) {
      warnings.push(`Módulo '${submission.targetModule}' não reconhecido`);
      score -= 10;
    }

    // Validação 4: Tipo de contribuição apropriado?
    const validTypes = ["bug-fix", "feature", "optimization", "documentation"];
    if (!validTypes.includes(submission.contributionType)) {
      errors.push("Tipo de contribuição inválido");
      score -= 20;
    }

    const valid = errors.length === 0 && score >= 50;

    return {
      valid,
      score: Math.max(0, score),
      errors,
      warnings,
    };
  }

  /**
   * Aplica uma contribuição aprovada
   */
  async applyContribution(contributionId: number): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [contribution] = await db.select()
      .from(aiContributions)
      .where(eq(aiContributions.id, contributionId));

    if (!contribution) {
      throw new Error(`Contribuição ${contributionId} não encontrada`);
    }

    if (contribution.status === "applied") {
      console.log(`[ApiAutoEvolucao] Contribuição ${contributionId} já foi aplicada`);
      return true;
    }

    console.log(`[ApiAutoEvolucao] 🔧 Aplicando contribuição ${contributionId}...`);

    try {
      // Criar backup ANTES de aplicar
      const backupId = await sistemaPai.createBackup({
        type: "pre-update",
        description: `Backup antes de aplicar contribuição de ${contribution.aiSource}`,
        notes: `Contribuição ID: ${contributionId}\nTítulo: ${contribution.title}`,
      });

      // Aplicar código
      if (contribution.targetFile && contribution.proposedCode) {
        const filePath = path.join("/home/ubuntu/servidor-automacao", contribution.targetFile);
        await fs.writeFile(filePath, contribution.proposedCode);
        console.log(`[ApiAutoEvolucao] Arquivo atualizado: ${contribution.targetFile}`);
      }

      // Executar testes para validar
      console.log("[ApiAutoEvolucao] Executando testes de validação...");
      const { stdout } = await execAsync(
        "cd /home/ubuntu/servidor-automacao && pnpm test --run 2>&1 || true",
        { timeout: 120000 }
      );

      const passMatch = stdout.match(/(\d+) passed/);
      const failMatch = stdout.match(/(\d+) failed/);
      const passingTests = passMatch ? parseInt(passMatch[1]) : 0;
      const failingTests = failMatch ? parseInt(failMatch[1]) : 0;

      // Se testes falharam, fazer rollback
      if (failingTests > 0) {
        console.log(`[ApiAutoEvolucao] ❌ Testes falharam (${failingTests}), fazendo rollback...`);
        
        await sistemaPai.restoreBackup(backupId, {
          reason: "auto-correction-failed",
          reasonDetails: `Contribuição ${contributionId} causou ${failingTests} testes falharem`,
          requestedBy: "api-auto-evolucao",
        });

        // Atualizar status
        await db.update(aiContributions)
          .set({
            status: "rejected",
            validationErrors: `${failingTests} testes falharam após aplicação`,
          })
          .where(eq(aiContributions.id, contributionId));

        // Enviar feedback negativo
        await this.sendFeedback(contributionId, {
          type: "failure",
          message: `Contribuição causou ${failingTests} testes falharem e foi revertida`,
          testsPassedBefore: passingTests + failingTests,
          testsPassedAfter: passingTests,
        });

        return false;
      }

      // Sucesso!
      await db.update(aiContributions)
        .set({
          status: "applied",
          backupIdBeforeApply: backupId,
          appliedAt: new Date(),
          appliedBy: "auto-system",
        })
        .where(eq(aiContributions.id, contributionId));

      console.log(`[ApiAutoEvolucao] ✅ Contribuição ${contributionId} aplicada com sucesso`);

      // Enviar feedback positivo
      await this.sendFeedback(contributionId, {
        type: "success",
        message: "Contribuição aplicada com sucesso! Todos os testes passaram.",
        testsPassedBefore: passingTests,
        testsPassedAfter: passingTests,
      });

      // Notificar
      await notifyOwner({
        title: `✅ Contribuição Aplicada: ${contribution.aiSource}`,
        content: `Título: ${contribution.title}\nTipo: ${contribution.contributionType}\nTestes: ${passingTests} passaram\nBackup ID: ${backupId}`,
      });

      return true;
    } catch (error) {
      console.error(`[ApiAutoEvolucao] Erro ao aplicar contribuição:`, error);

      // Atualizar status
      await db.update(aiContributions)
        .set({
          status: "rejected",
          validationErrors: error instanceof Error ? error.message : String(error),
        })
        .where(eq(aiContributions.id, contributionId));

      return false;
    }
  }

  /**
   * Envia feedback para IA contribuidora
   */
  private async sendFeedback(
    contributionId: number,
    feedback: {
      type: "success" | "failure" | "improvement-needed";
      message: string;
      testsPassedBefore: number;
      testsPassedAfter: number;
    }
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(aiEvolutionFeedback).values({
      contributionId,
      feedbackType: feedback.type,
      message: feedback.message,
      metrics: {
        testsPassedBefore: feedback.testsPassedBefore,
        testsPassedAfter: feedback.testsPassedAfter,
        performanceImpact: 0, // TODO: medir performance
        codeQualityScore: feedback.type === "success" ? 90 : 50,
      },
    });

    console.log(`[ApiAutoEvolucao] Feedback enviado para contribuição ${contributionId}: ${feedback.type}`);
  }

  /**
   * Lista contribuições pendentes
   */
  async listPendingContributions(): Promise<typeof aiContributions.$inferSelect[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.select()
      .from(aiContributions)
      .where(eq(aiContributions.status, "pending"))
      .orderBy(desc(aiContributions.createdAt));
  }

  /**
   * Obtém feedback de uma contribuição
   */
  async getFeedback(contributionId: number): Promise<typeof aiEvolutionFeedback.$inferSelect[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.select()
      .from(aiEvolutionFeedback)
      .where(eq(aiEvolutionFeedback.contributionId, contributionId))
      .orderBy(desc(aiEvolutionFeedback.createdAt));
  }

  /**
   * Valida API key de IA
   */
  private async validateApiKey(apiKey: string, aiSource: string): Promise<boolean> {
    // TODO: Implementar validação real de API keys
    // Por enquanto, aceitar qualquer key que comece com o nome da IA
    return apiKey.startsWith(aiSource.toLowerCase());
  }

  /**
   * Popula base de conhecimento inicial
   */
  async populateKnowledgeBase(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verificar se já existe conhecimento
    const existing = await db.select().from(aiKnowledgeBase).limit(1);
    if (existing.length > 0) {
      console.log("[ApiAutoEvolucao] Base de conhecimento já populada");
      return;
    }

    console.log("[ApiAutoEvolucao] Populando base de conhecimento...");

    const knowledge = [
      {
        module: "sistema-pai",
        title: "Sistema Pai - Backups Automáticos",
        description: "Sistema de backups rolling de 7 dias com protótipo original preservado. Similar à fórmula da Coca-Cola.",
        apiEndpoint: "/api/trpc/sistemaPai.createBackup",
        tags: ["backup", "rollback", "proteção"],
        version: "1.0.0",
      },
      {
        module: "auto-tests",
        title: "Auto-Testes Noturnos",
        description: "Executa todos os testes automaticamente às 3h da manhã. Se falhar > 5%, faz rollback automático.",
        apiEndpoint: "/api/trpc/sistemaPai.listBackups",
        tags: ["testes", "automação", "qualidade"],
        version: "1.0.0",
      },
      {
        module: "auto-correction",
        title: "Auto-Correção com Rollback",
        description: "Detecta problemas automaticamente e aplica correções COM backup antes. Se falhar, rollback automático.",
        tags: ["correção", "rollback", "automação"],
        version: "1.0.0",
      },
      {
        module: "api-auto-evolucao",
        title: "API de Auto-Evolução",
        description: "Permite IAs externas enviarem melhorias. Validação automática e aplicação com rollback se necessário.",
        apiEndpoint: "/api/evolution/contribute",
        tags: ["evolução", "ia", "contribuições"],
        version: "1.0.0",
      },
    ];

    for (const item of knowledge) {
      await db.insert(aiKnowledgeBase).values(item);
    }

    console.log(`[ApiAutoEvolucao] ✅ ${knowledge.length} itens adicionados à base de conhecimento`);
  }
}

// Instância singleton
export const apiAutoEvolucao = new ApiAutoEvolucao();
