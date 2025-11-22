import type { Express } from "express";
import { eq, like, or } from "drizzle-orm";
import { skills } from "../../drizzle/schema";
import { getDb } from "../db";

export function registerSkillsRoutes(app: Express) {
  // GET /api/skills/categorias - Listar categorias
  app.get("/api/skills/categorias", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ sucesso: false, erro: "Banco de dados indisponível" });
      }

      const { sql } = await import("drizzle-orm");
      const categorias = await db
        .select({
          categoria: skills.categoria,
          total: sql<number>`count(*)`.as('total'),
          totalUso: sql<number>`sum(${skills.usoCount})`.as('totalUso'),
        })
        .from(skills)
        .groupBy(skills.categoria)
        .orderBy(sql`count(*) desc`);

      res.json({
        sucesso: true,
        dados: {
          categorias: categorias.map(cat => ({
            nome: cat.categoria,
            totalSkills: cat.total,
            totalUso: cat.totalUso || 0,
          })),
          total: categorias.length,
        },
      });
    } catch (erro) {
      console.error("[Skills Categorias] Erro:", erro);
      res.status(500).json({ sucesso: false, erro: "Erro ao buscar categorias" });
    }
  });

  // GET /api/skills - Listar todas as skills
  app.get("/api/skills", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const allSkills = await db.select().from(skills).orderBy(skills.nome);
      
      res.json({
        total: allSkills.length,
        skills: allSkills,
      });
    } catch (error) {
      console.error("[Skills] Error listing skills:", error);
      res.status(500).json({ error: "Failed to list skills" });
    }
  });

  // GET /api/skills/:nome - Buscar skill por nome
  app.get("/api/skills/:nome", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const nome = decodeURIComponent(req.params.nome);
      const skill = await db
        .select()
        .from(skills)
        .where(eq(skills.nome, nome))
        .limit(1);

      if (skill.length === 0) {
        return res.status(404).json({ error: "Skill not found" });
      }

      // Incrementar contador de uso
      const foundSkill = skill[0];
      if (foundSkill) {
        await db
          .update(skills)
          .set({
            usoCount: (foundSkill.usoCount || 0) + 1,
            ultimaExecucao: new Date(),
          })
          .where(eq(skills.id, foundSkill.id));
      }

      res.json(skill[0]);
    } catch (error) {
      console.error("[Skills] Error getting skill:", error);
      res.status(500).json({ error: "Failed to get skill" });
    }
  });

  // GET /api/skills/buscar?query=... - Buscar skills por query
  app.get("/api/skills/buscar", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const searchPattern = `%${query}%`;
      const results = await db
        .select()
        .from(skills)
        .where(
          or(
            like(skills.nome, searchPattern),
            like(skills.descricao, searchPattern),
            like(skills.tags, searchPattern)
          )
        )
        .orderBy(skills.usoCount);

      res.json({
        query,
        total: results.length,
        skills: results,
      });
    } catch (error) {
      console.error("[Skills] Error searching skills:", error);
      res.status(500).json({ error: "Failed to search skills" });
    }
  });

  // POST /api/skills/:id/sucesso - Marcar execução bem-sucedida
  app.post("/api/skills/:id/sucesso", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const id = parseInt(req.params.id);
      const skill = await db.select().from(skills).where(eq(skills.id, id)).limit(1);

      if (skill.length === 0) {
        return res.status(404).json({ error: "Skill not found" });
      }

      const foundSkill = skill[0];
      if (foundSkill) {
        await db
          .update(skills)
          .set({
            sucessoCount: (foundSkill.sucessoCount || 0) + 1,
            ultimaExecucao: new Date(),
          })
          .where(eq(skills.id, id));
      }

      res.json({ success: true, message: "Success count incremented" });
    } catch (error) {
      console.error("[Skills] Error marking success:", error);
      res.status(500).json({ error: "Failed to mark success" });
    }
  });

  // POST /api/skills - Criar nova skill
  app.post("/api/skills", async (req, res) => {
    try {
      const { nome, descricao, categoria, instrucoes, exemplo, tags, autonomiaNivel } = req.body;
      
      // Validação
      if (!nome || !descricao || !instrucoes) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Campos obrigatórios: nome, descricao, instrucoes'
        });
      }
      
      // Validar nível de autonomia
      const niveisValidos = ['baixa', 'media', 'alta'];
      const nivelFinal = autonomiaNivel && niveisValidos.includes(autonomiaNivel) 
        ? autonomiaNivel 
        : 'media';
      
      const db = await getDb();
      if (!db) {
        return res.status(503).json({
          sucesso: false,
          erro: 'Banco de dados indisponível'
        });
      }
      
      // Verificar se skill já existe
      const skillExistente = await db
        .select()
        .from(skills)
        .where(eq(skills.nome, nome))
        .limit(1);
      
      if (skillExistente.length > 0) {
        return res.status(409).json({
          sucesso: false,
          erro: 'Skill com este nome já existe'
        });
      }
      
      // Inserir nova skill
      await db.insert(skills).values({
        nome,
        descricao,
        categoria: categoria || 'geral',
        instrucoes,
        exemplo: exemplo || null,
        tags: tags || null,
        autonomiaNivel: nivelFinal as any
      });
      
      // Buscar skill criada
      const novaSkill = await db
        .select()
        .from(skills)
        .where(eq(skills.nome, nome))
        .limit(1);
      
      res.status(201).json({
        sucesso: true,
        mensagem: 'Skill criada com sucesso',
        dados: novaSkill[0]
      });
    } catch (erro: any) {
      console.error('[Skills API] Erro ao criar skill:', erro);
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar skill: ' + erro.message
      });
    }
  });

  // POST /api/skills/:id/falha - Marcar execução falhada
  app.post("/api/skills/:id/falha", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const id = parseInt(req.params.id);
      const skill = await db.select().from(skills).where(eq(skills.id, id)).limit(1);

      if (skill.length === 0) {
        return res.status(404).json({ error: "Skill not found" });
      }

      const foundSkill = skill[0];
      if (foundSkill) {
        await db
          .update(skills)
          .set({
            falhaCount: (foundSkill.falhaCount || 0) + 1,
            ultimaExecucao: new Date(),
          })
          .where(eq(skills.id, id));
      }

      res.json({ success: true, message: "Failure count incremented" });
    } catch (error) {
      console.error("[Skills] Error marking failure:", error);
      res.status(500).json({ error: "Failed to mark failure" });
    }
  });
}
