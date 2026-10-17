// Fulfillment assignments: "Sent Kaia / Victor / Melissa" checklist modal + Fulfillment board.
// Persists to the backend (/api/admin/fulfillment/*), which stores in app_settings
// and sends the email + SMS.

const FA_TEAM = ['Kaia', 'Victor', 'Melissa'];
const FA_EXTRAS = ['Syringes/Wipes', 'BAC water', 'Reconstitution syringe', 'Recon sticker', 'Info Sheet', 'Pack for shipment', 'Pickup SJ', 'Pickup MH', 'Pickup MV'];
const faToken = () => localStorage.getItem('_pfb_token');
const faApi = async (path, opts = {}) => {
  const r = await fetch('/api/admin/fulfillment/' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + faToken(), ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'Request failed');
  return j;
};
const faIsShipped = (o) => !!o && !!o.shipping_address && !String(o.shipping_method || '').startsWith('Pickup');
const faItemLines = (orders) => orders.map(o => {
  const qty = parseInt(o.quantity ?? o.qty ?? 1, 10) || 1;
  return `${qty}× ${o.product || o.item || 'Item'}`;
});
const faGroupKey = (orders) => String(orders[0].order_reference || orders[0].id);

const faS = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28, color: '#f5f5f7' },
  label: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' },
  box: (on) => ({ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: on ? 'none' : '1.5px solid rgba(255,255,255,0.3)', background: on ? '#2997ff' : 'transparent', color: '#fff', fontSize: 13, fontWeight: 700 }),
};

const FaCheckRow = ({ on, label, onToggle }) => (
  <div style={{ ...faS.row, borderColor: on ? 'rgba(41,151,255,0.4)' : 'rgba(255,255,255,0.06)' }} onClick={onToggle}>
    <span style={faS.box(on)}>{on ? '✓' : ''}</span>
    <span>{label}</span>
  </div>
);

// ── Checklist modal ─────────────────────────────────────────────────────────
window.FulfillmentChecklistModal = ({ orders, assignee, clientName, onCancel, onDone }) => {
  const first = orders[0];
  const itemLines = faItemLines(orders);
  const all = [...itemLines, ...FA_EXTRAS];
  const [checked, setChecked] = React.useState({});
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const shipped = faIsShipped(first);
  const toggle = (k) => setChecked(c => ({ ...c, [k]: !c[k] }));
  const picked = all.filter(k => checked[k]);

  const send = async () => {
    if (!picked.length) { setError('Check at least one item.'); return; }
    setSending(true); setError('');
    try {
      const res = await faApi('assign', { method: 'POST', body: JSON.stringify({
        key: faGroupKey(orders), assignee, orderRef: first.order_reference || '', clientName: clientName || '',
        items: picked, note, shippingMethod: first.shipping_method || '',
        address: shipped ? first.shipping_address : '',
      }) });
      onDone(res);
    } catch (e) { setError(e.message); setSending(false); }
  };

  return (
    <div style={faS.overlay} onClick={onCancel}>
      <div style={faS.modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: '#2997ff', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Send to {assignee}</div>
        <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>{first.order_reference || 'Order'}</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 22 }}>{clientName}{first.shipping_method ? ` · ${first.shipping_method}` : ''}</p>

        <span style={faS.label}>Items on this order</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {itemLines.map(k => <FaCheckRow key={k} label={k} on={!!checked[k]} onToggle={() => toggle(k)} />)}
        </div>
        <span style={faS.label}>Also include</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {FA_EXTRAS.map(k => <FaCheckRow key={k} label={k} on={!!checked[k]} onToggle={() => toggle(k)} />)}
        </div>

        {shipped && (
          <div style={{ marginBottom: 20 }}>
            <span style={faS.label}>Ship to (included in message)</span>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '11px 14px', lineHeight: 1.5 }}>{first.shipping_address}</div>
          </div>
        )}
        <span style={faS.label}>Note for {assignee} (optional)</span>
        <textarea className="field-input" rows={2} value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', resize: 'vertical', marginBottom: 18 }} />

        {error && <div style={{ color: '#ff453a', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel} disabled={sending}>Cancel</button>
          <button className="btn-primary" onClick={send} disabled={sending || !picked.length} style={{ opacity: picked.length ? 1 : 0.5 }}>
            {sending ? 'Sending…' : `Send to ${assignee} (${picked.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Fulfillment board (Orders → Fulfillment) ───────────────────────────────
window.FulfillmentBoard = ({ sb, clients, onBack }) => {
  const [orders, setOrders] = React.useState(null);
  const [assign, setAssign] = React.useState({});
  const [team, setTeam] = React.useState({});
  const [showTeam, setShowTeam] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState('');
  const clientById = React.useMemo(() => Object.fromEntries((clients || []).map(c => [c.id, c])), [clients]);

  const load = React.useCallback(async () => {
    setOrders(null);
    const [{ data }, a] = await Promise.all([sb.from('orders').select('*'), faApi('assignments').catch(() => ({}))]);
    setOrders((data || []).filter(o => !['completed', 'cancelled'].includes(o.status)));
    setAssign(a.assignments || {});
    setTeam(a.team || {});
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const groups = React.useMemo(() => {
    const m = new Map();
    (orders || []).forEach(o => {
      const k = String(o.order_reference || o.id);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(o);
    });
    return [...m.values()].sort((a, b) => new Date(b[0].created_at || 0) - new Date(a[0].created_at || 0));
  }, [orders]);

  const saveTeam = async () => {
    try { await faApi('team', { method: 'POST', body: JSON.stringify({ team }) }); setSaveMsg('Saved.'); }
    catch (e) { setSaveMsg('Error: ' + e.message); }
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const filters = ['All', ...FA_TEAM, 'Unassigned'];
  const [filter, setFilter] = React.useState('All');
  const shown = groups.filter(g => {
    const a = assign[faGroupKey(g)];
    if (filter === 'All') return true;
    if (filter === 'Unassigned') return !a;
    return a && a.assignee === filter;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' }}>Fulfillment</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Open orders (not completed) and the instructions sent to each person.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowTeam(s => !s)}>{showTeam ? 'Hide' : 'Team contacts'}</button>
          <button className="btn-ghost" onClick={load}>Refresh</button>
          <button className="btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>

      {showTeam && (
        <div className="card" style={{ marginBottom: 20 }}>
          <span style={faS.label}>Where each person's instructions are sent</span>
          <div style={{ display: 'grid', gap: 12 }}>
            {FA_TEAM.map(n => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr)', gap: 10, alignItems: 'center' }}>
                <strong style={{ fontSize: 14 }}>{n}</strong>
                <input className="field-input" placeholder="Email" value={team[n]?.email || ''} onChange={e => setTeam(t => ({ ...t, [n]: { ...t[n], email: e.target.value } }))} />
                <input className="field-input" placeholder="Mobile (e.g. 4085551234)" value={team[n]?.phone || ''} onChange={e => setTeam(t => ({ ...t, [n]: { ...t[n], phone: e.target.value } }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
            <button className="btn-primary" onClick={saveTeam}>Save contacts</button>
            {saveMsg && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{saveMsg}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
        {filters.map(f => {
          const active = filter === f;
          const n = f === 'All' ? groups.length : f === 'Unassigned' ? groups.filter(g => !assign[faGroupKey(g)]).length : groups.filter(g => assign[faGroupKey(g)]?.assignee === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: active ? 'rgba(41,151,255,0.18)' : 'rgba(255,255,255,0.04)', color: active ? '#2997ff' : 'rgba(255,255,255,0.7)',
              border: '1px solid ' + (active ? 'rgba(41,151,255,0.45)' : 'rgba(255,255,255,0.08)'), borderRadius: 980, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
            }}>{f} <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{n}</span></button>
          );
        })}
      </div>

      {orders === null && <div className="card" style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading…</div>}
      {orders !== null && shown.length === 0 && <div className="card" style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No open orders here.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {shown.map(g => {
          const first = g[0];
          const a = assign[faGroupKey(g)];
          const c = clientById[first.client_id];
          return (
            <div key={faGroupKey(g)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#2997ff', fontWeight: 600 }}>{first.order_reference || '—'}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{c ? (c.name || c.email) : 'Unknown client'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{new Date(first.created_at || first.ordered_at).toLocaleDateString()} · {first.shipping_method || '—'} · {first.status || 'pending'}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 980, padding: '4px 11px', whiteSpace: 'nowrap',
                  background: a ? 'rgba(41,151,255,0.14)' : 'rgba(255,159,10,0.14)', color: a ? '#2997ff' : '#ff9f0a' }}>{a ? `Sent ${a.assignee}` : 'Unassigned'}</span>
              </div>
              {a ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Instructions · {new Date(a.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>{a.items.map(i => <li key={i}>{i}</li>)}</ul>
                  {a.address && <div style={{ fontSize: 13, marginTop: 10, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.75)' }}><strong>Ship to:</strong> {a.address}</div>}
                  {a.note && <div style={{ fontSize: 13, marginTop: 8, color: 'rgba(255,255,255,0.75)' }}><strong>Note:</strong> {a.note}</div>}
                  <div style={{ fontSize: 11.5, marginTop: 10, color: 'rgba(255,255,255,0.4)' }}>Email: {a.emailStatus || '—'} · SMS: {a.smsStatus || '—'}</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  {faItemLines(g).map(l => <div key={l}>{l}</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.FA_TEAM = FA_TEAM;
