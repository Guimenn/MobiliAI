# Modelos 3D (GLB/GLTF)

Esta pasta contém os modelos 3D de móveis e objetos que podem ser adicionados ao simulador.

## Formatos Suportados

- `.glb` (recomendado - formato binário, mais compacto)
- `.gltf` (formato JSON, pode incluir arquivos externos)

## Como Adicionar Modelos

1. Baixe ou crie modelos 3D no formato GLB/GLTF
2. Coloque os arquivos nesta pasta (`public/models/`)
3. Adicione a entrada correspondente em `src/data/models.json`

## Exemplo de Entrada em models.json

```json
{
  "id": "cadeira",
  "name": "Cadeira Moderna",
  "url": "/models/cadeira.glb",
  "category": "Assentos",
  "description": "Cadeira moderna e confortável"
}
```

## Onde Encontrar Modelos Gratuitos

- [Sketchfab](https://sketchfab.com) - Modelos 3D gratuitos e pagos
- [Poly Haven](https://polyhaven.com/models) - Modelos CC0 gratuitos
- [Free3D](https://free3d.com) - Modelos 3D gratuitos
- [TurboSquid](https://www.turbosquid.com) - Modelos profissionais (alguns gratuitos)

## Dicas

- Prefira modelos otimizados (baixo poly count) para melhor performance
- Modelos devem estar em escala realista (1 unidade = 1 metro)
- Certifique-se de que os modelos estão orientados corretamente (Y-up é o padrão)
- Texturas devem estar incluídas no arquivo GLB ou referenciadas corretamente no GLTF

## Modelos de Exemplo

Para testar o simulador, você pode usar modelos simples criados em Blender ou outras ferramentas 3D, ou baixar modelos gratuitos das fontes acima.


