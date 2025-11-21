# 🖼️ Configuração do ImageKit para Upload de Imagens

## 📋 O que é o ImageKit?

O ImageKit é um serviço de CDN e otimização de imagens que substitui o uso do bucket do Supabase para armazenar imagens de produtos.

## 🚀 Como configurar

### Passo 1: Criar conta no ImageKit

1. Acesse [https://imagekit.io](https://imagekit.io)
2. Crie uma conta gratuita
3. Após criar a conta, você terá acesso ao dashboard

### Passo 2: Obter credenciais

No dashboard do ImageKit, você encontrará:

1. **URL Endpoint**: Formato `https://ik.imagekit.io/seu-imagekit-id`
2. **Public Key**: Chave pública para autenticação
3. **Private Key**: Chave privada (mantenha segura!)

### Passo 3: Configurar variáveis de ambiente

#### Frontend (my-app/.env.local)

```env
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ujp6mp5if
```

#### Backend (project/.env)

```env
# ImageKit Configuration
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ujp6mp5if
IMAGEKIT_PUBLIC_KEY=public_nww8kxehhXubCsIlmUMF9qbLou0=
IMAGEKIT_PRIVATE_KEY=private_+ypqNiAlGiz+W8zklPxRsuF2bMY=
```

⚠️ **IMPORTANTE**: As credenciais acima são reais. Certifique-se de que o arquivo `.env` está no `.gitignore` e nunca commite essas chaves no Git!

## ✅ Verificar se está funcionando

1. Reinicie o servidor backend
2. Reinicie o servidor frontend
3. Tente fazer upload de uma imagem de produto
4. Verifique se a URL retornada é do ImageKit (formato: `https://ik.imagekit.io/...`)

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- **NUNCA** commite o arquivo `.env` com as chaves no Git
- O arquivo `.env` já deve estar no `.gitignore`
- A `IMAGEKIT_PRIVATE_KEY` deve ser mantida apenas no backend
- Apenas a `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` é necessária no frontend

## 📝 Notas

- O ImageKit oferece otimização automática de imagens
- Você pode usar transformações de URL para redimensionar imagens
- O plano gratuito oferece 20GB de armazenamento e 20GB de largura de banda
- **Pasta configurada**: As imagens são armazenadas na pasta `/FotoMovel` no ImageKit

