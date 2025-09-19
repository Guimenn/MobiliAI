# 🪑 MobiliAI - Loja de Móveis com IA

Sistema web inovador onde o cliente envia uma foto de um ambiente, e o software identifica o espaço e sugere móveis ideais, permitindo visualizar como ficará o ambiente com diferentes móveis e decorações.

## ✨ Funcionalidades

### 🎯 Gestão da Empresa e Lojas
- Cadastro de produtos, móveis e fornecedores
- Controle de estoque manual por loja
- Registro de vendas e fluxo de caixa por loja e consolidado
- Histórico de clientes, compras e preferências de decoração
- Relatórios de desempenho por loja

### 🤖 IA e Visualização de Móveis
- Detecção de espaços e ambientes na foto enviada pelo cliente
- Substituição de móveis na imagem com peças escolhidas
- Sugestão de decorações complementares e combinações harmoniosas
- Pré-visualização realista antes da compra
- Recomendações de móveis baseadas no estilo e espaço

### 💬 Assistente Virtual Inteligente
- Chatbot para ajudar na escolha de móveis e decoração
- Sugestões de combinações baseadas em estilo e preferências
- Integração com ChatGPT API

### 🛒 Sistema de Autoatendimento Web
- Cliente envia foto, escolhe móveis, visualiza resultado
- Carrinho de compras integrado
- Sistema de pagamento PIX via AbacatePay

## 🏗️ Arquitetura

### Frontend
- **Next.js 15** com App Router
- **Shadcn/UI** para componentes modernos
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **React Hook Form** para formulários
- **Axios** para comunicação com API

### Backend
- **NestJS** (Node.js) modular e escalável
- **PostgreSQL** com Prisma ORM
- **JWT + Passport.js** para autenticação
- **OpenAI API** para chatbot
- **Sharp** para processamento de imagens

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 20+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd Lojadetinta
```

### 2. Configurar o Backend

```bash
cd project
npm install
```

Crie um arquivo `.env` na pasta `project` com as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/loja_tintas?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=loja_tintas

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# AbacatePay (PIX)
ABACATEPAY_API_KEY=sua_chave_abacatepay
ABACATEPAY_ENVIRONMENT=sandbox

# App
PORT=3001
NODE_ENV=development
```

### 3. Configurar o Banco de Dados

Crie o banco de dados PostgreSQL:
```sql
CREATE DATABASE loja_tintas;
```

### 4. Configurar Prisma

```bash
cd project
npx prisma generate
npx prisma db push
npm run seed
```

### 5. Executar o Backend

```bash
cd project
npm run start:dev
```

O backend estará disponível em `http://localhost:3001`

### 6. Configurar o Frontend

```bash
cd my-app
npm install
```

Crie um arquivo `.env.local` na pasta `my-app`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 7. Executar o Frontend

```bash
cd my-app
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## 👥 Contas de Demonstração

### Admin
- **Email:** admin@loja.com
- **Senha:** admin123
- **Acesso:** Todas as funcionalidades

### Funcionário
- **Email:** funcionario@loja.com
- **Senha:** func123
- **Acesso:** Gestão de produtos e vendas

### Cliente
- **Email:** cliente@loja.com
- **Senha:** cliente123
- **Acesso:** Visualização de cores e compras

## 📱 Como Usar

### 1. Visualização de Móveis
1. Acesse a página "Visualizar Móveis"
2. Faça upload de uma foto do ambiente
3. Clique em "Analisar Espaço" para detectar o ambiente
4. Escolha móveis do catálogo para visualizar no espaço
5. Veja o resultado em tempo real

### 2. Assistente Virtual
1. Acesse o chatbot no canto inferior direito
2. Faça perguntas sobre móveis, decoração ou estilos
3. Receba recomendações personalizadas

### 3. Compras
1. Navegue pelos móveis
2. Use os filtros para encontrar o que precisa
3. Adicione produtos ao carrinho
4. Finalize a compra

## 🛠️ Tecnologias Utilizadas

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Zustand
- React Hook Form
- Axios
- Lucide React

### Backend
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT
- Passport.js
- OpenAI API
- Sharp
- Multer
- Bcryptjs

## 📁 Estrutura do Projeto

```
Lojadetinta/
├── project/                 # Backend NestJS
│   ├── src/
│   │   ├── auth/           # Autenticação
│   │   ├── users/          # Usuários
│   │   ├── products/       # Produtos
│   │   ├── stores/         # Lojas
│   │   ├── sales/          # Vendas
│   │   ├── ai/             # IA e processamento de imagens
│   │   ├── chatbot/        # Chatbot
│   │   └── entities/       # Entidades do banco
│   └── package.json
├── my-app/                 # Frontend Next.js
│   ├── app/               # Páginas
│   ├── components/        # Componentes
│   ├── lib/              # Utilitários e configurações
│   └── package.json
└── README.md
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas, por favor:

1. Verifique se seguiu todos os passos de instalação
2. Confirme se todas as dependências estão instaladas
3. Verifique se o banco de dados está rodando
4. Abra uma issue no GitHub

---

Desenvolvido com ❤️ para revolucionar a experiência de compra de móveis!
