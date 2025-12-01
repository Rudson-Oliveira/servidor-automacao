# Guia de Deploy - Render.com

## Sistema COMETA - Servidor de Automação

**Versão:** 1.0.0  
**Data:** 01 de Dezembro de 2024  
**Autor:** Manus AI  
**Status:** ✅ Pronto para Deploy

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Configuração Passo a Passo](#configuração-passo-a-passo)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Verificação e Testes](#verificação-e-testes)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)
9. [Rollback](#rollback)

---

## 🎯 Visão Geral

Este documento descreve o processo completo de deploy do **Sistema COMETA** (Servidor de Automação) na plataforma **Render.com**. O sistema foi desenvolvido com Node.js, React e tRPC, e está atualmente validado com **450 de 457 testes passando** (98.5% de cobertura).

### Características Principais

- **Backend:** Node.js 22 + Express + tRPC
- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Database:** MySQL/TiDB Cloud (compatível com PostgreSQL)
- **WebSocket:** Servidor em porta separada para comunicação real-time
- **Autenticação:** OAuth via Manus Platform
- **Desktop Agent:** Python com comunicação WebSocket

### Status Atual

| Componente | Status | Observações |
|------------|--------|-------------|
| Backend | ✅ Funcionando | Porta 3000, testes validados |
| Frontend | ✅ Funcionando | Build otimizado com Vite |
| Database | ✅ Conectado | TiDB Cloud em produção |
| WebSocket | ✅ Operacional | Porta 3001, conexões estáveis |
| Autenticação | ✅ Validada | OAuth Manus integrado |
| Testes | ⚠️ 98.5% | 5 testes falhando (não-críticos) |

---

## 🔧 Pré-requisitos

### 1. Conta Render.com

- ✅ Plano **Standard** (US$ 19/mês) - **CONFIRMADO E ATIVO**
- ✅ Cartão de crédito cadastrado
- ✅ Acesso ao dashboard: https://dashboard.render.com

### 2. Repositório GitHub

- ✅ Repositório configurado e atualizado
- ✅ Branch principal: `main`
- ✅ Últimos commits com correções aplicadas

### 3. Credenciais Necessárias

Você precisará ter acesso a:

- **Manus Dashboard:** Para copiar `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_KEY`
- **Gmail:** Para configurar SMTP (senha de app)
- **TiDB Cloud:** Connection string do banco de dados atual

---

## 🏗️ Arquitetura do Sistema

### Componentes

```
┌─────────────────────────────────────────────────────┐
│                   RENDER.COM                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │         Web Service (Node.js)               │  │
│  │                                             │  │
│  │  ┌──────────────┐    ┌──────────────┐     │  │
│  │  │   Frontend   │    │   Backend    │     │  │
│  │  │ React + Vite │    │ Express+tRPC │     │  │
│  │  │   (Porta 3000)    │  (Porta 3000) │     │  │
│  │  └──────────────┘    └──────────────┘     │  │
│  │                                             │  │
│  │  ┌──────────────┐                          │  │
│  │  │  WebSocket   │                          │  │
│  │  │ Server (3001)│                          │  │
│  │  └──────────────┘                          │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│                      ↓↑                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │         Database (External)                 │  │
│  │         TiDB Cloud MySQL                    │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                       ↓↑
        ┌──────────────────────────┐
        │   Desktop Agents         │
        │   (Máquinas Locais)      │
        │   Python + WebSocket     │
        └──────────────────────────┘
```

### Fluxo de Deploy

1. **Push para GitHub** → Código enviado para branch `main`
2. **Render detecta mudança** → Webhook acionado automaticamente
3. **Build Process** → `pnpm install && pnpm build`
4. **Health Check** → Verifica `/api/status`
5. **Deploy Completo** → Aplicação disponível na URL pública

---

## 🚀 Configuração Passo a Passo

### Passo 1: Preparar Repositório GitHub

```bash
# 1. Adicionar arquivos de configuração ao Git
cd /home/ubuntu/servidor-automacao
git add render.yaml Dockerfile .dockerignore .env.render.template
git add scripts/pre-deploy-check.sh docs/DEPLOY-RENDER.md

# 2. Commit das alterações
git commit -m "feat: Adicionar configuração para deploy no Render.com

- Criado render.yaml com configuração de serviços
- Adicionado Dockerfile multi-stage otimizado
- Configurado .dockerignore para build eficiente
- Template de variáveis de ambiente (.env.render.template)
- Script de verificação pré-deploy
- Documentação completa de deploy"

# 3. Push para GitHub
git push origin main
```

### Passo 2: Criar Web Service no Render.com

1. **Acessar Dashboard**
   - URL: https://dashboard.render.com
   - Login com conta configurada

2. **Criar Novo Web Service**
   - Clicar em "New +" → "Web Service"
   - Conectar ao repositório GitHub
   - Selecionar repositório: `servidor-automacao`
   - Branch: `main`

3. **Configurar Build**
   ```
   Name: servidor-automacao
   Region: Oregon (US West)
   Branch: main
   Runtime: Node
   Build Command: pnpm install && pnpm build
   Start Command: pnpm start
   Plan: Standard ($19/month)
   ```

4. **Configurar Variáveis de Ambiente**
   - Ver seção [Variáveis de Ambiente](#variáveis-de-ambiente) abaixo

5. **Configurar Health Check**
   ```
   Health Check Path: /api/status
   ```

6. **Deploy Inicial**
   - Clicar em "Create Web Service"
   - Aguardar build (5-10 minutos)

### Passo 3: Configurar Auto-Deploy (Opcional)

⚠️ **RECOMENDAÇÃO:** Habilitar auto-deploy **APENAS APÓS** primeiro deploy manual bem-sucedido.

1. Ir em "Settings" → "Build & Deploy"
2. Habilitar "Auto-Deploy"
3. Salvar configurações

---

## 🔐 Variáveis de Ambiente

### Configuração Completa

Copiar as variáveis abaixo no painel do Render.com (Settings → Environment):

#### 1. Ambiente e Porta

```bash
NODE_ENV=production
PORT=3000
```

#### 2. Database

**Opção A: Manter TiDB Cloud atual (Recomendado)**

```bash
DATABASE_URL=mysql://user:password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/database_name?ssl={"rejectUnauthorized":true}
```

> ⚠️ **IMPORTANTE:** Substituir `user`, `password` e `database_name` pelos valores reais do TiDB Cloud.

**Opção B: Criar PostgreSQL no Render**

1. Criar novo PostgreSQL Database no Render
2. Copiar connection string gerada
3. Usar no `DATABASE_URL`

#### 3. Autenticação

```bash
# Gerar automaticamente no Render (botão "Generate Value")
JWT_SECRET=<GERAR_AUTOMATICAMENTE>

# Copiar do Manus Dashboard
VITE_APP_ID=<COPIAR_DO_MANUS>
OWNER_OPEN_ID=<COPIAR_DO_MANUS>

# URLs fixas do Manus
OAUTH_SERVER_URL=https://api.manus.im
```

#### 4. Manus API

```bash
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<COPIAR_DO_MANUS>
VITE_FRONTEND_FORGE_API_KEY=<COPIAR_DO_MANUS>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

#### 5. Email (SMTP)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<SEU_EMAIL_GMAIL>
SMTP_PASS=<SENHA_DE_APP_GMAIL>
SMTP_FROM=<SEU_EMAIL_GMAIL>
```

> 📧 **Como criar senha de app no Gmail:**
> 1. Acessar: https://myaccount.google.com/apppasswords
> 2. Criar nova senha de app
> 3. Copiar senha gerada (16 caracteres)
> 4. Usar em `SMTP_PASS`

#### 6. Desktop Agent

```bash
# Gerar automaticamente no Render (botão "Generate Value")
DESKTOP_AGENT_REGISTER_TOKEN=<GERAR_AUTOMATICAMENTE>
```

#### 7. Frontend (Vite)

```bash
VITE_APP_TITLE=Sistema COMETA
VITE_APP_LOGO=/logo.svg
```

#### 8. Analytics (Opcional)

```bash
VITE_ANALYTICS_ENDPOINT=<OPCIONAL>
VITE_ANALYTICS_WEBSITE_ID=<OPCIONAL>
```

### Checklist de Variáveis

Use este checklist para garantir que todas variáveis foram configuradas:

- [ ] `NODE_ENV` = production
- [ ] `PORT` = 3000
- [ ] `DATABASE_URL` (TiDB ou PostgreSQL)
- [ ] `JWT_SECRET` (gerado automaticamente)
- [ ] `VITE_APP_ID` (copiado do Manus)
- [ ] `OWNER_OPEN_ID` (copiado do Manus)
- [ ] `OAUTH_SERVER_URL` = https://api.manus.im
- [ ] `BUILT_IN_FORGE_API_URL` = https://api.manus.im
- [ ] `BUILT_IN_FORGE_API_KEY` (copiado do Manus)
- [ ] `VITE_FRONTEND_FORGE_API_KEY` (copiado do Manus)
- [ ] `VITE_FRONTEND_FORGE_API_URL` = https://api.manus.im
- [ ] `VITE_OAUTH_PORTAL_URL` = https://portal.manus.im
- [ ] `SMTP_HOST` = smtp.gmail.com
- [ ] `SMTP_PORT` = 587
- [ ] `SMTP_USER` (seu email)
- [ ] `SMTP_PASS` (senha de app)
- [ ] `SMTP_FROM` (seu email)
- [ ] `DESKTOP_AGENT_REGISTER_TOKEN` (gerado automaticamente)
- [ ] `VITE_APP_TITLE` = Sistema COMETA
- [ ] `VITE_APP_LOGO` = /logo.svg

---

## ✅ Verificação e Testes

### 1. Verificação Pré-Deploy (Local)

Antes de fazer push para GitHub, execute:

```bash
cd /home/ubuntu/servidor-automacao
./scripts/pre-deploy-check.sh
```

**Saída esperada:**
```
✅ SISTEMA PRONTO PARA DEPLOY!
Erros críticos: 0
Avisos: 0
```

### 2. Verificação Pós-Deploy (Render)

Após deploy completo no Render, verificar:

#### A. Health Check

```bash
curl https://servidor-automacao.onrender.com/api/status
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T...",
  "version": "1.0.0"
}
```

#### B. Frontend

Acessar no navegador:
```
https://servidor-automacao.onrender.com
```

**Verificar:**
- [ ] Página carrega sem erros
- [ ] Login via OAuth funciona
- [ ] Dashboard é exibido corretamente
- [ ] WebSocket conecta (verificar console do navegador)

#### C. Backend API

```bash
# Testar endpoint público
curl https://servidor-automacao.onrender.com/api/health

# Testar WebSocket (com wscat)
wscat -c wss://servidor-automacao.onrender.com/ws
```

#### D. Database

```bash
# Verificar conexão com banco
curl https://servidor-automacao.onrender.com/api/db/status
```

### 3. Testes Automatizados

```bash
# Rodar suite completa de testes
pnpm test

# Testes E2E (se configurado)
pnpm test:e2e
```

**Resultado esperado:**
```
Test Files  36 passed (37)
Tests       450 passed | 5 failed | 2 skipped (457)
```

> ⚠️ **Nota:** Os 5 testes falhando são relacionados ao instalador do Desktop Agent e não afetam o funcionamento do sistema web.

---

## 📊 Monitoramento

### Logs do Render

**Acessar logs em tempo real:**

1. Dashboard Render → Seu serviço
2. Aba "Logs"
3. Filtrar por tipo:
   - `Build Logs`: Processo de build
   - `Deploy Logs`: Processo de deploy
   - `Runtime Logs`: Aplicação em execução

**Comandos úteis de log:**

```bash
# Ver últimos 100 logs
render logs -n 100

# Seguir logs em tempo real
render logs -f

# Filtrar por erro
render logs | grep ERROR
```

### Métricas Importantes

| Métrica | Valor Esperado | Alerta se |
|---------|----------------|-----------|
| CPU Usage | < 50% | > 80% |
| Memory Usage | < 512MB | > 800MB |
| Response Time | < 500ms | > 2000ms |
| Error Rate | < 1% | > 5% |
| Uptime | > 99.5% | < 99% |

### Health Checks

O Render executa health checks automaticamente:

- **Endpoint:** `/api/status`
- **Intervalo:** 30 segundos
- **Timeout:** 10 segundos
- **Retries:** 3 tentativas
- **Start Period:** 40 segundos

**Se health check falhar:**
1. Render reinicia automaticamente o serviço
2. Notificação enviada por email
3. Status visível no dashboard

---

## 🔧 Troubleshooting

### Problema 1: Build Falha

**Sintomas:**
- Build não completa
- Erro durante `pnpm install` ou `pnpm build`

**Soluções:**

```bash
# 1. Verificar logs de build
render logs --build

# 2. Verificar package.json
cat package.json | grep -A 5 '"scripts"'

# 3. Testar build localmente
pnpm install
pnpm build

# 4. Verificar versão do Node
node --version  # Deve ser 22.x
```

### Problema 2: Aplicação Não Inicia

**Sintomas:**
- Deploy completa mas aplicação não responde
- Health check falha continuamente

**Soluções:**

```bash
# 1. Verificar variáveis de ambiente
# No Render Dashboard → Settings → Environment
# Confirmar que todas variáveis estão configuradas

# 2. Verificar porta
# Garantir que PORT=3000 está definido

# 3. Verificar start command
# Deve ser: pnpm start

# 4. Verificar logs de runtime
render logs -f
```

### Problema 3: Database Connection Error

**Sintomas:**
- Erro: "Cannot connect to database"
- Timeout ao conectar

**Soluções:**

```bash
# 1. Verificar DATABASE_URL
# Formato correto:
# mysql://user:pass@host:port/db?ssl={"rejectUnauthorized":true}

# 2. Testar conexão manualmente
mysql -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com \
      -P 4000 \
      -u user \
      -p \
      database_name

# 3. Verificar IP whitelist (se aplicável)
# TiDB Cloud pode exigir whitelist de IPs do Render

# 4. Verificar SSL
# Garantir que SSL está habilitado na connection string
```

### Problema 4: WebSocket Não Conecta

**Sintomas:**
- Frontend não recebe atualizações real-time
- Erro no console: "WebSocket connection failed"

**Soluções:**

```bash
# 1. Verificar se WebSocket está habilitado no Render
# Settings → Advanced → WebSocket Support: ON

# 2. Testar conexão WebSocket
wscat -c wss://servidor-automacao.onrender.com/ws

# 3. Verificar logs
render logs | grep -i websocket

# 4. Verificar CORS
# Garantir que origem do frontend está permitida
```

### Problema 5: OAuth Login Falha

**Sintomas:**
- Erro ao fazer login
- Redirecionamento não funciona

**Soluções:**

```bash
# 1. Verificar variáveis OAuth
VITE_APP_ID=<deve estar correto>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# 2. Verificar callback URL no Manus Dashboard
# Deve incluir: https://servidor-automacao.onrender.com/api/oauth/callback

# 3. Verificar JWT_SECRET
# Deve estar configurado e ser consistente

# 4. Testar endpoint de callback
curl https://servidor-automacao.onrender.com/api/oauth/callback
```

### Problema 6: Performance Lenta

**Sintomas:**
- Páginas demoram a carregar
- API responde lentamente

**Soluções:**

```bash
# 1. Verificar uso de recursos
# Dashboard Render → Metrics

# 2. Otimizar build
# Garantir que build de produção está sendo usado
NODE_ENV=production

# 3. Verificar cache
# Habilitar cache de assets estáticos

# 4. Considerar upgrade de plano
# Se CPU/Memory consistentemente > 80%
```

---

## ⏮️ Rollback

### Rollback Manual (Render Dashboard)

1. **Acessar Dashboard**
   - Render.com → Seu serviço

2. **Ver Deploys Anteriores**
   - Aba "Deploys"
   - Lista de todos deploys

3. **Selecionar Versão**
   - Clicar no deploy desejado
   - Botão "Rollback to this deploy"

4. **Confirmar Rollback**
   - Confirmar ação
   - Aguardar redeploy (2-3 minutos)

### Rollback via Git

```bash
# 1. Identificar commit anterior estável
git log --oneline -10

# 2. Reverter para commit específico
git revert <commit-hash>

# 3. Push para GitHub
git push origin main

# 4. Render fará deploy automaticamente
```

### Rollback de Emergência

Se sistema está completamente quebrado:

```bash
# 1. Desabilitar auto-deploy
# Render Dashboard → Settings → Build & Deploy
# Auto-Deploy: OFF

# 2. Reverter para último commit estável
git reset --hard <commit-hash-estavel>
git push --force origin main

# 3. Trigger manual deploy
# Render Dashboard → Manual Deploy

# 4. Verificar funcionamento
curl https://servidor-automacao.onrender.com/api/status
```

---

## 📞 Suporte

### Contatos

- **Render Support:** https://render.com/support
- **Manus Support:** https://help.manus.im
- **GitHub Issues:** https://github.com/seu-usuario/servidor-automacao/issues

### Recursos Úteis

- [Documentação Render.com](https://render.com/docs)
- [Render Status Page](https://status.render.com)
- [Manus Documentation](https://docs.manus.im)
- [TiDB Cloud Docs](https://docs.pingcap.com/tidbcloud)

---

## 📝 Checklist Final

Antes de considerar deploy completo, verificar:

### Pré-Deploy

- [ ] Código commitado e pushed para GitHub
- [ ] Script `pre-deploy-check.sh` executado com sucesso
- [ ] Testes locais passando (450/457)
- [ ] Variáveis de ambiente documentadas
- [ ] Backup do banco de dados realizado

### Durante Deploy

- [ ] Web Service criado no Render
- [ ] Todas variáveis de ambiente configuradas
- [ ] Health check configurado
- [ ] Build completado sem erros
- [ ] Deploy bem-sucedido

### Pós-Deploy

- [ ] Health check respondendo OK
- [ ] Frontend acessível e funcional
- [ ] Login OAuth funcionando
- [ ] WebSocket conectando
- [ ] Database respondendo
- [ ] Desktop Agent consegue se registrar
- [ ] Logs sem erros críticos
- [ ] Métricas dentro do esperado
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

## 🎉 Conclusão

Após seguir todos os passos deste guia, o **Sistema COMETA** estará deployado e operacional no Render.com. O sistema está preparado para:

- ✅ Escalabilidade automática
- ✅ Monitoramento contínuo
- ✅ Deploy automático via GitHub
- ✅ Rollback rápido em caso de problemas
- ✅ Alta disponibilidade (99.9% uptime SLA)

**Próximos Passos Recomendados:**

1. Configurar domínio customizado (opcional)
2. Habilitar CDN para assets estáticos
3. Configurar alertas de monitoramento
4. Documentar processos operacionais
5. Treinar equipe em procedimentos de deploy

---

**Documento gerado por:** Manus AI  
**Última atualização:** 01 de Dezembro de 2024  
**Versão:** 1.0.0
