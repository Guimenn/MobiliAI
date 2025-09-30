# PintAi - Loja de Tintas com IA

Sistema web completo para loja de tintas com visualização de cores via inteligência artificial, desenvolvido com Next.js e integração com IA.

## 🚀 Funcionalidades

### Para Funcionários (PDV)
- **Ponto de Venda (PDV)**: Sistema completo de vendas com controle de caixa
- **Gestão de Estoque**: Controle de produtos e estoque em tempo real
- **Relatórios**: Dashboards com métricas de vendas e performance
- **Configurações**: Gestão de dados da loja e preferências

### Para Clientes
- **Catálogo de Produtos**: Navegação completa por tintas e acessórios
- **Visualizador de Cores IA**: Upload de fotos para visualizar cores antes de pintar
- **Assistente Virtual**: Chatbot inteligente para ajuda na escolha de produtos
- **Carrinho e Checkout**: Processo completo de compra online
- **Histórico de Pedidos**: Acompanhamento de compras realizadas

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Shadcn/UI, Lucide React
- **Estado**: React Hooks, localStorage
- **Integração**: APIs REST para backend NestJS
- **IA**: Integração com APIs de processamento de imagem e chatbot

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas da aplicação
│   ├── page.tsx           # Página principal (PDV)
│   ├── products/          # Catálogo de produtos
│   ├── color-visualizer/  # Visualizador de cores IA
│   ├── chatbot/           # Assistente virtual
│   ├── cart/              # Carrinho e checkout
│   ├── reports/           # Relatórios (funcionários)
│   └── settings/          # Configurações
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI base
│   ├── Layout.tsx        # Layout principal
│   ├── Navigation.tsx    # Navegação
│   └── LoginScreen.tsx   # Tela de login
└── lib/                  # Utilitários e APIs
    ├── api.ts           # Serviços de API
    ├── store.ts         # Gerenciamento de estado
    └── utils.ts         # Funções utilitárias
```

## 🎨 Páginas Principais

### 1. Página Principal (PDV)
- **Funcionários**: Sistema completo de vendas com controle de caixa
- **Clientes**: Interface de compras com carrinho integrado
- **Recursos**: Busca de produtos, múltiplos métodos de pagamento, gestão de estoque

### 2. Catálogo de Produtos
- **Filtros**: Por categoria, marca, cor, preço
- **Visualização**: Grid e lista
- **Detalhes**: Informações completas de cada produto
- **Categorias**: Tintas, Primers, Kits, Ferramentas

### 3. Visualizador de Cores IA
- **Upload**: Fotos via arquivo ou câmera
- **Processamento**: Análise de cores com IA
- **Paleta**: Cores disponíveis para aplicação
- **Preview**: Visualização do resultado final

### 4. Assistente Virtual
- **Chat Inteligente**: Respostas contextuais sobre produtos
- **Sugestões**: Produtos recomendados baseados na conversa
- **Categorias**: Cores, produtos, dicas, inspirações

### 5. Carrinho e Checkout
- **Gestão**: Adicionar/remover produtos, ajustar quantidades
- **Endereço**: Formulário de entrega para clientes
- **Pagamento**: PIX, Cartão, Dinheiro
- **Confirmação**: Processo completo de finalização

### 6. Relatórios (Funcionários)
- **Métricas**: Vendas totais, ticket médio, pedidos
- **Produtos**: Mais vendidos por período
- **Pagamentos**: Análise por método de pagamento
- **Exportação**: Relatórios em PDF/Excel

### 7. Configurações
- **Perfil**: Dados pessoais do usuário
- **Loja**: Configurações da loja (funcionários)
- **Notificações**: Preferências de comunicação
- **Privacidade**: Controle de dados pessoais

## 🔧 Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## 🌐 Integração com Backend

O sistema está preparado para integração com o backend NestJS através das APIs:

- **Autenticação**: Login/logout de usuários
- **Produtos**: CRUD de produtos e estoque
- **Vendas**: Criação e gestão de vendas
- **IA**: Processamento de imagens e chatbot
- **Relatórios**: Geração de métricas e dados

## 📱 Responsividade

O sistema é totalmente responsivo, funcionando perfeitamente em:
- **Desktop**: Interface completa com todas as funcionalidades
- **Tablet**: Layout adaptado para telas médias
- **Mobile**: Interface otimizada para smartphones

## 🎯 Recursos de IA

### Visualizador de Cores
- **Detecção**: Identificação automática de cores em imagens
- **Aplicação**: Substituição virtual de cores
- **Paleta**: Sugestões de cores complementares
- **Preview**: Visualização realista do resultado

### Assistente Virtual
- **Contexto**: Respostas baseadas no histórico da conversa
- **Produtos**: Sugestões inteligentes de produtos
- **Dicas**: Orientação sobre técnicas de pintura
- **Inspiração**: Ideias de decoração e combinações

## 🔐 Autenticação

Sistema de login com dois tipos de acesso:
- **Funcionário**: Acesso completo ao PDV e gestão
- **Cliente**: Interface de compras e funcionalidades do cliente

## 📊 Métricas e Analytics

Para funcionários:
- Vendas diárias, semanais e mensais
- Produtos mais vendidos
- Métodos de pagamento preferidos
- Performance por período

## 🚀 Próximos Passos

- [ ] Integração completa com APIs do backend
- [ ] Implementação real de IA para processamento de imagens
- [ ] Sistema de notificações push
- [ ] Integração com sistemas de pagamento
- [ ] App mobile nativo
- [ ] Sistema de avaliações de produtos
- [ ] Programa de fidelidade

## 📝 Licença

Este projeto faz parte do sistema PintAi - Loja de Tintas com IA.