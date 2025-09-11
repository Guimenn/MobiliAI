# 🚀 Guia de Início Rápido

## Instalação Automática (Windows)

1. **Execute o script de instalação:**
   ```bash
   install.bat
   ```

2. **Configure o PostgreSQL:**
   - Instale o PostgreSQL
   - Crie o banco: `CREATE DATABASE loja_tintas;`

3. **Configure as chaves de API:**
   - Edite `project\.env` e adicione suas chaves:
     - `OPENAI_API_KEY` (para o chatbot)
     - `ABACATEPAY_API_KEY` (para pagamentos PIX)

4. **Execute o seed do banco:**
   ```bash
   cd project
   npm run seed
   ```

5. **Inicie os serviços:**
   ```bash
   start.bat
   ```

## Instalação Manual

### Backend
```bash
cd project
npm install
# Configure o .env
npm run seed
npm run start:dev
```

### Frontend
```bash
cd my-app
npm install
# Configure o .env.local
npm run dev
```

## Acesso

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api

## Contas de Teste

- **Admin:** admin@loja.com / admin123
- **Funcionário:** funcionario@loja.com / func123
- **Cliente:** cliente@loja.com / cliente123

## Funcionalidades Principais

1. **Visualização de Cores:** Upload de foto → Análise de cores → Troca de cores
2. **Chatbot:** Assistente virtual para dicas de pintura
3. **Produtos:** Catálogo completo com filtros
4. **Carrinho:** Sistema de compras integrado
5. **Gestão:** Painel administrativo completo

## Problemas Comuns

### Erro de conexão com banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`

### Erro de CORS
- Verifique se o frontend está rodando na porta 3000
- Confirme a URL da API no `.env.local`

### Erro de autenticação
- Execute o seed: `npm run seed`
- Use as contas de teste fornecidas

## Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Confirme se todas as dependências estão instaladas
3. Verifique se o banco de dados está acessível
4. Abra uma issue no GitHub
