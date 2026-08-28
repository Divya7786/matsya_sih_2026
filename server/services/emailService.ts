// Email abstraction — logs gracefully when provider is not configured.
// Credentials come exclusively from environment variables; nothing is hardcoded.

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const provider = (process.env.EMAIL_PROVIDER ?? '').toLowerCase();
  const apiKey = process.env.EMAIL_API_KEY ?? '';
  const from = process.env.EMAIL_FROM || 'noreply@matsya.ai';

  if (!provider || !apiKey) {
    console.log(`[EMAIL] Not configured — would send to <${payload.to}>: "${payload.subject}"`);
    return false;
  }

  try {
    if (provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: from },
          subject: payload.subject,
          content: [{ type: 'text/plain', value: payload.text }],
        }),
      });
      if (!res.ok) throw new Error(`SendGrid HTTP ${res.status}`);
      console.log(`[EMAIL] Sent via SendGrid to ${payload.to}`);
      return true;
    }

    if (provider === 'mailgun') {
      const domain = process.env.EMAIL_DOMAIN ?? '';
      if (!domain) { console.warn('[EMAIL] EMAIL_DOMAIN required for Mailgun'); return false; }
      const body = new URLSearchParams({ from, to: payload.to, subject: payload.subject, text: payload.text });
      const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` },
        body,
      });
      if (!res.ok) throw new Error(`Mailgun HTTP ${res.status}`);
      console.log(`[EMAIL] Sent via Mailgun to ${payload.to}`);
      return true;
    }

    console.warn(`[EMAIL] Unknown provider "${provider}" — email not sent`);
    return false;
  } catch (err: any) {
    console.error('[EMAIL] Send failed:', err.message);
    return false;
  }
}

export async function sendAlertEmail(
  to: string,
  alertTitle: string,
  alertMessage: string,
  region: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `[MATSYA AI Alert] ${alertTitle}`,
    text: `Marine Safety Alert — ${region}\n\n${alertTitle}\n\n${alertMessage}\n\n---\nMATSYA AI Marine Intelligence Platform\nThis is an automated safety notification.`,
    html: `<h2 style="color:#0f766e">Marine Safety Alert — ${region}</h2><h3>${alertTitle}</h3><p>${alertMessage}</p><hr><small>MATSYA AI Marine Intelligence Platform — automated safety notification</small>`,
  });
}
