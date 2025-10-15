# 🍌 Guia HTTPie para Google Nano Banana

Este guia mostra como enviar requisições para o modelo Google Nano Banana usando HTTPie.

## 📋 Pré-requisitos

```bash
# Instalar HTTPie
pip install httpie

# Ou no Ubuntu/Debian
sudo apt install httpie
```

## 🚀 Exemplos de Requisições

### 1. Requisição Direta para Replicate API

```bash
# Configurar token
export REPLICATE_API_TOKEN="r8_seu_token_aqui"

# Enviar requisição
http POST https://api.replicate.com/v1/predictions \
  Authorization:"Token $REPLICATE_API_TOKEN" \
  version="google/nano-banana:latest" \
  input:='{"prompt": "troque a cor para vermelho", "image_input": ["https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp"], "output_format": "jpg"}'
```

### 2. Requisição para Servidor Local (Process URL)

```bash
# Processar com URL de imagem
http POST http://localhost:3005/api/process-url \
  prompt="troque a cor para vermelho" \
  imageUrl="https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp" \
  outputFormat="jpg"
```

**Resposta esperada:**
```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/...",
  "localFile": "processed-image-1234567890.jpg",
  "message": "Imagem processada com sucesso!"
}
```

### 3. Requisição com Upload de Arquivo

```bash
# Processar com upload de arquivo local
http --form POST http://localhost:3005/api/process-upload \
  prompt="adicione um sofá vermelho no centro" \
  outputFormat="jpg" \
  image@/caminho/para/sua/imagem.jpg
```

**Resposta esperada:**
```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/...",
  "localFile": "processed-image-1234567890.jpg",
  "message": "Imagem processada com sucesso!"
}
```

## 🎨 Exemplos de Prompts

### Troca de Cores
```bash
# Vermelho
http POST http://localhost:3005/api/process-url \
  prompt="troque a cor da parede para vermelho vibrante" \
  imageUrl="https://example.com/sala.jpg"

# Azul claro
http POST http://localhost:3005/api/process-url \
  prompt="pinte a parede de azul claro suave" \
  imageUrl="https://example.com/sala.jpg"

# Cinza moderno
http POST http://localhost:3005/api/process-url \
  prompt="transforme a parede em cinza moderno elegante" \
  imageUrl="https://example.com/sala.jpg"
```

### Adicionar Móveis
```bash
# Sofá
http POST http://localhost:3005/api/process-url \
  prompt="adicione um sofá moderno cinza no centro da sala" \
  imageUrl="https://example.com/sala-vazia.jpg"

# Mesa de centro
http POST http://localhost:3005/api/process-url \
  prompt="coloque uma mesa de centro de madeira clara" \
  imageUrl="https://example.com/sala.jpg"

# Planta decorativa
http POST http://localhost:3005/api/process-url \
  prompt="adicione uma planta grande no canto direito" \
  imageUrl="https://example.com/sala.jpg"
```

### Mudança de Estilo
```bash
# Moderno
http POST http://localhost:3005/api/process-url \
  prompt="transforme em estilo moderno minimalista" \
  imageUrl="https://example.com/sala.jpg"

# Rústico
http POST http://localhost:3005/api/process-url \
  prompt="converta para estilo rústico aconchegante" \
  imageUrl="https://example.com/sala.jpg"

# Industrial
http POST http://localhost:3005/api/process-url \
  prompt="dê um ar industrial com tijolos aparentes" \
  imageUrl="https://example.com/sala.jpg"
```

## 🔧 Opções Avançadas do HTTPie

### 1. Com Headers Personalizados
```bash
http POST http://localhost:3005/api/process-url \
  Authorization:"Bearer seu-token" \
  Content-Type:"application/json" \
  prompt="troque a cor" \
  imageUrl="https://example.com/image.jpg"
```

### 2. Salvando Resposta em Arquivo
```bash
http POST http://localhost:3005/api/process-url \
  prompt="troque a cor para azul" \
  imageUrl="https://example.com/sala.jpg" \
  > resposta.json
```

### 3. Verbose Mode (Ver Detalhes)
```bash
http -v POST http://localhost:3005/api/process-url \
  prompt="troque a cor" \
  imageUrl="https://example.com/image.jpg"
```

### 4. Download da Imagem Processada
```bash
# Primeiro, obter a URL
RESULT=$(http POST http://localhost:3005/api/process-url \
  prompt="troque a cor para verde" \
  imageUrl="https://example.com/sala.jpg")

# Extrair URL e baixar
IMAGE_URL=$(echo $RESULT | jq -r '.imageUrl')
http GET $IMAGE_URL > imagem-processada.jpg
```

## 📊 Formato dos Dados

### Input JSON Completo
```json
{
  "prompt": "troque a cor da parede para azul claro",
  "imageUrl": "https://example.com/sala.jpg",
  "outputFormat": "jpg"
}
```

### Output JSON (Sucesso)
```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/pbxt/...",
  "localFile": "processed-image-1234567890.jpg",
  "message": "Imagem processada com sucesso!"
}
```

### Output JSON (Erro)
```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

## 🧪 Testando a API

### 1. Verificar se servidor está rodando
```bash
http GET http://localhost:3005/
```

### 2. Teste rápido com URL pública
```bash
http POST http://localhost:3005/api/process-url \
  prompt="adicione uma cadeira" \
  imageUrl="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"
```

### 3. Teste com arquivo local
```bash
# Criar diretório de teste
mkdir -p /tmp/test-images

# Baixar imagem de exemplo
http GET https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800 > /tmp/test-images/sala.jpg

# Processar
http --form POST http://localhost:3005/api/process-upload \
  prompt="pinte de azul" \
  image@/tmp/test-images/sala.jpg
```

## 🎯 Comandos Úteis

### Matar processo na porta 3005
```bash
lsof -ti:3005 | xargs kill -9
```

### Verificar porta em uso
```bash
lsof -i:3005
```

### Ver logs do servidor
```bash
# Se usando npm
cd testando-nanobanana
npm run dev

# Ver em tempo real
tail -f nohup.out
```

## 📝 Exemplos Práticos

### Caso de Uso 1: Loja de Tintas
```bash
# Cliente quer ver parede em diferentes cores
http POST http://localhost:3005/api/process-url \
  prompt="pinte a parede de azul royal" \
  imageUrl="https://storage.cliente.com/sala-01.jpg"

http POST http://localhost:3005/api/process-url \
  prompt="pinte a parede de verde musgo" \
  imageUrl="https://storage.cliente.com/sala-01.jpg"

http POST http://localhost:3005/api/process-url \
  prompt="pinte a parede de cinza neutro" \
  imageUrl="https://storage.cliente.com/sala-01.jpg"
```

### Caso de Uso 2: Designer de Interiores
```bash
# Visualizar sala com diferentes móveis
http POST http://localhost:3005/api/process-url \
  prompt="adicione um sofá de couro marrom e uma mesa de centro de vidro" \
  imageUrl="https://example.com/sala-vazia.jpg"

http POST http://localhost:3005/api/process-url \
  prompt="coloque uma estante de madeira na parede e plantas decorativas" \
  imageUrl="https://example.com/sala-vazia.jpg"
```

### Caso de Uso 3: Reforma
```bash
# Antes e depois
http POST http://localhost:3005/api/process-url \
  prompt="modernize a sala com piso de madeira, parede branca e iluminação LED" \
  imageUrl="https://example.com/sala-antiga.jpg" \
  outputFormat="jpg"
```

## 🐛 Troubleshooting

### Erro: Connection refused
```bash
# Verificar se servidor está rodando
curl http://localhost:3005/

# Iniciar servidor
cd testando-nanobanana
npm run dev
```

### Erro: Invalid token
```bash
# Verificar token no config
cat testando-nanobanana/config.js

# Atualizar token
export REPLICATE_API_TOKEN="seu_novo_token"
```

### Erro: Image too large
```bash
# Redimensionar imagem antes de enviar
convert input.jpg -resize 1024x1024 output.jpg

# Ou usar URL de imagem menor
http POST http://localhost:3005/api/process-url \
  prompt="seu prompt" \
  imageUrl="https://example.com/imagem-pequena.jpg"
```

## 📚 Recursos Adicionais

- [Documentação HTTPie](https://httpie.io/docs)
- [Replicate API Docs](https://replicate.com/docs)
- [Google Nano Banana Model](https://replicate.com/google/nano-banana)

## 🎉 Comandos Rápidos

```bash
# Comando básico mais usado
http POST :3005/api/process-url prompt="troque cor para vermelho" imageUrl="URL_DA_IMAGEM"

# Com upload
http -f POST :3005/api/process-upload prompt="adicione móveis" image@imagem.jpg

# Ver resposta bonita
http POST :3005/api/process-url prompt="azul" imageUrl="URL" | jq
```
