# 🐳 Ambiente de Desenvolvimento Docker

## 📋 Visão Geral

Este ambiente Docker completo simula **todo o sistema real** para testes seguros, sem risco de bloqueios ou uso de dados/APIs reais.

### ✨ Características

- **7 Containers Integrados**: Frontend, Backend, Desktop Agent, PostgreSQL, Redis, Prometheus, Grafana
- **Mock Services**: WhatsApp, Obsidian, Telefonica/Genspark, Abacus AI
- **Simulação Headless**: Desktop Agent com Xvfb e Chromium
- **Monitoramento Completo**: Prometheus + Grafana
- **Network Isolada**: Segurança e isolamento total
- **Hot Reload**: Desenvolvimento com atualização automática
- **Volumes Persistentes**: Dados preservados entre reinicializações

---

## 🚀 Início Rápido

### Pré-requisitos

- **Docker** 20.10+ ([Instalar](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ ([Instalar](https://docs.docker.com/compose/install/))
- **8GB RAM** disponível (mínimo)
- **10GB espaço em disco**

### Iniciar Ambiente

```bash
# 1. Navegar para o diretório do projeto
cd servidor-automacao

# 2. Executar script de inicialização
./scripts/init-dev.sh

# Aguardar ~2 minutos para todos os serviços iniciarem
```

### Parar Ambiente

```bash
# Parar containers (preserva dados)
./scripts/teardown-dev.sh

# Parar E remover volumes (limpa tudo)
./scripts/teardown-dev.sh --volumes
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/api/docs | - |
| **Grafana** | http://localhost:3001 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **PostgreSQL** | localhost:5432 | automacao / automacao123 |
| **Redis** | localhost:6379 | - |

---

## 📦 Containers

### 1. Frontend (React + Vite)
- **Porta**: 3000
- **Hot Reload**: Ativado
- **Código**: `client/`

### 2. Backend (FastAPI + WebSocket)
- **Porta**: 8000
- **API REST**: `/api/*`
- **WebSocket**: `/ws`
- **Código**: `server/`

### 3. Desktop Agent (Python + Xvfb)
- **Modo**: Headless
- **Display**: :99 (virtual)
- **Screenshots**: `screenshots/`
- **Código**: `desktop-agent/`

### 4. PostgreSQL
- **Porta**: 5432
- **Database**: automacao_dev
- **Volume**: Persistente

### 5. Redis
- **Porta**: 6379
- **Uso**: Cache e sessões
- **Volume**: Persistente

### 6. Prometheus
- **Porta**: 9090
- **Coleta**: Métricas de todos os serviços

### 7. Grafana
- **Porta**: 3001
- **Dashboards**: Pré-configurados

---

## 🎭 Mock Services

Todos os mocks estão **ATIVADOS por padrão** para testes seguros.

### WhatsApp Mock (`server/mocks/whatsapp-mock.ts`)

```typescript
import { whatsappMock } from './server/mocks';

// Enviar mensagem (simulado)
const result = await whatsappMock.sendMessage(
  '+5511999999999',
  'Mensagem de teste'
);

// result.mock === true (indica que é mock)
// result.messageId === 'MOCK_WA_1_...'
```

**Funcionalidades:**
- ✅ Validação de número brasileiro
- ✅ Delay de rede simulado (100-500ms)
- ✅ Taxa de falha configurável (5%)
- ✅ Histórico de mensagens enviadas

### Obsidian Mock (`server/mocks/obsidian-mock.ts`)

```typescript
import { obsidianMock } from './server/mocks';

// Criar/atualizar nota
await obsidianMock.createOrUpdateNote(
  'main-vault',
  'path/to/note.md',
  '# Conteúdo da nota'
);

// Buscar notas
const results = await obsidianMock.searchNotes('main-vault', 'query');

// Listar todas as notas
const notes = await obsidianMock.listNotes('main-vault');
```

**Funcionalidades:**
- ✅ Múltiplos vaults
- ✅ CRUD completo de notas
- ✅ Busca por conteúdo
- ✅ Persistência em memória

### Telefonica/Genspark Mock (`server/mocks/telefonica-mock.ts`)

```typescript
import { telefonicaMock } from './server/mocks';

// Gerar resposta de IA
const response = await telefonicaMock.generateResponse({
  prompt: 'Explique Docker',
  context: 'Contexto adicional',
  maxTokens: 500
});

// response.response === "Resposta gerada..."
// response.tokensUsed === 125
```

**Funcionalidades:**
- ✅ Respostas contextuais inteligentes
- ✅ Delay de processamento realista (500-2000ms)
- ✅ Contagem de tokens simulada
- ✅ Diferentes tipos de resposta (código, resumo, análise, etc.)

### Abacus AI Mock (`server/mocks/abacus-mock.ts`)

```typescript
import { abacusMock } from './server/mocks';

// Adicionar conhecimento
await abacusMock.addKnowledge(
  'Título',
  'Conteúdo detalhado',
  'Categoria',
  ['tag1', 'tag2']
);

// Buscar conhecimento
const results = await abacusMock.searchKnowledge('docker', 'DevOps');

// Organizar por categoria
const organized = await abacusMock.organizeByCategory();
```

**Funcionalidades:**
- ✅ Base de conhecimento em memória
- ✅ Busca por texto e tags
- ✅ Organização por categorias
- ✅ Dados de exemplo pré-carregados

---

## 🔧 Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Reiniciar um serviço
docker-compose restart frontend

# Parar um serviço
docker-compose stop desktop-agent

# Acessar shell de um container
docker-compose exec backend sh
docker-compose exec postgres psql -U automacao automacao_dev

# Ver status dos containers
docker-compose ps

# Ver uso de recursos
docker stats
```

### Database

```bash
# Acessar PostgreSQL
docker-compose exec postgres psql -U automacao automacao_dev

# Executar migrations
docker-compose exec backend pnpm db:push

# Backup do banco
docker-compose exec postgres pg_dump -U automacao automacao_dev > backup.sql

# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U automacao automacao_dev
```

### Desenvolvimento

```bash
# Rebuild de um serviço específico
docker-compose build --no-cache frontend

# Rebuild completo
docker-compose build --no-cache

# Limpar tudo e reconstruir
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Monitoramento

### Prometheus (http://localhost:9090)

**Métricas disponíveis:**
- `http_requests_total` - Total de requisições HTTP
- `http_request_duration_seconds` - Duração das requisições
- `websocket_connections` - Conexões WebSocket ativas
- `desktop_agent_tasks_total` - Tarefas executadas pelo agent

**Queries úteis:**
```promql
# Taxa de requisições por segundo
rate(http_requests_total[5m])

# Latência P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Conexões WebSocket
websocket_connections
```

### Grafana (http://localhost:3001)

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `admin123`

**Dashboards pré-configurados:**
1. **System Overview** - Visão geral do sistema
2. **API Performance** - Performance das APIs
3. **Desktop Agent** - Atividade do agent
4. **Database** - Métricas do PostgreSQL

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs [service-name]

# Verificar health check
docker-compose ps

# Reiniciar serviço
docker-compose restart [service-name]
```

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Parar processo ou alterar porta no docker-compose.yml
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Resetar banco (CUIDADO: apaga dados)
docker-compose down -v
docker-compose up -d postgres
```

### Desktop Agent falha

```bash
# Verificar logs
docker-compose logs desktop-agent

# Verificar se Xvfb iniciou
docker-compose exec desktop-agent ps aux | grep Xvfb

# Reiniciar
docker-compose restart desktop-agent
```

### Sem espaço em disco

```bash
# Limpar imagens não utilizadas
docker image prune -a

# Limpar volumes órfãos
docker volume prune

# Ver uso de espaço
docker system df
```

---

## 🔐 Segurança

### Network Isolada

Todos os containers rodam em uma network privada (`172.25.0.0/16`), isolada da rede host.

### Mocks por Padrão

Todas as integrações externas usam **mocks por padrão**, garantindo:
- ✅ Sem risco de bloqueio de contas reais
- ✅ Sem consumo de APIs pagas
- ✅ Testes reproduzíveis
- ✅ Desenvolvimento offline

### Variáveis de Ambiente

Credenciais sensíveis estão em `.env.development` (não commitado no Git).

**Para produção, NUNCA use:**
- JWT_SECRET do .env.development
- Credenciais de desenvolvimento
- Mocks ativados

---

## 📝 Estrutura de Arquivos

```
servidor-automacao/
├── docker-compose.yml              # Orquestração
├── Dockerfile.frontend             # Build frontend
├── Dockerfile.backend              # Build backend
├── Dockerfile.desktop-agent        # Build desktop agent
├── .env.development                # Variáveis de ambiente
│
├── scripts/
│   ├── init-dev.sh                 # Inicializar ambiente
│   ├── teardown-dev.sh             # Limpar ambiente
│   ├── start-desktop-agent.sh      # Iniciar agent headless
│   └── init-db.sql                 # Setup PostgreSQL
│
├── server/
│   └── mocks/
│       ├── whatsapp-mock.ts        # Mock WhatsApp
│       ├── obsidian-mock.ts        # Mock Obsidian
│       ├── telefonica-mock.ts      # Mock Telefonica
│       ├── abacus-mock.ts          # Mock Abacus
│       └── index.ts                # Exports
│
├── monitoring/
│   ├── prometheus.yml              # Config Prometheus
│   └── grafana-datasources.yml     # Datasources Grafana
│
├── logs/                           # Logs dos serviços
├── screenshots/                    # Screenshots do agent
└── [volumes]                       # Dados persistentes
```

---

## 🎯 Casos de Uso

### 1. Testar Integração WhatsApp

```typescript
// No backend (server/routers.ts)
import { whatsappMock } from './mocks';

export const testRouter = router({
  sendWhatsApp: publicProcedure
    .input(z.object({ to: z.string(), message: z.string() }))
    .mutation(async ({ input }) => {
      const result = await whatsappMock.sendMessage(input.to, input.message);
      return result;
    }),
});
```

### 2. Simular Automação Desktop

```python
# No desktop-agent/agent.py
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('https://example.com')
    page.screenshot(path='/app/screenshots/test.png')
    browser.close()
```

### 3. Testar Obsidian Integration

```typescript
import { obsidianMock } from './mocks';

// Criar nota
await obsidianMock.createOrUpdateNote(
  'work-vault',
  'meetings/2024-11-30.md',
  '# Reunião\n\n- Ponto 1\n- Ponto 2'
);

// Buscar notas de reunião
const meetings = await obsidianMock.searchNotes('work-vault', 'reunião');
```

---

## 🚦 Workflow de Desenvolvimento

### 1. Iniciar Ambiente

```bash
./scripts/init-dev.sh
```

### 2. Desenvolver

- **Frontend**: Edite `client/src/*` → Hot reload automático
- **Backend**: Edite `server/*` → Reinicia automaticamente
- **Desktop Agent**: Edite `desktop-agent/*` → Reinicie container

### 3. Testar

- Acesse http://localhost:3000
- Teste APIs em http://localhost:8000/api/docs
- Monitore em http://localhost:3001 (Grafana)

### 4. Debugar

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Acessar container
docker-compose exec backend sh
```

### 5. Commit

```bash
# Parar ambiente (opcional)
./scripts/teardown-dev.sh

# Commit apenas código (não commitar .env.development)
git add .
git commit -m "feat: nova funcionalidade"
```

---

## ⚙️ Configuração Avançada

### Desativar Mocks (usar APIs reais)

Edite `.env.development`:

```bash
# Desativar mock do WhatsApp (usar API real)
WHATSAPP_MOCK=false
WHATSAPP_API_KEY=sua_chave_real

# Desativar mock do Obsidian (usar app real)
OBSIDIAN_MOCK=false
```

### Alterar Portas

Edite `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Usar porta 3001 em vez de 3000
```

### Adicionar Novo Mock

1. Criar `server/mocks/novo-servico-mock.ts`
2. Exportar em `server/mocks/index.ts`
3. Adicionar variável `NOVO_SERVICO_MOCK=true` em `.env.development`
4. Usar no código com `import { novoServicoMock } from './mocks'`

---

## 📚 Recursos Adicionais

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/

---

## 🆘 Suporte

### Problemas Comuns

1. **"Cannot connect to Docker daemon"**
   - Certifique-se de que Docker Desktop está rodando

2. **"Port already in use"**
   - Pare outros serviços usando as mesmas portas
   - Ou altere as portas no docker-compose.yml

3. **"Out of memory"**
   - Aumente RAM disponível para Docker
   - Ou pare alguns containers não essenciais

4. **"Build failed"**
   - Execute `docker-compose build --no-cache`
   - Verifique logs com `docker-compose logs`

### Logs Detalhados

```bash
# Todos os serviços
docker-compose logs -f --tail=100

# Serviço específico
docker-compose logs -f backend --tail=100

# Salvar logs em arquivo
docker-compose logs > logs.txt
```

---

## ✅ Checklist de Validação

Após iniciar o ambiente, verifique:

- [ ] Frontend acessível em http://localhost:3000
- [ ] Backend API em http://localhost:8000/api/status retorna `{"status": "ok"}`
- [ ] Grafana acessível em http://localhost:3001
- [ ] PostgreSQL aceita conexões (`docker-compose exec postgres pg_isready`)
- [ ] Redis responde (`docker-compose exec redis redis-cli ping`)
- [ ] Desktop Agent rodando (`docker-compose ps desktop-agent`)
- [ ] Logs sem erros críticos (`docker-compose logs`)

---

## 📄 Licença

Este ambiente de desenvolvimento é parte do projeto Servidor de Automação.

---

**Desenvolvido com ❤️ para testes seguros e desenvolvimento eficiente**
