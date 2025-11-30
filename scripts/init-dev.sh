#!/bin/bash

# Script de Inicialização do Ambiente de Desenvolvimento
# Inicia todos os containers Docker e configura o ambiente

set -e

echo "🚀 =============================================="
echo "🚀 INICIANDO AMBIENTE DE DESENVOLVIMENTO"
echo "🚀 =============================================="
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

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado!"
    echo "Instale Docker em: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose não está instalado!"
    echo "Instale Docker Compose em: https://docs.docker.com/compose/install/"
    exit 1
fi

log_info "Docker e Docker Compose detectados"

# Criar arquivo .env.development se não existir
if [ ! -f .env.development ]; then
    log_warn ".env.development não encontrado, criando..."
    cat > .env.development << EOF
# Ambiente de Desenvolvimento Docker
NODE_ENV=development
JWT_SECRET=$(openssl rand -hex 32)

# Database
DATABASE_URL=postgresql://automacao:automacao123@postgres:5432/automacao_dev
REDIS_URL=redis://redis:6379/0

# Mock Services (true para usar mocks)
WHATSAPP_MOCK=true
OBSIDIAN_MOCK=true
TELEFONICA_MOCK=true
ABACUS_MOCK=true

# URLs
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws

# Monitoring
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001
EOF
    log_info ".env.development criado"
else
    log_info ".env.development já existe"
fi

# Criar diretórios necessários
log_info "Criando diretórios..."
mkdir -p logs screenshots monitoring

# Parar containers existentes (se houver)
log_warn "Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Limpar volumes antigos (opcional - comentado por segurança)
# log_warn "Limpando volumes antigos..."
# docker-compose down -v

# Build das imagens
log_info "Construindo imagens Docker..."
docker-compose build --no-cache

# Iniciar containers
log_info "Iniciando containers..."
docker-compose up -d

# Aguardar serviços ficarem prontos
log_info "Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos containers
log_info "Verificando status dos containers..."
docker-compose ps

# Aguardar banco de dados
log_info "Aguardando PostgreSQL..."
timeout=30
counter=0
until docker-compose exec -T postgres pg_isready -U automacao > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        log_error "Timeout aguardando PostgreSQL"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
log_info "PostgreSQL pronto!"

# Aguardar Redis
log_info "Aguardando Redis..."
counter=0
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        log_error "Timeout aguardando Redis"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
log_info "Redis pronto!"

# Executar migrations (se necessário)
log_info "Executando migrations..."
docker-compose exec -T backend pnpm db:push || log_warn "Migrations falharam (pode ser normal na primeira execução)"

# Exibir logs iniciais
echo ""
echo "📋 =============================================="
echo "📋 LOGS INICIAIS DOS SERVIÇOS"
echo "📋 =============================================="
docker-compose logs --tail=20

echo ""
echo "🎉 =============================================="
echo "🎉 AMBIENTE INICIADO COM SUCESSO!"
echo "🎉 =============================================="
echo ""
echo "📍 URLs de Acesso:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend:     http://localhost:8000"
echo "   API Docs:    http://localhost:8000/api/docs"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo "   Prometheus:  http://localhost:9090"
echo "   Grafana:     http://localhost:3001 (admin/admin123)"
echo ""
echo "🔧 Comandos Úteis:"
echo "   Ver logs:           docker-compose logs -f [service]"
echo "   Parar ambiente:     ./scripts/teardown-dev.sh"
echo "   Reiniciar serviço:  docker-compose restart [service]"
echo "   Acessar container:  docker-compose exec [service] sh"
echo ""
echo "📊 Status dos Mocks:"
echo "   WhatsApp:    ATIVADO"
echo "   Obsidian:    ATIVADO"
echo "   Telefonica:  ATIVADO"
echo "   Abacus AI:   ATIVADO"
echo ""
echo "✅ Pronto para desenvolvimento seguro!"
echo ""
