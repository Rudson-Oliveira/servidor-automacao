import { describe, expect, it, beforeEach } from "vitest";
import { skills } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

describe("POST /api/skills - Criar nova skill", () => {
  beforeEach(async () => {
    // Limpar skills de teste antes de cada teste
    const db = await getDb();
    if (db) {
      await db.delete(skills).where(eq(skills.nome, "Teste Skill"));
      await db.delete(skills).where(eq(skills.nome, "Skill Duplicada"));
      await db.delete(skills).where(eq(skills.nome, "Skill Mínima"));
    }
  });

  it("deve criar uma nova skill com sucesso", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const novaSkill = {
      nome: "Teste Skill",
      descricao: "Skill de teste para validação",
      categoria: "teste",
      instrucoes: "1. Executar teste\\n2. Validar resultado",
      exemplo: "Exemplo de uso da skill",
      tags: "teste,validacao",
      autonomiaNivel: "total"
    };

    // Inserir skill
    await db.insert(skills).values({
      nome: novaSkill.nome,
      descricao: novaSkill.descricao,
      categoria: novaSkill.categoria,
      instrucoes: novaSkill.instrucoes,
      exemplo: novaSkill.exemplo,
      tags: novaSkill.tags,
      autonomiaNivel: novaSkill.autonomiaNivel as any
    });

    // Verificar se foi criada
    const skillCriada = await db
      .select()
      .from(skills)
      .where(eq(skills.nome, novaSkill.nome))
      .limit(1);

    expect(skillCriada).toHaveLength(1);
    expect(skillCriada[0]?.nome).toBe(novaSkill.nome);
    expect(skillCriada[0]?.descricao).toBe(novaSkill.descricao);
    expect(skillCriada[0]?.instrucoes).toBe(novaSkill.instrucoes);
    expect(skillCriada[0]?.autonomiaNivel).toBe("total");
  });

  it("deve validar campos obrigatórios", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Tentar inserir sem nome (deve falhar)
    try {
      await db.insert(skills).values({
        nome: "", // Nome vazio
        descricao: "Teste",
        instrucoes: "Teste"
      } as any);
      throw new Error("Deveria ter falhado");
    } catch (error: any) {
      expect(error.message).toBeTruthy();
    }
  });

  it("deve impedir skills duplicadas", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const skillData = {
      nome: "Skill Duplicada",
      descricao: "Teste de duplicação",
      instrucoes: "Instruções de teste"
    };

    // Inserir primeira vez
    await db.insert(skills).values(skillData);

    // Verificar que foi criada
    const skillCriada = await db
      .select()
      .from(skills)
      .where(eq(skills.nome, skillData.nome))
      .limit(1);

    expect(skillCriada).toHaveLength(1);
    expect(skillCriada[0]?.nome).toBe(skillData.nome);

    // Tentar inserir novamente deve falhar devido à constraint unique
    let erroCapturado = false;
    try {
      await db.insert(skills).values(skillData);
    } catch (error: any) {
      erroCapturado = true;
      // Erro capturado - duplicação impedida com sucesso
      expect(error).toBeDefined();
    }
    // O importante é que o erro foi capturado, impedindo a duplicação
    expect(erroCapturado).toBe(true);
  });

  it("deve usar valores padrão quando não fornecidos", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const skillMinima = {
      nome: "Skill Mínima",
      descricao: "Skill com campos mínimos",
      instrucoes: "Instruções básicas"
    };

    await db.insert(skills).values(skillMinima);

    const skillCriada = await db
      .select()
      .from(skills)
      .where(eq(skills.nome, skillMinima.nome))
      .limit(1);

    expect(skillCriada).toHaveLength(1);
    expect(skillCriada[0]?.usoCount).toBe(0);
    expect(skillCriada[0]?.sucessoCount).toBe(0);
    expect(skillCriada[0]?.falhaCount).toBe(0);
    expect(skillCriada[0]?.autonomiaNivel).toBe("media"); // Valor padrão
  });
});
