# 🚀 GUIA DE INSTALAÇÃO LOCAL - AMBIENTE DOCKER

**Projeto:** Servidor de Automação - Sistema de Comunicação  
**Data:** 30 de Novembro de 2025  
**Versão:** 1.0.0

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do Docker Desktop](#instalação-do-docker-desktop)
3. [Download e Extração do Projeto](#download-e-extração-do-projeto)
4. [Configuração do Ambiente](#configuração-do-ambiente)
5. [Inicialização dos Serviços](#inicialização-dos-serviços)
6. [Validação e Testes](#validação-e-testes)
7. [Troubleshooting](#troubleshooting)
8. [Comandos Úteis](#comandos-úteis)

---

## 🔧 PRÉ-REQUISITOS

### Hardware Mínimo
- **CPU:** 4 cores (recomendado: 8 cores)
- **RAM:** 8 GB (recomendado: 16 GB)
- **Disco:** 20 GB livres (recomendado: 50 GB)
- **Sistema Operacional:**
  - Windows 10/11 Pro, Enterprise ou Education (64-bit)
  - macOS 10.15 ou superior
  - Linux (Ubuntu 20.04+, Debian 10+, CentOS 8+)

### Software Necessário
- ✅ Docker Desktop (versão 4.0+)
- ✅ Git (opcional, para versionamento)
- ✅ Editor de texto (VS Code recomendado)

---

## 🐳 INSTALAÇÃO DO DOCKER DESKTOP

### Windows 10/11

#### Passo 1: Habilitar WSL 2 (Windows Subsystem for Linux)

1. **Abra PowerShell como Administrador** e execute:
   ```powershell
   wsl --install
   ```

2. **Reinicie o computador** quando solicitado

3. **Verifique a instalação:**
   ```powershell
   wsl --list --verbose
   ```

#### Passo 2: Baixar Docker Desktop

1. Acesse: https://www.docker.com/products/docker-desktop/
2. Clique em **"Download for Windows"**
3. Execute o instalador `Docker Desktop Installer.exe`
4. Siga o assistente de instalação:
   - ✅ Marque: "Use WSL 2 instead of Hyper-V"
   - ✅ Marque: "Add shortcut to desktop"
5. Clique em **"Install"** e aguarde
6. Reinicie o computador quando solicitado

#### Passo 3: Configurar Docker Desktop

1. **Inicie o Docker Desktop** (ícone na área de trabalho)
2. **Aceite os termos** de serviço
3. **Configurações recomendadas:**
   - Vá em: **Settings → Resources → Advanced**
   - **CPUs:** 4 (ou mais)
   - **Memory:** 6 GB (ou mais)
   - **Disk image size:** 40 GB (ou mais)
4. Clique em **"Apply & Restart"**

#### Passo 4: Validar Instalação

Abra **PowerShell** ou **CMD** e execute:
```bash
docker --version
docker-compose --version
docker run hello-world
```

**Saída esperada:**
```
Docker version 24.0.0, build abc1234
Docker Compose version v2.20.0
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

### macOS

#### Passo 1: Baixar Docker Desktop

1. Acesse: https://www.docker.com/products/docker-desktop/
2. Clique em **"Download for Mac"**
3. Escolha a versão correta:
   - **Mac with Intel chip:** Docker Desktop for Mac (Intel)
   - **Mac with Apple silicon (M1/M2):** Docker Desktop for Mac (Apple Silicon)
4. Abra o arquivo `.dmg` baixado
5. Arraste o ícone do Docker para a pasta **Applications**

#### Passo 2: Iniciar Docker Desktop

1. Abra **Docker.app** da pasta Applications
2. Aceite os termos de serviço
3. Aguarde o Docker iniciar (ícone de baleia na barra superior)

#### Passo 3: Validar Instalação

Abra **Terminal** e execute:
```bash
docker --version
docker-compose --version
docker run hello-world
```

---

### Linux (Ubuntu/Debian)

#### Passo 1: Instalar Docker Engine

```bash
# Atualizar pacotes
sudo apt-get update

# Instalar dependências
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Adicionar chave GPG oficial do Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker (evita sudo)
sudo usermod -aG docker $USER

# Reiniciar sessão (logout/login) ou executar:
newgrp docker
```

#### Passo 2: Validar Instalação

```bash
docker --version
docker compose version
docker run hello-world
```

---

## 📦 DOWNLOAD E EXTRAÇÃO DO PROJETO

### Método 1: Download via Navegador (Recomendado)

1. **Acesse o File Manager do Sandbox**
2. **Navegue até:** `/home/ubuntu/downloads/`
3. **Baixe os arquivos:**
   - `servidor-automacao_YYYYMMDD_HHMMSS.tar.gz`
   - `servidor-automacao_YYYYMMDD_HHMMSS.tar.gz.md5`

4. **Salve em uma pasta local** (ex: `C:\Projetos\` no Windows ou `~/Projetos/` no Linux/Mac)

### Método 2: Download via Script (Alternativo)

Se você tem acesso SSH ao sandbox:

```bash
# No sandbox, execute:
cd /home/ubuntu/servidor-automacao
./DOWNLOAD_PROJETO.sh

# Depois, baixe o arquivo gerado em /home/ubuntu/downloads/
```

### Extração do Projeto

#### Windows (PowerShell):
```powershell
# Navegar para a pasta de downloads
cd C:\Users\SeuUsuario\Downloads

# Extrair arquivo
tar -xzf servidor-automacao_*.tar.gz

# Mover para pasta de projetos
Move-Item servidor-automacao C:\Projetos\
```

#### Linux/macOS (Terminal):
```bash
# Navegar para a pasta de downloads
cd ~/Downloads

# Verificar integridade (opcional)
md5sum -c servidor-automacao_*.tar.gz.md5

# Extrair arquivo
tar -xzf servidor-automacao_*.tar.gz

# Mover para pasta de projetos
mv servidor-automacao ~/Projetos/
```

---

## ⚙️ CONFIGURAÇÃO DO AMBIENTE

### Passo 1: Navegar para o Projeto

```bash
# Windows
cd C:\Projetos\servidor-automacao

# Linux/macOS
cd ~/Projetos/servidor-automacao
```

### Passo 2: Verificar Estrutura de Arquivos

```bash
ls -la
```

**Arquivos esperados:**
```
✅ docker-compose.yml
✅ Dockerfile.frontend
✅ Dockerfile.backend
✅ Dockerfile.desktop-agent
✅ .env.development
✅ scripts/init-dev.sh
✅ scripts/teardown-dev.sh
✅ README-DEV.md
```

### Passo 3: Revisar Variáveis de Ambiente (Opcional)

Abra o arquivo `.env.development` e ajuste se necessário:

```bash
# Windows
notepad .env.development

# Linux/macOS
nano .env.development
```

**Variáveis principais:**
```env
# Banco de Dados
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=automacao_dev

# Redis
REDIS_PASSWORD=redis123

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

---

## 🚀 INICIALIZAÇÃO DOS SERVIÇOS

### Método Automático (Recomendado)

#### Windows (PowerShell como Administrador):
```powershell
# Navegar para o projeto
cd C:\Projetos\servidor-automacao

# Executar script de inicialização
.\scripts\init-dev.sh
```

**Nota:** Se o script `.sh` não funcionar no Windows, use o método manual abaixo.

#### Linux/macOS:
```bash
# Navegar para o projeto
cd ~/Projetos/servidor-automacao

# Tornar script executável
chmod +x scripts/init-dev.sh

# Executar script
./scripts/init-dev.sh
```

### Método Manual (Alternativo)

Se o script automático falhar, execute manualmente:

```bash
# 1. Criar diretórios necessários
mkdir -p logs screenshots

# 2. Iniciar serviços Docker
docker-compose up -d

# 3. Aguardar inicialização (30-60 segundos)
docker-compose ps

# 4. Verificar logs
docker-compose logs -f
```

### O que o Script Faz

O script `init-dev.sh` executa automaticamente:

1. ✅ Valida se Docker está instalado
2. ✅ Valida se Docker Compose está disponível
3. ✅ Cria diretórios necessários (`logs/`, `screenshots/`)
4. ✅ Carrega variáveis do `.env.development`
5. ✅ Inicializa banco de dados PostgreSQL
6. ✅ Inicia todos os containers Docker
7. ✅ Aguarda health checks de todos os serviços
8. ✅ Exibe URLs de acesso

---

## ✅ VALIDAÇÃO E TESTES

### Verificar Status dos Containers

```bash
docker-compose ps
```

**Saída esperada:**
```
NAME                    STATUS              PORTS
frontend                Up 2 minutes        0.0.0.0:3000->3000/tcp
backend                 Up 2 minutes        0.0.0.0:8000->8000/tcp
desktop-agent           Up 2 minutes        
postgres                Up 2 minutes        0.0.0.0:5432->5432/tcp
redis                   Up 2 minutes        0.0.0.0:6379->6379/tcp
prometheus              Up 2 minutes        0.0.0.0:9090->9090/tcp
grafana                 Up 2 minutes        0.0.0.0:3001->3000/tcp
```

### Testar Acesso aos Serviços

Abra seu navegador e acesse:

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:8000/api/status | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | admin / admin123 |
| **PostgreSQL** | localhost:5432 | postgres / postgres123 |
| **Redis** | localhost:6379 | - / redis123 |

### Verificar Logs

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f desktop-agent
```

### Executar Testes

```bash
# Entrar no container do backend
docker-compose exec backend sh

# Executar testes
pnpm test

# Sair do container
exit
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: "Docker daemon is not running"

**Sintomas:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solução:**
1. Abra o Docker Desktop
2. Aguarde o ícone da baleia ficar verde
3. Execute novamente o comando

---

### Problema 2: Porta já em uso

**Sintomas:**
```
Error: bind: address already in use
```

**Solução:**

#### Windows:
```powershell
# Verificar o que está usando a porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID pelo número retornado)
taskkill /PID <PID> /F
```

#### Linux/macOS:
```bash
# Verificar o que está usando a porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>
```

**Alternativa:** Mudar a porta no `.env.development`:
```env
FRONTEND_PORT=3001
```

---

### Problema 3: Containers não iniciam

**Sintomas:**
```
ERROR: Container exited with code 1
```

**Solução:**
```bash
# Ver logs detalhados
docker-compose logs <nome-do-servico>

# Recriar containers
docker-compose down
docker-compose up -d --build
```

---

### Problema 4: Erro de permissão (Linux)

**Sintomas:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solução:**
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar
newgrp docker

# Testar
docker ps
```

---

### Problema 5: Falta de memória

**Sintomas:**
```
Container killed due to OOM (Out of Memory)
```

**Solução:**
1. Abra Docker Desktop
2. Vá em **Settings → Resources → Advanced**
3. Aumente **Memory** para pelo menos 6 GB
4. Clique em **Apply & Restart**

---

### Problema 6: Banco de dados não conecta

**Sintomas:**
```
Error: Connection refused to postgres:5432
```

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Ver logs do PostgreSQL
docker-compose logs postgres
```

---

## 📚 COMANDOS ÚTEIS

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes (CUIDADO: apaga dados)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart frontend

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
```

### Acesso aos Containers

```bash
# Entrar no container do frontend
docker-compose exec frontend sh

# Entrar no container do backend
docker-compose exec backend sh

# Entrar no container do PostgreSQL
docker-compose exec postgres psql -U postgres -d automacao_dev

# Entrar no container do Redis
docker-compose exec redis redis-cli -a redis123
```

### Limpeza e Manutenção

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover volumes não utilizados
docker volume prune

# Limpeza completa (CUIDADO!)
docker system prune -a --volumes
```

### Rebuild de Imagens

```bash
# Rebuild de todas as imagens
docker-compose build --no-cache

# Rebuild de uma imagem específica
docker-compose build --no-cache frontend

# Rebuild e reiniciar
docker-compose up -d --build
```

---

## 🎯 PRÓXIMOS PASSOS

Após a instalação bem-sucedida:

1. ✅ **Explore a interface:** http://localhost:3000
2. ✅ **Configure integrações:** Vá em Configurações → IAs
3. ✅ **Teste os mocks:** WhatsApp, Obsidian, Telefônica, Abacus
4. ✅ **Configure monitoramento:** Acesse Grafana e importe dashboards
5. ✅ **Leia a documentação:** `README-DEV.md` para detalhes técnicos

---

## 📞 SUPORTE

**Documentação adicional:**
- `README-DEV.md` - Guia completo de desenvolvimento
- `VALIDATION_REPORT.md` - Relatório de validação do ambiente
- `EVIDENCIAS_DOCKER.md` - Evidências de funcionamento

**Problemas não resolvidos?**
- Verifique os logs: `docker-compose logs -f`
- Consulte a seção de Troubleshooting acima
- Revise as configurações do `.env.development`

---

**✨ Ambiente Docker pronto para uso!**

Desenvolvido com ❤️ pela equipe Manus AI
