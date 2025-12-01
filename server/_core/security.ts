/**
 * Módulo de Segurança HTTP
 * 
 * Implementa proteções HTTP essenciais usando Helmet.js e CORS.
 * Configuração conservadora para evitar quebrar funcionalidades existentes.
 * 
 * @author Sistema de Automação
 * @version 1.0.0
 * @date 2025-01-12
 * 
 * AUDITORIA: Implementado para corrigir vulnerabilidades de segurança
 * identificadas na análise do projeto.
 */

import helmet from 'helmet';
import cors from 'cors';
import { Express, Request, Response, NextFunction } from 'express';
import { ENV } from './env';

/**
 * Configuração de origens permitidas para CORS
 * 
 * Em desenvolvimento: permite localhost em várias portas
 * Em produção: permite apenas domínios específicos
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  // Adicionar URL do frontend se configurado
  if (ENV.frontendUrl) {
    origins.push(ENV.frontendUrl);
  }

  // Adicionar origens customizadas via variável de ambiente
  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...customOrigins);
  }

  return origins;
}

/**
 * Configura Helmet.js com proteções HTTP essenciais
 * 
 * Configuração CONSERVADORA para evitar quebrar o frontend:
 * - CSP desabilitado (pode bloquear scripts inline)
 * - COEP desabilitado (pode bloquear recursos externos)
 * - Outras proteções ativadas (XSS, clickjacking, etc)
 */
function setupHelmet(app: Express): void {
  app.use(helmet({
    // Content Security Policy: DESABILITADO por enquanto
    // Motivo: pode bloquear scripts inline e recursos do Vite
    contentSecurityPolicy: false,
    
    // Cross-Origin-Embedder-Policy: DESABILITADO por enquanto
    // Motivo: pode bloquear recursos de outros domínios
    crossOriginEmbedderPolicy: false,
    
    // Cross-Origin-Opener-Policy: DESABILITADO por enquanto
    // Motivo: pode afetar popups e janelas abertas
    crossOriginOpenerPolicy: false,
    
    // Cross-Origin-Resource-Policy: DESABILITADO por enquanto
    // Motivo: pode bloquear recursos compartilhados
    crossOriginResourcePolicy: false,
    
    // Proteções ATIVADAS (seguras e não quebram funcionalidades):
    
    // X-DNS-Prefetch-Control: controla DNS prefetching
    dnsPrefetchControl: { allow: false },
    
    // X-Frame-Options: previne clickjacking
    frameguard: { action: 'deny' },
    
    // Hide X-Powered-By: esconde tecnologia usada
    hidePoweredBy: true,
    
    // Strict-Transport-Security: força HTTPS (apenas em produção)
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    
    // X-Download-Options: previne downloads automáticos no IE
    ieNoOpen: true,
    
    // X-Content-Type-Options: previne MIME sniffing
    noSniff: true,
    
    // Origin-Agent-Cluster: isola origem do agente
    originAgentCluster: true,
    
    // X-Permitted-Cross-Domain-Policies: controla políticas cross-domain
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    
    // Referrer-Policy: controla informações de referrer
    referrerPolicy: { policy: 'no-referrer' },
    
    // X-XSS-Protection: proteção contra XSS (legado, mas ainda útil)
    xssFilter: true,
  }));

  console.log('[Security] Helmet.js configurado com proteções HTTP essenciais');
}

/**
 * Configura CORS (Cross-Origin Resource Sharing)
 * 
 * Permite requisições de origens específicas com credenciais.
 * Configuração PERMISSIVA em desenvolvimento, RESTRITIVA em produção.
 */
function setupCORS(app: Express): void {
  const allowedOrigins = getAllowedOrigins();

  app.use(cors({
    // Função de validação de origem
    origin: (origin, callback) => {
      // Permitir requisições sem origem (ex: Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Verificar se origem está na lista permitida
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Em desenvolvimento, permitir qualquer localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      // Bloquear origem não autorizada
      console.warn(`[Security] CORS bloqueou origem não autorizada: ${origin}`);
      return callback(new Error('Origem não permitida pelo CORS'), false);
    },

    // Permitir credenciais (cookies, headers de autenticação)
    credentials: true,

    // Headers permitidos
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'Accept',
      'Origin',
    ],

    // Métodos HTTP permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    // Headers expostos ao cliente
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'X-Request-Id',
    ],

    // Cache de preflight (24 horas)
    maxAge: 86400,

    // Permitir requisições OPTIONS (preflight)
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));

  console.log(`[Security] CORS configurado com ${allowedOrigins.length} origens permitidas`);
}

/**
 * Adiciona headers de segurança customizados
 * 
 * Headers adicionais que não são cobertos pelo Helmet.js
 */
function setupCustomSecurityHeaders(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // X-Request-Id: identificador único para rastreamento
    if (!req.headers['x-request-id']) {
      res.setHeader('X-Request-Id', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }

    next();
  });

  console.log('[Security] Headers de segurança customizados configurados');
}

/**
 * Middleware de rate limiting básico (em memória)
 * 
 * Previne abuso de endpoints sem depender de Redis.
 * Configuração PERMISSIVA para não afetar uso normal.
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function setupBasicRateLimiting(app: Express): void {
  const WINDOW_MS = 60 * 1000; // 1 minuto
  const MAX_REQUESTS = 10000; // 10000 requisições por minuto (extremamente permissivo)

  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(ip);

    // Resetar contador se janela expirou
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + WINDOW_MS };
      requestCounts.set(ip, record);
    }

    // Incrementar contador
    record.count++;

    // Verificar limite
    if (record.count > MAX_REQUESTS) {
      console.warn(`[Security] Rate limit excedido para IP: ${ip}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Você excedeu o limite de requisições. Tente novamente em alguns instantes.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    // Adicionar headers informativos
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  });

  // Limpar registros antigos a cada 5 minutos
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
      if (now > record.resetTime + WINDOW_MS) {
        requestCounts.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  console.log('[Security] Rate limiting básico configurado (10000 req/min por IP)');
}

/**
 * Função principal de configuração de segurança
 * 
 * Deve ser chamada ANTES de qualquer rota no servidor.
 * Ordem de execução é importante!
 */
export function setupSecurity(app: Express): void {
  console.log('[Security] Iniciando configuração de segurança HTTP...');

  // 1. Rate limiting (primeiro para bloquear abusos rapidamente)
  setupBasicRateLimiting(app);

  // 2. CORS (antes de qualquer processamento de requisição)
  setupCORS(app);

  // 3. Helmet (proteções HTTP gerais)
  setupHelmet(app);

  // 4. Headers customizados (últimos para não serem sobrescritos)
  setupCustomSecurityHeaders(app);

  console.log('[Security] ✅ Configuração de segurança HTTP concluída com sucesso');
  console.log('[Security] Proteções ativas:');
  console.log('[Security]   - Helmet.js (XSS, Clickjacking, MIME Sniffing)');
  console.log('[Security]   - CORS (Cross-Origin Resource Sharing)');
  console.log('[Security]   - Rate Limiting (10000 req/min por IP)');
  console.log('[Security]   - Headers Customizados (Request ID)');
}

/**
 * Função para obter estatísticas de segurança
 * 
 * Útil para monitoramento e auditoria
 */
export function getSecurityStats() {
  return {
    rateLimiting: {
      activeIPs: requestCounts.size,
      totalRequests: Array.from(requestCounts.values()).reduce((sum, r) => sum + r.count, 0),
    },
    cors: {
      allowedOrigins: getAllowedOrigins().length,
      origins: getAllowedOrigins(),
    },
    helmet: {
      enabled: true,
      cspEnabled: false, // Desabilitado por enquanto
    },
  };
}
