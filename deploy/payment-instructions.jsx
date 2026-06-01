/* payment-instructions.jsx — PeakForm Bio
   ────────────────────────────────────────────────────────────────────────────
   Buyer-facing "Awaiting payment" card shown on the order-confirmation screen
   and in order tracking. Lists your direct-payment methods (Venmo / Zelle /
   Cash App / PayPal / crypto), the exact amount due, and an order reference for
   the payment memo — with copy buttons and an "I've sent payment" action.

   Exposes:
     window.loadPaymentMethods(sb)  → Promise<method[]>  (server value or defaults)
     window.PaymentInstructions     → React component
   Depends on payment-config.js (window.PFB_PAYMENT, window.visiblePaymentMethods).
   ──────────────────────────────────────────────────────────────────────────── */
(function (global) {
  const { useState } = React;

  // Read admin-saved methods from app_settings; fall back to baked-in defaults.
  global.loadPaymentMethods = async function (sb) {
    const defaults = (global.PFB_PAYMENT && global.PFB_PAYMENT.methods) || [];
    if (!sb) return defaults;
    try {
      const { data, error } = await sb.from('app_settings')
        .select('*').eq('key', 'payment_methods').maybeSingle();
      if (error || !data || !data.value) return defaults;
      const val = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return Array.isArray(val) && val.length ? val : defaults;
    } catch (e) {
      return defaults;
    }
  };

  const copyText = (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    } catch (e) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    } catch (e) {}
    return Promise.resolve();
  };

  const CopyBtn = ({ value }) => {
    const [done, setDone] = useState(false);
    if (!value) return null;
    return (
      <button type="button" onClick={() => { copyText(value); setDone(true); setTimeout(() => setDone(false), 1400); }}
        style={{ flexShrink: 0, fontFamily: 'inherit', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(41,151,255,0.5)',
          background: done ? 'rgba(52,199,89,0.16)' : 'transparent', color: done ? '#34c759' : '#2997ff', whiteSpace: 'nowrap' }}>
        {done ? '✓ Copied' : 'Copy'}
      </button>
    );
  };

  const MethodCard = ({ m, amount, highlight, linksEnabled = true }) => {
    const isHandle = m.kind === 'handle' || m.kind === 'crypto';
    const link = global.paymentLink ? global.paymentLink(m, amount) : null;
    return (
      <div style={{
        border: `1px solid ${highlight ? 'rgba(41,151,255,0.55)' : 'rgba(255,255,255,0.09)'}`,
        background: highlight ? 'rgba(41,151,255,0.08)' : 'rgba(255,255,255,0.03)',
        borderRadius: 12, padding: '13px 15px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: isHandle ? 8 : 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>{m.label}</span>
            {m.network && <span style={{ fontSize: 11, fontWeight: 600, color: '#ff9f0a', background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 999, padding: '1px 8px' }}>{m.network}</span>}
            {highlight && <span style={{ fontSize: 11, fontWeight: 600, color: '#2997ff' }}>· your pick</span>}
          </div>
        </div>
        {isHandle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{ flex: 1, minWidth: 0, fontFamily: 'ui-monospace,monospace', fontSize: 14, color: '#fff',
              background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 11px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.handle}</code>
            <CopyBtn value={m.handle} />
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer"
                onClick={(e) => { if (!linksEnabled) e.preventDefault(); }}
                aria-disabled={!linksEnabled}
                style={{ flexShrink: 0, textDecoration: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                  padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0066cc', color: '#fff', whiteSpace: 'nowrap',
                  pointerEvents: linksEnabled ? 'auto' : 'none', opacity: linksEnabled ? 1 : 0.4 }}>
                Open {m.label} ↗
              </a>
            )}
          </div>
        )}
        {m.id === 'zelle' && (
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 7 }}>
            Zelle is sent from inside your bank’s app — copy the detail above.
          </div>
        )}
        {m.hint && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.45 }}>{m.hint}</div>}
      </div>
    );
  };

  /* Props:
       amountDue   number   (optional) — shown big if > 0
       reference   string   — order ref for the memo
       methods     array    — already filtered to what the buyer should see
       chosenId    string   — method id the buyer selected at checkout (highlighted)
       reported    bool     — buyer already tapped "I've sent payment"
       onReported  fn       — called when buyer taps "I've sent payment"
       businessName string  */
  const PaymentInstructions = ({ amountDue, reference, methods, chosenId, reported, onReported, businessName }) => {
    const cfg = global.PFB_PAYMENT || {};
    const [ackName, setAckName] = useState(false);
    const list = (methods && methods.length ? methods : global.visiblePaymentMethods(cfg.methods));
    const direct = list.filter(m => m.kind === 'handle' || m.kind === 'crypto');
    const invoice = list.find(m => m.kind === 'invoice');
    const other = list.find(m => m.kind === 'note');
    const chosen = list.find(m => m.id === chosenId);
    const chosenIsInvoice = chosen && chosen.kind === 'invoice';

    return (
      <div className="card" style={{ borderColor: 'rgba(41,151,255,0.25)', background: 'rgba(41,151,255,0.04)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#ff9f0a', background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.28)', borderRadius: 999, padding: '3px 11px' }}>
            Awaiting payment
          </span>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em', margin: '8px 0 4px' }}>
          {chosenIsInvoice ? 'Your order is in — invoice on the way' : 'Almost done — send your payment'}
        </h3>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginBottom: 18 }}>
          {chosenIsInvoice
            ? `We’ll email and text a secure invoice shortly. Your order is reserved.`
            : `Your order is reserved. Send payment using any method below, then tap “I’ve sent payment.” We’ll confirm and ship.`}
        </p>

        {/* Amount + reference */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {amountDue > 0 && (
            <div style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 15px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Amount due</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>${Number(amountDue).toFixed(2)}</div>
            </div>
          )}
          {reference && (
            <div style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 15px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Payment reference</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ fontFamily: 'ui-monospace,monospace', fontSize: 17, fontWeight: 700, color: '#fff' }}>{reference}</code>
                <CopyBtn value={reference} />
              </div>
            </div>
          )}
        </div>

        {/* Chosen direct method only — they already picked at checkout */}
        {!chosenIsInvoice && chosen && (chosen.kind === 'handle' || chosen.kind === 'crypto') && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Pay with {chosen.label}</div>

            {/* Privacy disclaimer + mandatory acknowledgement (gates the pay button) */}
            <div style={{ fontSize: 13, color: '#ffd27a', marginBottom: 12, lineHeight: 1.5, background: 'rgba(255,184,77,0.08)', border: '1px solid rgba(255,184,77,0.28)', borderRadius: 10, padding: '11px 13px' }}>
              <strong style={{ color: '#ffd27a' }}>For your privacy:</strong> put <strong>ONLY your name</strong> in the payment note — do <strong>not</strong> include any product names or details.
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 14, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
              <input type="checkbox" checked={ackName} onChange={(e) => setAckName(e.target.checked)}
                style={{ width: 17, height: 17, marginTop: 1, accentColor: '#0066cc', flexShrink: 0 }} />
              <span>I've read this and will put <strong>only my name</strong> in the payment note.</span>
            </label>

            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              <MethodCard m={chosen} amount={amountDue} highlight linksEnabled={ackName} />
            </div>
          </>
        )}

        {/* Memo reminder */}
        {!chosenIsInvoice && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'rgba(255,159,10,0.07)', border: '1px solid rgba(255,159,10,0.2)', borderRadius: 10, padding: '11px 13px', marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>📝</span>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
              After you send payment, tap <strong style={{ color: '#fff' }}>“I’ve sent payment”</strong> below so we can match it to your order and ship it out.
            </div>
          </div>
        )}

        {/* Other / invoice fallbacks */}
        {chosenIsInvoice && invoice && invoice.hint && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginBottom: 16 }}>{invoice.hint}</div>
        )}

        {/* Action */}
        {!chosenIsInvoice && (
          reported ? (
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.28)', borderRadius: 12, padding: '13px 15px' }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <div style={{ fontSize: 13.5, color: '#a6f2bd', lineHeight: 1.5 }}>
                <strong style={{ color: '#a6f2bd', fontWeight: 600 }}>Thanks — payment flagged.</strong> We’ll verify it and ship your order. You’ll see the status update here.
              </div>
            </div>
          ) : (
            <button className="btn-blue" onClick={onReported} style={{ width: '100%', padding: '13px 24px', fontSize: 15, fontWeight: 600 }}>
              I’ve sent payment
            </button>
          )
        )}
      </div>
    );
  };

  global.PaymentInstructions = PaymentInstructions;
})(window);
