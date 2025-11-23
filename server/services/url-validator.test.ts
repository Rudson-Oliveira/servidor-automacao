/**
 * Testes Unitários - URL Validator
 */

import { describe, it, expect } from 'vitest';
import { validateURL, extractDomain, normalizeURL } from './url-validator';

describe('URL Validator', () => {
  describe('validateURL', () => {
    it('deve validar URLs HTTP válidas', () => {
      const result = validateURL('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitizedUrl).toBe('http://example.com/');
    });

    it('deve validar URLs HTTPS válidas', () => {
      const result = validateURL('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/');
    });

    it('deve rejeitar URLs sem protocolo', () => {
      const result = validateURL('example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('deve rejeitar URLs file://', () => {
      const result = validateURL('file:///etc/passwd');
      expect(result.valid).toBe(false);
      // file:// falha na validação de formato antes de chegar no check específico
      expect(result.error).toBeDefined();
    });

    it('deve rejeitar localhost', () => {
      const result = validateURL('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Local IPs and localhost are not allowed');
    });

    it('deve rejeitar 127.0.0.1', () => {
      const result = validateURL('http://127.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Local IPs and localhost are not allowed');
    });

    it('deve rejeitar IPs privados 192.168.x.x', () => {
      const result = validateURL('http://192.168.1.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Local IPs and localhost are not allowed');
    });

    it('deve rejeitar IPs privados 10.x.x.x', () => {
      const result = validateURL('http://10.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Local IPs and localhost are not allowed');
    });

    it('deve rejeitar string vazia', () => {
      const result = validateURL('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('deve remover espaços em branco', () => {
      const result = validateURL('  https://example.com  ');
      expect(result.valid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/');
    });

    it('deve validar URLs com path', () => {
      const result = validateURL('https://example.com/path/to/page');
      expect(result.valid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/path/to/page');
    });

    it('deve validar URLs com query params', () => {
      const result = validateURL('https://example.com?param=value');
      expect(result.valid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/?param=value');
    });
  });

  describe('extractDomain', () => {
    it('deve extrair domínio de URL simples', () => {
      const domain = extractDomain('https://example.com');
      expect(domain).toBe('example.com');
    });

    it('deve extrair domínio de URL com path', () => {
      const domain = extractDomain('https://example.com/path/to/page');
      expect(domain).toBe('example.com');
    });

    it('deve extrair domínio de URL com subdomain', () => {
      const domain = extractDomain('https://sub.example.com');
      expect(domain).toBe('sub.example.com');
    });

    it('deve retornar null para URL inválida', () => {
      const domain = extractDomain('not-a-url');
      expect(domain).toBeNull();
    });
  });

  describe('normalizeURL', () => {
    it('deve remover fragmento (#)', () => {
      const normalized = normalizeURL('https://example.com#section');
      expect(normalized).toBe('https://example.com');
    });

    it('deve manter query params por padrão', () => {
      const normalized = normalizeURL('https://example.com?param=value');
      expect(normalized).toBe('https://example.com/?param=value');
    });

    it('deve remover query params quando solicitado', () => {
      const normalized = normalizeURL('https://example.com?param=value', true);
      expect(normalized).toBe('https://example.com');
    });

    it('deve remover trailing slash quando path é /', () => {
      const normalized = normalizeURL('https://example.com/');
      expect(normalized).toBe('https://example.com');
    });

    it('deve manter trailing slash quando path não é /', () => {
      const normalized = normalizeURL('https://example.com/path/');
      expect(normalized).toBe('https://example.com/path/');
    });
  });
});
