#!/bin/bash

echo "========================================"
echo "🤖 Instalador do Agente Local"
echo "========================================"
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado!"
    echo "📥 Instale Python3:"
    echo "   Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "   macOS: brew install python3"
    exit 1
fi

echo "✅ Python3 encontrado"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
python3 -m pip install --upgrade pip
python3 -m pip install websockets

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas"
echo ""

# Solicitar token
echo "🔑 Cole o token de autenticação:"
read -r TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token não pode estar vazio"
    exit 1
fi

# Criar arquivo de configuração
cat > config_agente.py << EOF
TOKEN = "$TOKEN"
SERVIDOR_URL = "ws://localhost:3000/ws/agente"
EOF

echo "✅ Token configurado"
echo ""

# Criar script de execução
cat > EXECUTAR_AGENTE.sh << 'EOF'
#!/bin/bash
python3 agente_local.py
EOF

chmod +x EXECUTAR_AGENTE.sh

echo "✅ Script de execução criado"
echo ""

# Perguntar se deseja iniciar com sistema
echo "🚀 Deseja iniciar o agente automaticamente com o sistema? (s/n)"
read -r AUTO_START

if [[ "$AUTO_START" =~ ^[Ss]$ ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - criar LaunchAgent
        PLIST_PATH="$HOME/Library/LaunchAgents/com.vercept.agente.plist"
        cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.vercept.agente</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(pwd)/EXECUTAR_AGENTE.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
        launchctl load "$PLIST_PATH"
        echo "✅ Agente configurado para iniciar com macOS"
    else
        # Linux - criar systemd service
        SERVICE_PATH="$HOME/.config/systemd/user/agente-vercept.service"
        mkdir -p "$HOME/.config/systemd/user"
        cat > "$SERVICE_PATH" << EOF
[Unit]
Description=Agente Local Vercept
After=network.target

[Service]
Type=simple
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/EXECUTAR_AGENTE.sh
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF
        systemctl --user daemon-reload
        systemctl --user enable agente-vercept.service
        systemctl --user start agente-vercept.service
        echo "✅ Agente configurado para iniciar com Linux"
    fi
fi

echo ""
echo "========================================"
echo "✅ Instalação concluída!"
echo "========================================"
echo ""
echo "Para executar o agente:"
echo "  1. Execute: ./EXECUTAR_AGENTE.sh"
echo "  2. Ou execute: python3 agente_local.py"
echo ""
echo "📚 Documentação: README_AGENTE.md"
echo ""
