# ✅ Checklist de Deploy - Render.com

## Sistema COMETA - Validação Completa

**Data:** 01 de Dezembro de 2024  
**Responsável:** CEO Rudson Oliveira  
**Versão:** 1.0.0

---

## 📦 FASE 1: Preparação do Código

### Repositório GitHub

- [ ] Código commitado na branch `main`
- [ ] Últimos 5 commits verificados
- [ ] Correções críticas aplicadas (commit 9f36105)
- [ ] Arquivos de configuração adicionados:
  - [ ] `render.yaml`
  - [ ] `Dockerfile`
  - [ ] `.dockerignore`
  - [ ] `.env.render.template`
  - [ ] `scripts/pre-deploy-check.sh`
  - [ ] `docs/DEPLOY-RENDER.md`

### Validação Local

- [ ] Script `pre-deploy-check.sh` executado
- [ ] Resultado: "✅ SISTEMA PRONTO PARA DEPLOY"
- [ ] Testes executados: `pnpm test`
- [ ] Resultado: 450/457 testes passando (98.5%)
- [ ] Build local bem-sucedido: `pnpm build`
- [ ] Servidor local funcionando: `pnpm dev`

### Estrutura de Arquivos

- [ ] `package.json` com scripts corretos
- [ ] `tsconfig.json` configurado
- [ ] `drizzle/schema.ts` atualizado
- [ ] `server/_core/env.ts` com todas variáveis
- [ ] `client/` com build otimizado

---

## 🔐 FASE 2: Variáveis de Ambiente

### Autenticação Manus

- [ ] `VITE_APP_ID` copiado do dashboard
- [ ] `OWNER_OPEN_ID` copiado do dashboard
- [ ] `BUILT_IN_FORGE_API_KEY` copiado do dashboard
- [ ] `VITE_FRONTEND_FORGE_API_KEY` copiado do dashboard
- [ ] `OAUTH_SERVER_URL` = https://api.manus.im
- [ ] `VITE_OAUTH_PORTAL_URL` = https://portal.manus.im

### Database

- [ ] `DATABASE_URL` do TiDB Cloud obtida
- [ ] Formato validado: `mysql://user:pass@host:port/db?ssl=...`
- [ ] Conexão testada localmente
- [ ] Backup do banco realizado

### Secrets

- [ ] `JWT_SECRET` será gerado automaticamente no Render
- [ ] `DESKTOP_AGENT_REGISTER_TOKEN` será gerado no Render

### Email (SMTP)

- [ ] Conta Gmail configurada
- [ ] Senha de app criada: https://myaccount.google.com/apppasswords
- [ ] `SMTP_USER` definido
- [ ] `SMTP_PASS` (senha de app) definido
- [ ] `SMTP_FROM` definido

### Frontend

- [ ] `VITE_APP_TITLE` = Sistema COMETA
- [ ] `VITE_APP_LOGO` = /logo.svg
- [ ] `NODE_ENV` = production
- [ ] `PORT` = 3000

---

## 🚀 FASE 3: Configuração Render.com

### Conta e Plano

- [ ] Login em https://dashboard.render.com
- [ ] Plano Standard (US$ 19/mês) confirmado e ativo
- [ ] Cartão de crédito válido cadastrado

### Criar Web Service

- [ ] Clicar em "New +" → "Web Service"
- [ ] Conectar ao repositório GitHub
- [ ] Repositório selecionado: `servidor-automacao`
- [ ] Branch selecionada: `main`

### Configurações do Serviço

- [ ] **Name:** servidor-automacao
- [ ] **Region:** Oregon (US West)
- [ ] **Branch:** main
- [ ] **Runtime:** Node
- [ ] **Build Command:** `pnpm install && pnpm build`
- [ ] **Start Command:** `pnpm start`
- [ ] **Plan:** Standard ($19/month)

### Variáveis de Ambiente (Render)

Copiar todas as variáveis da seção FASE 2 no painel:
**Settings → Environment → Add Environment Variable**

- [ ] NODE_ENV
- [ ] PORT
- [ ] DATABASE_URL
- [ ] JWT_SECRET (Generate Value)
- [ ] VITE_APP_ID
- [ ] OWNER_OPEN_ID
- [ ] OAUTH_SERVER_URL
- [ ] BUILT_IN_FORGE_API_URL
- [ ] BUILT_IN_FORGE_API_KEY
- [ ] VITE_FRONTEND_FORGE_API_KEY
- [ ] VITE_FRONTEND_FORGE_API_URL
- [ ] VITE_OAUTH_PORTAL_URL
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USER
- [ ] SMTP_PASS
- [ ] SMTP_FROM
- [ ] DESKTOP_AGENT_REGISTER_TOKEN (Generate Value)
- [ ] VITE_APP_TITLE
- [ ] VITE_APP_LOGO

### Configurações Avançadas

- [ ] **Health Check Path:** `/api/status`
- [ ] **WebSocket Support:** Enabled
- [ ] **Auto-Deploy:** Disabled (habilitar após primeiro deploy manual)

---

## 🔄 FASE 4: Deploy Inicial

### Iniciar Deploy

- [ ] Clicar em "Create Web Service"
- [ ] Aguardar início do build
- [ ] Monitorar logs de build em tempo real

### Acompanhar Build

- [ ] Build iniciado (0-2 min)
- [ ] Dependências instaladas (2-5 min)
- [ ] Build do frontend completado (5-8 min)
- [ ] Build do backend completado (8-10 min)
- [ ] Deploy finalizado (10-12 min)

### Verificar Status

- [ ] Status mudou para "Live"
- [ ] URL pública gerada: `https://servidor-automacao.onrender.com`
- [ ] Health check respondendo OK

---

## ✅ FASE 5: Validação Pós-Deploy

### Testes de API

```bash
# Health Check
curl https://servidor-automacao.onrender.com/api/status
```

- [ ] Resposta: `{"status":"ok"}`
- [ ] Status Code: 200
- [ ] Response Time: < 500ms

### Testes de Frontend

Acessar: `https://servidor-automacao.onrender.com`

- [ ] Página carrega sem erros
- [ ] CSS aplicado corretamente
- [ ] Imagens carregam
- [ ] Console sem erros críticos

### Testes de Autenticação

- [ ] Botão "Login" visível
- [ ] Clicar em "Login"
- [ ] Redirecionamento para Manus OAuth
- [ ] Login bem-sucedido
- [ ] Redirecionamento de volta para aplicação
- [ ] Dashboard exibido
- [ ] Dados do usuário carregados

### Testes de WebSocket

Abrir console do navegador (F12):

- [ ] Mensagem: "WebSocket connected"
- [ ] Sem erros de conexão
- [ ] Ping/pong funcionando

### Testes de Database

- [ ] Dados carregam do banco
- [ ] Queries executam sem timeout
- [ ] Sem erros de conexão nos logs

### Testes de Desktop Agent

Executar agent local:

```bash
python desktop-agent/agent.py
```

- [ ] Agent conecta ao servidor
- [ ] Registro bem-sucedido
- [ ] Token gerado
- [ ] WebSocket estabelecido
- [ ] Comandos recebidos

---

## 📊 FASE 6: Monitoramento

### Logs

Acessar: **Dashboard → Logs**

- [ ] Logs de runtime sem erros
- [ ] Sem warnings críticos
- [ ] Conexões WebSocket estabelecidas
- [ ] Database queries executando

### Métricas

Acessar: **Dashboard → Metrics**

- [ ] CPU Usage: < 50%
- [ ] Memory Usage: < 512MB
- [ ] Response Time: < 500ms
- [ ] Error Rate: < 1%

### Health Checks

- [ ] Health checks passando (verde)
- [ ] Sem falhas nos últimos 10 checks
- [ ] Uptime: 100%

---

## 🔧 FASE 7: Configurações Finais

### Auto-Deploy

⚠️ **IMPORTANTE:** Habilitar APENAS após validação completa

- [ ] Todos testes da FASE 5 passaram
- [ ] Sistema estável por pelo menos 30 minutos
- [ ] Ir em Settings → Build & Deploy
- [ ] Habilitar "Auto-Deploy"
- [ ] Salvar configurações

### Notificações

- [ ] Configurar notificações por email
- [ ] Habilitar alertas de deploy
- [ ] Habilitar alertas de downtime

### Domínio (Opcional)

- [ ] Registrar domínio customizado
- [ ] Configurar DNS
- [ ] Adicionar domínio no Render
- [ ] Habilitar HTTPS automático

---

## 📝 FASE 8: Documentação

### Atualizar Documentação

- [ ] README.md atualizado com URL de produção
- [ ] Variáveis de ambiente documentadas
- [ ] Processos de deploy documentados
- [ ] Troubleshooting atualizado

### Comunicação

- [ ] Equipe notificada do deploy
- [ ] URL de produção compartilhada
- [ ] Credenciais de acesso distribuídas
- [ ] Procedimentos de suporte comunicados

---

## 🎯 VALIDAÇÃO FINAL

### Critérios de Sucesso

- [ ] ✅ Sistema acessível via URL pública
- [ ] ✅ Login funcionando
- [ ] ✅ Dashboard carregando
- [ ] ✅ WebSocket conectado
- [ ] ✅ Database respondendo
- [ ] ✅ Desktop Agent conectando
- [ ] ✅ Health checks passando
- [ ] ✅ Métricas dentro do esperado
- [ ] ✅ Logs sem erros críticos
- [ ] ✅ Testes automatizados passando

### Assinaturas

**Preparado por:**  
Nome: ___________________________  
Data: ___/___/______  
Assinatura: ______________________

**Validado por:**  
Nome: ___________________________  
Data: ___/___/______  
Assinatura: ______________________

**Aprovado por (CEO):**  
Nome: Rudson Oliveira  
Data: ___/___/______  
Assinatura: ______________________

---

## 📞 Contatos de Emergência

### Suporte Técnico

- **Render Support:** https://render.com/support
- **Manus Support:** https://help.manus.im
- **Email:** support@manus.im

### Rollback de Emergência

Se algo der errado:

1. **Desabilitar auto-deploy** (Settings → Build & Deploy)
2. **Rollback para deploy anterior** (Deploys → Rollback)
3. **Notificar equipe** via canal de comunicação
4. **Abrir ticket de suporte** se necessário

---

**Documento gerado por:** Manus AI  
**Última atualização:** 01 de Dezembro de 2024  
**Versão:** 1.0.0  
**Status:** ✅ PRONTO PARA USO
