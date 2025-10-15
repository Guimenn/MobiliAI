# 🍌 HTTPie + Google Nano Banana - Guia Rápido

## 🚀 Comando Mais Simples

```bash
http POST http://localhost:3005/api/process-url \
  prompt="troque a cor para vermelho" \
  imageUrl="https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp"
```

## 📋 Formato da Requisição

### Com URL de Imagem
```bash
http POST http://localhost:3005/api/process-url \
  prompt="TEXTO_DO_QUE_VOCÊ_QUER_FAZER" \
  imageUrl="URL_DA_SUA_IMAGEM" \
  outputFormat="jpg"
```

### Com Upload de Arquivo
```bash
http --form POST http://localhost:3005/api/process-upload \
  prompt="TEXTO_DO_QUE_VOCÊ_QUER_FAZER" \
  image@/caminho/para/arquivo.jpg
```

## 🎨 Exemplos Práticos

### 1. Trocar Cor da Parede
```bash
http POST :3005/api/process-url \
  prompt="pinte a parede de azul claro" \
  imageUrl="https://example.com/sala.jpg"
```

### 2. Adicionar Móveis
```bash
http POST :3005/api/process-url \
  prompt="adicione um sofá cinza moderno no centro" \
  imageUrl="https://example.com/sala-vazia.jpg"
```

### 3. Mudança Completa
```bash
http POST :3005/api/process-url \
  prompt="modernize: parede branca, piso de madeira, móveis minimalistas" \
  imageUrl="https://example.com/sala.jpg"
```

## 📊 Resposta Esperada

```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/pbxt/...",
  "localFile": "processed-image-1234567890.jpg",
  "message": "Imagem processada com sucesso!"
}
```

## 🛠️ Setup Inicial

### 1. Instalar HTTPie
```bash
pip install httpie
# ou
sudo apt install httpie
```

### 2. Iniciar Servidor
```bash
cd testando-nanobanana
npm run dev
```

### 3. Testar
```bash
./test-httpie-nano-banana.sh
```

## 📚 Arquivos de Referência

- `HTTPIE_NANO_BANANA_GUIDE.md` - Guia completo detalhado
- `httpie-quick-examples.txt` - Exemplos copy/paste
- `test-httpie-nano-banana.sh` - Script interativo de teste

## 🔗 Links Úteis

- [HTTPie Docs](https://httpie.io/docs)
- [Replicate API](https://replicate.com/docs)
- [Nano Banana Model](https://replicate.com/google/nano-banana)

## 💡 Dica Rápida

Para ver a resposta bonita, use `jq`:
```bash
http POST :3005/api/process-url prompt="azul" imageUrl="URL" | jq
```

---

**Pronto para começar?** Execute: `./test-httpie-nano-banana.sh`

