/**
 * Serviço de Validação de URLs
 * Valida e sanitiza URLs antes de scraping
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Valida uma URL para scraping
 * Bloqueia IPs locais, file:// URLs e formatos inválidos
 */
export function validateURL(url: string): ValidationResult {
  // Verificar se URL foi fornecida
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  // Remover espaços em branco
  url = url.trim();

  // Verificar formato básico
  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(url)) {
    return { valid: false, error: 'Invalid URL format. Must start with http:// or https://' };
  }

  // Bloquear file:// URLs (segurança)
  if (url.toLowerCase().startsWith('file://')) {
    return { valid: false, error: 'File URLs are not allowed' };
  }

  // Bloquear IPs locais (segurança)
  const localPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '::1', // IPv6 localhost
    'fe80::', // IPv6 link-local
  ];

  const lowerUrl = url.toLowerCase();
  for (const pattern of localPatterns) {
    if (lowerUrl.includes(pattern)) {
      return { valid: false, error: 'Local IPs and localhost are not allowed' };
    }
  }

  // Tentar criar objeto URL para validação adicional
  try {
    const urlObj = new URL(url);

    // Verificar protocolo
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Verificar se tem hostname
    if (!urlObj.hostname) {
      return { valid: false, error: 'URL must have a valid hostname' };
    }

    // URL válida, retornar versão sanitizada
    return {
      valid: true,
      sanitizedUrl: urlObj.toString(),
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extrai o domínio de uma URL
 * Usado para rate limiting por domínio
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Normaliza uma URL removendo fragmentos e parâmetros opcionais
 * Útil para caching
 */
export function normalizeURL(url: string, removeQueryParams: boolean = false): string {
  try {
    const urlObj = new URL(url);

    // Remover fragmento (#)
    urlObj.hash = '';

    // Remover query params se solicitado
    if (removeQueryParams) {
      urlObj.search = '';
    }

    // Remover trailing slash
    let normalized = urlObj.toString();
    if (normalized.endsWith('/') && urlObj.pathname === '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return url;
  }
}

/**
 * Verifica se uma URL é acessível (formato válido e não bloqueada)
 */
export async function isURLAccessible(url: string): Promise<boolean> {
  const validation = validateURL(url);
  return validation.valid;
}
