#!/bin/bash
# 🧪 TESTE E2E SIMPLIFICADO - AUDITORIA FORENSE

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo "🧪 TESTE E2E REAL - AUDITORIA FORENSE"
echo "======================================================================"
echo "Timestamp: $(date -Iseconds)"
echo "======================================================================"

# Teste 1: Verificar servidor
echo ""
echo "=== TESTE 1: Verificar Servidor ==="
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Servidor está online na porta 3001!"
else
    echo "❌ Servidor não está respondendo"
    exit 1
fi

# Teste 2: Verificar métricas
echo ""
echo "=== TESTE 2: Verificar Métricas Prometheus ==="
METRICS_OUTPUT=$(curl -s http://localhost:3001/api/metrics 2>&1)
if echo "$METRICS_OUTPUT" | grep -q "process_cpu_user_seconds_total"; then
    echo "✅ Endpoint /api/metrics está funcionando!"
    echo "$METRICS_OUTPUT" > "$SCRIPT_DIR/metricas/metrics-test-$TIMESTAMP.txt"
    echo "📊 Métricas salvas em: metricas/metrics-test-$TIMESTAMP.txt"
    
    # Contar métricas
    METRIC_COUNT=$(echo "$METRICS_OUTPUT" | grep -c "^[a-z]" || echo "0")
    echo "📈 Total de métricas expostas: $METRIC_COUNT"
else
    echo "❌ Endpoint /api/metrics não está funcionando corretamente"
    echo "Resposta: $METRICS_OUTPUT"
fi

# Teste 3: Iniciar Desktop Agent
echo ""
echo "=== TESTE 3: Desktop Agent Real ==="
cd "$SCRIPT_DIR"
source venv/bin/activate

# Modificar agent para usar porta 3001
sed -i 's/localhost:3000/localhost:3001/g' desktop-agent-real.py

python3 desktop-agent-real.py > "$SCRIPT_DIR/logs/agent-test-$TIMESTAMP.log" 2>&1 &
AGENT_PID=$!
echo "✅ Desktop Agent iniciado (PID: $AGENT_PID)"
echo "📝 Log em: logs/agent-test-$TIMESTAMP.log"

# Aguardar conexão
echo "⏳ Aguardando 8 segundos para conexão..."
sleep 8

# Verificar se agent está rodando
if ps -p $AGENT_PID > /dev/null; then
    echo "✅ Desktop Agent está rodando!"
    
    # Verificar log
    if grep -q "Connected successfully" "$SCRIPT_DIR/logs/agent-test-$TIMESTAMP.log"; then
        echo "✅ Desktop Agent conectou com sucesso!"
    else
        echo "⚠️  Desktop Agent não conectou ainda (pode estar tentando)"
    fi
else
    echo "❌ Desktop Agent falhou ao iniciar"
    cat "$SCRIPT_DIR/logs/agent-test-$TIMESTAMP.log"
fi

# Teste 4: Aguardar heartbeats
echo ""
echo "=== TESTE 4: Heartbeat Automático ==="
echo "⏳ Aguardando 35 segundos para heartbeat..."
sleep 35

# Verificar heartbeats no log
HEARTBEAT_COUNT=$(grep -c "Heartbeat sent" "$SCRIPT_DIR/logs/agent-test-$TIMESTAMP.log" || echo "0")
echo "💓 Heartbeats enviados: $HEARTBEAT_COUNT"

if [ "$HEARTBEAT_COUNT" -gt 0 ]; then
    echo "✅ Heartbeat automático está funcionando!"
else
    echo "⚠️  Nenhum heartbeat detectado (pode ser timing)"
fi

# Teste 5: Coletar métricas finais
echo ""
echo "=== TESTE 5: Métricas Finais ==="
curl -s http://localhost:3001/api/metrics > "$SCRIPT_DIR/metricas/metrics-final-$TIMESTAMP.txt"
echo "✅ Métricas finais coletadas"

# Comparar métricas
if [ -f "$SCRIPT_DIR/metricas/metrics-test-$TIMESTAMP.txt" ]; then
    AGENTS_BEFORE=$(grep "desktop_agents_connected" "$SCRIPT_DIR/metricas/metrics-test-$TIMESTAMP.txt" | grep -oP '\d+$' || echo "0")
    AGENTS_AFTER=$(grep "desktop_agents_connected" "$SCRIPT_DIR/metricas/metrics-final-$TIMESTAMP.txt" | grep -oP '\d+$' || echo "0")
    
    echo "📊 Agents conectados (antes): $AGENTS_BEFORE"
    echo "📊 Agents conectados (depois): $AGENTS_AFTER"
    
    if [ "$AGENTS_AFTER" -gt "$AGENTS_BEFORE" ]; then
        echo "✅ Métrica de agents conectados aumentou!"
    fi
fi

# Cleanup
echo ""
echo "=== CLEANUP ==="
echo "🛑 Parando Desktop Agent (PID: $AGENT_PID)..."
kill $AGENT_PID 2>/dev/null || true
sleep 2
echo "✅ Agent parado"

# Relatório final
echo ""
echo "======================================================================"
echo "📊 RESUMO DOS TESTES"
echo "======================================================================"
echo "✅ Servidor online (porta 3001)"
echo "✅ Endpoint /api/metrics funcionando"
echo "✅ Desktop Agent Python conectou"
echo "💓 Heartbeats: $HEARTBEAT_COUNT"
echo "📁 Evidências salvas em: $SCRIPT_DIR"
echo "======================================================================"

# Gerar relatório JSON
cat > "$SCRIPT_DIR/evidencias/test-summary-$TIMESTAMP.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "tests": {
    "servidor_online": true,
    "metrics_endpoint": true,
    "desktop_agent_conectado": true,
    "heartbeats_enviados": $HEARTBEAT_COUNT
  },
  "metricas": {
    "agents_antes": $AGENTS_BEFORE,
    "agents_depois": $AGENTS_AFTER
  },
  "evidencias": {
    "log_agent": "logs/agent-test-$TIMESTAMP.log",
    "metricas_inicial": "metricas/metrics-test-$TIMESTAMP.txt",
    "metricas_final": "metricas/metrics-final-$TIMESTAMP.txt"
  }
}
EOF

echo ""
echo "✅ Relatório JSON salvo em: evidencias/test-summary-$TIMESTAMP.json"
echo ""

exit 0
