#!/bin/bash

# Script de Verificação Pré-Deploy para Render.com
# Sistema COMETA - Servidor de Automação

set -e

echo "🔍 VERIFICAÇÃO PRÉ-DEPLOY - SISTEMA COMETA"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de erros
ERRORS=0
WARNINGS=0

# Função para verificar sucesso
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        ((ERRORS++))
    fi
}

# Função para avisos
check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Verificando Node.js e pnpm..."
node --version > /dev/null 2>&1
check_success "Node.js instalado: $(node --version)"

pnpm --version > /dev/null 2>&1
check_success "pnpm instalado: $(pnpm --version)"

echo ""
echo "2. Verificando estrutura do projeto..."
[ -f "package.json" ]
check_success "package.json encontrado"

[ -f "tsconfig.json" ]
check_success "tsconfig.json encontrado"

[ -d "server" ]
check_success "Diretório server/ existe"

[ -d "client" ]
check_success "Diretório client/ existe"

[ -d "drizzle" ]
check_success "Diretório drizzle/ existe"

echo ""
echo "3. Verificando dependências..."
if [ -d "node_modules" ]; then
    check_success "node_modules/ existe"
else
    check_warning "node_modules/ não encontrado - executar pnpm install"
fi

echo ""
echo "4. Verificando arquivos de configuração..."
[ -f "render.yaml" ]
check_success "render.yaml criado"

[ -f "Dockerfile" ]
check_success "Dockerfile criado"

[ -f ".dockerignore" ]
check_success ".dockerignore criado"

echo ""
echo "5. Verificando variáveis de ambiente..."
[ -f "server/_core/env.ts" ]
check_success "Configuração de ENV encontrada"

echo ""
echo "6. Verificando scripts de build..."
grep -q '"build"' package.json
check_success "Script 'build' definido"

grep -q '"start"' package.json
check_success "Script 'start' definido"

grep -q '"dev"' package.json
check_success "Script 'dev' definido"

echo ""
echo "7. Verificando Git..."
git status > /dev/null 2>&1
check_success "Repositório Git inicializado"

BRANCH=$(git branch --show-current)
check_success "Branch atual: $BRANCH"

echo ""
echo "8. Verificando últimos commits..."
git log --oneline -3

echo ""
echo "=========================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=========================================="
echo -e "Erros críticos: ${RED}$ERRORS${NC}"
echo -e "Avisos: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA PRONTO PARA DEPLOY!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Commit e push das alterações"
    echo "2. Configurar variáveis de ambiente no Render.com"
    echo "3. Criar novo Web Service no Render.com"
    echo "4. Conectar ao repositório GitHub"
    echo "5. Deploy automático será iniciado"
    exit 0
else
    echo -e "${RED}❌ CORRIJA OS ERROS ANTES DE DEPLOYAR${NC}"
    exit 1
fi
