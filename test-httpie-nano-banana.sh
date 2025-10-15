#!/bin/bash

# Script para testar Google Nano Banana com HTTPie
# Baseado no projeto testando-nanobanana

echo "🍌 Teste do Google Nano Banana com HTTPie"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URL do servidor
SERVER_URL="http://localhost:3005"

# Verificar se HTTPie está instalado
if ! command -v http &> /dev/null; then
    echo -e "${RED}❌ HTTPie não está instalado${NC}"
    echo "Instale com: pip install httpie ou sudo apt install httpie"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando se servidor está rodando...${NC}"
if curl -s "$SERVER_URL/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor está rodando${NC}"
else
    echo -e "${RED}❌ Servidor não está rodando${NC}"
    echo "Inicie o servidor com: cd testando-nanobanana && npm run dev"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Escolha um teste:${NC}"
echo "1. Teste com URL pública (troca de cor)"
echo "2. Teste com upload de arquivo"
echo "3. Teste com prompt customizado"
echo "4. Teste múltiplas cores"
echo "5. Ver exemplos de comandos"
echo ""
read -p "Escolha (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🚀 Teste 1: Processando com URL pública${NC}"
        echo -e "${YELLOW}Prompt: troque a cor da parede para vermelho${NC}"
        echo ""
        
        http POST $SERVER_URL/api/process-url \
          prompt="troque a cor da parede para vermelho vibrante" \
          imageUrl="https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp" \
          outputFormat="jpg"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}🚀 Teste 2: Upload de arquivo${NC}"
        read -p "Digite o caminho da imagem: " image_path
        
        if [ ! -f "$image_path" ]; then
            echo -e "${RED}❌ Arquivo não encontrado${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}Prompt: adicione um sofá moderno no centro${NC}"
        echo ""
        
        http --form POST $SERVER_URL/api/process-upload \
          prompt="adicione um sofá moderno cinza no centro da sala" \
          outputFormat="jpg" \
          image@"$image_path"
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}🚀 Teste 3: Prompt customizado${NC}"
        read -p "Digite seu prompt: " custom_prompt
        read -p "Digite a URL da imagem: " image_url
        
        echo ""
        echo -e "${YELLOW}Processando...${NC}"
        
        http POST $SERVER_URL/api/process-url \
          prompt="$custom_prompt" \
          imageUrl="$image_url" \
          outputFormat="jpg"
        ;;
        
    4)
        echo ""
        echo -e "${BLUE}🚀 Teste 4: Múltiplas cores${NC}"
        echo -e "${YELLOW}Testando 3 cores diferentes${NC}"
        echo ""
        
        IMAGE_URL="https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp"
        
        echo -e "${BLUE}1️⃣ Vermelho...${NC}"
        http POST $SERVER_URL/api/process-url \
          prompt="pinte a parede de vermelho" \
          imageUrl="$IMAGE_URL" \
          outputFormat="jpg" | jq -r '.localFile'
        
        echo ""
        echo -e "${BLUE}2️⃣ Azul...${NC}"
        http POST $SERVER_URL/api/process-url \
          prompt="pinte a parede de azul" \
          imageUrl="$IMAGE_URL" \
          outputFormat="jpg" | jq -r '.localFile'
        
        echo ""
        echo -e "${BLUE}3️⃣ Verde...${NC}"
        http POST $SERVER_URL/api/process-url \
          prompt="pinte a parede de verde" \
          imageUrl="$IMAGE_URL" \
          outputFormat="jpg" | jq -r '.localFile'
        ;;
        
    5)
        echo ""
        echo -e "${BLUE}📚 Exemplos de Comandos HTTPie${NC}"
        echo ""
        echo -e "${YELLOW}Básico (URL):${NC}"
        echo "http POST $SERVER_URL/api/process-url \\"
        echo "  prompt=\"troque a cor para azul\" \\"
        echo "  imageUrl=\"https://example.com/image.jpg\""
        echo ""
        echo -e "${YELLOW}Upload de arquivo:${NC}"
        echo "http --form POST $SERVER_URL/api/process-upload \\"
        echo "  prompt=\"adicione móveis\" \\"
        echo "  image@/caminho/para/imagem.jpg"
        echo ""
        echo -e "${YELLOW}Com verbose (ver detalhes):${NC}"
        echo "http -v POST $SERVER_URL/api/process-url \\"
        echo "  prompt=\"modernizar sala\" \\"
        echo "  imageUrl=\"https://example.com/sala.jpg\""
        echo ""
        echo -e "${YELLOW}Salvar resposta:${NC}"
        echo "http POST $SERVER_URL/api/process-url \\"
        echo "  prompt=\"trocar cor\" \\"
        echo "  imageUrl=\"https://example.com/image.jpg\" > resultado.json"
        echo ""
        echo -e "${YELLOW}Extrair e baixar imagem:${NC}"
        echo "IMAGE_URL=\$(http POST $SERVER_URL/api/process-url \\"
        echo "  prompt=\"azul\" imageUrl=\"URL\" | jq -r '.imageUrl')"
        echo "http GET \$IMAGE_URL > imagem.jpg"
        ;;
        
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Teste concluído!${NC}"
echo ""
echo -e "${BLUE}💡 Dicas:${NC}"
echo "- Imagens processadas são salvas na pasta do projeto"
echo "- Use 'http -v' para ver mais detalhes da requisição"
echo "- Combine com 'jq' para processar JSON: http POST ... | jq"
echo "- Ver documentação completa: cat HTTPIE_NANO_BANANA_GUIDE.md"

