# Visualizador 3D de Produtos

## Visão Geral

O sistema de visualização 3D permite que administradores visualizem produtos em três dimensões usando Three.js e React Three Fiber. Isso oferece uma experiência mais imersiva para entender melhor os produtos do catálogo.

## Componentes Disponíveis

### 1. ProductViewer3D (Básico)
- Visualização 3D simples
- Controles básicos de câmera
- Troca de cores
- Modelos 3D básicos baseados na categoria

### 2. ProductViewer3DAdvanced (Avançado)
- Visualização 3D avançada com mais recursos
- Múltiplos modos de iluminação (estúdio, pôr do sol, noite)
- Animações automáticas e interativas
- Modelos 3D mais complexos e realistas
- Controles avançados de visualização

## Funcionalidades

### Controles de Câmera
- **Rotação**: Arraste com o mouse para rotacionar o produto
- **Zoom**: Use a roda do mouse para aproximar/afastar
- **Pan**: Arraste com o botão direito para mover a câmera
- **Reset**: Botão para voltar à posição inicial

### Controles de Cores
- Paleta de cores pré-definidas
- Cores baseadas no produto (se disponível)
- Troca instantânea de cores
- Visualização em tempo real

### Modos de Iluminação (Apenas versão avançada)
- **Estúdio**: Iluminação profissional para visualização de produtos
- **Pôr do sol**: Iluminação quente e acolhedora
- **Noite**: Iluminação fria e dramática

### Animações
- **Rotação automática**: Produto gira continuamente
- **Hover effects**: Efeitos visuais ao passar o mouse
- **Transições suaves**: Mudanças de cor e iluminação animadas

## Modelos 3D por Categoria

### Tinta
- Cilindro principal (representando o galão)
- Alça lateral para realismo

### Pincel
- Cilindro longo (cabo)
- Cabeça do pincel mais larga

### Rolo
- Cilindro largo e baixo
- Eixo central para rotação

### Acessório
- Caixa com detalhes
- Elementos adicionais para realismo

### Kit
- Caixa principal
- Múltiplos elementos (esfera, cilindro)

### Outros
- Octaedro como forma padrão

## Como Usar

### Para Administradores
1. Acesse a página de **Gestão de Produtos**
2. Encontre o produto desejado na lista
3. Clique no botão **"3D"** no card do produto
4. Use os controles para interagir com o modelo 3D

### Controles Disponíveis
- **Mouse**: Rotação e navegação
- **Botões de controle**: Reset, zoom in/out
- **Paleta de cores**: Clique para trocar cores
- **Modos de iluminação**: Estúdio, pôr do sol, noite
- **Animação**: Liga/desliga rotação automática

## Tecnologias Utilizadas

- **Three.js**: Biblioteca 3D para JavaScript
- **React Three Fiber**: React renderer para Three.js
- **@react-three/drei**: Componentes auxiliares para R3F
- **React**: Framework principal e hooks
- **TypeScript**: Tipagem estática

## Dependências

```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0"
}
```

## Performance

- **Lazy loading**: Componentes carregados sob demanda
- **Suspense**: Loading states para melhor UX
- **Otimizações**: Shadows e iluminação otimizadas
- **Responsivo**: Funciona em diferentes tamanhos de tela

## Customização

### Adicionando Novas Cores
```typescript
const availableColors = [
  '#3e2626', '#8B4513', '#A0522D', 
  // Adicione suas cores aqui
  '#sua-cor'
];
```

### Criando Novos Modelos
```typescript
const getProductShape = () => {
  switch (product.category?.toLowerCase()) {
    case 'sua-categoria':
      return <SuaForma3D />;
    // ...
  }
};
```

### Modos de Iluminação Personalizados
```typescript
{lightingMode === 'custom' && (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[10, 10, 5]} intensity={1} />
  </>
)}
```

## Troubleshooting

### Problemas Comuns
1. **Modelo não carrega**: Verifique se as dependências estão instaladas
2. **Performance lenta**: Reduza a qualidade das sombras ou iluminação
3. **Cores não aparecem**: Verifique se o colorCode está definido no produto

### Debug
- Use as ferramentas de desenvolvedor do navegador
- Verifique o console para erros de Three.js
- Teste em diferentes navegadores

## Futuras Melhorias

- [ ] Carregamento de modelos 3D externos (GLTF, OBJ)
- [ ] Texturas e materiais mais realistas
- [ ] Animações de montagem/desmontagem
- [ ] Comparação lado a lado de produtos
- [ ] Exportação de imagens 3D
- [ ] Realidade aumentada (AR)
- [ ] Medições e dimensões precisas

## Contribuição

Para contribuir com melhorias no visualizador 3D:
1. Mantenha a compatibilidade com produtos existentes
2. Teste em diferentes dispositivos
3. Documente novas funcionalidades
4. Siga as convenções de código do projeto
