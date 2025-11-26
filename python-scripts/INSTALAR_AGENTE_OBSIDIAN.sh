#!/bin/bash
# Instalador Automático do Agente Obsidian
# Compatível com Windows (Git Bash), Mac e Linux

echo "🚀 Instalador do Agente Obsidian - Controle Remoto"
echo "=================================================="
echo ""

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="Mac"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="Windows"
else
    OS="Unknown"
fi

echo "✅ Sistema detectado: $OS"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado!"
    echo "Por favor, instale Python 3.8+ de https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✅ Python encontrado: $PYTHON_VERSION"
echo ""

# Instalar dependências
echo "📦 Instalando dependências Python..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Instalação concluída!"
echo ""
echo "📖 Como usar:"
echo ""
echo "1. Obtenha seu token de autenticação no servidor web"
echo "2. Execute o agente:"
echo ""
echo "   python3 obsidian_agent.py \\"
echo "     --vault /caminho/para/seu/vault \\"
echo "     --server wss://SEU-SERVIDOR/ws/obsidian \\"
echo "     --token SEU_TOKEN_AQUI"
echo ""
echo "3. Acesse a interface web para controlar o Obsidian remotamente"
echo ""
echo "=================================================="
