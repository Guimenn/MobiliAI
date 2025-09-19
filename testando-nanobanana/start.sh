#!/bin/bash

echo "🍌 Iniciando Nano Banana - Replicate API"
echo "========================================"

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "node public-server.js" 2>/dev/null || true

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Criar pasta uploads se não existir
mkdir -p uploads

echo "🚀 Iniciando servidores..."
echo "📁 Servidor de arquivos: http://localhost:8080"
echo "🌐 Interface web: http://localhost:3005"
echo ""
echo "💡 Para parar os servidores, pressione Ctrl+C"
echo ""

# Iniciar ambos os servidores
npm run start:all


