# Configuração do Replicate API

## Configuração do Backend

Para usar a funcionalidade de processamento de imagens com IA, você precisa configurar a API do Replicate.

### 1. Obter Token da API do Replicate

1. Acesse [https://replicate.com](https://replicate.com)
2. Crie uma conta ou faça login
3. Vá para [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
4. Crie um novo token de API
5. Copie o token (formato: `r8_...`)

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `project/` com o seguinte conteúdo:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/loja_tintas"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# Replicate
REPLICATE_API_TOKEN="r8_your-replicate-token-here"

# Server
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

### 3. Instalar Dependências

No diretório `project/`, execute:

```bash
npm install
```

### 4. Executar o Backend

```bash
npm run start:dev
```

## Funcionalidades Implementadas

### Backend (NestJS)

1. **ReplicateService** - Serviço para processamento de imagens com Google Nano Banana
2. **Novas rotas de API**:
   - `POST /api/ai/process-url` - Processar imagem com URL
   - `POST /api/ai/process-upload` - Processar imagem com upload

### Frontend (Next.js)

1. **Nova página**: `/ai-processor` - Interface para processamento de imagens com prompt
2. **Funcionalidades**:
   - Upload de imagens ou uso de URLs
   - Processamento com prompts em linguagem natural
   - Suporte a diferentes formatos de saída (JPG, PNG, WebP)
   - Interface intuitiva com abas

## Como Usar

### 1. Processamento com URL

1. Acesse `/ai-processor`
2. Selecione a aba "URL da Imagem"
3. Cole uma URL de imagem
4. Digite um prompt (ex: "troque a cor para vermelho")
5. Clique em "Processar Imagem"

### 2. Processamento com Upload

1. Acesse `/ai-processor`
2. Selecione a aba "Upload de Arquivo"
3. Faça upload de uma imagem
4. Digite um prompt
5. Clique em "Processar Imagem"

## Exemplos de Prompts

- "troque a cor da parede para azul"
- "adicione um padrão de flores na parede"
- "transforme em um estilo vintage"
- "mude a iluminação para mais quente"
- "adicione textura de madeira"

## Tecnologias Utilizadas

- **Backend**: NestJS, Replicate API, Sharp
- **Frontend**: Next.js, React, Tailwind CSS, Shadcn/UI
- **IA**: Google Nano Banana via Replicate
- **Processamento**: Conversão de imagens, upload de arquivos

## Estrutura de Arquivos

```
project/
├── src/
│   └── ai/
│       ├── replicate.service.ts    # Serviço do Replicate
│       ├── ai.controller.ts       # Controlador com novas rotas
│       └── ai.module.ts           # Módulo atualizado
└── package.json                   # Dependências atualizadas

my-app/
├── app/
│   └── ai-processor/
│       └── page.tsx               # Nova página de processamento
├── lib/
│   └── api.ts                     # APIs atualizadas
└── app/
    └── page.tsx                   # Página principal atualizada
```

## Próximos Passos

1. Configure as variáveis de ambiente
2. Instale as dependências
3. Execute o backend e frontend
4. Teste as funcionalidades
5. Personalize conforme necessário
