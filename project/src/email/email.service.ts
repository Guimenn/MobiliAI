import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const serviceId = this.configService.get<string>('EMAILJS_SERVICE_ID');
    const templateId = this.configService.get<string>('EMAILJS_TEMPLATE_ID');
    const publicKey = this.configService.get<string>('EMAILJS_PUBLIC_KEY');
    const userId = this.configService.get<string>('EMAILJS_USER_ID');

    // Verificar se EmailJS está configurado
    if (!serviceId || !templateId || !publicKey) {
      // Fallback: apenas logar se não estiver configurado
      this.logger.warn(`\n${'='.repeat(60)}`);
      this.logger.warn(`⚠️  EMAILJS NÃO CONFIGURADO - Email não enviado`);
      this.logger.warn(`${'='.repeat(60)}`);
      this.logger.warn(`Para: ${email}`);
      this.logger.warn(`Código: ${code}`);
      this.logger.warn(`Configure EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID e EMAILJS_PUBLIC_KEY no .env`);
      this.logger.warn(`${'='.repeat(60)}\n`);
      return;
    }

    try {
      // Preparar HTML do email usando o template fornecido
      const html = `
<div
  style="
    font-family: 'Segoe UI', system-ui, Arial, sans-serif;
    font-size: 15px;
    color: #333;
    padding: 30px 14px;
    background-color: #f4f6f8;
  "
>
  <div
    style="
      max-width: 600px;
      margin: auto;
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    "
  >
    <!-- Cabeçalho -->
    <div
      style="
        text-align: center;
        background: linear-gradient(135deg, #2b2b2b, #444);
        padding: 18px;
      "
    >
      <div style="color: white; font-size: 24px; font-weight: bold;">
        MobiliAI
      </div>
    </div>

    <!-- Corpo -->
    <div style="padding: 30px 24px">
      <h1
        style="
          font-size: 22px;
          margin-bottom: 18px;
          color: #111;
          font-weight: 600;
        "
      >
        Solicitação de Redefinição de Senha
      </h1>

      <p style="margin-bottom: 18px; line-height: 1.6">
        Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para criar uma nova senha:
      </p>

      <!-- Código de 6 dígitos -->
      <div style="text-align: center; margin: 28px 0">
        <div
          style="
            background-color: #f4f6f8;
            color: #2b2b2b;
            padding: 20px 30px;
            border-radius: 8px;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            display: inline-block;
            font-family: 'Courier New', monospace;
            border: 2px solid #e0e0e0;
          "
        >
          ${code}
        </div>
      </div>

      <p style="margin-bottom: 14px; line-height: 1.6">
        Este código irá expirar em <strong>15 minutos</strong>.
      </p>

      <p style="line-height: 1.6">
        Se você não solicitou a redefinição de senha, ignore este e-mail ou entre em contato com nossa equipe de suporte imediatamente.
      </p>

      <p style="margin-top: 26px; line-height: 1.5">
        Atenciosamente,<br />
        <strong>Equipe MobiliAI</strong>
      </p>
    </div>
  </div>

  <!-- Rodapé -->
  <div
    style="
      max-width: 600px;
      margin: 20px auto;
      text-align: center;
      font-size: 13px;
      color: #999;
    "
  >
    <p style="margin: 0 0 4px 0">Este e-mail foi enviado para ${email}</p>
    <p style="margin: 0">
      Você recebeu esta mensagem porque possui uma conta na <strong>MobiliAI</strong>.
    </p>
  </div>
</div>
      `;

      // Preparar dados para EmailJS
      // Variáveis que o template do EmailJS pode usar:
      // - email: Email do destinatário
      // - reset_code ou code: Código de 6 dígitos
      // - message_html: HTML completo (se configurado no template para usar HTML)
      const templateParams: Record<string, string> = {
        email: email,
        to_email: email,
        reset_code: code,
        code: code,
        message_html: html,
        subject: 'Código de Recuperação de Senha - MobiliAI',
      };

      // Enviar email via EmailJS API v1.0
      const emailjsUrl = `https://api.emailjs.com/api/v1.0/email/send`;
      
      // EmailJS espera o formato específico com service_id, template_id, user_id e template_params
      const requestBody = {
        service_id: serviceId,
        template_id: templateId,
        user_id: userId || publicKey, // User ID ou Public Key
        template_params: templateParams,
      };

      const response = await axios.post(emailjsUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        this.logger.log(`\n${'='.repeat(60)}`);
        this.logger.log(`✅ EMAIL ENVIADO COM SUCESSO VIA EMAILJS`);
        this.logger.log(`${'='.repeat(60)}`);
        this.logger.log(`Para: ${email}`);
        this.logger.log(`Código: ${code}`);
        this.logger.log(`Status: ${response.status}`);
        this.logger.log(`${'='.repeat(60)}\n`);
      }
    } catch (error: any) {
      // Em caso de erro, logar mas não falhar completamente
      this.logger.error(`\n${'='.repeat(60)}`);
      this.logger.error(`❌ ERRO AO ENVIAR EMAIL VIA EMAILJS`);
      this.logger.error(`${'='.repeat(60)}`);
      this.logger.error(`Para: ${email}`);
      this.logger.error(`Código: ${code}`);
      this.logger.error(`Erro: ${error?.response?.data?.message || error?.message || 'Erro desconhecido'}`);
      this.logger.error(`Status: ${error?.response?.status || 'N/A'}`);
      
      // Fallback: mostrar código no console para desenvolvimento
      this.logger.warn(`\n⚠️  CÓDIGO DE RESET (para desenvolvimento):`);
      this.logger.warn(`   Email: ${email}`);
      this.logger.warn(`   Código: ${code}`);
      this.logger.error(`${'='.repeat(60)}\n`);
      
      // Não lançar erro para não quebrar o fluxo, mas logar o problema
      // throw new Error('Erro ao enviar email via EmailJS');
    }
  }
}
