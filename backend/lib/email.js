// Lightweight email helper. Sends via Resend's HTTP API using built-in fetch,
// so we don't need to install another npm package.
//
// Required env vars on Railway:
//   RESEND_API_KEY        — your Resend API key (starts with "re_")
//   ADMIN_NOTIFY_EMAIL    — where admin notifications get sent
//   EMAIL_FROM (optional) — sender address; defaults to "onboarding@resend.dev"
//                           for testing. Set to "noreply@peakformbio.com" once
//                           you've verified the domain in Resend.

const RESEND_API = 'https://api.resend.com/emails';

export async function sendEmail({ to, subject, html, text, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('sendEmail: RESEND_API_KEY not set; skipping send');
    return { ok: false, skipped: true };
  }

  const fromAddress = from || process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {})
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('Resend send failed (' + res.status + '): ' + body);
      return { ok: false, status: res.status, error: body };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('sendEmail exception:', err);
    return { ok: false, error: err.message };
  }
}

export function notifyAdmin({ subject, html, text }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) {
    console.warn('notifyAdmin: ADMIN_NOTIFY_EMAIL not set; skipping');
    return Promise.resolve({ ok: false, skipped: true });
  }
  return sendEmail({ to, subject, html, text });
}

export function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

