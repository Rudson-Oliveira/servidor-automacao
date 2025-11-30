#!/bin/bash

# Script de inicialização do Desktop Agent com Xvfb

echo "🚀 Iniciando Desktop Agent em modo headless..."

# Iniciar Xvfb (X Virtual Framebuffer)
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

echo "✅ Xvfb iniciado (PID: $XVFB_PID)"

# Aguardar Xvfb inicializar
sleep 2

# Verificar se Xvfb está rodando
if ps -p $XVFB_PID > /dev/null; then
    echo "✅ Display virtual :99 ativo"
else
    echo "❌ Erro ao iniciar Xvfb"
    exit 1
fi

# Instalar browsers do Playwright (apenas na primeira execução)
if [ ! -d "/root/.cache/ms-playwright" ]; then
    echo "📦 Instalando browsers do Playwright..."
    playwright install chromium
fi

# Iniciar Desktop Agent
echo "🤖 Iniciando Desktop Agent Python..."
cd /app/desktop-agent

# Executar agent principal
python3 agent.py

# Cleanup ao sair
trap "kill $XVFB_PID" EXIT
