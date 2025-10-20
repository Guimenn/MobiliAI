# 🪣 Como Criar o Bucket no Supabase

## ❌ Problema Identificado

O bucket `product-images` não existe no Supabase, por isso o upload de imagens não está funcionando.

## 📝 Passos para Criar o Bucket

### 1. Acessar o Painel do Supabase
- Acesse: https://supabase.com/dashboard/project/duvgptwzoodyyjbdhepa
- Faça login com sua conta

### 2. Navegar para Storage
- No menu lateral esquerdo, clique em **"Storage"**
- Você verá a lista de buckets (provavelmente vazia)

### 3. Criar Novo Bucket
- Clique no botão **"Create a new bucket"** ou **"New bucket"**
- Preencha os dados:
  - **Name**: `product-images`
  - **Public bucket**: ✅ **MARCAR ESTA OPÇÃO** (muito importante!)
  - **File size limit**: `5242880` (5MB)
  - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`

### 4. Configurar Políticas (RLS)
Após criar o bucket, você precisa configurar as políticas de acesso:

1. Clique no bucket `product-images` criado
2. Vá na aba **"Policies"**
3. Clique em **"New Policy"**
4. Escolha **"For full customization"**
5. Configure as seguintes políticas:

#### Política de SELECT (Leitura)
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

#### Política de INSERT (Upload)
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');
```

#### Política de DELETE (Remoção)
```sql
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');
```

### 5. Verificar Configuração
Após criar o bucket e as políticas, execute o teste:

```bash
cd project
node test-supabase-bucket.js
```

## 🔧 Configuração Alternativa (Mais Simples)

Se as políticas acima não funcionarem, use esta configuração mais permissiva:

1. No painel do Supabase, vá em **Storage > product-images > Policies**
2. Clique em **"New Policy"**
3. Escolha **"Get started quickly"**
4. Selecione **"Enable read access for all users"**
5. Selecione **"Enable insert access for authenticated users only"**
6. Selecione **"Enable delete access for authenticated users only"**

## ✅ Verificação Final

Após criar o bucket, você deve ver:

1. ✅ Bucket `product-images` listado no Storage
2. ✅ Bucket configurado como **público**
3. ✅ Políticas de acesso configuradas
4. ✅ Teste de upload funcionando

## 🚀 Testando a Criação de Produtos

Depois que o bucket estiver criado, teste a criação de produtos:

```bash
# 1. Fazer login
http POST http://localhost:3001/auth/login \
  email="admin@loja.com" \
  password="admin123"

# 2. Criar produto (substitua SEU_TOKEN e STORE_ID)
curl -X POST http://localhost:3001/admin/products \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "name=Teste Produto" \
  -F "category=SOFA" \
  -F "price=999.99" \
  -F "stock=10" \
  -F "storeId=STORE_ID" \
  -F "images=@caminho/para/imagem.jpg"
```

## 🆘 Problemas Comuns

### Erro: "bucket not found"
- ✅ Verifique se o bucket foi criado com o nome exato: `product-images`

### Erro: "permission denied"
- ✅ Verifique se o bucket está marcado como **público**
- ✅ Verifique se as políticas RLS estão configuradas

### Erro: "file too large"
- ✅ Verifique se o arquivo tem menos de 5MB
- ✅ Ajuste o limite no bucket se necessário

### Erro: "invalid file type"
- ✅ Use apenas: JPEG, JPG, PNG, WebP