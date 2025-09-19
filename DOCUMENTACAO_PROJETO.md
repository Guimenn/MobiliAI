# 🪑 MobiliAI - Plataforma Omnichannel de Móveis com IA Decoradora

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Público-Alvo](#público-alvo)
3. [Modelo de Negócios](#modelo-de-negócios)
4. [Objetivos Estratégicos](#objetivos-estratégicos)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [IA Decoradora - Destaque](#ia-decoradora---destaque)
7. [Arquitetura Técnica](#arquitetura-técnica)
8. [Tecnologias Utilizadas](#tecnologias-utilizadas)
9. [Instalação e Configuração](#instalação-e-configuração)
10. [Cronograma de Desenvolvimento](#cronograma-de-desenvolvimento)
11. [Métricas de Sucesso](#métricas-de-sucesso)
12. [Melhorias Sugeridas](#melhorias-sugeridas)

---

## 🎯 Visão Geral do Projeto

### Conceito Principal

**MobiliAI** é uma plataforma omnichannel inovadora (online + offline) especializada em venda de móveis e acessórios residenciais. O diferencial está na integração inteligente com lojas físicas e na **IA Decoradora**, uma ferramenta revolucionária que permite testes virtuais de produtos em ambientes reais, oferecendo customizações avançadas de cores, estilos e layouts.

### Proposta de Valor

- **Experiência Visual Imersiva**: Teste móveis em seu ambiente real antes da compra
- **Personalização Inteligente**: IA que aprende com suas preferências e sugere combinações perfeitas
- **Integração Omnichannel**: Compre online, retire na loja ou receba em casa
- **Redução de Devoluções**: Visualização realista elimina arrependimentos

---

## 👥 Público-Alvo

### Segmentação Principal

| Segmento | Idade | Características | Necessidades |
|----------|-------|-----------------|--------------|
| **Proprietários Residenciais** | 25-45 anos | Primeira casa, reforma, upgrade | Conveniência, qualidade, preço justo |
| **Designers de Interiores** | 28-50 anos | Profissionais, criativos | Ferramentas profissionais, catálogo amplo |
| **Entusiastas DIY** | 22-40 anos | Práticos, econômicos | Inspiração, tutoriais, produtos versáteis |

### Foco Geográfico Inicial
- **São Paulo** (SP) - Mercado principal
- **Rio de Janeiro** (RJ) - Mercado secundário  
- **Belo Horizonte** (MG) - Mercado em expansão

---

## 💼 Modelo de Negócios

### Estratégia Omnichannel

```
Vendas Online (60%) ←→ Vendas Offline (40%)
         ↕                    ↕
    Integração Total com Lojas Físicas
```

### Estrutura de Receita

| Fonte | Descrição | Margem Esperada |
|-------|-----------|-----------------|
| **Vendas Diretas** | Site/app + lojas físicas | 25-35% |
| **Frete Premium** | Entrega rápida (< 24h) | 15-20% |
| **Serviços IA** | Consultoria virtual, projetos personalizados | 40-50% |
| **Upsell Inteligente** | Sugestões automáticas de complementos | 20-30% |

### Políticas Comerciais

- ✅ **Frete grátis** para compras acima de R$ 500
- ✅ **Opções flexíveis**: retirada em loja ou entrega domiciliar
- ✅ **Programa de fidelidade** unificado online/offline
- ✅ **Garantia estendida** para produtos recomendados pela IA

---

## 🎯 Objetivos Estratégicos

### Metas Quantitativas (12 meses)

| Objetivo | Meta Atual | Meta Projetada | Impacto |
|----------|------------|----------------|---------|
| **Aumento de Conversões** | Baseline | +30% | IA Decoradora |
| **Redução de Devoluções** | 15% | -40% | Visualização prévia |
| **Vendas Omnichannel** | 20% | 50% | Integração total |
| **Engajamento IA** | 0% | 70% | Adoção da ferramenta |

### Metas Qualitativas

- 🏆 **Posicionamento**: Líder em inovação tecnológica no setor moveleiro
- 🤝 **Relacionamento**: Experiência personalizada e consultiva
- 📈 **Crescimento**: Expansão sustentável com base em dados

---

## ⚡ Funcionalidades Principais

### Tabela de Funcionalidades por Categoria

| **Categoria** | **Funcionalidades** | **Integração com Lojas Físicas** |
|---------------|---------------------|-----------------------------------|
| **🛒 Vendas Básicas** | • Catálogo com filtros avançados (preço, material, cor, estilo)<br>• Carrinho inteligente com sugestões<br>• Checkout múltiplo (PIX, cartão, boleto)<br>• Avaliações e fotos de clientes | • Estoque sincronizado via API com PDV<br>• Opção "Retirar na loja" com mapa interativo<br>• Reserva online, pagamento presencial |
| **🔄 Omnichannel** | • Agendamento de visitas virtuais/presenciais<br>• Chatbot integrado ao WhatsApp<br>• Programa de fidelidade unificado<br>• Histórico de compras cross-channel | • QR codes em lojas para visualizações no app<br>• Estoque unificado com reservas automáticas<br>• Funcionários acessam dados do cliente online |
| **👥 Comunidade** | • Blog com dicas de decoração<br>• Galeria de ambientes gerados por IA<br>• Sistema de reviews e fotos<br>• Fóruns de discussão | • Promoção de eventos presenciais<br>• Workshops de IA nas lojas<br>• Exposições de móveis com realidade aumentada |

### Design e UX

- **📱 Mobile-First**: Interface otimizada para smartphones
- **🎨 Inspiração Visual**: Layout similar ao Pinterest + varejo premium
- **⚡ Performance**: Carregamento rápido com lazy loading
- **♿ Acessibilidade**: Suporte completo a leitores de tela

---

## 🤖 IA Decoradora - Destaque

### Descrição Técnica

A **IA Decoradora** é o coração inovador do MobiliAI, utilizando **visão computacional** e **geração de imagens** para criar simulações realistas de ambientes decorados. O sistema aprende continuamente com as interações dos usuários para oferecer personalizações cada vez mais precisas.

### Recursos Principais

#### 🎨 Troca de Cores Inteligente
```
Fluxo: Upload → Detecção → Segmentação → Substituição → Visualização
```

- **Detecção Automática**: Identifica itens existentes via segmentação de imagem
- **Sobreposição Realista**: Aplica novas cores mantendo texturas e iluminação
- **Preview Instantâneo**: Visualização em tempo real das mudanças

#### 🏠 Decoração Completa de Ambientes
```
Input: "Sala 20m², orçamento R$5.000, estilo escandinavo"
Output: Layout completo + lista de produtos + simulação 3D
```

- **Geração de Layouts**: Criações baseadas em parâmetros específicos
- **Simulação de Iluminação**: Efeitos realistas de luz natural/artificial
- **Realidade Aumentada**: Drag & drop de móveis no ambiente real

#### 🎯 Personalização Avançada
- **Questionário Inteligente**: Coleta preferências (cores, pets, estilo, orçamento)
- **Moodboards Salvos**: Facilita compras rápidas e futuras
- **Histórico de Preferências**: IA aprende com cada interação

### Base de Dados Inteligente

| **Tipo** | **Quantidade** | **Fonte** | **Atualização** |
|----------|----------------|-----------|-----------------|
| **Produtos** | 1.000+ itens | Catálogo interno | Manual/API |
| **Metadados** | Dimensões, materiais, compatibilidades | Fornecedores | Automática |
| **Tendências** | Dados curados | Pinterest, Instagram, vendas | Diária |
| **Aprendizado** | Feedback contínuo | Usuários | Tempo real |

### Exemplo de Fluxo de Uso

```mermaid
graph TD
    A[Upload da Foto] --> B[IA Analisa Ambiente]
    B --> C[Gera 3 Opções de Decoração]
    C --> D[Usuário Escolhe Preferida]
    D --> E[Botão 'Comprar Tudo']
    E --> F[Carrinho Populado]
    F --> G[Escolha: Entrega ou Retirada]
    G --> H[Checkout Finalizado]
```

**Meta de Adoção**: 70% dos usuários utilizam a IA antes de finalizar a compra

---

## 🏗️ Arquitetura Técnica

### Frontend (Next.js 15)

```
my-app/
├── app/                    # App Router (Next.js 15)
│   ├── ai-processor/       # Processamento de imagens
│   ├── color-visualizer/   # Visualização de cores
│   ├── furniture-visualizer/ # Visualização de móveis
│   └── products/          # Catálogo de produtos
├── components/
│   └── ui/                # Componentes Shadcn/UI
└── lib/                   # Utilitários e configurações
```

**Tecnologias Frontend:**
- ⚡ **Next.js 15** com App Router e Turbopack
- 🎨 **Shadcn/UI** + Tailwind CSS para interface moderna
- 📱 **Design Responsivo** mobile-first
- 🔄 **Zustand** para gerenciamento de estado
- 📝 **React Hook Form** + Zod para validação
- 🌐 **Axios** para comunicação com API

### Backend (NestJS)

```
project/
├── src/
│   ├── ai/                # Módulo de IA (OpenAI + Replicate)
│   ├── auth/              # Autenticação JWT
│   ├── chatbot/           # Chatbot inteligente
│   ├── products/          # Gestão de produtos
│   ├── sales/             # Sistema de vendas
│   ├── stores/            # Gestão de lojas
│   └── users/             # Gestão de usuários
├── prisma/                # Schema do banco de dados
└── test/                  # Testes automatizados
```

**Tecnologias Backend:**
- 🚀 **NestJS** - Framework modular e escalável
- 🗄️ **PostgreSQL** + Prisma ORM
- 🔐 **JWT** + Passport.js para autenticação
- 🤖 **OpenAI API** para chatbot inteligente
- 🖼️ **Sharp** + Multer para processamento de imagens
- 🔄 **Replicate API** para IA de geração de imagens

### Banco de Dados (PostgreSQL)

```sql
-- Principais Entidades
Users (ADMIN, MANAGER, EMPLOYEE, CUSTOMER)
Stores (Lojas físicas)
Products (Móveis e acessórios)
Sales (Vendas omnichannel)
FurnitureAnalysis (Análises de IA)
ChatSession (Sessões do chatbot)
```

---

## 🛠️ Tecnologias Utilizadas

### Stack Principal

| **Categoria** | **Tecnologia** | **Versão** | **Propósito** |
|---------------|----------------|------------|---------------|
| **Frontend** | Next.js | 15.5.3 | Framework React |
| **Frontend** | React | 19.1.0 | Biblioteca UI |
| **Frontend** | TypeScript | 5.x | Tipagem estática |
| **Frontend** | Tailwind CSS | 4.x | Estilização |
| **Frontend** | Shadcn/UI | Latest | Componentes |
| **Backend** | NestJS | 10.3.0 | Framework Node.js |
| **Backend** | PostgreSQL | 14+ | Banco de dados |
| **Backend** | Prisma | 6.16.1 | ORM |
| **IA** | OpenAI API | 4.28.0 | Chatbot |
| **IA** | Replicate | 0.34.1 | Geração de imagens |
| **Pagamentos** | AbacatePay | Latest | PIX |

### Integrações Externas

- 🤖 **OpenAI GPT-4** - Chatbot e sugestões inteligentes
- 🎨 **Replicate** - Geração e processamento de imagens
- 💳 **AbacatePay** - Processamento de pagamentos PIX
- 📱 **WhatsApp API** - Integração do chatbot
- 🗺️ **Google Maps** - Localização de lojas

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 20+
- **PostgreSQL** 14+
- **npm** ou **yarn**
- **Git**

### 1. Clone e Configuração Inicial

```bash
# Clone o repositório
git clone <repository-url>
cd MobiliAI

# Instale dependências do backend
cd project
npm install

# Instale dependências do frontend
cd ../my-app
npm install
```

### 2. Configuração do Backend

Crie o arquivo `.env` na pasta `project`:

```env
# Database
DATABASE_URL="postgresql://postgres:senha@localhost:5432/mobiliai?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=mobiliai

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Replicate
REPLICATE_API_TOKEN=seu_token_replicate_aqui

# AbacatePay (PIX)
ABACATEPAY_API_KEY=sua_chave_abacatepay
ABACATEPAY_ENVIRONMENT=sandbox

# App
PORT=3001
NODE_ENV=development
```

### 3. Configuração do Banco de Dados

```bash
# Crie o banco de dados
createdb mobiliai

# Execute as migrações
cd project
npx prisma generate
npx prisma db push

# Popule com dados iniciais
npm run seed
```

### 4. Configuração do Frontend

Crie o arquivo `.env.local` na pasta `my-app`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=MobiliAI
```

### 5. Execução

```bash
# Terminal 1 - Backend
cd project
npm run start:dev

# Terminal 2 - Frontend  
cd my-app
npm run dev
```

**URLs de Acesso:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api

### 6. Contas de Demonstração

| **Tipo** | **Email** | **Senha** | **Acesso** |
|----------|-----------|-----------|------------|
| **Admin** | admin@mobiliai.com | admin123 | Todas as funcionalidades |
| **Funcionário** | funcionario@mobiliai.com | func123 | Gestão de produtos e vendas |
| **Cliente** | cliente@mobiliai.com | cliente123 | Visualização e compras |

---

## 📅 Cronograma de Desenvolvimento

### Fase 1: MVP (6 meses)

| **Mês** | **Entregas** | **Foco** |
|---------|--------------|----------|
| **1-2** | • Estrutura base<br>• Autenticação<br>• CRUD básico | Fundação sólida |
| **3-4** | • Catálogo de produtos<br>• Sistema de vendas<br>• Integração PIX | Funcionalidades core |
| **5-6** | • IA básica de visualização<br>• Interface mobile<br>• Testes e ajustes | Experiência do usuário |

### Fase 2: IA Completa (12 meses)

| **Mês** | **Entregas** | **Foco** |
|---------|--------------|----------|
| **7-8** | • IA Decoradora avançada<br>• Chatbot inteligente<br>• Integração omnichannel | Inteligência artificial |
| **9-10** | • Realidade aumentada<br>• Sistema de recomendações<br>• Analytics avançado | Inovação tecnológica |
| **11-12** | • Otimizações<br>• Expansão de funcionalidades<br>• Preparação para escala | Refinamento e crescimento |

### Marcos Importantes

- 🎯 **Mês 3**: Primeiro cliente usando a plataforma
- 🚀 **Mês 6**: MVP funcional com IA básica
- 🏆 **Mês 9**: IA Decoradora em produção
- 📈 **Mês 12**: Plataforma completa e escalável

---

## 📊 Métricas de Sucesso

### KPIs Técnicos

| **Métrica** | **Meta** | **Como Medir** |
|-------------|----------|----------------|
| **Tempo de Carregamento** | < 2s | Google PageSpeed |
| **Uptime** | 99.9% | Monitoramento 24/7 |
| **Taxa de Erro** | < 0.1% | Logs de aplicação |
| **Conversão IA** | 70% | Analytics de uso |

### KPIs de Negócio

| **Métrica** | **Baseline** | **Meta 6m** | **Meta 12m** |
|-------------|--------------|-------------|--------------|
| **Taxa de Conversão** | 2.5% | 3.5% | 5.0% |
| **Ticket Médio** | R$ 450 | R$ 650 | R$ 850 |
| **Taxa de Devolução** | 15% | 10% | 6% |
| **NPS** | - | 50+ | 70+ |

### Métricas de IA

- **📸 Taxa de Uso**: % de usuários que usam a IA Decoradora
- **🎯 Precisão**: % de sugestões aceitas pelo usuário
- **⏱️ Tempo de Processamento**: Velocidade de análise de imagens
- **💡 Satisfação**: Rating das sugestões da IA

---

## 💡 Melhorias Sugeridas

### Funcionalidades Adicionais

#### 🥽 Realidade Virtual (VR)
- **Visualização Imersiva**: Experiência VR completa para ambientes
- **Tecnologia**: WebXR + Oculus/Meta Quest
- **Benefício**: Redução de 60% nas devoluções

#### 🧠 Sistema de Recomendações Avançado
- **Machine Learning**: Algoritmos de recomendação personalizada
- **Tecnologia**: TensorFlow.js + dados de comportamento
- **Benefício**: Aumento de 25% no ticket médio

#### 📱 App Mobile Nativo
- **Funcionalidades**: Notificações push, modo offline, AR nativo
- **Tecnologia**: React Native ou Flutter
- **Benefício**: Engajamento 40% maior

#### 🤝 Marketplace de Designers
- **Funcionalidade**: Designers podem vender projetos personalizados
- **Monetização**: Comissão de 15% sobre vendas
- **Benefício**: Receita adicional de R$ 50k/mês

### Otimizações Técnicas

#### ⚡ Performance
- **CDN Global**: Distribuição de imagens e assets
- **Cache Inteligente**: Redis para sessões e dados frequentes
- **Lazy Loading**: Carregamento otimizado de componentes

#### 🔒 Segurança
- **2FA**: Autenticação de dois fatores
- **Rate Limiting**: Proteção contra ataques DDoS
- **Auditoria**: Logs detalhados de todas as ações

#### 📈 Analytics
- **Heatmaps**: Análise de comportamento do usuário
- **A/B Testing**: Testes de funcionalidades
- **Predictive Analytics**: Previsão de vendas e tendências

---

## 🎯 Conclusão

O **MobiliAI** representa uma revolução no setor moveleiro brasileiro, combinando tecnologia de ponta com uma experiência de compra verdadeiramente personalizada. A integração omnichannel e a IA Decoradora criam um ecossistema único que beneficia tanto clientes quanto lojistas.

### Diferenciais Competitivos

1. **🤖 IA Pioneira**: Primeira plataforma com IA Decoradora no Brasil
2. **🔄 Omnichannel Real**: Integração verdadeira entre online e offline
3. **🎨 Experiência Visual**: Visualização realista antes da compra
4. **📱 Tecnologia Moderna**: Stack atual e escalável

### Potencial de Mercado

- **Mercado Brasileiro**: R$ 45 bilhões/ano em móveis
- **Digitalização**: Apenas 8% das vendas são online atualmente
- **Oportunidade**: Crescimento de 300% no e-commerce moveleiro

---

*Documentação criada para o projeto MobiliAI - Revolucionando a experiência de compra de móveis com Inteligência Artificial*

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: Em Desenvolvimento Ativo
