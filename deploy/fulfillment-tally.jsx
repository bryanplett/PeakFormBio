// Fulfillment Tally — two views: pickup-day item tally, and delivery item tally.
// Pulls from the same `orders` table as AllOrders; groups line items by product
// and sums quantity so packing/shipping can be batched.

const TALLY_STATUS_EXCLUDE = ['cancelled', 'completed'];

function tallyItems(orders) {
  const byProduct = {};
  orders.forEach(o => {
    const label = o.product || o.item || '(unspecified)';
    const qty = parseInt(o.quantity ?? o.qty ?? 1, 10) || 1;
    byProduct[label] = (byProduct[label] || 0) + qty;
  });
  return Object.entries(byProduct).sort((a, b) => b[1] - a[1]);
}

function fmtDateLabel(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const PickupTally = ({ orders, clientById }) => {
  const today = new Date();
  const todayIso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const [date, setDate] = React.useState(todayIso);

  const pickupOrders = React.useMemo(
    () => orders.filter(o => String(o.shipping_method || '').startsWith('Pickup') && !TALLY_STATUS_EXCLUDE.includes((o.status || 'pending'))),
    [orders]
  );

  const dateLabel = fmtDateLabel(date);
  const scheduled = pickupOrders.filter(o => String(o.shipping_method).includes(dateLabel));
  const byArrangement = pickupOrders.filter(o => /special arrangement/i.test(o.shipping_method) || /appointment only/i.test(o.shipping_method) || !/—/.test(o.shipping_method) || (!scheduled.includes(o) && !/\d{1,2}:\d{2}/.test(o.shipping_method) && String(o.shipping_method).match(/Morgan Hill|Mountain View/)));

  const items = tallyItems(scheduled);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Pickup day</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="field-input" style={{ width: 190 }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{dateLabel}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Items to pack — {scheduled.length} order{scheduled.length === 1 ? '' : 's'}</h3>
        {items.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No pickup orders scheduled for this date.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Product</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map(([label, qty]) => (
                <tr key={label}>
                  <td style={{ padding: '9px 10px', fontSize: 13.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{label}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13.5, textAlign: 'right', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {scheduled.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Clients picking up {dateLabel}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scheduled.map(o => {
              const c = clientById[o.client_id];
              return (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <span>{c?.name || 'Unknown client'} — {o.product || o.item} × {parseInt(o.quantity ?? o.qty ?? 1, 10) || 1}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{String(o.shipping_method).split(' — ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {byArrangement.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>By appointment / special arrangement</h3>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
            Not tied to a specific date — Morgan Hill and Mountain View pickups, and San Jose "special arrangement" requests.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byArrangement.map(o => {
              const c = clientById[o.client_id];
              return (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <span>{c?.name || 'Unknown client'} — {o.product || o.item} × {parseInt(o.quantity ?? o.qty ?? 1, 10) || 1}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{o.shipping_method}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DeliveryTally = ({ orders, clientById }) => {
  const deliveryOrders = React.useMemo(
    () => orders.filter(o => {
      const sm = String(o.shipping_method || '');
      return sm && !sm.startsWith('Pickup') && !TALLY_STATUS_EXCLUDE.includes((o.status || 'pending'));
    }),
    [orders]
  );
  const mail = deliveryOrders.filter(o => /shipping/i.test(o.shipping_method));
  const local = deliveryOrders.filter(o => /local delivery/i.test(o.shipping_method));

  const renderGroup = (title, list) => {
    const items = tallyItems(list);
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{title} — {list.length} order{list.length === 1 ? '' : 's'}</h3>
        {items.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nothing pending.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Product</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map(([label, qty]) => (
                  <tr key={label}>
                    <td style={{ padding: '9px 10px', fontSize: 13.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{label}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13.5, textAlign: 'right', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(o => {
                const c = clientById[o.client_id];
                return (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <span>{c?.name || 'Unknown client'} — {o.product || o.item} × {parseInt(o.quantity ?? o.qty ?? 1, 10) || 1}</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{o.shipping_method}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderGroup('Mail — Regular / Priority Shipping', mail)}
      {renderGroup('Local Delivery', local)}
    </div>
  );
};

window.FulfillmentTally = ({ sb, clients, onBack }) => {
  const [orders, setOrders] = React.useState(null);
  const [view, setView] = React.useState('pickup'); // 'pickup' | 'delivery'

  const clientById = React.useMemo(() => {
    const m = {};
    (clients || []).forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  const load = React.useCallback(async () => {
    setOrders(null);
    const { data } = await sb.from('orders').select('*');
    setOrders(data || []);
  }, [sb]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' }}>Fulfillment Tally</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Item counts for packing and shipping, grouped by fulfillment method.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={load}>Refresh</button>
          <button className="btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {[['pickup', 'Pickup by Day'], ['delivery', 'Mail & Local Delivery']].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            style={{ background: 'transparent', border: 'none', color: view === key ? '#fff' : 'rgba(255,255,255,0.5)',
              padding: '10px 16px', fontSize: 14, fontWeight: view === key ? 600 : 400, cursor: 'pointer',
              borderBottom: view === key ? '2px solid #2997ff' : '2px solid transparent' }}>{label}</button>
        ))}
      </div>

      {orders === null ? (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
      ) : view === 'pickup' ? (
        <PickupTally orders={orders} clientById={clientById} />
      ) : (
        <DeliveryTally orders={orders} clientById={clientById} />
      )}
    </div>
  );
};
