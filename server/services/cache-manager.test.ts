/**
 * Testes Unitários - Cache Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from './cache-manager';

describe('LRU Cache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3, 1000); // Max 3 entries, TTL 1 segundo
  });

  describe('set e get', () => {
    it('deve armazenar e recuperar valor', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    it('deve retornar null para chave inexistente', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('deve sobrescrever valor existente', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      const result = cache.get('key1');
      expect(result).toBe('value2');
    });
  });

  describe('LRU eviction', () => {
    it('deve remover item mais antigo quando cache está cheio', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // key1 deve ser removida

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('deve atualizar ordem de acesso ao fazer get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Acessar key1 (move para o final)
      cache.get('key1');

      // Adicionar key4 (key2 deve ser removida, não key1)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('deve expirar item após TTL', async () => {
      const shortCache = new LRUCache<string>(10, 100); // TTL 100ms
      shortCache.set('key1', 'value1');

      // Imediatamente deve estar disponível
      expect(shortCache.get('key1')).toBe('value1');

      // Aguardar expiração
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Deve ter expirado
      expect(shortCache.get('key1')).toBeNull();
    });

    it('deve permitir TTL customizado por item', async () => {
      const shortCache = new LRUCache<string>(10, 1000); // TTL padrão 1s
      shortCache.set('key1', 'value1', 100); // TTL customizado 100ms

      expect(shortCache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortCache.get('key1')).toBeNull();
    });
  });

  describe('has', () => {
    it('deve retornar true para chave existente', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('deve retornar false para chave inexistente', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('deve retornar false para chave expirada', async () => {
      const shortCache = new LRUCache<string>(10, 100);
      shortCache.set('key1', 'value1');

      expect(shortCache.has('key1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortCache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('deve remover item do cache', () => {
      cache.set('key1', 'value1');
      const deleted = cache.delete('key1');

      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('deve retornar false ao deletar chave inexistente', () => {
      const deleted = cache.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('deve limpar todo o cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('deve remover apenas itens expirados', async () => {
      const shortCache = new LRUCache<string>(10, 100);
      shortCache.set('key1', 'value1', 50); // Expira em 50ms
      shortCache.set('key2', 'value2', 200); // Expira em 200ms

      await new Promise((resolve) => setTimeout(resolve, 100));

      const removed = shortCache.cleanup();

      expect(removed).toBe(1);
      expect(shortCache.get('key1')).toBeNull();
      expect(shortCache.get('key2')).toBe('value2');
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss

      const stats = cache.getStats();

      expect(stats.entries).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.67); // 2/3 = 0.666...
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('deve calcular hit rate como 0 quando não há requisições', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('keys e size', () => {
    it('deve retornar todas as chaves', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();

      expect(keys).toEqual(['key1', 'key2', 'key3']);
    });

    it('deve retornar tamanho correto', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });
});
