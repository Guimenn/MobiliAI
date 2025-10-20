# Exemplo de Uso - Admin Criar Produto com Imagens

## Endpoint Atualizado

```
POST /admin/products
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>
```

## Exemplo de Uso com JavaScript/Fetch

```javascript
// Criar produto com imagens no painel admin
const formData = new FormData();

// Dados do produto
formData.append('name', 'Sofá Moderno Premium');
formData.append('description', 'Sofá confortável de 3 lugares');
formData.append('category', 'SOFA');
formData.append('price', '2500.00');
formData.append('costPrice', '1800.00');
formData.append('stock', '10');
formData.append('minStock', '2');
formData.append('colorName', 'Cinza Escuro');
formData.append('colorHex', '#4A4A4A');
formData.append('brand', 'MóveisTop');
formData.append('style', 'MODERNO');
formData.append('material', 'TECIDO');
formData.append('width', '220');
formData.append('height', '85');
formData.append('depth', '95');
formData.append('weight', '45');
formData.append('model', 'Premium 3L');
formData.append('sku', 'SOF-PREM-3L-001');
formData.append('storeId', 'sua-store-id-aqui');
formData.append('isFeatured', 'true');
formData.append('isNew', 'true');

// Adicionar múltiplas imagens
const imageFiles = document.getElementById('product-images').files;
for (let i = 0; i < imageFiles.length; i++) {
  formData.append('images', imageFiles[i]);
}

// Fazer a requisição
fetch('/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Produto criado com sucesso:', data);
  // data.imageUrls conterá as URLs das imagens no Supabase
  // data.imageUrl conterá a URL da primeira imagem (principal)
})
.catch(error => {
  console.error('Erro ao criar produto:', error);
});
```

## Exemplo com HTML Form

```html
<form id="product-form" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Nome do produto" required>
  <textarea name="description" placeholder="Descrição"></textarea>
  
  <select name="category" required>
    <option value="SOFA">Sofá</option>
    <option value="MESA">Mesa</option>
    <option value="CADEIRA">Cadeira</option>
    <option value="ARMARIO">Armário</option>
    <option value="ESTANTE">Estante</option>
    <option value="POLTRONA">Poltrona</option>
    <option value="QUADRO">Quadro</option>
    <option value="LUMINARIA">Luminária</option>
    <option value="OUTROS">Outros</option>
  </select>
  
  <input type="number" name="price" step="0.01" placeholder="Preço" required>
  <input type="number" name="stock" placeholder="Estoque" required>
  <input type="text" name="storeId" placeholder="ID da Loja" required>
  
  <!-- Upload de múltiplas imagens -->
  <input type="file" name="images" multiple accept="image/*" id="product-images">
  
  <button type="submit">Criar Produto</button>
</form>

<script>
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('/admin/products', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Produto criado com sucesso!');
      console.log('Produto:', result);
      // Resetar formulário
      e.target.reset();
    } else {
      alert('Erro: ' + result.message);
    }
  } catch (error) {
    alert('Erro ao criar produto: ' + error.message);
  }
});
</script>
```

## Resposta de Sucesso

```json
{
  "id": "produto-uuid",
  "name": "Sofá Moderno Premium",
  "description": "Sofá confortável de 3 lugares",
  "category": "SOFA",
  "price": "2500.00",
  "stock": 10,
  "imageUrl": "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-uuid_1734567890123.jpg",
  "imageUrls": [
    "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-uuid_1734567890123.jpg",
    "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-uuid_1734567890124.jpg",
    "https://projeto.supabase.co/storage/v1/object/public/PRODUCT-IMAGES/produto-uuid_1734567890125.jpg"
  ],
  "store": {
    "id": "store-uuid",
    "name": "Loja Principal"
  },
  "createdAt": "2024-12-18T10:30:00.000Z",
  // ... outros campos
}
```

## Validações

- Apenas usuários com role `ADMIN` podem acessar
- Tipos de arquivo aceitos: JPEG, JPG, PNG, WebP
- Tamanho máximo por arquivo: 5MB
- Máximo de 10 imagens por produto
- Se o upload falhar, o produto não será criado

## Comportamento

1. O produto é criado primeiro no banco de dados
2. Se há imagens, elas são enviadas para o bucket `PRODUCT-IMAGES` do Supabase
3. O produto é atualizado com as URLs das imagens
4. A primeira imagem se torna a imagem principal (`imageUrl`)
5. Todas as imagens ficam disponíveis em `imageUrls`
6. Se o upload falhar, o produto é deletado automaticamente