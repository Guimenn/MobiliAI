#!/bin/bash

# 🍌 EXEMPLO PRÁTICO - HTTPie com Google Nano Banana
# Copie e cole estes comandos no terminal

echo "🎨 Exemplos Práticos de HTTPie com Nano Banana"
echo "=============================================="
echo ""

# URL do servidor (ajuste se necessário)
SERVER="http://localhost:3005"

echo "📝 EXEMPLO 1: Trocar cor da parede para VERMELHO"
echo "Comando:"
echo "--------"
cat << 'CMD1'
http POST http://localhost:3005/api/process-url \
  prompt="troque a cor da parede para vermelho vibrante" \
  imageUrl="https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp" \
  outputFormat="jpg"
CMD1
echo ""
echo "----------------------------------------"
echo ""

echo "📝 EXEMPLO 2: Adicionar SOFÁ MODERNO"
echo "Comando:"
echo "--------"
cat << 'CMD2'
http POST http://localhost:3005/api/process-url \
  prompt="adicione um sofá moderno cinza de 3 lugares no centro da sala" \
  imageUrl="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800" \
  outputFormat="jpg"
CMD2
echo ""
echo "----------------------------------------"
echo ""

echo "📝 EXEMPLO 3: Upload de arquivo LOCAL"
echo "Comando:"
echo "--------"
cat << 'CMD3'
http --form POST http://localhost:3005/api/process-upload \
  prompt="modernize esta sala com cores neutras e móveis minimalistas" \
  outputFormat="jpg" \
  image@/caminho/para/sua/imagem.jpg
CMD3
echo ""
echo "----------------------------------------"
echo ""

echo "📝 EXEMPLO 4: Mudança COMPLETA de estilo"
echo "Comando:"
echo "--------"
cat << 'CMD4'
http POST http://localhost:3005/api/process-url \
  prompt="transforme em estilo escandinavo: paredes brancas, madeira clara, plantas grandes, minimalista e aconchegante" \
  imageUrl="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800" \
  outputFormat="jpg"
CMD4
echo ""
echo "----------------------------------------"
echo ""

echo "📝 EXEMPLO 5: Salvar resultado em ARQUIVO"
echo "Comando:"
echo "--------"
cat << 'CMD5'
http POST http://localhost:3005/api/process-url \
  prompt="pinte de azul claro suave" \
  imageUrl="URL_DA_IMAGEM" \
  outputFormat="jpg" > resultado.json

# Depois, extrair URL da imagem:
cat resultado.json | jq -r '.imageUrl'
CMD5
echo ""
echo "----------------------------------------"
echo ""

echo "💡 DICAS RÁPIDAS:"
echo ""
echo "1. Substitua 'URL_DA_IMAGEM' pela URL real da sua imagem"
echo "2. Use ':3005' em vez de 'http://localhost:3005' (HTTPie entende)"
echo "3. Adicione '| jq' no final para ver JSON formatado"
echo "4. Use '-v' para modo verbose: http -v POST ..."
echo ""
echo "🚀 Para testar agora:"
echo "Execute: ./test-httpie-nano-banana.sh"
echo ""
