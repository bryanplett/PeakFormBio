// Referrals report — tag clients with who referred them, then tally money
// collected from those clients and the commission owed to each referrer.
//
// Storage: one app_settings row (key='referrals'), no migration needed:
//   { commissionPct: number, clients: { [clientId]: 'Referrer name' } }
// Money collected = PAID orders only (payment status 'paid'), cancelled excluded.
// Order totals reuse Admin.html's computeGroupTotals / groupOrders (exposed on window).

const refStyles = {
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 16px', fontSize: 14, borderTop: '1px solid rgba(255,255,255,0.05)' },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 },
};
const refMoney = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const refIsoDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

window.ReferralsReport = ({ sb, clients, onBack }) => {
  const [settings, setSettings] = React.useState({ commissionPct: 10, clients: {} });
  const [orders, setOrders] = React.useState(null);
  const [coupons, setCoupons] = React.useState([]);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [expanded, setExpanded] = React.useState(null);
  const [msg, setMsg] = React.useState('');
  const [tagQuery, setTagQuery] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const [{ data: s }, { data: ords }, { data: cps }] = await Promise.all([
        sb.from('app_settings').select('*').eq('key', 'referrals').maybeSingle(),
        sb.from('orders').select('*'),
        sb.from('coupons').select('*'),
      ]);
      if (s && s.value) setSettings({ commissionPct: 10, clients: {}, ...s.value });
      setOrders(ords || []);
      setCoupons(cps || []);
    })();
  }, [sb]);

  const persist = async (next) => {
    setSettings(next);
    const { error } = await sb.from('app_settings')
      .upsert({ key: 'referrals', value: next, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select().single();
    setMsg(error ? 'Could not save: ' + error.message : 'Saved');
    setTimeout(() => setMsg(''), 2500);
  };

  const setReferrer = (clientId, name) => {
    const map = { ...(settings.clients || {}) };
    const clean = (name || '').trim();
    if (clean) map[clientId] = clean; else delete map[clientId];
    persist({ ...settings, clients: map });
  };

  const couponsByCode = React.useMemo(() => {
    const m = {};
    coupons.forEach(c => { if (c.code) m[String(c.code).toLowerCase()] = c; });
    return m;
  }, [coupons]);

  const clientById = React.useMemo(() => {
    const m = {};
    (clients || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  const referrerNames = React.useMemo(
    () => Array.from(new Set(Object.values(settings.clients || {}))).sort(),
    [settings]
  );

  // Paid, non-cancelled checkout groups from referred clients, inside the date range.
  const report = React.useMemo(() => {
    if (!orders || !window.groupOrders || !window.computeGroupTotals) return null;
    const refMap = settings.clients || {};
    const fromT = from ? new Date(from + 'T00:00:00').getTime() : -Infinity;
    const toT = to ? new Date(to + 'T23:59:59').getTime() : Infinity;
    const relevant = orders.filter(o => {
      if (!refMap[o.client_id]) return false;
      const { fulfillment, payment } = window.readStatuses(o);
      if (fulfillment === 'cancelled' || payment !== 'paid') return false;
      const t = new Date(o.created_at || o.ordered_at || 0).getTime();
      return t >= fromT && t <= toT;
    }).sort((a, b) => new Date(b.created_at || b.ordered_at || 0) - new Date(a.created_at || a.ordered_at || 0));

    const byReferrer = {};
    window.groupOrders(relevant).forEach(g => {
      const clientId = g.orders[0].client_id;
      const referrer = refMap[clientId];
      const total = window.computeGroupTotals(g.orders, couponsByCode).total;
      const r = byReferrer[referrer] || (byReferrer[referrer] = { name: referrer, orders: 0, collected: 0, clients: {} });
      r.orders += 1;
      r.collected += total;
      const c = r.clients[clientId] || (r.clients[clientId] = { id: clientId, orders: 0, collected: 0 });
      c.orders += 1;
      c.collected += total;
    });
    // Referrers with tagged clients but no paid orders in range still get a row.
    Object.entries(refMap).forEach(([clientId, referrer]) => {
      const r = byReferrer[referrer] || (byReferrer[referrer] = { name: referrer, orders: 0, collected: 0, clients: {} });
      if (!r.clients[clientId]) r.clients[clientId] = { id: clientId, orders: 0, collected: 0 };
    });
    const pct = (Number(settings.commissionPct) || 0) / 100;
    const rows = Object.values(byReferrer).map(r => ({ ...r, commission: r.collected * pct }))
      .sort((a, b) => b.collected - a.collected);
    return {
      rows,
      collected: rows.reduce((s, r) => s + r.collected, 0),
      commission: rows.reduce((s, r) => s + r.commission, 0),
      orders: rows.reduce((s, r) => s + r.orders, 0),
    };
  }, [orders, settings, from, to, couponsByCode]);

  const setPreset = (key) => {
    const now = new Date();
    if (key === 'all') { setFrom(''); setTo(''); return; }
    if (key === 'month') { setFrom(refIsoDay(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(refIsoDay(now)); return; }
    if (key === 'last') {
      setFrom(refIsoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
      setTo(refIsoDay(new Date(now.getFullYear(), now.getMonth(), 0)));
    }
  };

  const taggableClients = (clients || []).filter(c => {
    const q = tagQuery.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.email, (settings.clients || {})[c.id]].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' }}>Referrals</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Paid orders from referred clients. Cancelled orders are excluded.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, color: msg === 'Saved' ? '#34c759' : '#ff453a' }}>{msg}</span>}
          <button className="btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <label style={refStyles.label}>From</label>
          <input className="field-input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 170 }} />
        </div>
        <div>
          <label style={refStyles.label}>To</label>
          <input className="field-input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 170 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['month', 'This month'], ['last', 'Last month'], ['all', 'All time']].map(([k, l]) => (
            <button key={k} className="btn-ghost" onClick={() => setPreset(k)} style={{ padding: '8px 12px', fontSize: 13 }}>{l}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <label style={refStyles.label}>Commission %</label>
          <input className="field-input" type="number" min="0" max="100" step="0.5" style={{ width: 110 }}
            value={settings.commissionPct}
            onChange={e => setSettings(s => ({ ...s, commissionPct: e.target.value }))}
            onBlur={e => persist({ ...settings, commissionPct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
        </div>
      </div>

      {!report ? (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[['Collected from referrals', refMoney(report.collected)], ['Commission owed', refMoney(report.commission)], ['Paid orders', report.orders]].map(([l, v]) => (
              <div key={l} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
            <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={refStyles.th}>Referrer</th>
                    <th style={refStyles.th}>Clients</th>
                    <th style={refStyles.th}>Paid orders</th>
                    <th style={{ ...refStyles.th, textAlign: 'right' }}>Collected</th>
                    <th style={{ ...refStyles.th, textAlign: 'right' }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.length === 0 && (
                    <tr><td colSpan={5} style={{ ...refStyles.td, textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 28 }}>No referral clients tagged yet. Tag them below.</td></tr>
                  )}
                  {report.rows.map(r => (
                    <React.Fragment key={r.name}>
                      <tr onClick={() => setExpanded(expanded === r.name ? null : r.name)} style={{ cursor: 'pointer' }}>
                        <td style={{ ...refStyles.td, fontWeight: 600 }}>{expanded === r.name ? '▾' : '▸'} {r.name}</td>
                        <td style={refStyles.td}>{Object.keys(r.clients).length}</td>
                        <td style={refStyles.td}>{r.orders}</td>
                        <td style={{ ...refStyles.td, textAlign: 'right', fontWeight: 600 }}>{refMoney(r.collected)}</td>
                        <td style={{ ...refStyles.td, textAlign: 'right', color: '#2997ff', fontWeight: 600 }}>{refMoney(r.commission)}</td>
                      </tr>
                      {expanded === r.name && Object.values(r.clients).sort((a, b) => b.collected - a.collected).map(c => (
                        <tr key={c.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <td style={{ ...refStyles.td, paddingLeft: 36, color: 'rgba(255,255,255,0.75)' }}>{clientById[c.id]?.name || 'Unknown client'}</td>
                          <td style={refStyles.td}></td>
                          <td style={{ ...refStyles.td, color: 'rgba(255,255,255,0.75)' }}>{c.orders}</td>
                          <td style={{ ...refStyles.td, textAlign: 'right', color: 'rgba(255,255,255,0.75)' }}>{refMoney(c.collected)}</td>
                          <td style={refStyles.td}></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Tag referral clients</h3>
        <input className="field-input" placeholder="Search clients" value={tagQuery} onChange={e => setTagQuery(e.target.value)} style={{ maxWidth: 260 }} />
      </div>
      <datalist id="pfb-referrer-names">
        {referrerNames.map(n => <option key={n} value={n} />)}
      </datalist>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={refStyles.th}>Client</th>
                <th style={refStyles.th}>Email</th>
                <th style={refStyles.th}>Referred by</th>
              </tr>
            </thead>
            <tbody>
              {taggableClients.map(c => (
                <tr key={c.id}>
                  <td style={{ ...refStyles.td, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...refStyles.td, color: 'rgba(255,255,255,0.6)' }}>{c.email}</td>
                  <td style={refStyles.td}>
                    <input className="field-input" list="pfb-referrer-names" placeholder="Not a referral"
                      key={c.id + ':' + ((settings.clients || {})[c.id] || '')}
                      defaultValue={(settings.clients || {})[c.id] || ''}
                      onBlur={e => { if (e.target.value.trim() !== ((settings.clients || {})[c.id] || '')) setReferrer(c.id, e.target.value); }}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                      style={{ maxWidth: 240, padding: '8px 12px', fontSize: 13 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
        Type the referrer's name and press Enter. Names you've used before show as suggestions. Clear the field to remove the tag.
      </p>
    </div>
  );
};
