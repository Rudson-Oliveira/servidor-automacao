/**
 * Router tRPC para Capturas de Área de Trabalho
 * Recebe screenshots e dados do desktop do usuário
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { desktopCaptures, desktopProgramas, desktopJanelas } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import crypto from "crypto";

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const ProgramaSchema = z.object({
  pid: z.number().int(),
  nome: z.string(),
  usuario: z.string().optional(),
  memoria_mb: z.number().optional(),
  cpu_percent: z.number().optional(),
});

const JanelaSchema = z.object({
  titulo: z.string(),
  processo: z.string().optional(),
  pid: z.number().int().optional(),
});

const CapturaSchema = z.object({
  timestamp: z.string(),
  screenshot_base64: z.string(),
  resolucao: z.object({
    largura: z.number().int(),
    altura: z.number().int(),
  }),
  programas: z.array(ProgramaSchema),
  janelas: z.array(JanelaSchema),
  total_programas: z.number().int(),
  total_janelas: z.number().int(),
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Salva screenshot no S3
 */
async function salvarScreenshot(base64Data: string): Promise<string> {
  try {
    // Remover prefixo data:image/png;base64, se existir
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    
    // Converter base64 para buffer
    const imageBuffer = Buffer.from(base64Image, "base64");
    
    // Gerar nome único
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `desktop-captures/${timestamp}-${randomSuffix}.png`;
    
    // Upload para S3
    const { url } = await storagePut(fileName, imageBuffer, "image/png");
    
    return url;
  } catch (error) {
    console.error("Erro ao salvar screenshot:", error);
    throw new Error("Falha ao salvar screenshot no S3");
  }
}

// ========================================
// ROUTER
// ========================================

export const desktopRouter = router({
  
  /**
   * Recebe captura de área de trabalho
   */
  capturar: publicProcedure
    .input(CapturaSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      try {
        // 1. Salvar screenshot no S3
        const screenshotUrl = await salvarScreenshot(input.screenshot_base64);
        
        // 2. Inserir captura no banco
        const resultCapture = await db.insert(desktopCaptures).values({
          timestamp: new Date(input.timestamp),
          screenshotUrl: screenshotUrl,
          resolucaoLargura: input.resolucao.largura,
          resolucaoAltura: input.resolucao.altura,
          totalProgramas: input.total_programas,
          totalJanelas: input.total_janelas,
          analisado: 0,
        });
        
        const captureId = Number(resultCapture[0].insertId);
        
        // 3. Inserir programas
        if (input.programas.length > 0) {
          const programasData = input.programas.map(prog => ({
            captureId: captureId,
            pid: prog.pid,
            nome: prog.nome,
            usuario: prog.usuario || null,
            memoriaMb: prog.memoria_mb || 0,
            cpuPercent: prog.cpu_percent || 0,
          }));
          
          await db.insert(desktopProgramas).values(programasData);
        }
        
        // 4. Inserir janelas
        if (input.janelas.length > 0) {
          const janelasData = input.janelas.map(jan => ({
            captureId: captureId,
            titulo: jan.titulo,
            processo: jan.processo || null,
            pid: jan.pid || null,
          }));
          
          await db.insert(desktopJanelas).values(janelasData);
        }
        
        return {
          sucesso: true,
          id: captureId,
          screenshotUrl: screenshotUrl,
          mensagem: "Captura recebida com sucesso",
        };
        
      } catch (error) {
        console.error("Erro ao processar captura:", error);
        throw new Error(`Falha ao processar captura: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  /**
   * Lista capturas recentes
   */
  listar: protectedProcedure
    .input(z.object({
      limite: z.number().int().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const limite = input?.limite || 20;
      
      const capturas = await db
        .select()
        .from(desktopCaptures)
        .orderBy(desc(desktopCaptures.timestamp))
        .limit(limite);
      
      return capturas;
    }),

  /**
   * Busca captura por ID com programas e janelas
   */
  buscarPorId: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      // Buscar captura
      const capturaResult = await db
        .select()
        .from(desktopCaptures)
        .where(eq(desktopCaptures.id, input.id))
        .limit(1);
      
      if (capturaResult.length === 0) return null;
      
      const captura = capturaResult[0]!;
      
      // Buscar programas
      const programas = await db
        .select()
        .from(desktopProgramas)
        .where(eq(desktopProgramas.captureId, input.id));
      
      // Buscar janelas
      const janelas = await db
        .select()
        .from(desktopJanelas)
        .where(eq(desktopJanelas.captureId, input.id));
      
      return {
        ...captura,
        programas,
        janelas,
      };
    }),

  /**
   * Analisa captura com Comet Vision
   */
  analisar: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Buscar captura
      const capturaResult = await db
        .select()
        .from(desktopCaptures)
        .where(eq(desktopCaptures.id, input.id))
        .limit(1);
      
      if (capturaResult.length === 0) {
        throw new Error("Captura não encontrada");
      }
      
      const captura = capturaResult[0]!;
      
      // Integrar com Comet Vision para análise real
      let analise = "";
      
      try {
        // Fazer requisição para Comet Vision API
        const cometVisionUrl = process.env.COMET_VISION_API_URL || "https://api.comet.vision/analyze";
        const cometVisionKey = process.env.COMET_VISION_API_KEY;
        
        if (!cometVisionKey) {
          console.warn("[Desktop] COMET_VISION_API_KEY não configurada, usando análise básica");
          throw new Error("API key not configured");
        }
        
        // Chamar Comet Vision
        const response = await fetch(cometVisionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cometVisionKey}`,
          },
          body: JSON.stringify({
            image_url: captura.screenshotUrl,
            tasks: ["object_detection", "ocr", "ui_elements"],
            prompt: input.prompt || "Analise esta captura de tela e descreva o que você vê. Identifique programas, janelas, textos visíveis e elementos da interface.",
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Comet Vision API error: ${response.status}`);
        }
        
        const visionData = await response.json();
        
        // Formatar análise
        analise = `Análise da Captura #${input.id} (Comet Vision)

📊 INFORMAÇÕES BÁSICAS:
Resolução: ${captura.resolucaoLargura}x${captura.resolucaoAltura}
Programas detectados: ${captura.totalProgramas}
Janelas abertas: ${captura.totalJanelas}

🔍 ANÁLISE VISUAL (IA):
${visionData.description || "N/A"}

📝 TEXTO DETECTADO (OCR):
${visionData.ocr_text ? visionData.ocr_text.slice(0, 500) : "Nenhum texto detectado"}

🎯 OBJETOS IDENTIFICADOS:
${visionData.objects ? visionData.objects.map((obj: any) => `- ${obj.label} (${Math.round(obj.confidence * 100)}%)`).join("\n") : "Nenhum objeto detectado"}

🖥️ ELEMENTOS DE INTERFACE:
${visionData.ui_elements ? visionData.ui_elements.map((el: any) => `- ${el.type}: ${el.text || "(sem texto)"}`).join("\n") : "Nenhum elemento detectado"}`;
        
      } catch (error) {
        // Fallback para análise básica se Comet Vision falhar
        console.error("[Desktop] Erro ao chamar Comet Vision:", error);
        
        analise = `Análise da Captura #${input.id} (Análise Básica)

📊 INFORMAÇÕES:
Resolução: ${captura.resolucaoLargura}x${captura.resolucaoAltura}
Programas detectados: ${captura.totalProgramas}
Janelas abertas: ${captura.totalJanelas}

⚠️ Análise visual com IA não disponível.
Configure COMET_VISION_API_KEY para habilitar detecção de objetos, OCR e análise de elementos de interface.

${input.prompt ? `Prompt customizado: ${input.prompt}` : ""}`;
      }
      
      // Atualizar captura com análise
      await db
        .update(desktopCaptures)
        .set({
          analisado: 1,
          analiseTexto: analise,
        })
        .where(eq(desktopCaptures.id, input.id));
      
      return {
        sucesso: true,
        analise: analise,
      };
    }),

  /**
   * Deleta captura
   */
  deletar: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Deletar programas
      await db
        .delete(desktopProgramas)
        .where(eq(desktopProgramas.captureId, input.id));
      
      // Deletar janelas
      await db
        .delete(desktopJanelas)
        .where(eq(desktopJanelas.captureId, input.id));
      
      // Deletar captura
      await db
        .delete(desktopCaptures)
        .where(eq(desktopCaptures.id, input.id));
      
      return {
        sucesso: true,
        mensagem: "Captura deletada com sucesso",
      };
    }),

  /**
   * Estatísticas de capturas
   */
  estatisticas: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;
      
      const capturas = await db.select().from(desktopCaptures);
      
      const total = capturas.length;
      const analisadas = capturas.filter(c => c.analisado === 1).length;
      const pendentes = total - analisadas;
      
      // Programas mais comuns
      const programas = await db.select().from(desktopProgramas);
      const programasCount: Record<string, number> = {};
      
      programas.forEach(prog => {
        programasCount[prog.nome] = (programasCount[prog.nome] || 0) + 1;
      });
      
      const top5Programas = Object.entries(programasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, count]) => ({ nome, count }));
      
      return {
        totalCapturas: total,
        analisadas,
        pendentes,
        top5Programas,
      };
    }),
});
