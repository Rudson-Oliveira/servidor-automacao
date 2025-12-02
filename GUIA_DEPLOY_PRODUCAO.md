# Guia Completo de Deploy em Produção

**Servidor de Automação - Sistema de Comunicação e Integração Multi-IA**

**Versão:** 2.0  
**Data:** Dezembro 2024  
**Autor:** Manus AI

---

## Sumário Executivo

Este documento fornece instruções detalhadas para realizar o **deploy em produção** do Servidor de Automação, incluindo configuração de infraestrutura, variáveis de ambiente, otimizações de performance, segurança, monitoramento e troubleshooting. O sistema foi projetado para alta disponibilidade, escalabilidade e integração com múltiplas IAs (Comet, Manus, Genspark, DeepSITE, ABACUS).

---

## Índice

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Deploy com Docker](#deploy-com-docker)
6. [Deploy com PM2](#deploy-com-pm2)
7. [Configuração de Proxy Reverso (Nginx)](#configuração-de-proxy-reverso-nginx)
8. [SSL/TLS com Let's Encrypt](#ssltls-com-lets-encrypt)
9. [Banco de Dados](#banco-de-dados)
10. [Backup e Restore](#backup-e-restore)
11. [Monitoramento e Logs](#monitoramento-e-logs)
12. [Segurança](#segurança)
13. [Otimização de Performance](#otimização-de-performance)
14. [Escalabilidade](#escalabilidade)
15. [Troubleshooting](#troubleshooting)
16. [Manutenção](#manutenção)

---

## Requisitos do Sistema

### Hardware Mínimo

| Componente | Requisito Mínimo | Recomendado | Produção (Alta Carga) |
|------------|------------------|-------------|-----------------------|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **RAM** | 2 GB | 4 GB | 8+ GB |
| **Disco** | 10 GB SSD | 50 GB SSD | 100+ GB NVMe SSD |
| **Rede** | 100 Mbps | 1 Gbps | 10 Gbps |

### Software

| Componente | Versão Mínima | Recomendada |
|------------|---------------|-------------|
| **Node.js** | 18.x | 20.x LTS |
| **pnpm** | 8.x | 9.x |
| **MySQL** | 8.0 | 8.0.35+ |
| **Nginx** | 1.18 | 1.24+ |
| **Docker** | 20.10 | 24.x (opcional) |
| **Docker Compose** | 2.0 | 2.23+ (opcional) |
| **Sistema Operacional** | Ubuntu 20.04 | Ubuntu 22.04 LTS |

### Portas Necessárias

| Porta | Serviço | Descrição |
|-------|---------|-----------|
| **3000** | Servidor Node.js | Aplicação principal |
| **3306** | MySQL | Banco de dados |
| **80** | Nginx | HTTP |
| **443** | Nginx | HTTPS |
| **9090** | Prometheus | Métricas (opcional) |

---

## Preparação do Ambiente

### 1. Atualizar Sistema Operacional

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential
```

### 2. Instalar Node.js 20.x

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version
```

### 3. Instalar pnpm

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalação
pnpm --version
```

### 4. Instalar MySQL 8.0

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Iniciar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar MySQL (definir senha root)
sudo mysql_secure_installation
```

### 5. Criar Banco de Dados

```bash
# Acessar MySQL
sudo mysql -u root -p

# Criar banco de dados
CREATE DATABASE servidor_automacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário
CREATE USER 'servidor_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';

# Conceder permissões
GRANT ALL PRIVILEGES ON servidor_automacao.* TO 'servidor_user'@'localhost';
FLUSH PRIVILEGES;

# Sair
EXIT;
```

### 6. Configurar Firewall

```bash
# Instalar UFW (se não estiver instalado)
sudo apt install -y ufw

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## Instalação e Configuração

### 1. Clonar Repositório

```bash
# Criar diretório para aplicação
sudo mkdir -p /opt/servidor-automacao
sudo chown $USER:$USER /opt/servidor-automacao

# Clonar repositório
cd /opt
git clone https://github.com/seu-usuario/servidor-automacao.git
cd servidor-automacao
```

### 2. Instalar Dependências

```bash
# Instalar dependências do projeto
pnpm install --frozen-lockfile

# Verificar se todas as dependências foram instaladas
pnpm list
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
nano .env
```

Veja seção [Variáveis de Ambiente](#variáveis-de-ambiente) para detalhes completos.

### 4. Executar Migrations do Banco de Dados

```bash
# Aplicar migrations
pnpm db:push

# Verificar se as tabelas foram criadas
mysql -u servidor_user -p servidor_automacao -e "SHOW TABLES;"
```

### 5. Popular Banco com Dados Iniciais

```bash
# Executar seed (skills, templates, etc.)
pnpm db:seed

# Verificar dados inseridos
mysql -u servidor_user -p servidor_automacao -e "SELECT COUNT(*) FROM skills;"
```

### 6. Build da Aplicação

```bash
# Build do frontend e backend
pnpm build

# Verificar se o build foi bem-sucedido
ls -la dist/
```

### 7. Testar Aplicação Localmente

```bash
# Iniciar servidor em modo desenvolvimento
pnpm dev

# Em outro terminal, testar health check
curl http://localhost:3000/api/trpc/health.check

# Se tudo estiver OK, parar o servidor (Ctrl+C)
```

---

## Variáveis de Ambiente

### Arquivo `.env` Completo

```bash
# ================================
# BANCO DE DADOS
# ================================
DATABASE_URL=mysql://servidor_user:senha_segura_aqui@localhost:3306/servidor_automacao

# ================================
# AUTENTICAÇÃO E SEGURANÇA
# ================================
JWT_SECRET=seu-secret-jwt-muito-seguro-aqui-min-32-caracteres
NODE_ENV=production

# ================================
# OAUTH MANUS
# ================================
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=seu-app-id-manus

# ================================
# API KEYS EXTERNAS
# ================================
# Manus Forge API
BUILT_IN_FORGE_API_KEY=sua-api-key-manus-aqui
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Perplexity AI
PERPLEXITY_API_KEY=sua-api-key-perplexity

# DeepSITE / Hugging Face
DEEPSITE_HF_TOKEN=seu-token-huggingface

# Claude AI
CLAUDE_API_KEY=sua-api-key-claude

# Gemini AI
GEMINI_API_KEY=sua-api-key-gemini

# GitHub
GITHUB_API_KEY=seu-token-github

# ================================
# CONFIGURAÇÕES DO SISTEMA
# ================================
PORT=3000
VITE_APP_TITLE=Servidor de Automação
VITE_APP_LOGO=/logo.png

# Owner
OWNER_OPEN_ID=seu-open-id
OWNER_NAME=Seu Nome

# ================================
# WHATSAPP (OPCIONAL)
# ================================
WHATSAPP_SESSION_DIR=./whatsapp-sessions

# ================================
# TELEFONIA (OPCIONAL)
# ================================
TELEPHONY_API_KEY=sua-api-key-telefonia
TELEPHONY_PHONE_NUMBER=+5511999999999

# ================================
# OBSIDIAN (OPCIONAL)
# ================================
OBSIDIAN_VAULTS_DIR=./obsidian-vaults

# ================================
# DESKTOP AGENT (OPCIONAL)
# ================================
DESKTOP_AGENT_REGISTER_TOKEN=seu-token-registro-seguro

# ================================
# SUPABASE (OPCIONAL)
# ================================
SUPABASE_URL=sua-url-supabase
SUPABASE_ANON_KEY=sua-anon-key

# ================================
# ANALYTICS (OPCIONAL)
# ================================
VITE_ANALYTICS_ENDPOINT=https://analytics.seu-dominio.com
VITE_ANALYTICS_WEBSITE_ID=seu-website-id

# ================================
# ORCHESTRATOR
# ================================
ORCHESTRATOR_LEADER=true
ORCHESTRATOR_FALLBACK_ENABLED=true
```

### Variáveis Críticas

As seguintes variáveis **DEVEM** ser configuradas para o sistema funcionar:

1. **DATABASE_URL** - String de conexão MySQL
2. **JWT_SECRET** - Secret para JWT (mínimo 32 caracteres)
3. **BUILT_IN_FORGE_API_KEY** - API key Manus (obrigatória)
4. **NODE_ENV** - Deve ser `production`

### Gerar JWT Secret Seguro

```bash
# Gerar secret aleatório de 64 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deploy com Docker

### 1. Dockerfile

Criar arquivo `Dockerfile` na raiz do projeto:

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# ========================================
# Stage: Dependencies
# ========================================
FROM base AS dependencies

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile --prod=false

# ========================================
# Stage: Build
# ========================================
FROM base AS build

WORKDIR /app

# Copiar dependências instaladas
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm build

# ========================================
# Stage: Production
# ========================================
FROM base AS production

WORKDIR /app

# Copiar apenas dependências de produção
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle ./drizzle

# Criar diretórios necessários
RUN mkdir -p ./whatsapp-sessions ./obsidian-vaults ./uploads ./logs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/trpc/health.simple', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicação
CMD ["pnpm", "start"]
```

### 2. docker-compose.yml

Criar arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # ========================================
  # Servidor de Automação
  # ========================================
  servidor-automacao:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: servidor-automacao
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://servidor_user:senha_segura@mysql:3306/servidor_automacao
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - BUILT_IN_FORGE_API_KEY=${BUILT_IN_FORGE_API_KEY}
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
      - DEEPSITE_HF_TOKEN=${DEEPSITE_HF_TOKEN}
    volumes:
      - ./whatsapp-sessions:/app/whatsapp-sessions
      - ./obsidian-vaults:/app/obsidian-vaults
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - servidor-network

  # ========================================
  # MySQL Database
  # ========================================
  mysql:
    image: mysql:8.0
    container_name: servidor-mysql
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=root_password_segura
      - MYSQL_DATABASE=servidor_automacao
      - MYSQL_USER=servidor_user
      - MYSQL_PASSWORD=senha_segura
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - servidor-network

  # ========================================
  # Nginx Reverse Proxy (Opcional)
  # ========================================
  nginx:
    image: nginx:alpine
    container_name: servidor-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - servidor-automacao
    networks:
      - servidor-network

volumes:
  mysql-data:
    driver: local

networks:
  servidor-network:
    driver: bridge
```

### 3. Iniciar com Docker Compose

```bash
# Build e iniciar containers
docker-compose up -d --build

# Ver logs
docker-compose logs -f servidor-automacao

# Ver status
docker-compose ps

# Executar migrations
docker-compose exec servidor-automacao pnpm db:push

# Popular banco de dados
docker-compose exec servidor-automacao pnpm db:seed

# Parar containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### 4. Comandos Úteis Docker

```bash
# Acessar shell do container
docker-compose exec servidor-automacao sh

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar apenas o servidor
docker-compose restart servidor-automacao

# Verificar uso de recursos
docker stats

# Limpar containers parados
docker container prune

# Limpar imagens não utilizadas
docker image prune -a
```

---

## Deploy com PM2

PM2 é um gerenciador de processos para Node.js ideal para produção.

### 1. Instalar PM2

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalação
pm2 --version
```

### 2. Criar Arquivo de Configuração PM2

Criar arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'servidor-automacao',
      script: 'pnpm',
      args: 'start',
      cwd: '/opt/servidor-automacao',
      instances: 'max', // Usar todos os CPUs disponíveis
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
```

### 3. Iniciar Aplicação com PM2

```bash
# Navegar para diretório do projeto
cd /opt/servidor-automacao

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup

# Executar comando mostrado pelo pm2 startup (exemplo):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 4. Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs servidor-automacao

# Ver logs em tempo real
pm2 logs servidor-automacao --lines 100

# Monitorar recursos
pm2 monit

# Reiniciar aplicação
pm2 restart servidor-automacao

# Recarregar (zero downtime)
pm2 reload servidor-automacao

# Parar aplicação
pm2 stop servidor-automacao

# Deletar aplicação do PM2
pm2 delete servidor-automacao

# Ver informações detalhadas
pm2 describe servidor-automacao

# Limpar logs
pm2 flush
```

### 5. Atualizar Aplicação

```bash
# Pull das últimas alterações
cd /opt/servidor-automacao
git pull origin main

# Instalar novas dependências
pnpm install --frozen-lockfile

# Executar migrations
pnpm db:push

# Build
pnpm build

# Recarregar aplicação (zero downtime)
pm2 reload servidor-automacao
```

---

## Configuração de Proxy Reverso (Nginx)

### 1. Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 2. Configurar Nginx

Criar arquivo `/etc/nginx/sites-available/servidor-automacao`:

```nginx
# /etc/nginx/sites-available/servidor-automacao

# Upstream para o servidor Node.js
upstream servidor_backend {
    least_conn;
    server localhost:3000 max_fails=3 fail_timeout=30s;
    # Se usar PM2 cluster mode com múltiplas instâncias:
    # server localhost:3001 max_fails=3 fail_timeout=30s;
    # server localhost:3002 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL Certificates (configurar após Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/servidor-automacao-access.log;
    error_log /var/log/nginx/servidor-automacao-error.log;

    # Client body size (para uploads)
    client_max_body_size 50M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://servidor_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://servidor_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint (sem cache)
    location /api/trpc/health {
        proxy_pass http://servidor_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Métricas Prometheus (proteger com autenticação se necessário)
    location /api/trpc/prometheus.metrics {
        proxy_pass http://servidor_backend;
        # auth_basic "Prometheus Metrics";
        # auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
```

### 3. Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/servidor-automacao /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Se OK, recarregar Nginx
sudo systemctl reload nginx
```

### 4. Configurar Logs

```bash
# Criar diretório de logs (se não existir)
sudo mkdir -p /var/log/nginx

# Verificar logs
sudo tail -f /var/log/nginx/servidor-automacao-access.log
sudo tail -f /var/log/nginx/servidor-automacao-error.log
```

---

## SSL/TLS com Let's Encrypt

### 1. Instalar Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Verificar instalação
certbot --version
```

### 2. Obter Certificado SSL

```bash
# Obter certificado (Nginx irá configurar automaticamente)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir instruções interativas:
# - Fornecer email
# - Aceitar termos de serviço
# - Escolher se deseja redirecionar HTTP para HTTPS (recomendado: sim)
```

### 3. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Certbot já configura renovação automática via cron/systemd
# Verificar timer de renovação
sudo systemctl status certbot.timer

# Ver próxima execução
sudo systemctl list-timers | grep certbot
```

### 4. Renovar Manualmente (se necessário)

```bash
# Renovar certificados
sudo certbot renew

# Recarregar Nginx após renovação
sudo systemctl reload nginx
```

---

## Banco de Dados

### Otimizações MySQL para Produção

Editar `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Configurações básicas
max_connections = 200
max_allowed_packet = 64M
thread_cache_size = 8
query_cache_size = 0
query_cache_type = 0

# InnoDB
innodb_buffer_pool_size = 2G  # 70-80% da RAM disponível
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
innodb_file_per_table = 1

# Logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Timezone
default-time-zone = '+00:00'
```

Reiniciar MySQL:

```bash
sudo systemctl restart mysql
```

### Backup Automatizado

Criar script `/opt/scripts/backup-mysql.sh`:

```bash
#!/bin/bash

# Configurações
DB_NAME="servidor_automacao"
DB_USER="servidor_user"
DB_PASS="senha_segura"
BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Fazer backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Remover backups antigos
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "[$DATE] Backup concluído: backup_${DATE}.sql.gz" >> $BACKUP_DIR/backup.log
```

Tornar executável e agendar:

```bash
# Tornar executável
chmod +x /opt/scripts/backup-mysql.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
crontab -e

# Adicionar linha:
0 2 * * * /opt/scripts/backup-mysql.sh
```

### Restore de Backup

```bash
# Descompactar e restaurar
gunzip < /opt/backups/mysql/backup_20241202_020000.sql.gz | mysql -u servidor_user -p servidor_automacao
```

---

## Backup e Restore

### Backup Completo do Sistema

Criar script `/opt/scripts/backup-completo.sh`:

```bash
#!/bin/bash

# Configurações
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/servidor-automacao"

# Criar diretório
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u servidor_user -psenha_segura servidor_automacao | gzip > $BACKUP_DIR/db_${DATE}.sql.gz

# Backup de arquivos
tar -czf $BACKUP_DIR/files_${DATE}.tar.gz \
  $APP_DIR/whatsapp-sessions \
  $APP_DIR/obsidian-vaults \
  $APP_DIR/uploads \
  $APP_DIR/.env

# Backup de configurações Nginx
tar -czf $BACKUP_DIR/nginx_${DATE}.tar.gz /etc/nginx/sites-available/servidor-automacao

# Log
echo "[$DATE] Backup completo concluído" >> $BACKUP_DIR/backup.log

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Restore Completo

```bash
#!/bin/bash

# Configurações
BACKUP_DATE="20241202_020000"
BACKUP_DIR="/opt/backups"
APP_DIR="/opt/servidor-automacao"

# Parar aplicação
pm2 stop servidor-automacao

# Restore banco de dados
gunzip < $BACKUP_DIR/db_${BACKUP_DATE}.sql.gz | mysql -u servidor_user -p servidor_automacao

# Restore arquivos
tar -xzf $BACKUP_DIR/files_${BACKUP_DATE}.tar.gz -C /

# Restore Nginx
tar -xzf $BACKUP_DIR/nginx_${BACKUP_DATE}.tar.gz -C /

# Reiniciar serviços
sudo systemctl reload nginx
pm2 restart servidor-automacao

echo "Restore concluído!"
```

---

## Monitoramento e Logs

### 1. Configurar Logs Estruturados

O servidor já possui sistema de logs. Configurar rotação:

Criar `/etc/logrotate.d/servidor-automacao`:

```
/opt/servidor-automacao/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Monitoramento com Prometheus

Instalar Prometheus:

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz

# Extrair
tar -xzf prometheus-2.45.0.linux-amd64.tar.gz
sudo mv prometheus-2.45.0.linux-amd64 /opt/prometheus

# Criar configuração
sudo nano /opt/prometheus/prometheus.yml
```

Configuração `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'servidor-automacao'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/trpc/prometheus.metrics'
```

Criar serviço systemd `/etc/systemd/system/prometheus.service`:

```ini
[Unit]
Description=Prometheus
After=network.target

[Service]
User=ubuntu
ExecStart=/opt/prometheus/prometheus --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.path=/opt/prometheus/data
Restart=always

[Install]
WantedBy=multi-user.target
```

Iniciar Prometheus:

```bash
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus

# Acessar: http://seu-servidor:9090
```

### 3. Alertas

Configurar alertas no Prometheus ou usar o sistema de alertas interno da aplicação.

---

## Segurança

### 1. Firewall (UFW)

```bash
# Regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar
sudo ufw enable
```

### 2. Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar
sudo apt install -y fail2ban

# Configurar
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Adicionar:
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/servidor-automacao-error.log

# Reiniciar
sudo systemctl restart fail2ban
```

### 3. Rotação de API Keys

Implementar rotação periódica de API keys:

```bash
# Script para rotação de keys
# Executar mensalmente
# Gerar nova key via API
# Atualizar .env
# Reiniciar aplicação
```

### 4. Auditoria de Segurança

```bash
# Verificar portas abertas
sudo netstat -tulpn

# Verificar processos
ps aux | grep node

# Verificar logs de acesso suspeitos
sudo tail -f /var/log/nginx/servidor-automacao-access.log | grep -E "POST|DELETE"
```

---

## Otimização de Performance

### 1. Node.js

```bash
# Aumentar limite de arquivos abertos
ulimit -n 65536

# Adicionar ao /etc/security/limits.conf:
ubuntu soft nofile 65536
ubuntu hard nofile 65536
```

### 2. PM2 Cluster Mode

Usar todas as CPUs disponíveis:

```javascript
// ecosystem.config.js
instances: 'max',
exec_mode: 'cluster',
```

### 3. Nginx Caching

Adicionar cache ao Nginx:

```nginx
# Adicionar ao bloco http
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

# No bloco location
location /api/trpc {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 4. Database Indexing

Criar índices no MySQL:

```sql
-- Índices para tabelas principais
CREATE INDEX idx_created_at ON conversas(created_at);
CREATE INDEX idx_user_id ON execucoes(user_id);
CREATE INDEX idx_status ON tasks(status);
```

---

## Escalabilidade

### Arquitetura Escalável

```
                    ┌─────────────┐
                    │  Load       │
                    │  Balancer   │
                    │  (Nginx)    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
      │ Node.js │     │ Node.js │    │ Node.js │
      │ Server  │     │ Server  │    │ Server  │
      │ (PM2)   │     │ (PM2)   │    │ (PM2)   │
      └────┬────┘     └────┬────┘    └────┬────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL     │
                    │   Master    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   MySQL     │
                    │   Replica   │
                    └─────────────┘
```

### Load Balancing com Nginx

```nginx
upstream servidor_cluster {
    least_conn;
    server 10.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:3000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 64;
}
```

---

## Troubleshooting

### Servidor não inicia

```bash
# Verificar logs
pm2 logs servidor-automacao --lines 100

# Verificar porta em uso
sudo lsof -i :3000

# Verificar variáveis de ambiente
cat .env | grep DATABASE_URL

# Testar conexão com banco
mysql -u servidor_user -p servidor_automacao -e "SELECT 1;"
```

### Erro de conexão com banco de dados

```bash
# Verificar status MySQL
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar logs MySQL
sudo tail -f /var/log/mysql/error.log

# Testar conexão
mysql -u servidor_user -p -h localhost
```

### WhatsApp Web não conecta

```bash
# Limpar sessões
rm -rf /opt/servidor-automacao/whatsapp-sessions/*

# Verificar permissões
chmod 755 /opt/servidor-automacao/whatsapp-sessions

# Reiniciar aplicação
pm2 restart servidor-automacao
```

### Performance degradada

```bash
# Verificar uso de CPU/RAM
htop

# Verificar processos Node.js
ps aux | grep node

# Verificar conexões MySQL
mysql -u root -p -e "SHOW PROCESSLIST;"

# Verificar logs de slow queries
sudo tail -f /var/log/mysql/mysql-slow.log
```

---

## Manutenção

### Checklist Semanal

- [ ] Verificar logs de erro
- [ ] Verificar uso de disco
- [ ] Verificar backups foram criados
- [ ] Verificar métricas de performance
- [ ] Verificar alertas ativos

### Checklist Mensal

- [ ] Atualizar dependências (npm outdated)
- [ ] Revisar logs de segurança
- [ ] Testar restore de backup
- [ ] Revisar e otimizar queries lentas
- [ ] Rotacionar API keys
- [ ] Atualizar certificados SSL (se necessário)

### Atualizações do Sistema

```bash
# Atualizar sistema operacional
sudo apt update && sudo apt upgrade -y

# Atualizar Node.js (se necessário)
# Verificar versão atual
node --version

# Atualizar aplicação
cd /opt/servidor-automacao
git pull origin main
pnpm install --frozen-lockfile
pnpm db:push
pnpm build
pm2 reload servidor-automacao
```

---

## Conclusão

Este guia fornece todas as informações necessárias para realizar o **deploy em produção** do Servidor de Automação com alta disponibilidade, segurança e performance. Para suporte adicional, consulte a [documentação completa da API](./DOCUMENTACAO_API_COMPLETA.md) ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização:** Dezembro 2024  
**Versão:** 2.0  
**Autor:** Manus AI
