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

export async function sendModerationNotificationEmail(opts: {
  clientEmail: string;
  clientName: string;
  desmancheEmail: string;
  desmancheName: string;
  orderTitle: string;
  negotiationId: string;
}) {
  const { clientEmail, clientName, desmancheEmail, desmancheName, orderTitle, negotiationId } = opts;
  const appUrl = getAppUrl();

  const sharedBody = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <span style="font-size:28px;">⚖️</span>
        <h2 style="color:#1e293b;margin:0;">Negociação em Moderação</h2>
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="color:#9a3412;font-weight:600;margin:0 0 6px 0;font-size:14px;">📦 Pedido</p>
        <p style="color:#7c2d12;margin:0;font-size:14px;">${orderTitle}</p>
      </div>
  `;

  const sharedFooter = `
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
        Você receberá outra notificação assim que a moderação encerrar o caso.<br/>
        <a href="${appUrl}" style="color:#f97316;">Acessar plataforma</a> · Referência: <code>${negotiationId}</code>
      </p>
    </div>
  `;

  const results = await Promise.allSettled([
    sendMail(
      clientEmail,
      "Sua negociação está em moderação — Central dos Desmanches",
      `${sharedBody}
      <p style="color:#475569;">Olá, <strong>${clientName}</strong>!</p>
      <p style="color:#475569;">
        Detectamos uma divergência entre as informações fornecidas pelo desmanche e as suas sobre o pedido acima.
        Por isso, a negociação foi encaminhada para análise pela nossa equipe de moderação.
      </p>
      <p style="color:#475569;">
        <strong>O que acontece agora?</strong><br/>
        Nossa equipe irá revisar o caso e tomar a decisão mais justa para ambas as partes.
        Você não precisa fazer nada — aguarde nosso contato.
      </p>
    ${sharedFooter}`
    ),
    sendMail(
      desmancheEmail,
      "Negociação encaminhada à moderação — Central dos Desmanches",
      `${sharedBody}
      <p style="color:#475569;">Olá, <strong>${desmancheName}</strong>!</p>
      <p style="color:#475569;">
        Detectamos uma divergência entre as informações que você forneceu e as do cliente sobre o pedido acima.
        A negociação foi encaminhada para análise pela nossa equipe de moderação.
      </p>
      <p style="color:#475569;">
        <strong>O que acontece agora?</strong><br/>
        Nossa equipe irá revisar o caso e tomar a decisão mais justa para ambas as partes.
        Você não precisa fazer nada — aguarde nosso contato.
      </p>
    ${sharedFooter}`
    ),
  ]);

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const recipient = i === 0 ? clientEmail : desmancheEmail;
      console.error(`Moderation email failed for ${recipient}:`, result.reason);
    }
  });
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
