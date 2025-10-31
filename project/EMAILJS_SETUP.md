# Configuração do EmailJS para Recuperação de Senha

Este documento explica como configurar o EmailJS para enviar emails reais de recuperação de senha.

## Passo 1: Criar conta no EmailJS

1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/)
2. Crie uma conta gratuita
3. Faça login no painel

## Passo 2: Configurar Serviço de Email

1. No painel do EmailJS, vá em **Email Services**
2. Clique em **Add New Service**
3. Escolha seu provedor de email (Gmail, Outlook, Yahoo, etc.)
4. Siga as instruções para conectar sua conta
5. Anote o **Service ID** (exemplo: `service_xxxxxxx`)

## Passo 3: Criar Template de Email

1. No painel, vá em **Email Templates**
2. Clique em **Create New Template**
3. Configure o template com as seguintes variáveis:

**Campos do Template:**
- `To Email`: `{{to_email}}`
- `Subject`: `{{subject}}`
- `Content/Html`: Cole o HTML do email ou use a variável `{{message_html}}`

**Exemplo de Template HTML:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #3e2626; color: white; padding: 20px; text-align: center;">
    <h1>MobiliAI</h1>
  </div>
  <div style="padding: 30px; background: #fafafa;">
    <h2>Recuperação de Senha</h2>
    <p>Olá,</p>
    <p>Você solicitou a recuperação de senha. Use o código abaixo:</p>
    <div style="font-size: 32px; font-weight: bold; text-align: center; background: white; padding: 20px; margin: 20px 0; border-radius: 8px; letter-spacing: 5px; color: #3e2626;">
      {{reset_code}}
    </div>
    <p>Este código expira em 15 minutos.</p>
  </div>
</div>
```

**OU use HTML direto:**
- Configure o template para aceitar HTML e use: `{{message_html}}`

4. Salve o template e anote o **Template ID** (exemplo: `template_xxxxxxx`)

## Passo 4: Obter User ID e Public Key

1. No painel, vá em **Account** → **General**
2. Anote o **User ID** (exemplo: `user_xxxxxxx`)
3. Anote o **Public Key** (exemplo: `xxxxxxx_xxxxxxxxxxxx`)

## Passo 5: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env` do projeto:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=xxxxxxx_xxxxxxxxxxxx
EMAILJS_USER_ID=user_xxxxxxx
```

**Onde encontrar:**
- `EMAILJS_SERVICE_ID`: ID do serviço configurado (Email Services)
- `EMAILJS_TEMPLATE_ID`: ID do template criado (Email Templates)
- `EMAILJS_PUBLIC_KEY`: Chave pública da conta (Account → General)
- `EMAILJS_USER_ID`: ID do usuário da conta (Account → General)

## Passo 6: Verificar Funcionamento

1. Reinicie o servidor backend
2. Tente solicitar recuperação de senha
3. Verifique os logs do backend para confirmar o envio
4. Verifique a caixa de entrada do email configurado

## Troubleshooting

### Email não está sendo enviado

1. **Verifique as credenciais no .env** - Certifique-se de que todas as variáveis estão corretas
2. **Verifique os logs do backend** - Procure por erros relacionados ao EmailJS
3. **Verifique o template** - Certifique-se de que as variáveis do template correspondem:
   - `to_email`
   - `reset_code`
   - `message_html` (ou use HTML direto)
   - `subject`
4. **Limite de emails** - A conta gratuita do EmailJS tem limite de 200 emails/mês
5. **Verifique o serviço de email** - Certifique-se de que a conexão com Gmail/Outlook está ativa

### Erro 400 Bad Request

- Verifique se o formato do request está correto
- Certifique-se de que todas as variáveis do template estão sendo enviadas

### Erro 401 Unauthorized

- Verifique se o `EMAILJS_PUBLIC_KEY` ou `EMAILJS_USER_ID` está correto
- Certifique-se de que está usando a chave pública, não a privada

## Notas Importantes

- **Segurança**: Nunca exponha sua Private Key no código
- **Limites**: Conta gratuita permite 200 emails/mês
- **Template HTML**: Se usar `message_html`, certifique-se de que o template aceita HTML
- **Código de Fallback**: Se EmailJS não estiver configurado, o código será exibido apenas nos logs do backend

## Exemplo de Template Variables

As seguintes variáveis são enviadas para o template:

- `to_email`: Email do destinatário
- `reset_code`: Código de 6 dígitos
- `message_html`: HTML completo do email (opcional, se não quiser usar o HTML do template)
- `subject`: Assunto do email


