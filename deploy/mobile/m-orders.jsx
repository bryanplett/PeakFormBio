/* m-orders.jsx — mobile Orders list + order detail sheet → window.MOrders */
(function () {
const { Icon, StatusPill, Spinner, Empty, Sheet, fmtMoney, fmtDate, fmtDateTime, initials, useToast } = window.MUI;
const P = window.PFBOrders;

function itemsSummary(group) {
  const first = group.orders[0];
  const label = first.product || first.item || 'Item';
  const n = group.orders.length;
  return n > 1 ? `${label} +${n - 1} more` : label;
}

function OrderCard({ group, clientById, couponsByCode, onOpen }) {
  const first = group.orders[0];
  const c = clientById[first.client_id];
  const totals = P.computeGroupTotals(group.orders, couponsByCode);
  const { fulfillment, payment } = P.readStatuses(first);
  const name = c ? (c.name || c.email) : 'Unknown client';
  return (
    <div className="listcard" onClick={() => onOpen(group)}>
      <div className="avatar">{initials(name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>{fmtMoney(totals.total)}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
          {itemsSummary(group)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          <StatusPill status={fulfillment} />
          <StatusPill status={payment} />
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-45)' }}>{fmtDate(first.created_at || first.ordered_at)}</span>
        </div>
      </div>
    </div>
  );
}

function SegStatus({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="field-label">{label}</div>
      <div className="seg">
        {options.map(opt => {
          const on = opt === value;
          const c = P.STATUS_COLORS[opt] || P.STATUS_COLORS.pending;
          return (
            <button key={opt} className={on ? 'is-on' : ''} onClick={() => onChange(opt)}
              style={on ? { background: c.bg, color: c.fg, borderColor: 'transparent' } : null}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderSheet({ group, client, couponsByCode, sb, onClose, onChanged }) {
  const first = group.orders[0];
  const init = P.readStatuses(first);
  const [fulfillment, setFulfillment] = React.useState(init.fulfillment);
  const [payment, setPayment] = React.useState(init.payment);
  const [busy, setBusy] = React.useState(false);
  const totals = P.computeGroupTotals(group.orders, couponsByCode);
  const name = client ? (client.name || client.email) : 'Unknown client';

  const changeFulfillment = async (v) => {
    setFulfillment(v); setBusy(true);
    await P.setGroupStatus(sb, group.orders, v);
    setBusy(false); onChanged && onChanged();
  };
  const changePayment = async (v) => {
    setPayment(v); setBusy(true);
    await P.setGroupPaymentStatus(sb, group.orders, v);
    setBusy(false); onChanged && onChanged();
  };

  return (
    <Sheet title="Order detail" onClose={onClose}
      headRight={busy ? <div className="spinner" style={{ width: 18, height: 18 }} /> : null}>
      {/* Client */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div className="avatar">{initials(name)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>{fmtDateTime(first.created_at || first.ordered_at)}</div>
        </div>
      </div>

      {/* Tap to call / message */}
      {(() => {
        const phone = first.phone_at_order || (client && client.phone);
        const tel = phone ? String(phone).replace(/[^\d+]/g, '') : '';
        if (!phone) return null;
        return (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <a className="btn btn--tonal" href={'tel:' + tel} style={{ flex: 1, textDecoration: 'none' }}><Icon name="phone" size={18} /> Call</a>
            <a className="btn btn--neutral" href={'sms:' + tel} style={{ flex: 1, textDecoration: 'none' }}><Icon name="message" size={18} /> Message</a>
          </div>
        );
      })()}

      {/* Items */}
      <div className="section-label">Items</div>
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        {group.orders.map(o => {
          const label = o.product || o.item || '—';
          const qty = parseInt(o.quantity ?? o.qty ?? 1, 10) || 1;
          const price = P.priceFromLabel(label);
          return (
            <div key={o.id} className="kv" style={{ padding: '8px 0' }}>
              <span className="kv__k" style={{ color: 'var(--ink)' }}>
                {qty > 1 && <span style={{ color: 'var(--ink-45)', marginRight: 6 }}>{qty}×</span>}{label}
              </span>
              <span className="kv__v">{fmtMoney(price * qty)}</span>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        {totals.discount > 0 && (
          <div className="kv"><span className="kv__k">Discount{totals.coupon ? ` (${first.coupon_code})` : ''}</span>
            <span className="kv__v" style={{ color: '#7be39a' }}>−{fmtMoney(totals.discount)}</span></div>
        )}
        {totals.shipping > 0 && (
          <div className="kv"><span className="kv__k">Shipping{first.shipping_method ? ` · ${first.shipping_method}` : ''}</span>
            <span className="kv__v">{fmtMoney(totals.shipping)}</span></div>
        )}
        <div className="kv"><span className="kv__k" style={{ fontWeight: 600, color: 'var(--ink)' }}>Total</span>
          <span className="kv__v" style={{ fontWeight: 700, fontSize: 16 }}>{fmtMoney(totals.total)}</span></div>
      </div>

      {/* Payment method / shipping / notes */}
      {(first.payment_method || first.shipping_address || first.notes) && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          {first.payment_method && <div className="kv"><span className="kv__k">Payment method</span><span className="kv__v">{first.payment_method}</span></div>}
          {first.shipping_address && <div className="kv"><span className="kv__k">Ship to</span><span className="kv__v" style={{ whiteSpace: 'pre-wrap', maxWidth: '60%' }}>{first.shipping_address}</span></div>}
          {(first.phone_at_order || (client && client.phone)) && <div className="kv"><span className="kv__k">Phone</span><a className="kv__v" href={'tel:' + String(first.phone_at_order || client.phone).replace(/[^\d+]/g, '')} style={{ color: 'var(--primary)' }}>{first.phone_at_order || client.phone}</a></div>}
          {first.notes && <div className="kv"><span className="kv__k">Notes</span><span className="kv__v" style={{ maxWidth: '60%' }}>{first.notes}</span></div>}
        </div>
      )}

      {/* Status controls */}
      <div className="section-label">Update status</div>
      <SegStatus label="Fulfillment" value={fulfillment} options={P.FULFILLMENT_OPTIONS} onChange={changeFulfillment} />
      <SegStatus label="Payment" value={payment} options={P.PAYMENT_OPTIONS} onChange={changePayment} />
    </Sheet>
  );
}

function OrdersScreen({ sb, clients, initialFilter }) {
  const [orders, setOrders] = React.useState(null);
  const [coupons, setCoupons] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState(initialFilter || 'all');
  const [openGroup, setOpenGroup] = React.useState(null);
  const [toast, showToast] = useToast();

  const clientById = React.useMemo(() => {
    const m = {}; (clients || []).forEach(c => { m[c.id] = c; }); return m;
  }, [clients]);
  const couponsByCode = React.useMemo(() => P.couponsByCode(coupons), [coupons]);

  const load = React.useCallback(async () => {
    const { data } = await sb.from('orders').select('*');
    setOrders(data || []);
    const { data: cps } = await sb.from('coupons').select('*');
    setCoupons(cps || []);
  }, [sb]);

  React.useEffect(() => { load(); }, [load]);

  const STATUSES = ['all', 'pending', 'shipped', 'delivered', 'completed', 'unpaid', 'paid'];

  // group everything first for counts + display
  const allGroups = React.useMemo(() => P.sortAndGroup(orders || []), [orders]);

  const counts = React.useMemo(() => {
    const ct = { all: allGroups.length };
    STATUSES.slice(1).forEach(s => ct[s] = 0);
    allGroups.forEach(g => {
      const { fulfillment, payment } = P.readStatuses(g.orders[0]);
      if (ct[fulfillment] != null) ct[fulfillment]++;
      if (ct[payment] != null) ct[payment]++;
    });
    return ct;
  }, [allGroups]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGroups.filter(g => {
      const first = g.orders[0];
      const { fulfillment, payment } = P.readStatuses(first);
      if (filter !== 'all' && fulfillment !== filter && payment !== filter) return false;
      if (!q) return true;
      const c = clientById[first.client_id];
      const hay = [
        c?.name, c?.email, first.notes, first.coupon_code,
        ...g.orders.map(o => o.product || o.item),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [allGroups, filter, query, clientById]);

  const onChanged = React.useCallback(() => { load(); }, [load]);

  return (
    <div className="fade-in">
      <div className="searchbar" style={{ marginBottom: 12 }}>
        <Icon name="search" size={19} style={{ color: 'var(--ink-45)' }} />
        <input placeholder="Search orders, clients, products…" value={query} onChange={e => setQuery(e.target.value)} />
        {query && <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={() => setQuery('')}><Icon name="close" size={18} /></button>}
      </div>

      <div className="chiprow" style={{ marginBottom: 14 }}>
        {STATUSES.map(s => (
          <button key={s} className={'chip' + (filter === s ? ' is-active' : '')} onClick={() => setFilter(s)}>
            <span style={{ textTransform: 'capitalize' }}>{s}</span>
            <span className="chip__count">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {orders === null && <Spinner />}
      {orders !== null && visible.length === 0 && (
        <Empty icon="orders" title={orders.length === 0 ? 'No orders yet' : 'Nothing matches'}
          sub={orders.length === 0 ? 'When clients check out, their orders show up here.' : 'Try a different filter or search.'} />
      )}

      <div className="stack">
        {visible.map(g => (
          <OrderCard key={g.orders[0].id} group={g} clientById={clientById}
            couponsByCode={couponsByCode} onOpen={setOpenGroup} />
        ))}
      </div>

      {openGroup && (
        <OrderSheet group={openGroup} client={clientById[openGroup.orders[0].client_id]}
          couponsByCode={couponsByCode} sb={sb} onClose={() => setOpenGroup(null)} onChanged={onChanged} />
      )}
      {toast}
    </div>
  );
}

window.MOrders = { OrdersScreen, OrderCard, OrderSheet };
})();
