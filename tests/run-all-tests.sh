#!/bin/bash

# Script Master para Executar Todos os Testes de Validação
# Este script executa todos os testes em sequência e gera um relatório final

echo "🚀 INICIANDO BATERIA COMPLETA DE TESTES"
echo "========================================"
echo ""
echo "📍 Servidor: ${SERVER_URL:-https://servidor-automacao.onrender.com}"
echo "⏰ Data/Hora: $(date)"
echo ""
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=5
PASSED=0
FAILED=0
INCONCLUSIVE=0

# Função para executar teste
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 TESTE: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Executar teste
    npx tsx "$test_file"
    local exit_code=$?
    
    # Verificar resultado
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ PASSOU${NC}"
        ((PASSED++))
    elif [ $exit_code -eq 2 ]; then
        echo -e "${YELLOW}⚠️  INCONCLUSIVO${NC}"
        ((INCONCLUSIVE++))
    else
        echo -e "${RED}❌ FALHOU${NC}"
        ((FAILED++))
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Aguardar 2 segundos entre testes
    sleep 2
}

# Executar testes
run_test "1. Health Endpoint" "tests/test-health.ts"
run_test "2. Database Connection" "tests/test-database.ts"
run_test "3. Agent Registration" "tests/test-agent-registration.ts"
run_test "4. TensorFlow" "tests/test-tensorflow.ts"
run_test "5. Auto-Healing" "tests/test-auto-healing.ts"

# Relatório final
echo ""
echo "========================================"
echo "📊 RELATÓRIO FINAL"
echo "========================================"
echo ""
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passaram: $PASSED${NC}"
echo -e "${RED}❌ Falharam: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Inconclusivos: $INCONCLUSIVE${NC}"
echo ""

# Calcular taxa de sucesso
SUCCESS_RATE=$(echo "scale=2; ($PASSED / $TOTAL_TESTS) * 100" | bc)
echo "Taxa de sucesso: ${SUCCESS_RATE}%"
echo ""

# Determinar resultado geral
if [ $FAILED -eq 0 ] && [ $PASSED -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "✅ Sistema está funcionando perfeitamente!"
    echo ""
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  TESTES PASSARAM COM RESSALVAS${NC}"
    echo ""
    echo "Alguns testes foram inconclusivos, mas nenhum falhou."
    echo ""
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Por favor, revise os logs acima para identificar os problemas."
    echo ""
    exit 1
fi
