# 🚀 Como Executar o MobiliAI

## 📋 Pré-requisitos

- **Node.js** 20+ instalado
- **PostgreSQL** 14+ instalado e rodando
- **npm** ou **yarn**

## 🛠️ Configuração do Backend

### 1. Instalar Dependências
```bash
cd project
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na pasta `project` com:

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

### 3. Configurar Banco de Dados
```bash
# Criar o banco de dados
createdb mobiliai

# Executar migrações
npx prisma generate
npx prisma db push

# Popular com dados iniciais
npm run seed
```

### 4. Executar Backend
```bash
npm run start:dev
```

**✅ Backend rodando em:** http://localhost:3001

## 🎨 Configuração do Frontend

### 1. Instalar Dependências
```bash
cd my-app
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na pasta `my-app`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=MobiliAI
```

### 3. Executar Frontend
```bash
npm run dev
```

**✅ Frontend rodando em:** http://localhost:3000

## 🌐 Acessar o Site

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Documentação da API:** http://localhost:3001/api (Swagger)

## 👥 Contas de Demonstração

| Tipo | Email | Senha | Acesso |
|------|-------|-------|---------|
| **Admin** | admin@loja.com | admin123 | Todas as funcionalidades |
| **Funcionário** | funcionario@loja.com | func123 | Gestão de produtos e vendas |
| **Cliente** | cliente@loja.com | cliente123 | Visualização e compras |

## 🔧 Scripts Disponíveis

### Backend (project/)
```bash
npm run start:dev    # Desenvolvimento com hot-reload
npm run build        # Build para produção
npm run start        # Executar versão compilada
npm run lint         # Verificar código
npm run test         # Executar testes
npm run seed         # Popular banco com dados iniciais
```

### Frontend (my-app/)
```bash
npm run dev          # Desenvolvimento com hot-reload
npm run build        # Build para produção
npm run start        # Executar versão compilada
npm run lint         # Verificar código
```

## 🐛 Solução de Problemas

### Erro: "Missing script: dev"
**Problema:** Tentou executar `npm run dev` no backend
**Solução:** Use `npm run start:dev` para o backend

### Erro de Conexão com Banco
**Problema:** PostgreSQL não está rodando
**Solução:** Inicie o PostgreSQL e verifique as credenciais no `.env`

### Erro: "Module not found"
**Problema:** Dependências não instaladas
**Solução:** Execute `npm install` em ambas as pastas

### Porta já em uso
**Problema:** Porta 3000 ou 3001 já está sendo usada
**Solução:** Pare outros processos ou mude as portas no `.env`

## 📱 Funcionalidades Disponíveis

### ✅ Implementadas
- ✅ Página inicial moderna
- ✅ Sistema de autenticação (login/registro)
- ✅ Catálogo de produtos com filtros
- ✅ Chatbot integrado
- ✅ Design responsivo
- ✅ Integração com backend

### 🚧 Em Desenvolvimento
- 🚧 IA Visualizadora de móveis
- 🚧 Carrinho de compras
- 🚧 Sistema de pagamentos
- 🚧 Dashboard administrativo

## 🎯 Próximos Passos

1. **Configurar APIs externas** (OpenAI, Replicate, AbacatePay)
2. **Implementar IA Visualizadora** completa
3. **Adicionar testes automatizados**
4. **Configurar deploy** em produção

---

**🎉 Parabéns! Seu MobiliAI está rodando com sucesso!**

Para mais informações, consulte a documentação completa em `DOCUMENTACAO_PROJETO.md`
