/**
 * Middleware de Rate Limiting
 * Limita número de requisições por IP/usuário
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Armazenamento em memória (usar Redis em produção)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurações
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 100; // 100 requisições por janela

/**
 * Limpa entradas expiradas periodicamente
 */
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 60 * 1000); // Limpar a cada minuto

/**
 * Verifica se requisição excede o limite
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Primeira requisição ou janela expirada
  if (!entry || entry.resetTime < now) {
    const resetTime = now + WINDOW_MS;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime,
    };
  }

  // Incrementar contador
  entry.count++;
  rateLimitStore.set(identifier, entry);

  // Verificar se excedeu o limite
  if (entry.count > MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Gera identificador único para rate limiting
 * Usa userId se autenticado, senão usa IP
 */
export function getRateLimitIdentifier(
  userId: number | undefined,
  ip: string | undefined
): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip || 'unknown'}`;
}

/**
 * Formata tempo restante em segundos
 */
export function getResetTimeInSeconds(resetTime: number): number {
  return Math.ceil((resetTime - Date.now()) / 1000);
}
