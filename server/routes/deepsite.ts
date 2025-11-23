/**
 * Router DeepSITE - Web Scraping e Análise
 * Endpoints para scraping, análise com IA, cache e validação
 */

import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { deepsiteScrapes, deepsiteAnalyses, deepsiteCacheMetadata } from '../../drizzle/schema';
import { validateURL, extractDomain, normalizeURL } from '../services/url-validator';
import { scrapeURL, scrapeBatch, extractTextFromHTML } from '../services/scraper';
import { cacheManager } from '../services/cache-manager';
import { invokeLLM } from '../_core/llm';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/deepsite/scrape
 * Scraping básico de uma URL com caching inteligente
 */
router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Validar URL
    const validation = validateURL(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const sanitizedUrl = validation.sanitizedUrl || url;
    const normalizedUrl = normalizeURL(sanitizedUrl);

    // Verificar cache em memória primeiro
    const scrapeCache = cacheManager.getScrapeCache();
    const useCache = options.useCache !== false; // Default: true

    if (useCache) {
      const cached = scrapeCache.get(normalizedUrl);
      if (cached) {
        return res.json({
          success: true,
          data: {
            ...cached,
            fromCache: true,
          },
        });
      }
    }

    // Cache miss, fazer scraping real
    const scrapeResult = await scrapeURL(sanitizedUrl, {
      timeout: options.timeout || 30000,
      followRedirects: options.followRedirects !== false,
      extractMetadata: options.extractMetadata !== false,
      userAgent: options.userAgent,
    });

    if (!scrapeResult.success) {
      // Salvar erro no banco
      const db = await getDb();
      if (db) {
        await db.insert(deepsiteScrapes).values({
          url: sanitizedUrl,
          status: 'failed',
          error: scrapeResult.error,
          responseTime: scrapeResult.responseTime,
        });
      }

      return res.status(500).json({
        success: false,
        error: scrapeResult.error,
        responseTime: scrapeResult.responseTime,
      });
    }

    // Salvar no banco
    const db = await getDb();
    let scrapeId: number | undefined;

    if (db) {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      const result = await db.insert(deepsiteScrapes).values({
        url: sanitizedUrl,
        html: scrapeResult.html,
        metadata: JSON.stringify(scrapeResult.metadata),
        status: 'success',
        responseTime: scrapeResult.responseTime,
        expiresAt,
      });

      scrapeId = result[0].insertId;

      // Salvar metadados de cache
      await db.insert(deepsiteCacheMetadata).values({
        url: normalizedUrl,
        scrapeId: scrapeId,
        expiresAt,
        size: scrapeResult.html?.length || 0,
        hitCount: 0,
      }).onDuplicateKeyUpdate({
        set: {
          scrapeId: scrapeId,
          expiresAt,
          size: scrapeResult.html?.length || 0,
        },
      });
    }

    // Adicionar ao cache em memória
    if (useCache) {
      scrapeCache.set(normalizedUrl, {
        url: sanitizedUrl,
        html: scrapeResult.html,
        metadata: scrapeResult.metadata,
        scrapedAt: new Date().toISOString(),
        responseTime: scrapeResult.responseTime,
      });
    }

    return res.json({
      success: true,
      data: {
        url: sanitizedUrl,
        html: scrapeResult.html,
        metadata: scrapeResult.metadata,
        scrapedAt: new Date().toISOString(),
        fromCache: false,
        responseTime: scrapeResult.responseTime,
      },
    });
  } catch (error) {
    console.error('[DeepSITE] Scrape error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/deepsite/scrape-batch
 * Scraping em lote (múltiplas URLs)
 */
router.post('/scrape-batch', async (req: Request, res: Response) => {
  try {
    const { urls, options = {} } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required',
      });
    }

    if (urls.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 URLs per batch',
      });
    }

    const maxConcurrent = options.maxConcurrent || 5;
    const results = await scrapeBatch(urls, options, maxConcurrent);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return res.json({
      success: true,
      total: urls.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('[DeepSITE] Batch scrape error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/deepsite/analyze
 * Análise completa de conteúdo com LLM
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { url, analysisType = 'full', options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Primeiro fazer scraping
    const scrapeResult = await scrapeURL(url, {
      extractMetadata: true,
    });

    if (!scrapeResult.success || !scrapeResult.html) {
      return res.status(500).json({
        success: false,
        error: scrapeResult.error || 'Failed to scrape URL',
      });
    }

    // Extrair texto limpo
    const text = extractTextFromHTML(scrapeResult.html);

    // Limitar tamanho do texto (primeiros 5000 caracteres)
    const textToAnalyze = text.substring(0, 5000);

    // Análise com LLM
    const analysisPrompt = `Analise o seguinte conteúdo web e retorne um JSON estruturado com:
- summary: resumo do conteúdo (máximo 200 palavras)
- category: categoria do website (blog, e-commerce, notícia, corporativo, etc)
- language: código ISO 639-1 do idioma (pt, en, es, etc)
- sentiment: sentimento geral (positivo, negativo, neutro)
- confidence: nível de confiança da análise (0-100)

Conteúdo:
${textToAnalyze}`;

    const llmResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analisador de conteúdo web. Retorne sempre JSON estruturado.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'content_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              category: { type: 'string' },
              language: { type: 'string' },
              sentiment: { type: 'string' },
              confidence: { type: 'number' },
            },
            required: ['summary', 'category', 'language', 'sentiment', 'confidence'],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = llmResponse.choices[0].message.content;
    const contentStr = typeof messageContent === 'string' ? messageContent : '{}';
    const analysis = JSON.parse(contentStr);

    // Salvar análise no banco
    const db = await getDb();
    if (db) {
      // Buscar scrapeId
      const scrapes = await db
        .select()
        .from(deepsiteScrapes)
        .where(eq(deepsiteScrapes.url, url))
        .orderBy(deepsiteScrapes.scrapedAt)
        .limit(1);

      const scrapeId = scrapes[0]?.id || 0;

      await db.insert(deepsiteAnalyses).values({
        scrapeId,
        analysisType,
        summary: analysis.summary,
        category: analysis.category,
        language: analysis.language,
        sentiment: analysis.sentiment,
        confidence: Math.round(analysis.confidence),
      });
    }

    return res.json({
      success: true,
      analysis: {
        url,
        ...analysis,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[DeepSITE] Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/deepsite/summarize
 * Resumo de conteúdo
 */
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { url, maxLength = 200, language = 'pt-BR' } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Fazer scraping
    const scrapeResult = await scrapeURL(url);

    if (!scrapeResult.success || !scrapeResult.html) {
      return res.status(500).json({
        success: false,
        error: scrapeResult.error || 'Failed to scrape URL',
      });
    }

    // Extrair texto
    const text = extractTextFromHTML(scrapeResult.html);
    const originalLength = text.length;

    // Gerar resumo com LLM
    const llmResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Você é um resumidor de conteúdo. Crie resumos concisos em ${language}.`,
        },
        {
          role: 'user',
          content: `Resuma o seguinte texto em no máximo ${maxLength} palavras:\n\n${text.substring(0, 5000)}`,
        },
      ],
    });

    const messageContent = llmResponse.choices[0].message.content;
    const summary = typeof messageContent === 'string' ? messageContent : '';
    const summaryLength = summary ? summary.split(/\s+/).length : 0;

    return res.json({
      success: true,
      summary,
      originalLength,
      summaryLength,
      compressionRatio: Math.round((summaryLength / originalLength) * 1000) / 1000,
    });
  } catch (error) {
    console.error('[DeepSITE] Summarize error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/deepsite/cache/:url
 * Verificar se URL está em cache
 */
router.get('/cache/:url', async (req: Request, res: Response) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const normalizedUrl = normalizeURL(url);

    // Verificar cache em memória
    const scrapeCache = cacheManager.getScrapeCache();
    const cached = scrapeCache.has(normalizedUrl);

    if (cached) {
      return res.json({
        cached: true,
        source: 'memory',
      });
    }

    // Verificar cache no banco
    const db = await getDb();
    if (db) {
      const cacheEntries = await db
        .select()
        .from(deepsiteCacheMetadata)
        .where(eq(deepsiteCacheMetadata.url, normalizedUrl))
        .limit(1);

      if (cacheEntries.length > 0) {
        const entry = cacheEntries[0];
        return res.json({
          cached: true,
          source: 'database',
          cachedAt: entry.cachedAt,
          expiresAt: entry.expiresAt,
          hitCount: entry.hitCount,
          size: entry.size,
        });
      }
    }

    return res.json({
      cached: false,
    });
  } catch (error) {
    console.error('[DeepSITE] Cache check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * DELETE /api/deepsite/cache/:url
 * Limpar cache de URL específica
 */
router.delete('/cache/:url', async (req: Request, res: Response) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const normalizedUrl = normalizeURL(url);

    // Limpar cache em memória
    const scrapeCache = cacheManager.getScrapeCache();
    scrapeCache.delete(normalizedUrl);

    // Limpar cache no banco
    const db = await getDb();
    if (db) {
      await db.delete(deepsiteCacheMetadata).where(eq(deepsiteCacheMetadata.url, normalizedUrl));
    }

    return res.json({
      success: true,
      message: `Cache cleared for ${url}`,
    });
  } catch (error) {
    console.error('[DeepSITE] Cache delete error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * DELETE /api/deepsite/cache
 * Limpar todo o cache
 */
router.delete('/cache', async (req: Request, res: Response) => {
  try {
    // Limpar cache em memória
    cacheManager.clearAll();

    // Limpar cache no banco
    const db = await getDb();
    let clearedEntries = 0;

    if (db) {
      const result = await db.delete(deepsiteCacheMetadata);
      clearedEntries = result[0].affectedRows || 0;
    }

    return res.json({
      success: true,
      clearedEntries,
      message: 'All cache cleared',
    });
  } catch (error) {
    console.error('[DeepSITE] Cache clear error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/deepsite/validate-url
 * Validar URL antes de scraping
 */
router.post('/validate-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        valid: false,
        error: 'URL is required',
      });
    }

    const validation = validateURL(url);

    if (!validation.valid) {
      return res.json({
        valid: false,
        error: validation.error,
      });
    }

    return res.json({
      valid: true,
      sanitizedUrl: validation.sanitizedUrl,
      domain: extractDomain(validation.sanitizedUrl || url),
    });
  } catch (error) {
    console.error('[DeepSITE] Validate error:', error);
    return res.status(500).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/deepsite/status
 * Status do sistema DeepSITE
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const cacheStats = cacheManager.getGlobalStats();

    // Buscar métricas do banco
    const db = await getDb();
    let totalScrapes = 0;
    let totalAnalyses = 0;

    if (db) {
      const scrapes = await db.select().from(deepsiteScrapes);
      const analyses = await db.select().from(deepsiteAnalyses);
      totalScrapes = scrapes.length;
      totalAnalyses = analyses.length;
    }

    return res.json({
      status: 'online',
      cache: cacheStats,
      metrics: {
        totalScrapes,
        totalAnalyses,
      },
    });
  } catch (error) {
    console.error('[DeepSITE] Status error:', error);
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
