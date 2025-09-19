# 🍌 Nano Banana - Replicate API

Projeto simples em Node.js para usar a API do Replicate com o modelo GOOGLE-NANO-BANANA para processamento de imagens com prompts.

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

## 🔧 Configuração

O token da API do Replicate está configurado no arquivo `config.js`. Se necessário, você pode alterar o token diretamente no arquivo.

## 📖 Como usar

### Opção 1: Início rápido (recomendado)
```bash
./start.sh
```

### Opção 2: Iniciar manualmente
```bash
# Terminal 1 - Servidor de arquivos (porta 8080)
npm run files

# Terminal 2 - Servidor principal (porta 3005)
npm start
```

### Opção 3: Ambos os servidores juntos
```bash
npm run start:all
```

### Usar em seu próprio código:
```javascript
import { processImageWithPrompt } from './index.js';

const result = await processImageWithPrompt(
  "seu prompt aqui",
  "https://url-da-sua-imagem.com/imagem.jpg",
  "jpg" // formato de saída (opcional)
);

if (result.success) {
  console.log("Imagem processada:", result.imageUrl);
  console.log("Arquivo salvo:", result.localFile);
}
```

## 🎯 Funcionalidades

- ✅ Processamento de imagens com prompts usando GOOGLE-NANO-BANANA
- ✅ Upload de arquivos locais com URLs públicas automáticas
- ✅ Múltiplos serviços de upload como fallback
- ✅ Interface web moderna e responsiva
- ✅ Download automático da imagem processada
- ✅ Salvamento local da imagem
- ✅ Tratamento de erros melhorado
- ✅ Logs detalhados do processo

## 📝 Parâmetros

- **prompt**: Texto descrevendo a modificação desejada na imagem
- **imageUrl**: URL da imagem a ser processada
- **outputFormat**: Formato de saída (jpg, png, webp) - padrão: "jpg"

## 🔍 Exemplo de saída

```
🎨 Projeto Nano Banana - Replicate API
=====================================
🚀 Iniciando processamento da imagem...
📝 Prompt: troque a cor para vermelho
🖼️  Imagem: https://replicate.delivery/pbxt/...
⏳ Enviando requisição para o Replicate...
✅ Processamento concluído!
🔗 URL da imagem processada: https://replicate.delivery/...
💾 Salvando imagem como: processed-image-1234567890.jpg
✅ Imagem salva com sucesso: processed-image-1234567890.jpg

🎉 Processamento concluído com sucesso!
📁 Arquivo salvo: processed-image-1234567890.jpg
```

## 🛠️ Scripts disponíveis

- `npm start`: Executa o exemplo padrão
- `npm run dev`: Executa com watch mode para desenvolvimento

## 📦 Dependências

- `replicate`: Cliente oficial da API Replicate
- `dotenv`: Gerenciamento de variáveis de ambiente (opcional)

## 🌐 URLs Públicas para Uploads

O projeto agora resolve automaticamente o problema de URLs locais:

1. **Servidor de arquivos** (porta 8080): Serve arquivos localmente com URLs públicas
2. **Múltiplos serviços de upload**: Imgur, Postimages, 0x0.st como fallback
3. **Detecção automática**: URLs locais são automaticamente convertidas para públicas

### Como funciona:
- Upload de arquivo → Salvo em `uploads/` → URL pública em `http://localhost:8080/file/`
- Se upload falhar → Tenta múltiplos serviços de upload externos
- API do Replicate recebe sempre URLs públicas acessíveis

## 🔗 Links úteis

- [Documentação da API Replicate](https://replicate.com/docs)
- [Modelo GOOGLE-NANO-BANANA](https://replicate.com/google/nano-banana)
- [Ngrok para URLs públicas externas](https://ngrok.com/)
