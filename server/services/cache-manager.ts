/**
 * Gerenciador de Cache LRU em Memória
 * Implementa cache de duas camadas: memória + banco de dados
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  size: number;
}

interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * Cache LRU (Least Recently Used) em memória
 * Evita requisições desnecessárias e melhora performance
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxEntries: number;
  private defaultTTL: number; // em milissegundos
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxEntries: number = 1000, defaultTTL: number = 3600000) {
    // defaultTTL = 1 hora
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Adiciona item ao cache
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    const size = this.estimateSize(data);

    // Se cache está cheio, remover item mais antigo (LRU)
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt,
      size,
    });
  }

  /**
   * Busca item no cache
   * Retorna null se não encontrado ou expirado
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Cache hit! Mover para o final (mais recente)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    return entry.data;
  }

  /**
   * Verifica se chave existe no cache (sem contar como hit/miss)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove item do cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove itens expirados
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    let memoryUsage = 0;
    const values = Array.from(this.cache.values());
    for (const entry of values) {
      memoryUsage += entry.size;
    }

    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Estima tamanho de um objeto em bytes
   */
  private estimateSize(data: T): number {
    try {
      const str = JSON.stringify(data);
      return str.length * 2; // Aproximação (UTF-16)
    } catch {
      return 1024; // Valor padrão se não conseguir serializar
    }
  }

  /**
   * Retorna todas as chaves no cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Retorna número de entradas no cache
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Gerenciador de Cache Global
 * Singleton para compartilhar cache entre requisições
 */
class CacheManager {
  private static instance: CacheManager;
  private scrapeCache: LRUCache<any>;
  private analysisCache: LRUCache<any>;

  private constructor() {
    // Cache de scrapes: 1000 entradas, TTL 1 hora
    this.scrapeCache = new LRUCache(1000, 3600000);

    // Cache de análises: 500 entradas, TTL 7 dias
    this.analysisCache = new LRUCache(500, 604800000);

    // Cleanup automático a cada 10 minutos
    setInterval(() => {
      this.scrapeCache.cleanup();
      this.analysisCache.cleanup();
    }, 600000);
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getScrapeCache(): LRUCache<any> {
    return this.scrapeCache;
  }

  getAnalysisCache(): LRUCache<any> {
    return this.analysisCache;
  }

  /**
   * Retorna estatísticas gerais do cache
   */
  getGlobalStats() {
    return {
      scrape: this.scrapeCache.getStats(),
      analysis: this.analysisCache.getStats(),
    };
  }

  /**
   * Limpa todos os caches
   */
  clearAll(): void {
    this.scrapeCache.clear();
    this.analysisCache.clear();
  }
}

// Exportar instância singleton
export const cacheManager = CacheManager.getInstance();
