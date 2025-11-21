# 🚀 Configuração do Ambiente - ARQUIVO .env.local

## ⚠️ IMPORTANTE: Você precisa criar o arquivo .env.local manualmente

### 📁 **Localização do arquivo:**
```
my-app/.env.local
```

### 📝 **Conteúdo do arquivo .env.local:**

```env
# Configuração do ImageKit (para upload de imagens de produtos)
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/ujp6mp5if

# Configuração do Supabase (para banco de dados)
NEXT_PUBLIC_SUPABASE_URL=https://duvgptwzoodyyjbdhepa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dmdwdHd6b29keXlqYmRoZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTU4MDcsImV4cCI6MjA3MzE5MTgwN30.g3q7AnhX3i2TBQdN0HJ7CvKZ8dVmnZSCQdyycyuTJ_g
```

## 🔑 **Para encontrar a chave anônima:**

1. **Vá no dashboard do Supabase**
2. **Settings > API** (no menu lateral)
3. **Copie a "anon public" key** (é uma chave muito longa)
4. **Substitua** `sua_chave_anonima_aqui` pela chave real

## 📋 **Passos para criar o arquivo:**

### Windows:
1. Abra o Windows Explorer
2. Navegue até: `C:\Users\24250322\Documents\GitHub\PintAi\my-app\`
3. Clique com botão direito > Novo > Documento de texto
4. Renomeie para `.env.local` (sem extensão)
5. Cole o conteúdo acima
6. Salve o arquivo

### VS Code:
1. No VS Code, abra a pasta `my-app`
2. Clique com botão direito na raiz da pasta
3. Novo arquivo
4. Nomeie como `.env.local`
5. Cole o conteúdo

## ✅ **Depois de criar o arquivo:**

1. **Reinicie o servidor** Next.js:
   ```bash
   npm run dev
   ```

2. **Teste o upload** de imagens no formulário de produtos

## 🔧 **Se ainda der erro:**

Verifique se:
- O arquivo está na pasta correta: `my-app/.env.local`
- Não tem extensão `.txt` no nome
- As credenciais estão corretas
- Reiniciou o servidor após criar o arquivo
