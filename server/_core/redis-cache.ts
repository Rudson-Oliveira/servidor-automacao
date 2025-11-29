/**
 * Redis Cache Adapter
 * 
 * Implementa cache distribuído usando Redis com fallback para in-memory.
 * Compatível com a interface do IntelligentCache existente.
 * 
 * Features:
 * - Cache distribuído via Redis
 * - Persistência entre restarts
 * - Sincronização entre múltiplas instâncias
 * - Pub/Sub para invalidação distribuída
 * - Fallback automático para in-memory se Redis não disponível
 * - TTL nativo do Redis
 */

import Redis from 'ioredis';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

class RedisCache {
  private redis: Redis | null = null;
  private subscriber: Redis | null = null;
  private fallbackCache = new Map<string, { value: any; expiresAt: number }>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  // Configurações
  private defaultTTL = 5 * 60; // 5 minutos (em segundos para Redis)
  private maxSize = 1000;
  private redisEnabled = false;
  private invalidationChannel = 'cache:invalidate';

  constructor() {
    this.initRedis();
  }

  /**
   * Inicializar conexão Redis
   */
  private async initRedis(): Promise<void> {
    try {
      // Tentar conectar ao Redis (localhost padrão)
      // Em produção, usar variável de ambiente REDIS_URL
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          // Desistir após 3 tentativas
          if (times > 3) {
            console.warn('[RedisCache] Falha ao conectar ao Redis após 3 tentativas, usando fallback in-memory');
            return null;
          }
          // Retry após 1 segundo
          return 1000;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      // Subscriber para invalidação distribuída
      this.subscriber = new Redis(redisUrl, {
        retryStrategy: (times) => (times > 3 ? null : 1000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Tentar conectar
      await this.redis.connect();
      await this.subscriber.connect();

      // Configurar listener de invalidação
      await this.subscriber.subscribe(this.invalidationChannel);
      this.subscriber.on('message', (channel, message) => {
        if (channel === this.invalidationChannel) {
          // Invalidar também no fallback cache local
          this.fallbackCache.delete(message);
        }
      });

      this.redisEnabled = true;
      console.log('[RedisCache] ✅ Conectado ao Redis com sucesso');
    } catch (error) {
      console.warn('[RedisCache] ⚠️ Redis não disponível, usando cache in-memory:', error);
      this.redisEnabled = false;
      this.redis = null;
      this.subscriber = null;
    }
  }

  /**
   * Buscar valor no cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redisEnabled && this.redis) {
        const value = await this.redis.get(key);

        if (!value) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        return JSON.parse(value) as T;
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao buscar do Redis:', error);
      // Fallback para cache in-memory
    }

    // Fallback: usar cache in-memory
    const entry = this.fallbackCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.fallbackCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Armazenar valor no cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlSeconds = ttl ? Math.floor(ttl / 1000) : this.defaultTTL;

    try {
      if (this.redisEnabled && this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        this.stats.sets++;
        return;
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao salvar no Redis:', error);
      // Fallback para cache in-memory
    }

    // Fallback: usar cache in-memory
    if (this.fallbackCache.size >= this.maxSize) {
      // Remover entrada mais antiga
      const firstKey = this.fallbackCache.keys().next().value;
      if (firstKey) {
        this.fallbackCache.delete(firstKey);
      }
    }

    this.fallbackCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    this.stats.sets++;
  }

  /**
   * Deletar entrada do cache
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    try {
      if (this.redisEnabled && this.redis) {
        const result = await this.redis.del(key);
        deleted = result > 0;

        // Publicar invalidação para outras instâncias
        if (deleted && this.redis) {
          await this.redis.publish(this.invalidationChannel, key);
        }
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao deletar do Redis:', error);
    }

    // Também deletar do fallback cache
    const fallbackDeleted = this.fallbackCache.delete(key);

    if (deleted || fallbackDeleted) {
      this.stats.deletes++;
    }

    return deleted || fallbackDeleted;
  }

  /**
   * Deletar múltiplas entradas por padrão
   */
  async deletePattern(pattern: string): Promise<number> {
    let count = 0;

    try {
      if (this.redisEnabled && this.redis) {
        const keys = await this.redis.keys(pattern);

        if (keys.length > 0) {
          count = await this.redis.del(...keys);

          // Publicar invalidação para cada chave
          for (const key of keys) {
            if (this.redis) {
              await this.redis.publish(this.invalidationChannel, key);
            }
          }
        }
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao deletar padrão do Redis:', error);
    }

    // Também deletar do fallback cache
    for (const key of this.fallbackCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.fallbackCache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redisEnabled && this.redis) {
        await this.redis.flushdb();
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao limpar Redis:', error);
    }

    this.fallbackCache.clear();
    this.stats.deletes++;
  }

  /**
   * Obter estatísticas do cache
   */
  async getStats(): Promise<CacheStats> {
    let size = this.fallbackCache.size;

    try {
      if (this.redisEnabled && this.redis) {
        size = await this.redis.dbsize();
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao obter tamanho do Redis:', error);
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      size,
      hitRate,
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
   * Verificar se Redis está disponível
   */
  isRedisEnabled(): boolean {
    return this.redisEnabled;
  }

  /**
   * Fechar conexões
   */
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
    } catch (error) {
      console.error('[RedisCache] Erro ao desconectar:', error);
    }
  }

  /**
   * Helper: verificar se chave corresponde ao padrão
   */
  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }
}

// Exportar instância singleton
export const redisCache = new RedisCache();
