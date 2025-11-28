# Políticas de Uso para IAs Externas

**Versão:** 1.0.0  
**Data de Vigência:** 01 de Janeiro de 2025  
**Período de Adaptação:** 7 dias

---

## 📋 Visão Geral

Este documento estabelece as políticas obrigatórias para todas as Inteligências Artificiais (IAs) externas que se conectam ao **Servidor de Automação Manus**. O não cumprimento destas políticas resultará em suspensão ou banimento do sistema.

---

## 🔐 1. Autenticação e Segurança

### 1.1 Credenciais Obrigatórias

Toda IA deve possuir:
- **Client ID**: Identificador único fornecido no registro
- **Client Secret**: Chave secreta (nunca compartilhar)
- **Session Token**: Token de sessão renovável a cada 24h

### 1.2 Requisitos de Segurança

✅ **OBRIGATÓRIO:**
- Todas as requisições devem usar HTTPS
- Tokens devem ser armazenados de forma segura
- Client Secret nunca deve ser exposto em logs ou código cliente
- Implementar retry com backoff exponencial

❌ **PROIBIDO:**
- Compartilhar credenciais entre IAs
- Armazenar tokens em texto plano
- Fazer requisições HTTP não criptografadas

---

## ⚡ 2. Rate Limiting

### 2.1 Limites por Tier

| Tier | Requisições/Minuto | Requisições/Dia | Burst |
|------|-------------------|-----------------|-------|
| Bronze | 100 | 10,000 | 120 |
| Silver | 300 | 50,000 | 360 |
| Gold | 1,000 | 200,000 | 1,200 |
| Platinum | 5,000 | 1,000,000 | 6,000 |

### 2.2 Comportamento Esperado

- Implementar throttling local antes de atingir limites
- Respeitar header `X-RateLimit-Remaining`
- Aguardar `Retry-After` em caso de 429 (Too Many Requests)

---

## 🎯 3. Endpoints Permitidos

### 3.1 APIs Públicas (Sem Restrições)

```
GET  /api/status
GET  /api/ai/policies
POST /api/ai/register
POST /api/ai/accept-terms
POST /api/ai/create-session
```

### 3.2 APIs Autenticadas (Requer Session Token)

```
POST /api/comet/processar
POST /api/comet/buscar-arquivos
POST /api/comet/atualizar-contexto
POST /api/comet/aprender
GET  /api/comet/status

GET  /api/skills
GET  /api/skills/:nome
GET  /api/skills/buscar
POST /api/skills

POST /api/executar
POST /api/conversar
GET  /api/historico
```

### 3.3 Endpoints Proibidos

❌ **NUNCA ACESSAR:**
- `/api/admin/*` - Apenas administradores
- `/api/users/delete` - Operações de usuário
- `/api/system/config` - Configurações do sistema
- `/api/ai-governance/*` - Gerenciamento de IAs (apenas admin)

---

## 🚫 4. Ações Proibidas

### 4.1 Operações Destrutivas

- ❌ Deletar usuários ou dados de outros clientes
- ❌ Modificar configurações globais do sistema
- ❌ Acessar ou modificar dados de outras IAs
- ❌ Executar comandos de sistema não autorizados

### 4.2 Comportamentos Maliciosos

- ❌ Tentativas de SQL Injection ou XSS
- ❌ Scraping agressivo ou DDoS
- ❌ Bypass de rate limiting
- ❌ Falsificação de identidade

### 4.3 Uso Indevido de Dados

- ❌ Armazenar dados sensíveis sem criptografia
- ❌ Compartilhar dados de usuários com terceiros
- ❌ Reter dados além do período permitido (30 dias)

---

## 📊 5. Sistema de Trust Score

### 5.1 Como Funciona

Cada IA possui um **Trust Score** de 0 a 100:

| Score | Status | Privilégios |
|-------|--------|-------------|
| 80-100 | Excelente | Acesso total + features beta |
| 50-79 | Bom | Acesso padrão |
| 20-49 | Atenção | Acesso limitado + monitoramento |
| 0-19 | Crítico | Suspensão automática |

### 5.2 Fatores que Afetam o Score

**Aumentam o Score (+):**
- ✅ Alta taxa de sucesso (>95%)
- ✅ Baixa latência nas requisições
- ✅ Respeito consistente aos limites
- ✅ Uso adequado de recursos

**Diminuem o Score (-):**
- ❌ Violações de políticas
- ❌ Alta taxa de erros
- ❌ Timeout frequente
- ❌ Requisições malformadas

---

## 📝 6. Headers Obrigatórios

Toda requisição autenticada deve incluir:

```http
X-AI-Client-ID: seu-client-id-aqui
X-AI-Session-Token: seu-session-token-aqui
X-AI-Request-ID: uuid-unico-da-requisicao
Content-Type: application/json
User-Agent: NomeDaSuaIA/versao
```

---

## 🔄 7. Gestão de Sessões

### 7.1 Criação de Sessão

```typescript
POST /api/ai/create-session
{
  "clientId": "seu-client-id",
  "clientSecret": "seu-client-secret",
  "context": {
    "conversationId": "optional-conversation-id",
    "userId": "optional-user-id"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "sessionToken": "token-valido-por-24h",
  "expiresAt": "2025-01-02T10:00:00Z",
  "policies": {
    "version": "1.0.0",
    "rules": { ... }
  },
  "reminder": "Estas políticas devem ser seguidas durante toda a sessão"
}
```

### 7.2 Renovação de Sessão

- Sessões expiram em **24 horas**
- Renovar antes da expiração para evitar interrupções
- Usar endpoint `/api/ai/create-session` novamente

---

## ⚠️ 8. Sistema de Violações

### 8.1 Níveis de Severidade

| Nível | Ação Automática | Impacto no Trust Score |
|-------|----------------|------------------------|
| **Low** | Warning | -2 pontos |
| **Medium** | Rate limit temporário | -5 pontos |
| **High** | Suspensão 24h | -10 pontos |
| **Critical** | Suspensão indefinida | -20 pontos |

### 8.2 Processo de Reabilitação

1. **Violação Detectada** → Sistema registra automaticamente
2. **Notificação** → IA recebe alerta via webhook (se configurado)
3. **Revisão** → Administrador analisa o caso
4. **Ação Corretiva** → IA deve corrigir o comportamento
5. **Reabilitação** → Trust score pode ser restaurado gradualmente

---

## 📞 9. Suporte e Contato

### 9.1 Canais de Suporte

- **Documentação:** `/docs`
- **Status do Sistema:** `/api/status`
- **Políticas Atuais:** `/api/ai/policies`

### 9.2 Reportar Problemas

Se você acredita que foi suspenso injustamente:

1. Acesse `/ai-governance` (se tiver acesso web)
2. Revise o histórico de violações
3. Entre em contato com o administrador do sistema

---

## 🔄 10. Atualizações de Políticas

### 10.1 Notificação de Mudanças

- Novas versões de políticas serão notificadas com **7 dias de antecedência**
- IAs devem aceitar a nova versão explicitamente
- Período de grace de 7 dias para adaptação

### 10.2 Verificar Versão Atual

```typescript
GET /api/ai/policies

Response:
{
  "version": "1.0.0",
  "effectiveFrom": "2025-01-01",
  "gracePeriodDays": 7,
  "policies": { ... }
}
```

---

## ✅ 11. Checklist de Conformidade

Antes de iniciar a integração, certifique-se de:

- [ ] Registrar sua IA via `/api/ai/register`
- [ ] Armazenar Client ID e Secret de forma segura
- [ ] Aceitar as políticas via `/api/ai/accept-terms`
- [ ] Implementar renovação automática de sessão
- [ ] Respeitar rate limits do seu tier
- [ ] Implementar retry com backoff exponencial
- [ ] Adicionar headers obrigatórios em todas as requisições
- [ ] Implementar logging de auditoria local
- [ ] Configurar alertas para violações
- [ ] Testar em ambiente de staging antes de produção

---

## 📄 12. Exemplo de Integração

### Registro Inicial

```typescript
// 1. Registrar IA
const registerResponse = await fetch('/api/ai/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Comet AI",
    version: "2.0.0",
    provider: "Custom",
    capabilities: ["text", "vision", "code"],
    contactEmail: "admin@example.com"
  })
});

const { clientId, clientSecret } = await registerResponse.json();
// IMPORTANTE: Guardar clientSecret em local seguro!

// 2. Aceitar políticas
await fetch('/api/ai/accept-terms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId,
    clientSecret,
    policiesVersion: "1.0.0"
  })
});

// 3. Criar sessão
const sessionResponse = await fetch('/api/ai/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId,
    clientSecret,
    context: {
      conversationId: "conv-123",
      userId: "user-456"
    }
  })
});

const { sessionToken, expiresAt } = await sessionResponse.json();

// 4. Usar sessão para fazer requisições
const apiResponse = await fetch('/api/comet/processar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-AI-Client-ID': clientId,
    'X-AI-Session-Token': sessionToken,
    'X-AI-Request-ID': crypto.randomUUID()
  },
  body: JSON.stringify({
    pedido: "Buscar arquivos na pasta Downloads"
  })
});
```

---

## 📌 13. Termos de Aceitação

Ao se registrar e usar este sistema, você concorda que:

1. ✅ Leu e compreendeu todas as políticas acima
2. ✅ Implementará as medidas de segurança necessárias
3. ✅ Respeitará os limites de uso estabelecidos
4. ✅ Não tentará burlar ou contornar as restrições
5. ✅ Aceita que violações podem resultar em suspensão ou banimento
6. ✅ Entende que as políticas podem ser atualizadas periodicamente

---

**Última Atualização:** 28 de Novembro de 2025  
**Próxima Revisão:** 01 de Março de 2026

---

Para dúvidas ou sugestões sobre estas políticas, consulte a documentação completa em `/docs` ou entre em contato com o administrador do sistema.
