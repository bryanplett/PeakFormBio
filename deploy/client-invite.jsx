// ClientInvite — coach-side helper to onboard a new client.
// Creates the client account with email + password, then shows the credentials.

const { useState } = React;

function ClientInvite({ sb, onInvited, onCancel }) {
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy]   = useState(false);
  const [msg,  setMsg]    = useState(null);            // { kind: 'ok'|'err', text, creds? }
  const [copied, setCopied] = useState(false);

  const portalUrl = window.location.origin + '/ClientPortal.html';

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);

    const email    = form.email.trim().toLowerCase();
    const name     = form.name.trim();
    const phone    = form.phone.trim();
    const password = form.password;

    if (!email || !name) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Name and email are required.' });
      return;
    }
    if (!password || password.length < 8) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }

    const { error: signUpErr } = await sb.auth.signUp({
      email, password,
      options: { data: { name, phone: phone || null } },
    });
    if (signUpErr) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Could not create account: ' + signUpErr.message });
      return;
    }

    setBusy(false);
    setMsg({
      kind: 'ok',
      text: `Account created for ${email}.`,
      creds: { email, password, portalUrl },
    });
    setForm({ name: '', email: '', phone: '', password: '' });
    onInvited && onInvited();
  };

  const copyText = async (text, label = 'value') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(label); setTimeout(() => setCopied(false), 2000); }
      catch { window.prompt('Copy this:', text); }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Onboard a new client</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
          Create their account with a password, then share the credentials with them.
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <input className="field-input" placeholder="Full name" required
          value={form.name} onChange={e => setField('name', e.target.value)} />
        <input className="field-input" placeholder="email@example.com" type="email" required
          value={form.email} onChange={e => setField('email', e.target.value)} />
        <input className="field-input" placeholder="Phone (optional)"
          value={form.phone} onChange={e => setField('phone', e.target.value)} />
        <input className="field-input" placeholder="Password (≥ 8 chars)" type="text" required
          value={form.password} onChange={e => setField('password', e.target.value)}
          style={{ gridColumn: '1 / -1' }} />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: msg ? 14 : 0, flexWrap: 'wrap' }}>
        <button type="button" className="btn-blue" disabled={busy} onClick={submit}
          style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => copyText(portalUrl, 'portal')} className="btn-ghost"
          style={{ fontSize: 12 }} title={portalUrl}>
          {copied === 'portal' ? '✓ Copied portal link' : 'Copy portal link'}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.55,
          background: msg.kind === 'ok' ? 'rgba(52,199,89,0.10)' : 'rgba(255,69,58,0.10)',
          border:     msg.kind === 'ok' ? '1px solid rgba(52,199,89,0.30)' : '1px solid rgba(255,69,58,0.30)',
          color:      msg.kind === 'ok' ? '#34c759' : '#ff453a',
        }}>
          <div>{msg.text}</div>

          {msg.creds && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 6,
              background: 'rgba(0,0,0,0.3)', color: '#f5f5f7',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 12, lineHeight: 1.7,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><span style={{ color: 'rgba(255,255,255,0.45)' }}>Portal:</span> {msg.creds.portalUrl}</span>
                <button type="button" onClick={() => copyText(msg.creds.portalUrl, 'creds-url')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#f5f5f7', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {copied === 'creds-url' ? '✓' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><span style={{ color: 'rgba(255,255,255,0.45)' }}>Email:</span> {msg.creds.email}</span>
                <button type="button" onClick={() => copyText(msg.creds.email, 'creds-email')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#f5f5f7', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {copied === 'creds-email' ? '✓' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><span style={{ color: 'rgba(255,255,255,0.45)' }}>Password:</span> {msg.creds.password}</span>
                <button type="button" onClick={() => copyText(msg.creds.password, 'creds-pw')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#f5f5f7', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {copied === 'creds-pw' ? '✓' : 'Copy'}
                </button>
              </div>
             <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
               <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.creds.email)}&su=${encodeURIComponent('Welcome to PeakForm Bio — your portal access')}&body=${encodeURIComponent(`Welcome to PeakForm Bio. Sign in here:\n${msg.creds.portalUrl}\n\nEmail: ${msg.creds.email}\nPassword: ${msg.creds.password}\n\nUse the "Use email & password" option on the sign-in screen.`)}`}
                  target="_blank" rel="noopener"
                  style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: 'rgba(0,102,204,0.45)', border: '1px solid rgba(0,102,204,0.65)', borderRadius: 4, color: '#fff', fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}>
                  ✉ Send welcome email
                </a>
                <button type="button" onClick={() => copyText(
                  `Welcome to PeakForm Bio. Sign in here:\n${msg.creds.portalUrl}\n\nEmail: ${msg.creds.email}\nPassword: ${msg.creds.password}\n\nUse the "Use email & password" option on the sign-in screen.`,
                  'creds-all'
                )}
                  style={{ flex: 1, background: 'rgba(0,102,204,0.25)', border: '1px solid rgba(0,102,204,0.45)', borderRadius: 4, color: '#fff', fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}>
                  {copied === 'creds-all' ? '✓ Copied' : 'Copy for SMS/other'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

window.ClientInvite = ClientInvite;
