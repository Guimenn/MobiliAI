#!/bin/bash

# 🛠️ TESTE - Criação de Produtos no Admin
# Verifica se a criação de produtos está funcionando corretamente

echo "🛠️ TESTE: Criação de Produtos no Admin"
echo "======================================"
echo ""

# URL do servidor
SERVER="http://localhost:3001"

echo "📝 PASSO 1: Login como Admin"
echo "Comando:"
echo "--------"
cat << 'LOGIN'
http POST http://localhost:3001/auth/login \
  email="admin@loja.com" \
  password="admin123"
LOGIN
echo ""

echo "💡 Copie o token da resposta e use nos próximos comandos"
echo ""
echo "----------------------------------------"
echo ""

echo "📝 PASSO 2: Criar Produto SEM Imagens"
echo "Comando:"
echo "--------"
cat << 'PRODUCT1'
http POST http://localhost:3001/admin/products \
  "Authorization:Bearer SEU_TOKEN_AQUI" \
  name="Sofá Moderno Teste" \
  description="Sofá de teste para verificar criação" \
  category="SOFA" \
  price:=1299.99 \
  costPrice:=800.00 \
  stock:=10 \
  minStock:=2 \
  colorName="Cinza" \
  brand="TestBrand" \
  style="MODERNO" \
  material="TECIDO" \
  width:=200 \
  height:=80 \
  depth:=90 \
  weight:=45.5 \
  storeId="STORE_ID_AQUI" \
  isFeatured:=true \
  isNew:=true \
  isAvailable:=true
PRODUCT1
echo ""
echo "----------------------------------------"
echo ""

echo "📝 PASSO 3: Criar Produto COM Imagens (usando curl)"
echo "Comando:"
echo "--------"
cat << 'PRODUCT2'
curl -X POST http://localhost:3001/admin/products \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "name=Mesa de Centro Teste" \
  -F "description=Mesa de teste com upload de imagem" \
  -F "category=MESA" \
  -F "price=599.99" \
  -F "costPrice=350.00" \
  -F "stock=5" \
  -F "minStock=1" \
  -F "colorName=Madeira Natural" \
  -F "brand=TestBrand" \
  -F "style=RUSTICO" \
  -F "material=MADEIRA" \
  -F "width=120" \
  -F "height=45" \
  -F "depth=60" \
  -F "weight=25.0" \
  -F "storeId=STORE_ID_AQUI" \
  -F "isFeatured=false" \
  -F "isNew=true" \
  -F "isAvailable=true" \
  -F "images=@/caminho/para/imagem1.jpg" \
  -F "images=@/caminho/para/imagem2.jpg"
PRODUCT2
echo ""
echo "----------------------------------------"
echo ""

echo "📝 PASSO 4: Listar Produtos Criados"
echo "Comando:"
echo "--------"
cat << 'LIST'
http GET http://localhost:3001/admin/products \
  "Authorization:Bearer SEU_TOKEN_AQUI" \
  page==1 \
  limit==10
LIST
echo ""
echo "----------------------------------------"
echo ""

echo "📝 PASSO 5: Verificar Lojas Disponíveis"
echo "Comando:"
echo "--------"
cat << 'STORES'
http GET http://localhost:3001/admin/stores \
  "Authorization:Bearer SEU_TOKEN_AQUI"
STORES
echo ""
echo "----------------------------------------"
echo ""

echo "💡 DICAS IMPORTANTES:"
echo ""
echo "1. Substitua 'SEU_TOKEN_AQUI' pelo token obtido no login"
echo "2. Substitua 'STORE_ID_AQUI' por um ID de loja válido"
echo "3. Para upload de imagens, use caminhos reais para arquivos"
echo "4. Verifique se o servidor está rodando na porta 3001"
echo "5. Verifique se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas"
echo ""
echo "🔍 VERIFICAÇÕES:"
echo ""
echo "- ✅ Produto criado sem erro"
echo "- ✅ Imagens enviadas para o bucket Supabase"
echo "- ✅ URLs das imagens retornadas na resposta"
echo "- ✅ Produto aparece na listagem"
echo ""