import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

/**
 * Router para sistema de orquestração multi-IA
 * Integra com orchestrator.py via subprocess
 */

// Schema de validação
const ProcessTaskSchema = z.object({
  input: z.string().min(1, "Input não pode ser vazio"),
  context: z.record(z.any()).optional(),
  force_provider: z.enum(['comet', 'claude_haiku', 'claude_sonnet', 'claude_opus', 'comet_vision', 'manus_llm']).optional(),
});

const GetTaskSchema = z.object({
  taskId: z.string().uuid(),
});

const EscalateTaskSchema = z.object({
  taskId: z.string().uuid(),
  targetProvider: z.enum(['claude_haiku', 'claude_sonnet', 'claude_opus', 'comet_vision']),
});

/**
 * Executa script Python do orquestrador
 */
async function runOrchestrator(input: string, userId?: number, context?: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'python_scripts', 'orchestrator.py');
    
    const pythonProcess = spawn('python3', [scriptPath], {
      env: {
        ...process.env,
        ORCHESTRATOR_MODE: 'api',
        ORCHESTRATOR_INPUT: input,
        ORCHESTRATOR_USER_ID: userId?.toString() || '',
        ORCHESTRATOR_CONTEXT: context ? JSON.stringify(context) : '{}',
      }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Erro no orquestrador Python:', stderr);
        reject(new Error(`Orquestrador falhou com código ${code}: ${stderr}`));
        return;
      }

      try {
        // Extrair JSON do output
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          resolve(result);
        } else {
          reject(new Error('Resposta inválida do orquestrador'));
        }
      } catch (error) {
        reject(new Error(`Erro ao parsear resposta: ${error}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Erro ao executar orquestrador: ${error.message}`));
    });
  });
}

export const orchestratorMultiIARouter = router({
  /**
   * Processa tarefa com orquestração automática
   */
  process: protectedProcedure
    .input(ProcessTaskSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await runOrchestrator(
          input.input,
          ctx.user.id,
          input.context
        );

        return {
          success: true,
          ...result,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erro ao processar tarefa',
        });
      }
    }),

  /**
   * Busca detalhes de uma tarefa
   */
  getTask: protectedProcedure
    .input(GetTaskSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      const result = await db.execute(sql`
        SELECT 
          te.*,
          ip.display_name as initial_provider_name,
          cp.display_name as current_provider_name
        FROM ai_task_executions te
        LEFT JOIN ai_providers ip ON te.initial_provider_id = ip.id
        LEFT JOIN ai_providers cp ON te.current_provider_id = cp.id
        WHERE te.task_id = ${input.taskId}
      `);

      if (!result.rows || result.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarefa não encontrada',
        });
      }

      const task = result.rows[0] as any;

      // Buscar histórico de escalações
      const escalations = await db.execute(sql`
        SELECT 
          eh.*,
          fp.display_name as from_provider_name,
          tp.display_name as to_provider_name,
          er.rule_name
        FROM ai_escalation_history eh
        LEFT JOIN ai_providers fp ON eh.from_provider_id = fp.id
        LEFT JOIN ai_providers tp ON eh.to_provider_id = tp.id
        LEFT JOIN ai_escalation_rules er ON eh.rule_id = er.id
        WHERE eh.task_execution_id = ${task.id}
        ORDER BY eh.escalated_at ASC
      `);

      return {
        task: {
          ...task,
          metadata: task.metadata ? JSON.parse(task.metadata) : null,
        },
        escalations: escalations.rows || [],
      };
    }),

  /**
   * Lista tarefas do usuário
   */
  listTasks: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['pending', 'processing', 'completed', 'failed', 'escalated']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      let query = sql`
        SELECT 
          te.*,
          ip.display_name as initial_provider_name,
          cp.display_name as current_provider_name
        FROM ai_task_executions te
        LEFT JOIN ai_providers ip ON te.initial_provider_id = ip.id
        LEFT JOIN ai_providers cp ON te.current_provider_id = cp.id
        WHERE te.user_id = ${ctx.user.id}
      `;

      if (input.status) {
        query = sql`${query} AND te.status = ${input.status}`;
      }

      query = sql`${query} ORDER BY te.created_at DESC LIMIT ${input.limit} OFFSET ${input.offset}`;

      const result = await db.execute(query);

      return {
        tasks: result.rows || [],
        total: result.rows?.length || 0,
      };
    }),

  /**
   * Busca status de todos os providers
   */
  getProvidersStatus: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      const providers = await db.execute(sql`
        SELECT 
          p.*,
          COALESCE(m.total_requests, 0) as total_requests_today,
          COALESCE(m.successful_requests, 0) as successful_requests_today,
          COALESCE(m.failed_requests, 0) as failed_requests_today,
          COALESCE(m.avg_confidence_score, 0) as avg_confidence_today
        FROM ai_providers p
        LEFT JOIN ai_provider_metrics m ON p.id = m.provider_id AND m.date = CURDATE()
        WHERE p.status = 'active'
        ORDER BY p.priority DESC
      `);

      return {
        providers: (providers.rows || []).map((p: any) => ({
          ...p,
          capabilities: p.capabilities ? JSON.parse(p.capabilities) : {},
        })),
      };
    }),

  /**
   * Busca métricas agregadas
   */
  getMetrics: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      // Métricas gerais
      const generalMetrics = await db.execute(sql`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks,
          SUM(CASE WHEN escalation_count > 0 THEN 1 ELSE 0 END) as escalated_tasks,
          AVG(confidence_score) as avg_confidence,
          AVG(execution_time_ms) as avg_execution_time,
          SUM(total_cost) as total_cost
        FROM ai_task_executions
        WHERE user_id = ${ctx.user.id}
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${input.days} DAY)
      `);

      // Métricas por provider
      const providerMetrics = await db.execute(sql`
        SELECT 
          p.display_name as provider_name,
          COUNT(*) as task_count,
          AVG(te.confidence_score) as avg_confidence,
          SUM(te.total_cost) as total_cost
        FROM ai_task_executions te
        JOIN ai_providers p ON te.current_provider_id = p.id
        WHERE te.user_id = ${ctx.user.id}
        AND te.created_at >= DATE_SUB(NOW(), INTERVAL ${input.days} DAY)
        GROUP BY p.id, p.display_name
        ORDER BY task_count DESC
      `);

      // Métricas por dia
      const dailyMetrics = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          AVG(confidence_score) as avg_confidence
        FROM ai_task_executions
        WHERE user_id = ${ctx.user.id}
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${input.days} DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      return {
        general: generalMetrics.rows?.[0] || {},
        byProvider: providerMetrics.rows || [],
        daily: dailyMetrics.rows || [],
      };
    }),

  /**
   * Força escalação manual de uma tarefa
   */
  escalate: protectedProcedure
    .input(EscalateTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados indisponível',
        });
      }

      // Verificar se tarefa existe e pertence ao usuário
      const taskResult = await db.execute(sql`
        SELECT * FROM ai_task_executions 
        WHERE task_id = ${input.taskId} AND user_id = ${ctx.user.id}
      `);

      if (!taskResult.rows || taskResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tarefa não encontrada',
        });
      }

      const task = taskResult.rows[0] as any;

      // Buscar provider de destino
      const providerResult = await db.execute(sql`
        SELECT * FROM ai_providers WHERE name = ${input.targetProvider}
      `);

      if (!providerResult.rows || providerResult.rows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider não encontrado',
        });
      }

      const targetProvider = providerResult.rows[0] as any;

      // Registrar escalação manual
      await db.execute(sql`
        INSERT INTO ai_escalation_history 
        (task_execution_id, from_provider_id, to_provider_id, reason, previous_output)
        VALUES (
          ${task.id},
          ${task.current_provider_id},
          ${targetProvider.id},
          'Escalação manual pelo usuário',
          ${task.output_text}
        )
      `);

      // Atualizar tarefa
      await db.execute(sql`
        UPDATE ai_task_executions 
        SET 
          current_provider_id = ${targetProvider.id},
          escalation_count = escalation_count + 1,
          status = 'escalated'
        WHERE task_id = ${input.taskId}
      `);

      // Reprocessar com novo provider
      try {
        const result = await runOrchestrator(
          task.input_text,
          ctx.user.id,
          task.metadata ? JSON.parse(task.metadata) : {}
        );

        return {
          success: true,
          message: `Tarefa escalada para ${targetProvider.display_name}`,
          result,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao reprocessar tarefa: ${error.message}`,
        });
      }
    }),
});
