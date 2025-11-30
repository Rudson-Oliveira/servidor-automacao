# 🚀 INÍCIO RÁPIDO - AMBIENTE DOCKER LOCAL

**Para quem tem pressa e já conhece Docker!**

---

## ⚡ INSTALAÇÃO EM 5 MINUTOS

### 1️⃣ PRÉ-REQUISITOS

```bash
# Validar Docker
docker --version && docker-compose --version
```

✅ **Esperado:** Docker 24.0+ e Docker Compose v2.20+

---

### 2️⃣ DOWNLOAD

**Baixe do sandbox:**
- Arquivo: `/home/ubuntu/downloads/servidor-automacao_20251130_071609.tar.gz`
- Checksum: `/home/ubuntu/downloads/servidor-automacao_20251130_071609.tar.gz.md5`

---

### 3️⃣ EXTRAÇÃO

```bash
# Navegar para pasta de projetos
cd ~/Projetos  # ou C:\Projetos no Windows

# Extrair
tar -xzf ~/Downloads/servidor-automacao_*.tar.gz

# Entrar no projeto
cd servidor-automacao
```

---

### 4️⃣ INICIALIZAÇÃO

```bash
# Método automático (Linux/macOS)
chmod +x scripts/init-dev.sh
./scripts/init-dev.sh

# Método manual (Windows ou se script falhar)
mkdir -p logs screenshots
docker-compose up -d
```

⏱️ **Aguarde 60 segundos** para inicialização completa.

---

### 5️⃣ VALIDAÇÃO

```bash
# Verificar containers
docker-compose ps

# Esperado: 7 containers com status "Up"
```

**Acessar serviços:**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:8000/api/status
- 📊 Grafana: http://localhost:3001 (admin / admin123)
- 📈 Prometheus: http://localhost:9090

---

## 🎯 COMANDOS ESSENCIAIS

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose stop

# Reiniciar
docker-compose restart

# Ver logs
docker-compose logs -f

# Parar e remover
docker-compose down

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔧 TROUBLESHOOTING RÁPIDO

### Porta em uso
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Container não inicia
```bash
docker-compose logs <nome-container>
docker-compose up -d --force-recreate <nome-container>
```

### Falta de memória
- Docker Desktop → Settings → Resources → Memory: **8 GB**

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Instalação detalhada:** `INSTALACAO_LOCAL.md`
- **Checklist de validação:** `CHECKLIST_VALIDACAO.md`
- **Guia de desenvolvimento:** `README-DEV.md`
- **Evidências Docker:** `EVIDENCIAS_DOCKER.md`

---

## ✅ PRONTO!

Ambiente rodando em **localhost:3000**

**Próximo passo:** Explorar a interface e configurar integrações! 🎉
