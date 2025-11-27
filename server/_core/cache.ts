/**
 * Sistema de Cache Inteligente
 * 
 * Implementa cache em memória com TTL e invalidação automática
 * para otimizar queries frequentes e reduzir carga no banco de dados.
 * 
 * Features:
 * - Cache em memória (Map)
 * - TTL configurável por chave
 * - Invalidação automática
 * - Estatísticas de hit/miss
 * - Limpeza automática de entradas expiradas
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
  
  // Configurações padrão
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  private maxSize = 1000; // Máximo de entradas
  private cleanupInterval = 60 * 1000; // Limpeza a cada 1 minuto
  
  constructor() {
    // Iniciar limpeza automática
    this.startCleanup();
  }
  
  /**
   * Buscar valor no cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value as T;
  }
  
  /**
   * Armazenar valor no cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Verificar limite de tamanho
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
    
    this.stats.sets++;
  }
  
  /**
   * Deletar entrada do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }
  
  /**
   * Invalidar múltiplas chaves por padrão
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.deletes += count;
    return count;
  }
  
  /**
   * Limpar todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }
  
  /**
   * Obter estatísticas
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
  
  /**
   * Resetar estatísticas
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }
  
  /**
   * Remover entrada mais antiga (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.deletes++;
    }
  }
  
  /**
   * Limpeza automática de entradas expiradas
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        this.stats.deletes += cleaned;
        console.log(`[Cache] Limpeza automática: ${cleaned} entradas removidas`);
      }
    }, this.cleanupInterval);
  }
  
  /**
   * Wrapper para funções com cache automático
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Tentar buscar do cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Executar função e cachear resultado
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }
}

// Instância singleton
export const cache = new IntelligentCache();

/**
 * Helper para criar chaves de cache
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

/**
 * Decorador para cachear resultados de métodos
 */
export function Cacheable(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = createCacheKey(
        target.constructor.name,
        propertyKey,
        JSON.stringify(args)
      );
      
      return cache.wrap(cacheKey, () => originalMethod.apply(this, args), ttl);
    };
    
    return descriptor;
  };
}
