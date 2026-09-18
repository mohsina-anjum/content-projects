import nodemailer from 'nodemailer';

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5173';

interface InviteEmailResult {
  sent: boolean;
  reason?: string;
}

function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendChecklistInviteEmail(hire: {
  id: number;
  name: string;
  email: string | null;
  agendaName: string;
}): Promise<InviteEmailResult> {
  const link = `${APP_BASE_URL}/checklist/${hire.id}`;

  if (!hire.email) {
    console.log(`[email] Skipped invite for ${hire.name} (id ${hire.id}) — no email on file. Link: ${link}`);
    return { sent: false, reason: 'no_email_on_file' };
  }

  const subject = `Your onboarding checklist: ${hire.agendaName}`;
  const text = `Hi ${hire.name},\n\nYou've been assigned "${hire.agendaName}". Access your checklist here:\n${link}\n\n— Builder Prime`;
  const html = `<p>Hi ${hire.name},</p><p>You've been assigned <strong>${hire.agendaName}</strong>. Access your checklist here:</p><p><a href="${link}">${link}</a></p><p>— Builder Prime</p>`;

  const transport = buildTransport();
  if (!transport) {
    console.log(
      `[email] SMTP not configured — would have sent invite to ${hire.email} (${hire.name}). Link: ${link}`
    );
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: hire.email,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send invite email:', err);
    return { sent: false, reason: 'send_failed' };
  }
}
