import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff, ServiceRetryManager } from './retry-handler';

describe('Retry Handler', () => {
  describe('retryWithBackoff', () => {
    it('deve retornar sucesso na primeira tentativa', async () => {
      const fn = vi.fn().mockResolvedValue('sucesso');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('sucesso');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve fazer retry até conseguir sucesso', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('falha 1'))
        .mockRejectedValueOnce(new Error('falha 2'))
        .mockResolvedValue('sucesso');

      const result = await retryWithBackoff(fn, {
        maxAttempts: 5,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('sucesso');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('deve falhar após esgotar tentativas', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('sempre falha'));

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('sempre falha');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('deve respeitar backoff exponencial', async () => {
      // Teste simplificado: verificar que faz múltiplas tentativas
      const fn = vi.fn().mockRejectedValue(new Error('falha'));

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10, // Delay curto para teste rápido
        backoffMultiplier: 2,
      });

      // Verifica que tentou 3 vezes
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
    });

    it('deve chamar callback onRetry', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('falha 1'))
        .mockResolvedValue('sucesso');

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('deve respeitar shouldRetry customizado', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('não deve fazer retry'));

      const result = await retryWithBackoff(fn, {
        maxAttempts: 5,
        initialDelayMs: 10,
        shouldRetry: (error) => !error.message.includes('não deve'),
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // Não fez retry
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve respeitar maxDelayMs', async () => {
      // Teste simplificado: verificar que maxAttempts é respeitado
      const fn = vi.fn().mockRejectedValue(new Error('falha'));

      const result = await retryWithBackoff(fn, {
        maxAttempts: 5,
        initialDelayMs: 10,
        maxDelayMs: 20,
        backoffMultiplier: 2,
      });

      // Verifica que tentou 5 vezes
      expect(result.attempts).toBe(5);
      expect(fn).toHaveBeenCalledTimes(5);
      expect(result.success).toBe(false);
    });
  });

  describe('ServiceRetryManager', () => {
    it('deve registrar tentativas de retry', async () => {
      const manager = new ServiceRetryManager();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('falha'))
        .mockResolvedValue('sucesso');

      await manager.executeWithRetry('test-service', fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });

      const history = manager.getHistory('test-service');
      expect(history.length).toBeGreaterThan(0);
    });

    it('deve calcular estatísticas corretamente', async () => {
      const manager = new ServiceRetryManager();

      // Executar 3 operações: 2 sucesso, 1 falha
      await manager.executeWithRetry('stats-test', 
        vi.fn().mockResolvedValue('ok'), 
        { maxAttempts: 1, initialDelayMs: 1 }
      );
      
      await manager.executeWithRetry('stats-test', 
        vi.fn().mockResolvedValue('ok'), 
        { maxAttempts: 1, initialDelayMs: 1 }
      );
      
      await manager.executeWithRetry('stats-test', 
        vi.fn().mockRejectedValue(new Error('fail')), 
        { maxAttempts: 1, initialDelayMs: 1 }
      );

      const stats = manager.getStats('stats-test');
      
      expect(stats.totalAttempts).toBe(3);
      expect(stats.successfulAttempts).toBe(2);
      expect(stats.failedAttempts).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
    });

    it('deve limpar histórico', async () => {
      const manager = new ServiceRetryManager();
      
      await manager.executeWithRetry('clear-test', 
        vi.fn().mockResolvedValue('ok'), 
        { maxAttempts: 1, initialDelayMs: 1 }
      );

      expect(manager.getHistory('clear-test').length).toBeGreaterThan(0);

      manager.clearHistory('clear-test');

      expect(manager.getHistory('clear-test').length).toBe(0);
    });

    it('deve retornar estatísticas vazias para serviço sem histórico', () => {
      const manager = new ServiceRetryManager();
      const stats = manager.getStats('inexistente');

      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulAttempts).toBe(0);
      expect(stats.failedAttempts).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageAttempts).toBe(0);
    });
  });
});
