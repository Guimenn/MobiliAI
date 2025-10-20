# Guia de Upload de Imagens para Produtos

## Configuração do Supabase

1. Certifique-se de que o bucket `PRODUCT-IMAGES` existe no seu projeto Supabase
2. Configure as variáveis de ambiente no `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
```

## Endpoints Disponíveis

### 1. Criar Produto com Imagens
```
POST /products/with-images
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- name: string
- description: string
- category: ProductCategory
- price: number
- storeId: string
- images: File[] (até 10 arquivos)
```

### 2. Upload de Imagem Única
```
POST /products/:id/upload-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- image: File
```

### 3. Upload de Múltiplas Imagens
```
POST /products/:id/upload-images
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- images: File[] (até 10 arquivos)
```

## Exemplo de Uso com JavaScript/Fetch

```javascript
// Criar produto com imagens
const formData = new FormData();
formData.append('name', 'Sofá Moderno');
formData.append('description', 'Sofá confortável para sala');
formData.append('category', 'SOFA');
formData.append('price', '1500.00');
formData.append('storeId', 'store-id-aqui');

// Adicionar múltiplas imagens
const imageFiles = document.getElementById('images').files;
for (let i = 0; i < imageFiles.length; i++) {
  formData.append('images', imageFiles[i]);
}

fetch('/products/with-images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Validações

- Tipos de arquivo aceitos: JPEG, JPG, PNG, WebP
- Tamanho máximo por arquivo: 5MB
- Máximo de 10 imagens por upload

## Estrutura de Resposta

Quando um produto é criado ou atualizado com imagens, a resposta inclui:

```json
{
  "id": "produto-id",
  "name": "Nome do Produto",
  "imageUrl": "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-id_timestamp.jpg",
  "imageUrls": [
    "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-id_timestamp1.jpg",
    "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-id_timestamp2.jpg"
  ],
  // ... outros campos do produto
}
```

## Visualização das Imagens

As URLs retornadas são públicas e podem ser usadas diretamente em tags `<img>` ou componentes de imagem no frontend.