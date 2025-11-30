#!/bin/bash

###############################################################################
# SCRIPT DE DOWNLOAD DO PROJETO - SERVIDOR DE AUTOMAÇÃO
# 
# Este script compacta o projeto e prepara para download local
# Autor: Manus AI
# Data: 30 de Novembro de 2025
###############################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretórios
PROJECT_DIR="/home/ubuntu/servidor-automacao"
DOWNLOAD_DIR="/home/ubuntu/downloads"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="servidor-automacao_${TIMESTAMP}.tar.gz"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DOWNLOAD DO PROJETO - SERVIDOR DE AUTOMAÇÃO              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Criar diretório de downloads
echo -e "${YELLOW}[1/6]${NC} Criando diretório de downloads..."
mkdir -p "$DOWNLOAD_DIR"

# Navegar para o diretório do projeto
echo -e "${YELLOW}[2/6]${NC} Navegando para o projeto..."
cd "$PROJECT_DIR"

# Limpar arquivos temporários e dependências (reduzir tamanho)
echo -e "${YELLOW}[3/6]${NC} Limpando arquivos temporários..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf coverage 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true
rm -rf desktop-agent/venv 2>/dev/null || true
rm -rf desktop-agent/__pycache__ 2>/dev/null || true

# Criar lista de exclusões
echo -e "${YELLOW}[4/6]${NC} Preparando exclusões..."
cat > /tmp/exclude-list.txt << 'EOF'
node_modules
.git
.vscode
.idea
*.log
*.pid
.DS_Store
Thumbs.db
.env.local
.env.production
desktop-agent/venv
desktop-agent/__pycache__
desktop-agent/*.pyc
desktop-agent/config.json
logs/*
screenshots/*
!logs/.gitkeep
!screenshots/.gitkeep
EOF

# Compactar projeto
echo -e "${YELLOW}[5/6]${NC} Compactando projeto..."
echo -e "   ${BLUE}→${NC} Origem: $PROJECT_DIR"
echo -e "   ${BLUE}→${NC} Destino: $DOWNLOAD_DIR/$ARCHIVE_NAME"

cd /home/ubuntu
tar -czf "$DOWNLOAD_DIR/$ARCHIVE_NAME" \
    --exclude-from=/tmp/exclude-list.txt \
    servidor-automacao/

# Verificar tamanho do arquivo
FILE_SIZE=$(du -h "$DOWNLOAD_DIR/$ARCHIVE_NAME" | cut -f1)

echo -e "${YELLOW}[6/6]${NC} Gerando checksum MD5..."
cd "$DOWNLOAD_DIR"
md5sum "$ARCHIVE_NAME" > "${ARCHIVE_NAME}.md5"

# Limpar arquivo temporário
rm -f /tmp/exclude-list.txt

# Exibir resultado
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DOWNLOAD PREPARADO COM SUCESSO!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 ARQUIVO GERADO:${NC}"
echo -e "   Caminho: ${GREEN}$DOWNLOAD_DIR/$ARCHIVE_NAME${NC}"
echo -e "   Tamanho: ${GREEN}$FILE_SIZE${NC}"
echo ""
echo -e "${BLUE}🔐 CHECKSUM MD5:${NC}"
cat "${DOWNLOAD_DIR}/${ARCHIVE_NAME}.md5"
echo ""
echo -e "${BLUE}📋 PRÓXIMOS PASSOS:${NC}"
echo -e "   1. Baixe o arquivo: ${GREEN}$ARCHIVE_NAME${NC}"
echo -e "   2. Baixe o checksum: ${GREEN}${ARCHIVE_NAME}.md5${NC}"
echo -e "   3. Verifique integridade (opcional):"
echo -e "      ${YELLOW}md5sum -c ${ARCHIVE_NAME}.md5${NC}"
echo -e "   4. Extraia o arquivo:"
echo -e "      ${YELLOW}tar -xzf $ARCHIVE_NAME${NC}"
echo -e "   5. Siga as instruções em: ${GREEN}INSTALACAO_LOCAL.md${NC}"
echo ""
echo -e "${BLUE}🌐 DOWNLOAD VIA NAVEGADOR:${NC}"
echo -e "   Acesse a pasta de downloads no File Manager do sandbox"
echo -e "   ou use o comando abaixo para listar arquivos:"
echo -e "   ${YELLOW}ls -lh $DOWNLOAD_DIR${NC}"
echo ""
echo -e "${GREEN}✨ Pronto para download!${NC}"
