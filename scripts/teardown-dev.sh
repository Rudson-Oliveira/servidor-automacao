#!/bin/bash

# Script de Limpeza do Ambiente de Desenvolvimento
# Para e remove todos os containers, networks e volumes

set -e

echo "🧹 =============================================="
echo "🧹 LIMPANDO AMBIENTE DE DESENVOLVIMENTO"
echo "🧹 =============================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se deve remover volumes
REMOVE_VOLUMES=false
if [ "$1" == "--volumes" ] || [ "$1" == "-v" ]; then
    REMOVE_VOLUMES=true
    log_warn "Modo de limpeza COMPLETA ativado (incluindo volumes)"
    echo "⚠️  ATENÇÃO: Todos os dados do banco de dados serão perdidos!"
    read -p "Deseja continuar? (s/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_info "Operação cancelada"
        exit 0
    fi
fi

# Parar containers
log_info "Parando containers..."
docker-compose down

# Remover volumes se solicitado
if [ "$REMOVE_VOLUMES" = true ]; then
    log_warn "Removendo volumes..."
    docker-compose down -v
    
    # Remover diretórios de dados locais
    log_warn "Limpando diretórios locais..."
    rm -rf logs/* screenshots/* 2>/dev/null || true
    log_info "Diretórios limpos"
fi

# Remover imagens órfãs (opcional)
log_info "Removendo imagens não utilizadas..."
docker image prune -f > /dev/null 2>&1 || true

# Verificar se ainda há containers rodando
RUNNING=$(docker-compose ps -q 2>/dev/null | wc -l)
if [ "$RUNNING" -gt 0 ]; then
    log_warn "Ainda há containers rodando"
    docker-compose ps
else
    log_info "Todos os containers foram parados"
fi

echo ""
echo "✅ =============================================="
echo "✅ LIMPEZA CONCLUÍDA"
echo "✅ =============================================="
echo ""

if [ "$REMOVE_VOLUMES" = true ]; then
    echo "🗑️  Volumes removidos: Todos os dados foram apagados"
else
    echo "💾 Volumes preservados: Dados do banco mantidos"
    echo "   Para limpeza completa, use: ./scripts/teardown-dev.sh --volumes"
fi

echo ""
echo "🔄 Para reiniciar o ambiente:"
echo "   ./scripts/init-dev.sh"
echo ""
