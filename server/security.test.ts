/**
 * Testes para o módulo de segurança HTTP
 * 
 * Valida que todas as proteções estão funcionando corretamente:
 * - Helmet.js headers
 * - CORS
 * - Rate limiting
 * - Headers customizados
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { setupSecurity, getSecurityStats } from './_core/security';

describe('Módulo de Segurança HTTP', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    setupSecurity(app);
    
    // Rota de teste
    app.get('/test', (req, res) => {
      res.json({ success: true });
    });
  });

  describe('Helmet.js Headers', () => {
    it('deve adicionar header X-Content-Type-Options', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deve adicionar header X-Frame-Options', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('deve adicionar header X-XSS-Protection', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-xss-protection']).toBe('0');
    });

    it('deve adicionar header Referrer-Policy', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
    });

    it('deve remover header X-Powered-By', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('deve adicionar header Strict-Transport-Security', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
  });

  describe('CORS', () => {
    it('deve permitir requisições de localhost:3000', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('deve permitir requisições de localhost:5173', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('deve permitir requisições sem origem (Postman, curl)', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    it('deve responder a requisições OPTIONS (preflight)', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Rate Limiting', () => {
    it('deve adicionar headers de rate limit', async () => {
      const response = await request(app).get('/test');
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('deve permitir até 1000 requisições por minuto', async () => {
      // Fazer 10 requisições rápidas
      const promises = Array.from({ length: 10 }, () => 
        request(app).get('/test')
      );
      
      const responses = await Promise.all(promises);
      
      // Todas devem passar
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('deve decrementar contador de requisições restantes', async () => {
      const response1 = await request(app).get('/test');
      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
      
      const response2 = await request(app).get('/test');
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);
      
      expect(remaining2).toBeLessThan(remaining1);
    });
  });

  describe('Headers Customizados', () => {
    it('deve adicionar header X-Request-Id', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^req_/);
    });
  });

  describe('Estatísticas de Segurança', () => {
    it('deve retornar estatísticas válidas', () => {
      const stats = getSecurityStats();
      
      expect(stats).toHaveProperty('rateLimiting');
      expect(stats).toHaveProperty('cors');
      expect(stats).toHaveProperty('helmet');
      
      expect(stats.cors.allowedOrigins).toBeGreaterThan(0);
      expect(Array.isArray(stats.cors.origins)).toBe(true);
      expect(stats.helmet.enabled).toBe(true);
    });
  });

  describe('Integração Completa', () => {
    it('deve aplicar todas as proteções em uma única requisição', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      // Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      
      // CORS
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      
      // Rate limiting
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      
      // Custom headers
      expect(response.headers['x-request-id']).toBeDefined();
      
      // Resposta
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });
});
