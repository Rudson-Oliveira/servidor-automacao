#!/bin/bash

# Script de Inicialização para Produção
# Servidor de Automação - Sistema de Comunicação

echo "🚀 Iniciando Servidor de Automação..."

# 1. Configurar limites do sistema
echo "📊 Configurando limites do sistema..."
ulimit -n 65536
sudo sysctl -w fs.inotify.max_user_watches=1048576 2>/dev/null || echo "⚠️  Aviso: Não foi possível aumentar inotify (requer sudo)"
sudo sysctl -w fs.inotify.max_user_instances=512 2>/dev/null
sudo sysctl -w fs.file-max=2097152 2>/dev/null

# 2. Verificar variáveis de ambiente
echo "🔐 Verificando variáveis de ambiente..."
required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ ERRO: Variável $var não configurada"
    exit 1
  fi
done
echo "✅ Variáveis de ambiente OK"

# 3. Verificar conexões
echo "🔌 Verificando conexões..."
if ! nc -z localhost 6379 2>/dev/null; then
  echo "⚠️  Aviso: Redis não está rodando em localhost:6379"
fi

# 4. Limpar processos antigos
echo "🧹 Limpando processos antigos..."
pkill -f "tsx.*server/_core/index.ts" 2>/dev/null || true
pkill -f "node.*pnpm.*tsx" 2>/dev/null || true
sleep 2

# 5. Iniciar servidor
echo "▶️  Iniciando servidor..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" pnpm tsx server/_core/index.ts
