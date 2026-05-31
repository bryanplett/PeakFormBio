/* m-app.jsx — app shell: login, app bar, bottom nav, FAB, router. */
(function () {
  const { Icon } = window.MUI;
  const { Dashboard } = window.MDashboard;
  const { OrdersScreen } = window.MOrders;
  const { ClientsScreen } = window.MClients;
  const { MoreScreen, ToolHost } = window.MMore;
  const { MOnboard } = window.MOnboard;

  const sb = window.createApiClient();
  window.supabaseClient = sb; // for inventory-helper.js restock

  // ── Login ────────────────────────────────────────────────────────────────
  function Login({ onSignedIn }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const submit = async (e) => {
      e.preventDefault();
      setError(''); setLoading(true);
      const { data, error: err } = await sb.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) { setError(err.message || 'Sign-in failed.'); return; }
      if (!data || !data.user || data.user.role !== 'admin') {
        await sb.auth.signOut();
        setError('This account does not have admin access.');
        return;
      }
      onSignedIn(data.user);
    };

    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img src="1_5058098532557259934/PNG/VV/Asset 1@4x.png" alt="PeakForm Bio" style={{ height: 84, width: 'auto' }} />
          <p style={{ marginTop: 14, fontSize: 11, letterSpacing: 3, color: 'var(--ink-45)', textTransform: 'uppercase', fontWeight: 600 }}>Admin</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none" autoCorrect="off" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.3)', borderRadius: 12, padding: '11px 14px', fontSize: 13.5, color: 'var(--danger)' }}>{error}</div>}
          <button type="submit" className="btn btn--blue btn--block" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--ink-30)', fontSize: 12, marginTop: 26 }}>You'll stay signed in on this device.</p>
      </div>
    );
  }

  // ── Bottom navigation ──────────────────────────────────────────────────────
  const NAV = [
    { key: 'orders', label: 'Orders', icon: 'orders' },
    { key: 'clients', label: 'Clients', icon: 'clients' },
    { key: '__spacer' },
    { key: 'inventory', label: 'Inventory', icon: 'inventory' },
    { key: 'more', label: 'More', icon: 'more' },
  ];

  function BottomNav({ tab, onTab }) {
    return (
      <nav className="bottomnav">
        {NAV.map((n, i) => n.key === '__spacer'
          ? <div key={i} className="navitem navitem--spacer" />
          : (
            <button key={n.key} className={'navitem' + (tab === n.key ? ' is-active' : '')} onClick={() => onTab(n.key)}>
              <span className="navicon"><Icon name={n.icon} size={22} /></span>
              <span>{n.label}</span>
            </button>
          ))}
      </nav>
    );
  }

  // ── App ──────────────────────────────────────────────────────────────────
  function App() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [clients, setClients] = React.useState(null);
    const [tab, setTab] = React.useState('home');
    const [onboardOpen, setOnboardOpen] = React.useState(false);
    const [tool, setTool] = React.useState(null);
    const [ordersFilter, setOrdersFilter] = React.useState('all');
    const [reloadKey, setReloadKey] = React.useState(0);

    const loadClients = React.useCallback(async () => {
      const { data } = await sb.from('clients').select('*').order('created_at', { ascending: false });
      setClients(data || []);
    }, []);

    React.useEffect(() => {
      (async () => {
        const { data: { session } } = await sb.auth.getSession();
        if (session && session.user && session.user.role === 'admin') {
          setUser(session.user);
          await loadClients();
        }
        setLoading(false);
      })();
    }, [loadClients]);

    const onSignedIn = async (u) => { setUser(u); await loadClients(); };
    const signOut = async () => { await sb.auth.signOut(); setUser(null); setTab('home'); };

    const navTo = (t, filter) => {
      if (filter) setOrdersFilter(filter); else if (t === 'orders') setOrdersFilter('all');
      setTab(t);
      setReloadKey(k => k + 1);
    };
    const refresh = () => { loadClients(); setReloadKey(k => k + 1); };

    if (loading) return <div className="app"><div className="center-load" style={{ height: '100%' }}><div className="spinner" /></div></div>;
    if (!user) return <div className="app"><Login onSignedIn={onSignedIn} /></div>;

    const titles = { home: null, orders: 'Orders', clients: 'Clients', inventory: 'Inventory', more: 'More' };
    const showRefresh = ['home', 'orders', 'clients'].includes(tab);

    let screen = null;
    if (tab === 'home') screen = <Dashboard key={'h' + reloadKey} sb={sb} clients={clients} onNav={navTo} onOnboard={() => setOnboardOpen(true)} onTool={setTool} />;
    else if (tab === 'orders') screen = <OrdersScreen key={'o' + reloadKey + ordersFilter} sb={sb} clients={clients} initialFilter={ordersFilter} />;
    else if (tab === 'clients') screen = <ClientsScreen key={'c' + reloadKey} sb={sb} clients={clients} onReload={loadClients} />;
    else if (tab === 'inventory') screen = window.InventoryManager
      ? <div key={'i' + reloadKey} style={{ paddingTop: 2 }}><window.InventoryManager sb={sb} onBack={() => setTab('home')} /></div>
      : <div className="empty">Inventory unavailable</div>;
    else if (tab === 'more') screen = <MoreScreen user={user} onTool={setTool} onSignOut={signOut} />;

    return (
      <div className="app">
        <header className="appbar">
          {tab === 'home' ? (
            <div className="appbar__brand">
              <img src="1_5058098532557259934/PNG/VV/Asset 1@4x.png" alt="PeakForm Bio" />
              <span className="appbar__kicker">Admin</span>
            </div>
          ) : (
            <React.Fragment>
              <button className="iconbtn" onClick={() => setTab('home')} aria-label="Home"><Icon name="home" /></button>
              <div className="appbar__title">{titles[tab]}</div>
            </React.Fragment>
          )}
          {showRefresh && <button className="iconbtn" onClick={refresh} aria-label="Refresh"><Icon name="refresh" size={20} /></button>}
        </header>

        <div className={'screen' + (tab === 'inventory' ? ' screen--flush' : '')} style={tab === 'inventory' ? { padding: '0 8px calc(var(--nav-h) + 24px)' } : null}>
          {screen}
        </div>

        <BottomNav tab={tab} onTab={(t) => navTo(t)} />
        <button className="fab" onClick={() => setOnboardOpen(true)} aria-label="Onboard client"><Icon name="add" size={26} stroke={2.4} /></button>

        {onboardOpen && <MOnboard sb={sb} onClose={() => setOnboardOpen(false)} onDone={refresh} />}
        {tool && <ToolHost tool={tool} sb={sb} clients={clients || []} onClose={() => setTool(null)} />}
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
