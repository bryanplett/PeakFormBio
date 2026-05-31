/* m-dashboard.jsx — home dashboard → window.MDashboard */
(function () {
  const { Icon, Spinner, fmtMoney, useToast } = window.MUI;
  const P = window.PFBOrders;
  const { OrderCard, OrderSheet } = window.MOrders;

  function Stat({ num, label, icon, color, onClick }) {
    return (
      <div className="stat" onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="stat__num" style={{ color: color || 'var(--ink)' }}>{num}</span>
          <span style={{ color: color || 'var(--ink-45)', opacity: 0.9 }}><Icon name={icon} size={20} /></span>
        </div>
        <span className="stat__lbl">{label}</span>
      </div>
    );
  }

  function Shortcut({ icon, label, onClick }) {
    return (
      <button className="tile" onClick={onClick} style={{ minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
        <span className="tile__icon" style={{ width: 36, height: 36 }}><Icon name={icon} size={19} /></span>
        <span className="tile__name">{label}</span>
      </button>
    );
  }

  function Dashboard({ sb, clients, onNav, onOnboard, onTool }) {
    const [orders, setOrders] = React.useState(null);
    const [coupons, setCoupons] = React.useState([]);
    const [openGroup, setOpenGroup] = React.useState(null);

    const clientById = React.useMemo(() => { const m = {}; (clients || []).forEach(c => m[c.id] = c); return m; }, [clients]);
    const couponsByCode = React.useMemo(() => P.couponsByCode(coupons), [coupons]);

    const load = React.useCallback(async () => {
      const { data } = await sb.from('orders').select('*');
      setOrders(data || []);
      const { data: cps } = await sb.from('coupons').select('*');
      setCoupons(cps || []);
    }, [sb]);
    React.useEffect(() => { load(); }, [load]);

    const groups = React.useMemo(() => P.sortAndGroup(orders || []), [orders]);

    const stats = React.useMemo(() => {
      let pending = 0, unpaid = 0, weekRev = 0;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      groups.forEach(g => {
        const { fulfillment, payment } = P.readStatuses(g.orders[0]);
        if (fulfillment === 'pending') pending++;
        if (payment === 'unpaid' || payment === 'reported') unpaid++;
        const t = new Date(g.orders[0].created_at || g.orders[0].ordered_at || 0).getTime();
        if (t >= weekAgo && fulfillment !== 'cancelled') weekRev += P.computeGroupTotals(g.orders, couponsByCode).total;
      });
      return { pending, unpaid, weekRev };
    }, [groups, couponsByCode]);

    const recent = groups.slice(0, 4);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <div className="fade-in">
        <div style={{ margin: '2px 2px 16px' }}>
          <div style={{ fontSize: 14, color: 'var(--ink-60)' }}>{greeting},</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Bryan</div>
        </div>

        {orders === null ? <Spinner /> : (
          <React.Fragment>
            <div className="stat-grid" style={{ marginBottom: 12 }}>
              <Stat num={stats.pending} label="Orders to fulfill" icon="orders" color={stats.pending ? 'var(--warn)' : 'var(--ink)'} onClick={() => onNav('orders', 'pending')} />
              <Stat num={stats.unpaid} label="Awaiting payment" icon="dollar" color={stats.unpaid ? 'var(--warn)' : 'var(--ink)'} onClick={() => onNav('orders', 'unpaid')} />
              <Stat num={(clients || []).length} label="Clients" icon="clients" onClick={() => onNav('clients')} />
              <Stat num={fmtMoney(stats.weekRev)} label="Revenue · 7 days" icon="bolt" color="var(--ok)" onClick={() => onNav('orders')} />
            </div>

            <div className="section-label" style={{ marginTop: 18 }}>Quick actions</div>
            <div className="tile-grid" style={{ marginBottom: 6 }}>
              <Shortcut icon="add" label="Onboard client" onClick={onOnboard} />
              <Shortcut icon="orders" label="All orders" onClick={() => onNav('orders')} />
              <Shortcut icon="inventory" label="Inventory" onClick={() => onTool('inventory')} />
              <Shortcut icon="tag" label="Coupons" onClick={() => onTool('coupons')} />
            </div>

            <div className="section-label" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Recent orders</span>
              <button onClick={() => onNav('orders')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>See all</button>
            </div>
            {recent.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--ink-45)', padding: 24, fontSize: 14 }}>No orders yet.</div>
            ) : (
              <div className="stack">
                {recent.map(g => (
                  <OrderCard key={g.orders[0].id} group={g} clientById={clientById} couponsByCode={couponsByCode} onOpen={setOpenGroup} />
                ))}
              </div>
            )}
          </React.Fragment>
        )}

        {openGroup && (
          <OrderSheet group={openGroup} client={clientById[openGroup.orders[0].client_id]}
            couponsByCode={couponsByCode} sb={sb} onClose={() => setOpenGroup(null)} onChanged={load} />
        )}
      </div>
    );
  }

  window.MDashboard = { Dashboard };
})();
