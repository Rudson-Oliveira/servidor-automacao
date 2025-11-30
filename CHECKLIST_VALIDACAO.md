# ✅ CHECKLIST DE VALIDAÇÃO - AMBIENTE DOCKER LOCAL

**Use este checklist para validar se o ambiente está funcionando corretamente.**

---

## 📋 PRÉ-INSTALAÇÃO

- [ ] **Docker Desktop instalado**
  ```bash
  docker --version
  # Esperado: Docker version 24.0.0 ou superior
  ```

- [ ] **Docker Compose disponível**
  ```bash
  docker-compose --version
  # Esperado: Docker Compose version v2.20.0 ou superior
  ```

- [ ] **Docker rodando**
  ```bash
  docker ps
  # Esperado: Lista de containers (pode estar vazia)
  ```

- [ ] **Memória suficiente alocada**
  - Docker Desktop → Settings → Resources → Memory: **6 GB ou mais**

- [ ] **Disco suficiente**
  - Espaço livre: **20 GB ou mais**

---

## 📦 DOWNLOAD E EXTRAÇÃO

- [ ] **Arquivo baixado**
  - Arquivo: `servidor-automacao_*.tar.gz`
  - Tamanho esperado: ~50-100 MB (sem node_modules)

- [ ] **Checksum validado (opcional)**
  ```bash
  md5sum -c servidor-automacao_*.tar.gz.md5
  # Esperado: servidor-automacao_*.tar.gz: OK
  ```

- [ ] **Arquivo extraído**
  ```bash
  tar -xzf servidor-automacao_*.tar.gz
  ```

- [ ] **Estrutura de arquivos presente**
  ```bash
  cd servidor-automacao
  ls -la
  # Esperado: docker-compose.yml, Dockerfiles, scripts/, etc
  ```

---

## ⚙️ CONFIGURAÇÃO

- [ ] **Arquivo .env.development presente**
  ```bash
  cat .env.development
  # Esperado: Variáveis de ambiente configuradas
  ```

- [ ] **Scripts executáveis (Linux/macOS)**
  ```bash
  chmod +x scripts/*.sh
  ```

- [ ] **Diretórios criados**
  ```bash
  mkdir -p logs screenshots
  ```

---

## 🚀 INICIALIZAÇÃO

- [ ] **Script de inicialização executado**
  ```bash
  ./scripts/init-dev.sh
  # OU manualmente:
  docker-compose up -d
  ```

- [ ] **Aguardar 60 segundos** (tempo de inicialização)

- [ ] **Verificar status dos containers**
  ```bash
  docker-compose ps
  # Esperado: 7 containers com status "Up"
  ```

---

## ✅ VALIDAÇÃO DE SERVIÇOS

### Frontend (React + Vite)

- [ ] **Container rodando**
  ```bash
  docker-compose ps frontend
  # Esperado: Up
  ```

- [ ] **Logs sem erros**
  ```bash
  docker-compose logs frontend | tail -20
  # Esperado: "VITE ready" ou "Local: http://localhost:3000"
  ```

- [ ] **Acesso via navegador**
  - URL: http://localhost:3000
  - Esperado: Interface web carregando

- [ ] **Hot reload funcionando**
  - Editar arquivo em `client/src/`
  - Esperado: Página recarrega automaticamente

---

### Backend (Express + tRPC)

- [ ] **Container rodando**
  ```bash
  docker-compose ps backend
  # Esperado: Up
  ```

- [ ] **Logs sem erros**
  ```bash
  docker-compose logs backend | tail -20
  # Esperado: "Server running on http://localhost:8000"
  ```

- [ ] **Acesso via navegador**
  - URL: http://localhost:8000/api/status
  - Esperado: JSON com status "ok"

- [ ] **Endpoint tRPC funcionando**
  - URL: http://localhost:8000/api/trpc
  - Esperado: Resposta JSON

---

### Desktop Agent (Playwright)

- [ ] **Container rodando**
  ```bash
  docker-compose ps desktop-agent
  # Esperado: Up
  ```

- [ ] **Xvfb iniciado (headless browser)**
  ```bash
  docker-compose logs desktop-agent | grep -i "xvfb"
  # Esperado: "Xvfb started"
  ```

- [ ] **Playwright instalado**
  ```bash
  docker-compose exec desktop-agent playwright --version
  # Esperado: Version 1.x.x
  ```

---

### PostgreSQL

- [ ] **Container rodando**
  ```bash
  docker-compose ps postgres
  # Esperado: Up
  ```

- [ ] **Porta acessível**
  ```bash
  nc -zv localhost 5432
  # Esperado: Connection succeeded
  ```

- [ ] **Conexão funcionando**
  ```bash
  docker-compose exec postgres psql -U postgres -d automacao_dev -c "SELECT 1;"
  # Esperado: 1
  ```

- [ ] **Tabelas criadas**
  ```bash
  docker-compose exec postgres psql -U postgres -d automacao_dev -c "\dt"
  # Esperado: Lista de tabelas
  ```

---

### Redis

- [ ] **Container rodando**
  ```bash
  docker-compose ps redis
  # Esperado: Up
  ```

- [ ] **Porta acessível**
  ```bash
  nc -zv localhost 6379
  # Esperado: Connection succeeded
  ```

- [ ] **Conexão funcionando**
  ```bash
  docker-compose exec redis redis-cli -a redis123 PING
  # Esperado: PONG
  ```

---

### Prometheus

- [ ] **Container rodando**
  ```bash
  docker-compose ps prometheus
  # Esperado: Up
  ```

- [ ] **Interface acessível**
  - URL: http://localhost:9090
  - Esperado: Interface do Prometheus

- [ ] **Targets configurados**
  - URL: http://localhost:9090/targets
  - Esperado: Lista de targets (backend, frontend, etc)

---

### Grafana

- [ ] **Container rodando**
  ```bash
  docker-compose ps grafana
  # Esperado: Up
  ```

- [ ] **Interface acessível**
  - URL: http://localhost:3001
  - Esperado: Tela de login do Grafana

- [ ] **Login funcionando**
  - Usuário: `admin`
  - Senha: `admin123`
  - Esperado: Dashboard do Grafana

- [ ] **Datasource Prometheus configurado**
  - Grafana → Configuration → Data Sources
  - Esperado: Prometheus listado

---

## 🧪 TESTES FUNCIONAIS

### Mocks

- [ ] **WhatsApp Mock**
  ```bash
  curl -X POST http://localhost:8000/api/mock/whatsapp/send \
    -H "Content-Type: application/json" \
    -d '{"to": "+5521999999999", "message": "Teste"}'
  # Esperado: JSON com sucesso
  ```

- [ ] **Obsidian Mock**
  ```bash
  curl http://localhost:8000/api/mock/obsidian/notes
  # Esperado: JSON com lista de notas
  ```

- [ ] **Telefônica Mock**
  ```bash
  curl -X POST http://localhost:8000/api/mock/telefonica/query \
    -H "Content-Type: application/json" \
    -d '{"query": "Olá"}'
  # Esperado: JSON com resposta
  ```

- [ ] **Abacus Mock**
  ```bash
  curl http://localhost:8000/api/mock/abacus/search?q=teste
  # Esperado: JSON com resultados
  ```

---

### Integração Frontend ↔ Backend

- [ ] **Frontend chama Backend**
  - Abrir: http://localhost:3000
  - Abrir DevTools (F12) → Network
  - Recarregar página
  - Esperado: Requisições para `localhost:8000/api/trpc` com status 200

- [ ] **WebSocket funcionando**
  - Abrir: http://localhost:3000
  - Abrir DevTools → Console
  - Esperado: Sem erros de WebSocket

---

### Persistência de Dados

- [ ] **Volume PostgreSQL persistente**
  ```bash
  # Criar dado
  docker-compose exec postgres psql -U postgres -d automacao_dev -c "CREATE TABLE teste (id INT);"
  
  # Reiniciar container
  docker-compose restart postgres
  
  # Verificar dado
  docker-compose exec postgres psql -U postgres -d automacao_dev -c "\dt teste"
  # Esperado: Tabela "teste" existe
  ```

- [ ] **Volume Redis persistente**
  ```bash
  # Criar dado
  docker-compose exec redis redis-cli -a redis123 SET teste "valor"
  
  # Reiniciar container
  docker-compose restart redis
  
  # Verificar dado
  docker-compose exec redis redis-cli -a redis123 GET teste
  # Esperado: "valor"
  ```

---

### Logs e Screenshots

- [ ] **Diretório logs/ populado**
  ```bash
  ls -la logs/
  # Esperado: Arquivos de log criados
  ```

- [ ] **Diretório screenshots/ acessível**
  ```bash
  ls -la screenshots/
  # Esperado: Diretório vazio ou com screenshots
  ```

---

## 🔧 TROUBLESHOOTING RÁPIDO

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs <nome-do-container>

# Recriar container
docker-compose up -d --force-recreate <nome-do-container>
```

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :<porta>
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :<porta>
kill -9 <PID>
```

### Falta de memória

```bash
# Ver uso de recursos
docker stats

# Aumentar memória no Docker Desktop
# Settings → Resources → Memory: 8 GB
```

### Rebuild completo

```bash
# Parar tudo
docker-compose down

# Rebuild sem cache
docker-compose build --no-cache

# Reiniciar
docker-compose up -d
```

---

## 📊 RESUMO DE VALIDAÇÃO

**Marque todos os itens acima antes de considerar o ambiente validado.**

### Contagem Rápida

- **Pré-instalação:** 5 itens
- **Download e Extração:** 4 itens
- **Configuração:** 3 itens
- **Inicialização:** 3 itens
- **Validação de Serviços:** 30 itens
- **Testes Funcionais:** 10 itens

**TOTAL:** 55 itens de validação

---

## ✅ CERTIFICAÇÃO

Após completar todos os itens:

```
✅ AMBIENTE DOCKER VALIDADO COM SUCESSO!

Data: ___/___/______
Validado por: _________________
Sistema Operacional: _________________
Versão Docker: _________________
```

---

**Próximo passo:** Começar a desenvolver! 🚀

Consulte `README-DEV.md` para guia completo de desenvolvimento.
