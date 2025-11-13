# Configuração do Firebase Admin para Login com Google

Este guia explica como configurar o Firebase Admin SDK no backend para permitir login com Google.

## Passo 1: Obter Service Account Key

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto (mobiliai)
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Vá na aba **Contas de serviço**
5. Clique em **Gerar nova chave privada**
6. Baixe o arquivo JSON (ex: `mobiliai-firebase-adminsdk-xxxxx.json`)

## Passo 2: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env` do backend (pasta `project`):

```env
# Firebase Admin (obtenha do arquivo JSON baixado)
FIREBASE_PROJECT_ID=mobiliai
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mobiliai.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Importante:**
- O `FIREBASE_PRIVATE_KEY` deve estar entre aspas duplas
- Mantenha os `\n` no valor (eles serão processados corretamente)
- Copie o valor completo da chave privada do arquivo JSON

## Passo 3: Exemplo de Arquivo JSON

O arquivo JSON baixado terá esta estrutura:

```json
{
  "type": "service_account",
  "project_id": "mobiliai",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@mobiliai.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Extraia os valores:**
- `FIREBASE_PROJECT_ID` = `project_id`
- `FIREBASE_CLIENT_EMAIL` = `client_email`
- `FIREBASE_PRIVATE_KEY` = `private_key` (mantenha as quebras de linha `\n`)

## Passo 4: Verificar Configuração

Após adicionar as variáveis, reinicie o servidor backend:

```bash
cd project
npm run start:dev
```

O servidor deve inicializar sem erros relacionados ao Firebase.

## Segurança

⚠️ **NUNCA** commite o arquivo JSON ou as variáveis de ambiente no Git!

O arquivo `.env` já deve estar no `.gitignore`, mas verifique se está configurado corretamente.

## Testando

Após configurar, teste o login com Google:

1. Acesse a página de login no frontend
2. Clique em "Continuar com Google"
3. Selecione sua conta Google
4. O sistema deve fazer login/registro automaticamente

## Troubleshooting

### Erro: "Firebase Admin não está configurado"
- Verifique se as variáveis de ambiente estão corretas
- Certifique-se de que o `FIREBASE_PRIVATE_KEY` está entre aspas duplas
- Verifique se os `\n` estão presentes na chave privada

### Erro: "Token do Google inválido"
- Verifique se o Firebase Authentication está habilitado no console
- Certifique-se de que o método de login Google está ativado
- Verifique se o domínio está autorizado no Firebase Console

### Erro: "Email não encontrado no token"
- Isso não deve acontecer, mas se acontecer, verifique se o usuário permitiu acesso ao email no Google

