#!/bin/bash

# SISTEMA AUTÔNOMO VCM - INICIALIZAÇÃO
# Execute este script para iniciar o sistema em modo autônomo

echo "🚀 Iniciando Sistema Autônomo VCM..."
echo "======================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    cp package-autonomous.json package.json
    npm install
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Crie o arquivo .env com as variáveis necessárias"
    exit 1
fi

echo "🤖 Iniciando modo autônomo..."
echo "Pressione Ctrl+C para parar o sistema"

node autonomous_task_arbitrator.js
