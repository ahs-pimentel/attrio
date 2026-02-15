import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail = 'Attrio <noreply@attrio.online>';
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY nao configurada - emails serao apenas logados');
    }
    this.resend = new Resend(apiKey || '');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async sendInviteEmail(params: {
    to: string;
    residentName: string;
    tenantName: string;
    unitIdentifier: string;
    inviteToken: string;
  }): Promise<boolean> {
    const { to, residentName, tenantName, unitIdentifier, inviteToken } = params;
    const registerUrl = `${this.frontendUrl}/register/${inviteToken}`;

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Convite para cadastro - ${tenantName}`,
        html: this.buildInviteHtml({
          residentName,
          tenantName,
          unitIdentifier,
          registerUrl,
        }),
      });

      if (error) {
        this.logger.error(`Erro ao enviar email para ${to}: ${error.message}`);
        return false;
      }

      this.logger.log(`Email de convite enviado para ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar email para ${to}`, err);
      return false;
    }
  }

  private buildInviteHtml(params: {
    residentName: string;
    tenantName: string;
    unitIdentifier: string;
    registerUrl: string;
  }): string {
    const { residentName, tenantName, unitIdentifier, registerUrl } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e40af;padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">Attrio</h1>
              <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Sistema de Gestao Condominial</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#111827;margin:0 0 16px;font-size:20px;">Ola, ${residentName}!</h2>
              <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
                Voce foi convidado para se cadastrar como morador no condominio <strong>${tenantName}</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;width:100%;margin:0 0 24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="color:#6b7280;margin:0 0 4px;font-size:13px;">Condominio</p>
                    <p style="color:#111827;margin:0;font-weight:600;">${tenantName}</p>
                  </td>
                  <td style="padding:16px;">
                    <p style="color:#6b7280;margin:0 0 4px;font-size:13px;">Unidade</p>
                    <p style="color:#111827;margin:0;font-weight:600;">${unitIdentifier}</p>
                  </td>
                </tr>
              </table>
              <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
                Clique no botao abaixo para completar seu cadastro. O link e valido por <strong>7 dias</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${registerUrl}" style="display:inline-block;background-color:#1e40af;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                      Completar Cadastro
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:24px 0 0;">
                Se voce nao reconhece este convite, por favor ignore este email.<br>
                Caso o botao nao funcione, copie e cole o link abaixo no navegador:<br>
                <a href="${registerUrl}" style="color:#1e40af;word-break:break-all;">${registerUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Attrio - Sistema de Gestao Condominial
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
