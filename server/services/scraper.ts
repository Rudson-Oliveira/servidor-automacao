/**
 * Serviço de Web Scraping
 * Faz requisições HTTP e extrai conteúdo de websites
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { validateURL, extractDomain } from './url-validator';

export interface ScrapeOptions {
  timeout?: number;
  followRedirects?: boolean;
  extractMetadata?: boolean;
  userAgent?: string;
}

export interface ScrapeMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  author?: string;
  publishedDate?: string;
  canonical?: string;
}

export interface ScrapeResult {
  success: boolean;
  url: string;
  html?: string;
  metadata?: ScrapeMetadata;
  responseTime: number;
  status?: number;
  error?: string;
}

/**
 * Faz scraping de uma URL
 */
export async function scrapeURL(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const startTime = Date.now();

  // Validar URL
  const validation = validateURL(url);
  if (!validation.valid) {
    return {
      success: false,
      url,
      responseTime: Date.now() - startTime,
      error: validation.error,
    };
  }

  const sanitizedUrl = validation.sanitizedUrl || url;

  // Configurações padrão
  const {
    timeout = 30000,
    followRedirects = true,
    extractMetadata = true,
    userAgent = 'DeepSITE-Bot/1.0 (+https://servidor-automacao.com/bot)',
  } = options;

  try {
    // Fazer requisição HTTP
    const response: AxiosResponse = await axios.get(sanitizedUrl, {
      timeout,
      maxRedirects: followRedirects ? 5 : 0,
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
      },
      validateStatus: (status) => status < 500, // Aceitar 4xx mas não 5xx
    });

    const responseTime = Date.now() - startTime;

    // Verificar se resposta é HTML
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html')) {
      return {
        success: false,
        url: sanitizedUrl,
        responseTime,
        status: response.status,
        error: `Content-Type is not HTML: ${contentType}`,
      };
    }

    const html = response.data;

    // Extrair metadados se solicitado
    let metadata: ScrapeMetadata | undefined;
    if (extractMetadata) {
      metadata = extractMetadataFromHTML(html);
    }

    return {
      success: true,
      url: sanitizedUrl,
      html,
      metadata,
      responseTime,
      status: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        url: sanitizedUrl,
        responseTime,
        status: error.response?.status,
        error: error.message,
      };
    }

    return {
      success: false,
      url: sanitizedUrl,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extrai metadados de HTML usando Cheerio
 */
export function extractMetadataFromHTML(html: string): ScrapeMetadata {
  const $ = cheerio.load(html);
  const metadata: ScrapeMetadata = {};

  // Title
  metadata.title = $('title').first().text().trim() || undefined;

  // Meta description
  metadata.description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    undefined;

  // Meta keywords
  const keywordsStr = $('meta[name="keywords"]').attr('content')?.trim();
  if (keywordsStr) {
    metadata.keywords = keywordsStr.split(',').map((k: string) => k.trim());
  }

  // Open Graph tags
  metadata.ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || undefined;
  metadata.ogDescription =
    $('meta[property="og:description"]').attr('content')?.trim() || undefined;
  metadata.ogImage = $('meta[property="og:image"]').attr('content')?.trim() || undefined;

  // Author
  metadata.author =
    $('meta[name="author"]').attr('content')?.trim() ||
    $('meta[property="article:author"]').attr('content')?.trim() ||
    undefined;

  // Published date
  metadata.publishedDate =
    $('meta[property="article:published_time"]').attr('content')?.trim() ||
    $('meta[name="date"]').attr('content')?.trim() ||
    undefined;

  // Canonical URL
  metadata.canonical = $('link[rel="canonical"]').attr('href')?.trim() || undefined;

  return metadata;
}

/**
 * Extrai texto limpo de HTML (sem tags)
 */
export function extractTextFromHTML(html: string): string {
  const $ = cheerio.load(html);

  // Remover scripts e styles
  $('script, style, noscript').remove();

  // Pegar texto do body
  const text = $('body').text();

  // Limpar espaços extras
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

/**
 * Scraping em lote (múltiplas URLs)
 */
export async function scrapeBatch(
  urls: string[],
  options: ScrapeOptions = {},
  maxConcurrent: number = 5
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Processar em lotes para controlar concorrência
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map((url) => scrapeURL(url, options)));
    results.push(...batchResults);
  }

  return results;
}
