import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { whatsappTemplates } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const templatesRouter = router({
  /**
   * Criar novo template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        category: z.string().optional(),
        content: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Extrair variáveis do conteúdo ({{variavel}})
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(input.content)) !== null) {
        if (!variables.includes(match[1]!)) {
          variables.push(match[1]!);
        }
      }

      const result = await db.insert(whatsappTemplates).values({
        name: input.name,
        category: input.category,
        content: input.content,
        variables: variables,
        description: input.description,
        createdBy: ctx.user?.id,
        isActive: true,
      });

      return { templateId: Number(result[0]?.insertId ?? 0), variables, success: true };
    }),

  /**
   * Atualizar template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        content: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const updateData: any = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      if (input.content !== undefined) {
        updateData.content = input.content;

        // Re-extrair variáveis
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables: string[] = [];
        let match;
        while ((match = variableRegex.exec(input.content)) !== null) {
          if (!variables.includes(match[1]!)) {
            variables.push(match[1]!);
          }
        }
        updateData.variables = variables;
      }

      await db.update(whatsappTemplates).set(updateData).where(eq(whatsappTemplates.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, input.id));

      return { success: true };
    }),

  /**
   * Obter template por ID
   */
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const templates = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, input.id));

    if (templates.length === 0) {
      return { found: false };
    }

    return { found: true, template: templates[0] };
  }),

  /**
   * Listar todos os templates
   */
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { templates: [], count: 0 };

      let query = db.select().from(whatsappTemplates);

      // Filtros (simplificado - em produção usar where conditions)
      let templates = await query;

      if (input?.category) {
        templates = templates.filter(t => t.category === input.category);
      }

      if (input?.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === input.isActive);
      }

      return { templates, count: templates.length };
    }),

  /**
   * Preview de template com variáveis substituídas
   */
  preview: publicProcedure
    .input(
      z.object({
        content: z.string(),
        variables: z.record(z.string(), z.string()),
      })
    )
    .query(({ input }) => {
      let preview = input.content;

      // Substituir variáveis
      for (const [key, value] of Object.entries(input.variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        preview = preview.replace(regex, value);
      }

      return { preview };
    }),

  /**
   * Criar templates pré-definidos (seed)
   */
  createDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const defaultTemplates = [
      {
        name: 'Recrutamento - Vaga Disponível',
        category: 'recrutamento',
        content: `Olá {{nome}}! 👋

Temos uma excelente oportunidade para você na {{empresa}}.

📋 Vaga: {{vaga}}
💰 Salário: {{salario}}
📍 Local: {{local}}

Você tem o perfil que procuramos! Gostaria de saber mais detalhes?`,
        description: 'Template para divulgação de vagas',
      },
      {
        name: 'Recrutamento - Convite Entrevista',
        category: 'recrutamento',
        content: `Olá {{nome}}!

Gostaríamos de convidá-lo(a) para uma entrevista na {{empresa}}.

📅 Data: {{data}}
🕐 Horário: {{horario}}
📍 Local: {{local}}

Por favor, confirme sua presença.`,
        description: 'Template para convidar candidatos para entrevista',
      },
      {
        name: 'Marketing - Promoção',
        category: 'marketing',
        content: `🎉 Olá {{nome}}!

Temos uma promoção especial para você:

{{descricao_promocao}}

⏰ Válido até: {{validade}}

Não perca essa oportunidade!`,
        description: 'Template para divulgação de promoções',
      },
      {
        name: 'Suporte - Confirmação',
        category: 'suporte',
        content: `Olá {{nome}},

Confirmamos o recebimento da sua solicitação #{{protocolo}}.

Nossa equipe está analisando e retornaremos em breve.

Obrigado pela preferência!
{{empresa}}`,
        description: 'Template para confirmação de atendimento',
      },
    ];

    for (const template of defaultTemplates) {
      // Extrair variáveis
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(template.content)) !== null) {
        if (!variables.includes(match[1]!)) {
          variables.push(match[1]!);
        }
      }

      await db.insert(whatsappTemplates).values({
        ...template,
        variables,
        createdBy: ctx.user?.id,
        isActive: true,
      });
    }

    return { success: true, count: defaultTemplates.length };
  }),
});
