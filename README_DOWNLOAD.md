# 📦 PACOTE DE DOWNLOAD - SERVIDOR DE AUTOMAÇÃO

**Versão:** 1.0.0  
**Data:** 30 de Novembro de 2025  
**Ambiente:** Docker Local (Windows/macOS/Linux)

---

## 📋 CONTEÚDO DO PACOTE

Este pacote contém o ambiente Docker completo para executar o **Servidor de Automação** localmente no seu computador.

### Arquivos Incluídos

```
servidor-automacao/
├── 📄 README_DOWNLOAD.md          ← Você está aqui!
├── 🚀 INICIO_RAPIDO.md            ← Guia rápido (5 minutos)
├── 📖 INSTALACAO_LOCAL.md         ← Guia completo de instalação
├── ✅ CHECKLIST_VALIDACAO.md      ← Checklist de validação (55 itens)
├── 🔧 README-DEV.md               ← Guia de desenvolvimento
├── 📊 EVIDENCIAS_DOCKER.md        ← Evidências de funcionamento
├── 🐳 docker-compose.yml          ← Orquestração de containers
├── 📝 .env.development            ← Variáveis de ambiente
├── 🛠️ scripts/
│   ├── init-dev.sh                ← Script de inicialização
│   ├── teardown-dev.sh            ← Script de limpeza
│   └── ...
├── 🎨 client/                     ← Frontend (React + Vite)
├── ⚙️ server/                     ← Backend (Express + tRPC)
├── 🤖 desktop-agent/              ← Automação (Playwright)
├── 🗄️ drizzle/                    ← Schemas de banco de dados
└── 📦 package.json                ← Dependências do projeto
```

---

## 🎯 QUAL GUIA USAR?

### 🚀 **INICIO_RAPIDO.md** (Recomendado para experientes)
**Para quem:**
- ✅ Já tem Docker instalado
- ✅ Conhece comandos básicos de Docker
- ✅ Quer ambiente rodando em 5 minutos

**Conteúdo:**
- Comandos essenciais
- Validação rápida
- Troubleshooting básico

---

### 📖 **INSTALACAO_LOCAL.md** (Recomendado para iniciantes)
**Para quem:**
- ❓ Nunca instalou Docker
- ❓ Primeira vez usando Docker Compose
- ❓ Quer instruções passo a passo

**Conteúdo:**
- Instalação completa do Docker Desktop (Windows/macOS/Linux)
- Configuração detalhada
- Troubleshooting avançado
- Comandos úteis

---

### ✅ **CHECKLIST_VALIDACAO.md** (Para validar instalação)
**Para quem:**
- 🔍 Quer garantir que tudo está funcionando
- 🔍 Precisa validar cada serviço individualmente
- 🔍 Está tendo problemas e quer diagnosticar

**Conteúdo:**
- 55 itens de validação
- Testes de cada container
- Testes de integração
- Diagnóstico de problemas

---

### 🔧 **README-DEV.md** (Para desenvolvedores)
**Para quem:**
- 💻 Vai modificar o código
- 💻 Precisa entender a arquitetura
- 💻 Quer contribuir com o projeto

**Conteúdo:**
- Arquitetura completa
- Estrutura de código
- Guia de desenvolvimento
- Boas práticas

---

## 🚀 INÍCIO RÁPIDO (TL;DR)

```bash
# 1. Extrair arquivo
tar -xzf servidor-automacao_*.tar.gz
cd servidor-automacao

# 2. Iniciar ambiente
./scripts/init-dev.sh
# OU manualmente:
docker-compose up -d

# 3. Aguardar 60 segundos

# 4. Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

## 📊 SERVIÇOS INCLUÍDOS

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| **Frontend** | 3000 | Interface web (React + Vite) |
| **Backend** | 8000 | API REST + tRPC (Express) |
| **Desktop Agent** | - | Automação (Playwright) |
| **PostgreSQL** | 5432 | Banco de dados |
| **Redis** | 6379 | Cache e filas |
| **Prometheus** | 9090 | Monitoramento |
| **Grafana** | 3001 | Dashboards |

**Total:** 7 containers Docker

---

## 🔧 PRÉ-REQUISITOS MÍNIMOS

### Hardware
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Disco:** 20 GB livres

### Software
- **Docker Desktop:** 24.0+
- **Docker Compose:** v2.20+
- **Sistema Operacional:**
  - Windows 10/11 Pro, Enterprise ou Education (64-bit)
  - macOS 10.15+
  - Linux (Ubuntu 20.04+, Debian 10+)

---

## 📞 SUPORTE

### Problemas Comuns

**Docker não instalado:**
→ Leia: `INSTALACAO_LOCAL.md` → Seção "Instalação do Docker Desktop"

**Porta já em uso:**
→ Leia: `INSTALACAO_LOCAL.md` → Seção "Troubleshooting" → "Problema 2"

**Container não inicia:**
→ Leia: `INSTALACAO_LOCAL.md` → Seção "Troubleshooting" → "Problema 3"

**Falta de memória:**
→ Leia: `INSTALACAO_LOCAL.md` → Seção "Troubleshooting" → "Problema 5"

### Documentação Adicional

- **Guia completo:** `INSTALACAO_LOCAL.md`
- **Checklist:** `CHECKLIST_VALIDACAO.md`
- **Desenvolvimento:** `README-DEV.md`
- **Evidências:** `EVIDENCIAS_DOCKER.md`

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Escolha seu guia:**
   - Experiente? → `INICIO_RAPIDO.md`
   - Iniciante? → `INSTALACAO_LOCAL.md`

2. ✅ **Instale Docker Desktop** (se necessário)

3. ✅ **Execute o ambiente**

4. ✅ **Valide com checklist:** `CHECKLIST_VALIDACAO.md`

5. ✅ **Explore a interface:** http://localhost:3000

6. ✅ **Configure integrações:** Configurações → IAs

---

## 📝 INFORMAÇÕES TÉCNICAS

### Arquivo Compactado

```
Nome: servidor-automacao_20251130_071609.tar.gz
Tamanho: ~60 MB (sem node_modules)
Checksum MD5: a62796bc89642f03a5e7308517c5fe1c
```

### Estrutura de Containers

```yaml
services:
  frontend:      # React + Vite (porta 3000)
  backend:       # Express + tRPC (porta 8000)
  desktop-agent: # Playwright (headless)
  postgres:      # PostgreSQL 15 (porta 5432)
  redis:         # Redis 7 (porta 6379)
  prometheus:    # Prometheus (porta 9090)
  grafana:       # Grafana (porta 3001)
```

### Volumes Persistentes

- `postgres_data` - Dados do PostgreSQL
- `redis_data` - Dados do Redis
- `grafana_data` - Configurações do Grafana
- `prometheus_data` - Métricas do Prometheus

---

## ⚠️ AVISOS IMPORTANTES

### Ambiente de Desenvolvimento

Este ambiente é **apenas para desenvolvimento local**. Não use em produção!

### Senhas Padrão

**ATENÇÃO:** As senhas padrão estão no `.env.development`:
- PostgreSQL: `postgres123`
- Redis: `redis123`
- Grafana: `admin123`

**Mude as senhas antes de expor publicamente!**

### Portas Utilizadas

Certifique-se de que as portas abaixo estão livres:
- 3000 (Frontend)
- 3001 (Grafana)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 8000 (Backend)
- 9090 (Prometheus)

---

## 📄 LICENÇA

Este projeto é de uso interno para desenvolvimento e testes.

---

## ✨ PRONTO PARA COMEÇAR?

**Escolha seu guia e comece a instalação:**

1. 🚀 **Experiente?** → Abra `INICIO_RAPIDO.md`
2. 📖 **Iniciante?** → Abra `INSTALACAO_LOCAL.md`
3. ✅ **Validar?** → Abra `CHECKLIST_VALIDACAO.md`

---

**Desenvolvido com ❤️ pela equipe Manus AI**

**Data de geração:** 30 de Novembro de 2025  
**Versão do pacote:** 1.0.0  
**Checksum:** a62796bc89642f03a5e7308517c5fe1c
