import nodemailer from "nodemailer";

function getAppUrl() {
  return process.env.APP_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

async function sendMail(to: string, subject: string, html: string) {
  const transport = createTransport();
  const from = process.env.SMTP_FROM || "Central dos Desmanches <noreply@centraldesmanches.com.br>";
  if (!transport) {
    console.log(`\n📧 [EMAIL - sem SMTP configurado]\nPara: ${to}\nAssunto: ${subject}\n${html.replace(/<[^>]+>/g, " ")}\n`);
    return;
  }
  await transport.sendMail({ from, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${getAppUrl()}/verificar-email?token=${token}`;
  await sendMail(
    to,
    "Confirme seu email — Central dos Desmanches",
    `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#1e293b;margin-bottom:8px;">Confirme seu e-mail</h2>
      <p style="color:#475569;">Olá! Clique no botão abaixo para ativar sua conta na <strong>Central dos Desmanches</strong>.</p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Verificar meu e-mail
      </a>
      <p style="color:#94a3b8;font-size:13px;">O link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Ou copie e cole este link:<br/><a href="${link}" style="color:#f97316;">${link}</a></p>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${getAppUrl()}/redefinir-senha?token=${token}`;
  await sendMail(
    to,
    "Redefinição de senha — Central dos Desmanches",
    `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
      <h2 style="color:#1e293b;margin-bottom:8px;">Redefinir senha</h2>
      <p style="color:#475569;">Recebemos uma solicitação de redefinição de senha para a sua conta na <strong>Central dos Desmanches</strong>.</p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Redefinir minha senha
      </a>
      <p style="color:#94a3b8;font-size:13px;">O link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Ou copie e cole este link:<br/><a href="${link}" style="color:#f97316;">${link}</a></p>
    </div>
    `
  );
}
