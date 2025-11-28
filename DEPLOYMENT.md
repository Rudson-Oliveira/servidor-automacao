# Guia de Deployment - Servidor de Automação

## 🚀 Preparação para Produção

### Pré-requisitos

1. **Sistema Operacional:** Ubuntu 22.04 LTS ou superior
2. **Node.js:** v22.13.0 ou superior
3. **pnpm:** v10.4.1 ou superior
4. **MySQL:** 8.0 ou superior (ou TiDB compatível)
5. **Redis:** 7.0 ou superior
6. **Memória:** Mínimo 2GB RAM (recomendado 4GB)
7. **Disco:** Mínimo 10GB livres

### Configuração do Sistema Operacional

Execute os seguintes comandos para configurar os limites do sistema:

```bash
# Aumentar limites de file watchers (permanente)
sudo tee -a /etc/sysctl.conf << EOF
fs.inotify.max_user_watches=1048576
fs.inotify.max_user_instances=512
fs.file-max=2097152
EOF

sudo sysctl -p

# Aumentar limite de file descriptors (permanente)
sudo tee -a /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
EOF

# Aplicar imediatamente (requer relogin para persistir)
ulimit -n 65536
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Database
DATABASE_URL=mysql://usuario:senha@host:3306/nome_do_banco

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<gerar-com-openssl-rand-base64-32>

# OAuth (Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=<seu-open-id>
OWNER_NAME=<seu-nome>

# App
VITE_APP_TITLE=Servidor de Automação
VITE_APP_ID=<seu-app-id>

# Opcional: Configurações avançadas
NODE_ENV=production
PORT=3000
WEBSOCKET_PORT=3001
```

**Gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

## 📦 Instalação

### 1. Clonar Repositório

```bash
git clone <url-do-repositorio>
cd servidor-automacao
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Banco de Dados

```bash
# Executar migrations
pnpm db:push
```

### 4. Build do Frontend

```bash
cd client
pnpm build
cd ..
```

## ▶️ Execução

### Modo Desenvolvimento

```bash
pnpm dev
```

### Modo Produção (Manual)

```bash
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" pnpm tsx server/_core/index.ts
```

### Modo Produção (Script Automatizado)

```bash
./start-production.sh
```

### Usando PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'servidor-automacao',
    script: 'server/_core/index.ts',
    interpreter: 'pnpm',
    interpreter_args: 'tsx',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=4096'
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '2G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Criar diretório de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração para reiniciar após reboot
pm2 save
pm2 startup
```

### Usando Docker (Opcional)

```bash
# Build da imagem
docker build -t servidor-automacao .

# Executar container
docker run -d \
  --name servidor-automacao \
  -p 3000:3000 \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  servidor-automacao
```

## 🔍 Verificação de Saúde

### Endpoints de Health Check

```bash
# Status básico
curl http://localhost:3000/api/status

# Health check completo
curl http://localhost:3000/api/health

# Métricas (se Prometheus estiver habilitado)
curl http://localhost:3000/metrics
```

### Logs

```bash
# PM2
pm2 logs servidor-automacao

# Docker
docker logs -f servidor-automacao

# Manual
tail -f logs/combined.log
```

## 🛡️ Segurança

### Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 3000/tcp  # HTTP
sudo ufw allow 3001/tcp  # WebSocket
sudo ufw enable
```

### SSL/TLS (Nginx Reverse Proxy)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📊 Monitoramento

### Prometheus + Grafana

1. **Instalar Prometheus:**
```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

2. **Configurar prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'servidor-automacao'
    static_configs:
      - targets: ['localhost:3000']
```

3. **Instalar Grafana:**
```bash
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana
```

### Sentry (Error Tracking)

Adicionar ao `.env`:
```bash
SENTRY_DSN=<seu-sentry-dsn>
```

## 🔄 Backup e Recuperação

### Backup do Banco de Dados

```bash
# Criar backup
mysqldump -u usuario -p nome_do_banco > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
mysql -u usuario -p nome_do_banco < backup_20251128_151700.sql
```

### Backup Automático (Cron)

```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h da manhã
0 2 * * * /usr/bin/mysqldump -u usuario -p'senha' nome_do_banco > /backups/db_$(date +\%Y\%m\%d).sql
```

## 🚨 Troubleshooting

### Erro: EMFILE (too many open files)

```bash
# Aumentar limite temporariamente
ulimit -n 65536

# Verificar limite atual
ulimit -n

# Aumentar permanentemente (ver seção "Configuração do Sistema Operacional")
```

### Erro: EADDRINUSE (porta em uso)

```bash
# Encontrar processo usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou usar fuser
sudo fuser -k 3000/tcp
```

### Servidor não inicia

```bash
# Verificar logs
pm2 logs servidor-automacao --lines 100

# Verificar variáveis de ambiente
printenv | grep DATABASE_URL

# Testar conexão com banco
mysql -h host -u usuario -p -e "SELECT 1"

# Testar conexão com Redis
redis-cli ping
```

### Alto uso de memória

```bash
# Aumentar limite de memória do Node.js
NODE_OPTIONS="--max-old-space-size=4096"

# Reiniciar PM2 com novo limite
pm2 restart servidor-automacao --update-env
```

## 📈 Otimizações de Performance

### 1. Habilitar Compressão

Adicionar ao servidor Express:
```typescript
import compression from 'compression';
app.use(compression());
```

### 2. Cache de Assets

Configurar Nginx para cache de assets estáticos:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Connection Pooling

Configurar pool de conexões do MySQL:
```typescript
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'usuario',
  password: 'senha',
  database: 'nome_do_banco'
});
```

## 🔗 Recursos Adicionais

- [Documentação do Projeto](./README.md)
- [Relatório de Auditoria](./AUDIT-REPORT.md)
- [Guia de Contribuição](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

---

**Última atualização:** 28 de novembro de 2025  
**Versão:** 1.0.0  
**Autor:** Manus AI
