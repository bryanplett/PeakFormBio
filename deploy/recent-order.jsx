// "Your recent order — awaiting payment" banner + pay modal for the client portal.
// Lets clients get back to their payment links after leaving the page.
// Totals/method for each reference are saved in localStorage when the order is
// placed (window.pfbRememberOrder); falls back to the order rows if missing.

(function (global) {
  const KEY = 'pfb_recent_orders_v1';
  const readSaved = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };

  global.pfbRememberOrder = (o) => {
    if (!o || !o.reference) return;
    const all = readSaved();
    all[o.reference] = { total: o.total, methodId: o.methodId, placedAt: new Date().toISOString() };
    global.__pfbJustPlaced = o.reference;
    const keys = Object.keys(all).sort((a, b) => (all[b].placedAt || '').localeCompare(all[a].placedAt || ''));
    keys.slice(15).forEach(k => delete all[k]);
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {}
    global.dispatchEvent(new Event('pfb-recent-order'));
  };

  const PAID = ['paid', 'reported', 'invoiced'];
  const CLOSED = ['shipped', 'completed', 'delivered', 'cancelled', 'paid', 'invoiced'];

  // Group raw order rows by reference → unpaid, recent (30 days) orders, newest first.
  const unpaidGroups = (rows) => {
    const m = new Map();
    (rows || []).forEach(o => {
      if (!o.order_reference) return;
      if (CLOSED.includes(o.status || 'pending') || PAID.includes(o.payment_status)) return;
      if (!m.has(o.order_reference)) m.set(o.order_reference, []);
      m.get(o.order_reference).push(o);
    });
    const cutoff = Date.now() - 30 * 864e5;
    return [...m.values()]
      .filter(g => new Date(g[0].ordered_at || g[0].created_at || 0).getTime() > cutoff)
      .sort((a, b) => new Date(b[0].ordered_at || b[0].created_at || 0) - new Date(a[0].ordered_at || a[0].created_at || 0));
  };

  const rowTotal = (g) => {
    let sum = 0, any = false;
    g.forEach(o => {
      const v = Number(o.line_total ?? o.total_price ?? o.total ?? (o.price != null ? o.price * (o.quantity || 1) : NaN));
      if (Number.isFinite(v)) { sum += v; any = true; }
    });
    const ship = Number(g[0].shipping_cost);
    if (any && Number.isFinite(ship)) sum += ship;
    return any ? sum : 0;
  };

  const RecentOrderPay = ({ sb, rawOrders, methods, hideJustPlaced }) => {
    const [saved, setSaved] = React.useState(readSaved);
    const [open, setOpen] = React.useState(null);
    const [reportedRefs, setReportedRefs] = React.useState({});
    React.useEffect(() => {
      const f = () => setSaved(readSaved());
      global.addEventListener('pfb-recent-order', f);
      return () => global.removeEventListener('pfb-recent-order', f);
    }, []);

    const groups = unpaidGroups(rawOrders).filter(g => !reportedRefs[g[0].order_reference]);
    if (!groups.length) return null;

    const list = methods && methods.length ? methods : (global.visiblePaymentMethods ? global.visiblePaymentMethods((global.PFB_PAYMENT || {}).methods) : []);
    const info = (g) => {
      const ref = g[0].order_reference;
      const s = saved[ref] || {};
      const label = String(g[0].payment_method || '');
      const byLabel = list.find(m => m.label && (label === m.label || label.toLowerCase().startsWith(String(m.label).toLowerCase())));
      return {
        ref, items: g.map(o => `${o.quantity || 1}× ${o.product}`),
        total: s.total || rowTotal(g),
        methodId: s.methodId || (byLabel && byLabel.id) || '',
        isInvoice: (byLabel && byLabel.kind === 'invoice') || /invoice|card/i.test(label),
        date: new Date(g[0].ordered_at || g[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    };
    const shown = groups.map(info).filter(x => !x.isInvoice && !(hideJustPlaced && x.ref === global.__pfbJustPlaced));
    if (!shown.length) return null;
    const cur = open && shown.find(x => x.ref === open);

    const onReported = async () => {
      const g = groups.find(x => x[0].order_reference === open) || [];
      for (const o of g) {
        try { await sb.from('orders').update({ payment_status: 'reported' }).eq('id', o.id); } catch (e) {}
      }
      setReportedRefs(r => ({ ...r, [open]: true }));
      setOpen(null);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {shown.map(x => (
          <div key={x.ref} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '16px 20px',
            borderColor: 'rgba(255,159,10,0.35)', background: 'rgba(255,159,10,0.06)' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff9f0a',
                  background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.28)', borderRadius: 999, padding: '3px 10px' }}>Awaiting payment</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{x.date}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7' }}>
                Order {x.ref}{x.total > 0 ? ` · $${Number(x.total).toFixed(2)}` : ''}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, textWrap: 'pretty' }}>{x.items.join(', ')}</div>
            </div>
            <button className="btn-primary" type="button" onClick={() => setOpen(x.ref)}
              style={{ flexShrink: 0, padding: '11px 22px', fontSize: 15 }}>Pay now</button>
          </div>
        ))}

        {cur && global.PaymentInstructions && (
          <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            overflowY: 'auto', padding: '40px 16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close"
                style={{ position: 'absolute', top: -14, right: -6, zIndex: 2, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                  background: '#1a1a1c', border: '1px solid rgba(255,255,255,0.15)', color: '#f5f5f7', fontSize: 18, fontFamily: 'inherit' }}>×</button>
              <global.PaymentInstructions
                amountDue={cur.total}
                reference={cur.ref}
                methods={list}
                chosenId={cur.methodId}
                reported={false}
                onReported={onReported}
                businessName={(global.PFB_PAYMENT && global.PFB_PAYMENT.businessName) || 'PeakForm Bio'}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  global.RecentOrderPay = RecentOrderPay;
})(window);
