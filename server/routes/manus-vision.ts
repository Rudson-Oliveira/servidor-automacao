import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Schema de validação para análise visual
const AnaliseVisualSchema = z.object({
  url: z.string().url(),
  screenshots: z.array(z.string()).optional(),
  dom_structure: z.object({
    title: z.string(),
    meta: z.record(z.string(), z.string()),
    components: z.array(z.object({
      type: z.string(),
      html: z.string(),
      classes: z.array(z.string())
    })),
    layout: z.object({
      type: z.string(),
      columns: z.number(),
      sections: z.array(z.any()).optional()
    })
  }),
  computed_styles: z.array(z.object({
    selector: z.string(),
    styles: z.record(z.string(), z.string())
  })),
  visual_patterns: z.object({
    colors: z.array(z.string()),
    spacing: z.object({
      horizontal: z.number(),
      vertical: z.number()
    }),
    components: z.array(z.any())
  }),
  timestamp: z.string(),
  analyzer_version: z.string()
});

// Schema de validação para resultado de validação
const ResultadoValidacaoSchema = z.object({
  url_original: z.string().url(),
  url_gerada: z.string().url(),
  similaridade_geral: z.number().min(0).max(100),
  ssim_score: z.number().min(0).max(100),
  color_similarity: z.number().min(0).max(100),
  layout_similarity: z.number().min(0).max(100),
  threshold: z.number().min(0).max(100),
  aprovado: z.boolean(),
  timestamp: z.string()
});

/**
 * POST /api/manus/analisar-visao
 * Recebe análise visual do Comet e processa
 */
router.post('/analisar-visao', async (req, res) => {
  try {
    // Validar dados de entrada
    const analise = AnaliseVisualSchema.parse(req.body);
    
    console.log(`[Manus Vision] Recebida análise visual de: ${analise.url}`);
    console.log(`[Manus Vision] Screenshots: ${analise.screenshots?.length || 0}`);
    console.log(`[Manus Vision] Componentes: ${analise.dom_structure.components.length}`);
    console.log(`[Manus Vision] Cores: ${analise.visual_patterns.colors.length}`);
    
    // TODO: Aqui o Manus processaria a análise e geraria código
    // Por enquanto, apenas retornamos sucesso
    
    res.json({
      sucesso: true,
      mensagem: 'Análise visual recebida com sucesso',
      dados: {
        url: analise.url,
        componentes_identificados: analise.dom_structure.components.length,
        cores_extraidas: analise.visual_patterns.colors.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados inválidos',
        detalhes: error.issues
      });
    }
    
    console.error('[Manus Vision] Erro ao processar análise:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao processar análise visual'
    });
  }
});

/**
 * POST /api/comet/validar-codigo
 * Recebe resultado de validação do Comet
 */
router.post('/validar-codigo', async (req, res) => {
  try {
    // Validar dados de entrada
    const resultado = ResultadoValidacaoSchema.parse(req.body);
    
    console.log(`[Comet Vision] Recebido resultado de validação`);
    console.log(`[Comet Vision] Original: ${resultado.url_original}`);
    console.log(`[Comet Vision] Gerado: ${resultado.url_gerada}`);
    console.log(`[Comet Vision] Similaridade: ${resultado.similaridade_geral}%`);
    console.log(`[Comet Vision] Aprovado: ${resultado.aprovado ? 'Sim' : 'Não'}`);
    
    // TODO: Armazenar resultado no banco de dados
    // TODO: Se não aprovado, iniciar ciclo de iteração
    
    res.json({
      sucesso: true,
      mensagem: 'Resultado de validação recebido com sucesso',
      dados: {
        aprovado: resultado.aprovado,
        similaridade: resultado.similaridade_geral,
        necessita_iteracao: !resultado.aprovado,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados inválidos',
        detalhes: error.issues
      });
    }
    
    console.error('[Comet Vision] Erro ao processar validação:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao processar resultado de validação'
    });
  }
});

/**
 * POST /api/comet/comparar-visual
 * Solicita comparação visual sob demanda
 */
router.post('/comparar-visual', async (req, res) => {
  try {
    const { url_original, url_gerada, threshold } = req.body;
    
    // Validar parâmetros
    if (!url_original || !url_gerada) {
      return res.status(400).json({
        sucesso: false,
        erro: 'url_original e url_gerada são obrigatórios'
      });
    }
    
    const thresholdValue = threshold || 90;
    
    console.log(`[Comet Vision] Solicitada comparação visual`);
    console.log(`[Comet Vision] Original: ${url_original}`);
    console.log(`[Comet Vision] Gerado: ${url_gerada}`);
    console.log(`[Comet Vision] Threshold: ${thresholdValue}%`);
    
    // TODO: Aqui dispararia o script de validação do Comet
    // Por enquanto, retornamos mensagem de sucesso
    
    res.json({
      sucesso: true,
      mensagem: 'Comparação visual solicitada',
      dados: {
        url_original,
        url_gerada,
        threshold: thresholdValue,
        status: 'em_processamento',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Comet Vision] Erro ao solicitar comparação:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao solicitar comparação visual'
    });
  }
});

/**
 * GET /api/manus/status-geracao
 * Verifica status da geração de código
 */
router.get('/status-geracao', async (req, res) => {
  try {
    // TODO: Verificar status real da geração
    // Por enquanto, retorna status mockado
    
    res.json({
      sucesso: true,
      dados: {
        status: 'concluido',
        url_servidor: 'http://localhost:3001',
        tempo_decorrido: 120,
        componentes_gerados: 5,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Manus Vision] Erro ao verificar status:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao verificar status de geração'
    });
  }
});

export default router;
