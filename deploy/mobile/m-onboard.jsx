/* m-onboard.jsx — Onboard a new client → window.MOnboard
   Mirrors desktop ClientInvite (sb.auth.signUp) + pricelist assignment
   + one-tap share of credentials. */
(function () {
  const { Icon, Overlay, copyText, shareText, useToast } = window.MUI;

  function genPassword() {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ', b = 'abcdefghijkmnpqrstuvwxyz', d = '23456789', s = '!@#$%';
    const pick = (set, n) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('');
    const raw = (pick(a, 2) + pick(b, 4) + pick(d, 3) + pick(s, 1)).split('');
    for (let i = raw.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [raw[i], raw[j]] = [raw[j], raw[i]]; }
    return raw.join('');
  }

  function Field({ label, children }) {
    return <div style={{ marginBottom: 14 }}><label className="field-label">{label}</label>{children}</div>;
  }

  function CredRow({ k, v, onCopy }) {
    return (
      <div className="kv" style={{ alignItems: 'center' }}>
        <span className="kv__k">{k}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="kv__v" style={{ wordBreak: 'break-all' }}>{v}</span>
          <button className="iconbtn" style={{ width: 32, height: 32, flex: '0 0 32px' }} onClick={onCopy} aria-label={'Copy ' + k}>
            <Icon name="copy" size={17} />
          </button>
        </span>
      </div>
    );
  }

  function MOnboard({ sb, onClose, onDone }) {
    const pricelistOptions = (typeof window.getPricelistOptions === 'function')
      ? window.getPricelistOptions()
      : [{ value: 'standard', label: 'Standard' }, { value: 'wholesale', label: 'Wholesale' }];

    const [form, setForm] = React.useState({ name: '', email: '', phone: '', password: '', pricelist: 'standard' });
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const [done, setDone] = React.useState(null); // { email, password, portalUrl, name }
    const [toast, showToast] = useToast();

    const portalUrl = window.location.origin + '/ClientPortal.html';
    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async () => {
      setErr('');
      const email = form.email.trim().toLowerCase();
      const name = form.name.trim();
      const phone = form.phone.trim();
      const password = form.password;
      if (!name || !email) { setErr('Name and email are required.'); return; }
      if (!password || password.length < 8) { setErr('Password must be at least 8 characters.'); return; }

      setBusy(true);
      const { error: signUpErr } = await sb.auth.signUp({
        email, password, options: { data: { name, phone: phone || null } },
      });
      if (signUpErr) { setBusy(false); setErr('Could not create account: ' + signUpErr.message); return; }

      // Assign a non-default pricelist if chosen (best-effort).
      if (form.pricelist && form.pricelist !== 'standard') {
        try {
          const { data: row } = await sb.from('clients').select('id').eq('email', email).maybeSingle();
          if (row && row.id) await sb.from('clients').update({ pricelist: form.pricelist }).eq('id', row.id);
        } catch (_) { /* non-fatal */ }
      }

      setBusy(false);
      setDone({ email, password, portalUrl, name });
      onDone && onDone();
    };

    const shareMsg = (d) =>
      `Welcome to PeakForm Bio, ${d.name}!\n\n` +
      `Your client portal login:\n` +
      `Site: ${d.portalUrl}\n` +
      `Email: ${d.email}\n` +
      `Password: ${d.password}\n\n` +
      `You can change your password after signing in.`;

    const onShare = async (d) => {
      const res = await shareText(shareMsg(d), 'PeakForm Bio — your login');
      if (res === 'copied') showToast('Credentials copied to clipboard');
      else if (res === 'fail') showToast('Could not share');
    };

    const headRight = (
      <button className="iconbtn iconbtn--accent" onClick={() => { setForm({ name: '', email: '', phone: '', password: '', pricelist: 'standard' }); setDone(null); setErr(''); }}
        aria-label="New" style={{ display: done ? 'inline-flex' : 'none' }}>
        <Icon name="add" />
      </button>
    );

    return (
      <Overlay title="Onboard client" onClose={onClose} headRight={headRight}>
        {!done && (
          <div className="fade-in">
            <p style={{ fontSize: 14, color: 'var(--ink-60)', lineHeight: 1.5, margin: '4px 2px 18px' }}>
              Create their account, then share the login. They'll see it in their client portal right away.
            </p>

            <Field label="Full name">
              <input className="field-input" placeholder="Jane Doe" value={form.name} onChange={e => setField('name', e.target.value)} autoCapitalize="words" />
            </Field>
            <Field label="Email">
              <input className="field-input" type="email" placeholder="jane@example.com" value={form.email}
                onChange={e => setField('email', e.target.value)} autoCapitalize="none" autoCorrect="off" />
            </Field>
            <Field label="Phone (optional)">
              <input className="field-input" type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={e => setField('phone', e.target.value)} />
            </Field>
            <Field label="Password">
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="field-input" type="text" placeholder="≥ 8 characters" value={form.password}
                  onChange={e => setField('password', e.target.value)} autoCapitalize="none" autoCorrect="off" style={{ flex: 1 }} />
                <button className="btn btn--neutral" style={{ flex: '0 0 auto', padding: '0 14px', borderRadius: 12 }}
                  onClick={() => setField('password', genPassword())}>
                  <Icon name="dice" size={18} /> Generate
                </button>
              </div>
            </Field>
            <Field label="Pricelist">
              <select className="field-input" value={form.pricelist} onChange={e => setField('pricelist', e.target.value)}>
                {pricelistOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            {err && (
              <div style={{ background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.3)',
                borderRadius: 12, padding: '11px 14px', fontSize: 13.5, color: 'var(--danger)', marginBottom: 14 }}>{err}</div>
            )}

            <button className="btn btn--blue btn--block" disabled={busy} onClick={submit} style={{ marginTop: 4 }}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        )}

        {done && (
          <div className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 18px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(52,199,89,0.14)', color: 'var(--ok)', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={28} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Account created</div>
              <div style={{ fontSize: 14, color: 'var(--ink-60)', textAlign: 'center' }}>Share these credentials with {done.name}.</div>
            </div>

            <div className="card" style={{ padding: 14, marginBottom: 16 }}>
              <CredRow k="Portal" v={done.portalUrl} onCopy={async () => { await copyText(done.portalUrl); showToast('Portal link copied'); }} />
              <CredRow k="Email" v={done.email} onCopy={async () => { await copyText(done.email); showToast('Email copied'); }} />
              <CredRow k="Password" v={done.password} onCopy={async () => { await copyText(done.password); showToast('Password copied'); }} />
            </div>

            <button className="btn btn--blue btn--block" onClick={() => onShare(done)} style={{ marginBottom: 10 }}>
              <Icon name="share" size={19} /> Share to client
            </button>
            <button className="btn btn--tonal btn--block" onClick={async () => { await copyText(shareMsg(done)); showToast('Full message copied'); }}>
              <Icon name="copy" size={18} /> Copy full message
            </button>

            <button className="btn btn--neutral btn--block" style={{ marginTop: 18 }}
              onClick={() => { setForm({ name: '', email: '', phone: '', password: '', pricelist: 'standard' }); setDone(null); setErr(''); }}>
              <Icon name="add" size={18} /> Onboard another
            </button>
          </div>
        )}
        {toast}
      </Overlay>
    );
  }

  window.MOnboard = { MOnboard };
})();
