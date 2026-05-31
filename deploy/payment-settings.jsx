/* payment-settings.jsx — PeakForm Bio Admin → Payments
   ────────────────────────────────────────────────────────────────────────────
   Edit the direct-payment handles buyers see at checkout. Saves to the
   `app_settings` table (key = 'payment_methods'); falls back to the baked-in
   defaults from payment-config.js. Requires the 2026_app_settings.sql migration
   for saving to work — until then, buyers still see the defaults and this panel
   shows a clear "run the migration" message on save.
   Exposes: window.PaymentSettings
   ──────────────────────────────────────────────────────────────────────────── */
(function (global) {
  const { useState, useEffect } = React;

  const PaymentSettings = ({ sb, onBack }) => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
      let cancelled = false;
      (async () => {
        const m = await global.loadPaymentMethods(sb);
        if (!cancelled) { setMethods(m.map(x => ({ ...x }))); setLoading(false); }
      })();
      return () => { cancelled = true; };
    }, []);

    const update = (id, patch) => setMethods(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m));

    const save = async () => {
      setSaving(true); setMsg('');
      try {
        const res = await sb.from('app_settings')
          .upsert({ key: 'payment_methods', value: methods, updated_at: new Date().toISOString() }, { onConflict: 'key' })
          .select().single();
        if (res.error) throw res.error;
        setMsg('✓ Saved. Buyers now see these at checkout.');
      } catch (err) {
        const m = (err && err.message) || String(err);
        if (/relation .*app_settings.* does not exist|does not exist|not accessible/i.test(m)) {
          setMsg('Could not save: the app_settings table isn’t set up yet. Run migrations/2026_app_settings.sql on your database (and redeploy the backend), then try again. Buyers still see your default handles in the meantime.');
        } else {
          setMsg('Error: ' + m);
        }
      } finally { setSaving(false); }
    };

    const resetDefaults = () => {
      const d = (global.PFB_PAYMENT && global.PFB_PAYMENT.methods) || [];
      setMethods(d.map(x => ({ ...x })));
      setMsg('Reset to defaults (not saved yet).');
    };

    const kindLabel = { handle: 'Handle / username', crypto: 'Wallet address', invoice: 'Invoice (no handle)', note: 'Other (contact)' };

    return (
      <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
        {onBack && <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>← Back</button>}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f7' }}>Payment methods</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 5, lineHeight: 1.5 }}>
            These are shown to buyers at checkout. Empty handles are hidden from buyers until you fill them in. Toggle off any method you don’t want to offer.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 12 }}>
              {methods.map(m => {
                const needsHandle = m.kind === 'handle' || m.kind === 'crypto';
                const off = !m.enabled;
                return (
                  <div key={m.id} className="card" style={{ padding: 18, opacity: off ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: needsHandle ? 12 : 0, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input value={m.label} onChange={e => update(m.id, { label: e.target.value })}
                          className="field-input" style={{ width: 220, fontWeight: 600, padding: '8px 12px', fontSize: 14 }} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{kindLabel[m.kind] || m.kind}</span>
                      </div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                        <input type="checkbox" checked={!!m.enabled} onChange={e => update(m.id, { enabled: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#0066cc' }} />
                        {m.enabled ? 'Shown' : 'Hidden'}
                      </label>
                    </div>
                    {needsHandle && (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {m.kind === 'crypto' && (
                          <input value={m.network || ''} onChange={e => update(m.id, { network: e.target.value })}
                            className="field-input" placeholder="Network (e.g. Solana (SPL))" style={{ padding: '9px 12px', fontSize: 13.5 }} />
                        )}
                        <input value={m.handle || ''} onChange={e => update(m.id, { handle: e.target.value })}
                          className="field-input" placeholder={m.kind === 'crypto' ? 'Wallet address…' : 'Handle / email / phone…'}
                          style={{ padding: '9px 12px', fontSize: 13.5, fontFamily: 'ui-monospace,monospace' }} />
                        <input value={m.hint || ''} onChange={e => update(m.id, { hint: e.target.value })}
                          className="field-input" placeholder="Optional note shown to buyer (e.g. “Friends & Family”)" style={{ padding: '9px 12px', fontSize: 13 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <button className="btn-blue" onClick={save} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save payment methods'}
              </button>
              <button className="btn-ghost" onClick={resetDefaults}>Reset to defaults</button>
              {msg && <span style={{ fontSize: 13, color: msg.startsWith('✓') ? '#34c759' : msg.startsWith('Error') ? '#ff453a' : 'rgba(255,255,255,0.6)', flex: '1 1 240px', lineHeight: 1.45 }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    );
  };

  global.PaymentSettings = PaymentSettings;
})(window);
