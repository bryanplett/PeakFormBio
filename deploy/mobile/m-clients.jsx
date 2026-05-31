/* m-clients.jsx — Clients list + Client detail → window.MClients */
(function () {
  const { Icon, StatusPill, Spinner, Empty, Overlay, Sheet, fmtMoney, fmtDate, initials, useToast } = window.MUI;
  const P = window.PFBOrders;
  const { OrderCard, OrderSheet } = window.MOrders;

  const TABS = ['profile', 'orders', 'nutrition', 'workout', 'weigh-in', 'bloodwork'];

  function PricelistSelect({ sb, client, onToast }) {
    const opts = (typeof window.getPricelistOptions === 'function')
      ? window.getPricelistOptions() : [{ value: 'standard', label: 'Standard' }, { value: 'wholesale', label: 'Wholesale' }];
    const [val, setVal] = React.useState(client.pricelist || 'standard');
    const [saving, setSaving] = React.useState(false);
    const change = async (v) => {
      setVal(v); setSaving(true);
      const { error } = await sb.from('clients').update({ pricelist: v }).eq('id', client.id);
      setSaving(false);
      if (error) { onToast && onToast('Update failed'); return; }
      client.pricelist = v; onToast && onToast('Pricelist updated');
    };
    return (
      <select className="field-input" value={val} disabled={saving} onChange={e => change(e.target.value)}
        style={{ width: 'auto', minWidth: 130, padding: '9px 34px 9px 12px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  function PlanEditor({ sb, client, kind }) {
    const table = kind === 'nutrition' ? 'nutrition_plans' : 'workout_plans';
    const [content, setContent] = React.useState(null);
    const [msg, setMsg] = React.useState('');
    React.useEffect(() => {
      (async () => {
        const { data } = await sb.from(table).select('*').eq('client_id', client.id).maybeSingle();
        setContent(data?.content || '');
      })();
    }, [client.id, table]);
    if (content === null) return <Spinner />;
    const save = async () => {
      const { error } = await sb.from(table).upsert({ client_id: client.id, content, updated_at: new Date().toISOString() }, { onConflict: 'client_id' });
      setMsg(error ? 'Error: ' + error.message : 'Saved.');
      setTimeout(() => setMsg(''), 2000);
    };
    return (
      <div className="fade-in">
        <p style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 12, lineHeight: 1.5 }}>
          The client sees this in their portal immediately after saving.
        </p>
        <textarea className="field-input" value={content} onChange={e => setContent(e.target.value)}
          placeholder={kind === 'nutrition' ? 'Daily targets, meal structure, supplements…' : 'Weekly schedule, exercises, sets/reps…'}
          style={{ minHeight: 300, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: 14 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <button className="btn btn--blue" onClick={save}>Save plan</button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--ok)' }}>{msg}</span>}
        </div>
      </div>
    );
  }

  function Bloodwork({ sb, client }) {
    const [files, setFiles] = React.useState(null);
    React.useEffect(() => {
      (async () => {
        const { data } = await sb.from('bloodwork_files').select('*').eq('client_id', client.id).order('uploaded_at', { ascending: false });
        setFiles(data || []);
      })();
    }, [client.id]);
    if (files === null) return <Spinner />;
    if (files.length === 0) return <Empty icon="orders" title="No bloodwork yet" sub="Files the client uploads appear here." />;
    return (
      <div className="stack stack--tight fade-in">
        {files.map(f => (
          <div key={f.id} className="listcard" style={{ cursor: 'default' }}>
            <div className="avatar" style={{ background: 'rgba(191,90,242,0.14)', color: 'var(--purple)' }}><Icon name="orders" size={20} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.file_name}</div>
              {f.uploaded_at && <div style={{ fontSize: 12, color: 'var(--ink-45)' }}>{fmtDate(f.uploaded_at)}</div>}
            </div>
            {f.file_url && <a className="iconbtn iconbtn--accent" href={f.file_url} target="_blank" rel="noreferrer"><Icon name="external" size={19} /></a>}
          </div>
        ))}
      </div>
    );
  }

  function ClientOrders({ sb, client, clientById }) {
    const [orders, setOrders] = React.useState(null);
    const [coupons, setCoupons] = React.useState([]);
    const [openGroup, setOpenGroup] = React.useState(null);
    const couponsByCode = React.useMemo(() => P.couponsByCode(coupons), [coupons]);
    const load = React.useCallback(async () => {
      const { data } = await sb.from('orders').select('*').eq('client_id', client.id);
      setOrders(data || []);
      const { data: cps } = await sb.from('coupons').select('*');
      setCoupons(cps || []);
    }, [client.id]);
    React.useEffect(() => { load(); }, [load]);
    if (orders === null) return <Spinner />;
    const groups = P.sortAndGroup((orders || []).filter(o => P.readStatuses(o).fulfillment !== 'cancelled'));
    if (groups.length === 0) return <Empty icon="orders" title="No orders" sub="This client hasn't ordered yet." />;
    return (
      <div className="stack fade-in">
        {groups.map(g => (
          <OrderCard key={g.orders[0].id} group={g} clientById={clientById} couponsByCode={couponsByCode} onOpen={setOpenGroup} />
        ))}
        {openGroup && (
          <OrderSheet group={openGroup} client={client} couponsByCode={couponsByCode} sb={sb}
            onClose={() => setOpenGroup(null)} onChanged={load} />
        )}
      </div>
    );
  }

  function ClientDetail({ sb, client, clientById, onClose, onChanged }) {
    const [tab, setTab] = React.useState('profile');
    const [editor, setEditor] = React.useState(null); // 'workout' | 'nutrition' | 'mealplan'
    const [toast, showToast] = useToast();

    const del = async () => {
      if (!window.confirm(`Delete ${client.name || client.email}?\n\nThis removes their record and all plans, orders, weigh-ins and bloodwork. Their auth login must be removed separately.`)) return;
      const { error } = await sb.from('clients').delete().eq('id', client.id);
      if (error) { window.alert('Delete failed: ' + error.message); return; }
      onChanged && onChanged(); onClose();
    };

    return (
      <Overlay title={client.name || client.email} onClose={onClose}
        headRight={<button className="iconbtn" onClick={del} aria-label="Delete client" style={{ color: 'var(--danger)' }}><Icon name="trash" size={20} /></button>}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="avatar" style={{ width: 48, height: 48, flex: '0 0 48px', fontSize: 17 }}>{initials(client.name || client.email)}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', wordBreak: 'break-all' }}>{client.email}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)' }}>{client.phone || 'No phone'}</div>
          </div>
        </div>

        {client.phone && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <a className="btn btn--tonal" href={'tel:' + String(client.phone).replace(/[^\d+]/g, '')} style={{ flex: 1, textDecoration: 'none' }}><Icon name="phone" size={18} /> Call</a>
            <a className="btn btn--neutral" href={'sms:' + String(client.phone).replace(/[^\d+]/g, '')} style={{ flex: 1, textDecoration: 'none' }}><Icon name="message" size={18} /> Message</a>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <PricelistSelect sb={sb} client={client} onToast={showToast} />
          <span className="pill" style={{ background: client.status === 'active' || !client.status ? 'rgba(52,199,89,0.14)' : 'rgba(255,255,255,0.08)', color: client.status === 'active' || !client.status ? 'var(--ok)' : 'var(--ink-60)' }}>
            <span className="dot" />{client.status || 'active'}
          </span>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          <button className="btn btn--tonal" style={{ flexDirection: 'column', gap: 5, padding: '12px 6px', fontSize: 12 }} onClick={() => setEditor('nutrition')}><Icon name="food" size={20} />Nutrition</button>
          <button className="btn btn--tonal" style={{ flexDirection: 'column', gap: 5, padding: '12px 6px', fontSize: 12 }} onClick={() => setEditor('workout')}><Icon name="dumbbell" size={20} />Workout</button>
          <button className="btn btn--tonal" style={{ flexDirection: 'column', gap: 5, padding: '12px 6px', fontSize: 12 }} onClick={() => setEditor('mealplan')}><Icon name="calendar" size={20} />Meal plan</button>
        </div>

        {/* Tabs */}
        <div className="chiprow" style={{ marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t} className={'chip' + (tab === t ? ' is-active' : '')} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {tab === 'profile' && (window.ProfileEditor
          ? <window.ProfileEditor sb={sb} client={client} onSaved={(u) => { Object.assign(client, u); showToast('Profile saved'); }} />
          : <Empty icon="user" title="Profile unavailable" />)}
        {tab === 'orders' && <ClientOrders sb={sb} client={client} clientById={clientById} />}
        {tab === 'nutrition' && <PlanEditor sb={sb} client={client} kind="nutrition" />}
        {tab === 'workout' && <PlanEditor sb={sb} client={client} kind="workout" />}
        {tab === 'weigh-in' && (window.WeighIn
          ? <window.WeighIn sb={sb} userId={client.id} readOnly={true} clientName={client.name} />
          : <Empty icon="scale" title="Weigh-in unavailable" />)}
        {tab === 'bloodwork' && <Bloodwork sb={sb} client={client} />}

        {/* Full editors launched over the detail */}
        {editor === 'workout' && window.WorkoutEditor && (
          <div className="overlay"><WorkoutEditorHost sb={sb} client={client} onBack={() => setEditor(null)} /></div>
        )}
        {editor === 'nutrition' && window.NutritionEditor && (
          <div className="overlay"><NutritionEditorHost sb={sb} client={client} onBack={() => setEditor(null)} /></div>
        )}
        {editor === 'mealplan' && window.StandaloneMealPlanner && (
          <div className="overlay"><MealPlanHost sb={sb} client={client} onBack={() => setEditor(null)} /></div>
        )}
        {toast}
      </Overlay>
    );
  }

  // Hosts: give the desktop editors a Material app bar + scroll container.
  function EditorHost({ title, onBack, children }) {
    return (
      <React.Fragment>
        <header className="appbar">
          <button className="iconbtn" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
          <div className="appbar__title">{title}</div>
        </header>
        <div className="screen" style={{ padding: 14 }}>{children}</div>
      </React.Fragment>
    );
  }
  function WorkoutEditorHost({ sb, client, onBack }) {
    return <EditorHost title="Edit workout" onBack={onBack}><window.WorkoutEditor sb={sb} client={client} onBack={onBack} /></EditorHost>;
  }
  function NutritionEditorHost({ sb, client, onBack }) {
    return <EditorHost title="Edit nutrition" onBack={onBack}><window.NutritionEditor sb={sb} client={client} onBack={onBack} /></EditorHost>;
  }
  function MealPlanHost({ sb, client, onBack }) {
    return <EditorHost title="Meal plan" onBack={onBack}><window.StandaloneMealPlanner sb={sb} clients={[client]} initialClientId={client.id} onBack={onBack} /></EditorHost>;
  }

  function ClientsScreen({ sb, clients, onReload }) {
    const [query, setQuery] = React.useState('');
    const [selected, setSelected] = React.useState(null);
    const clientById = React.useMemo(() => { const m = {}; (clients || []).forEach(c => m[c.id] = c); return m; }, [clients]);

    const q = query.trim().toLowerCase();
    const visible = (clients || []).filter(c => {
      if (!q) return true;
      return [c.name, c.email, c.phone].filter(Boolean).join(' ').toLowerCase().includes(q);
    });

    return (
      <div className="fade-in">
        <div className="searchbar" style={{ marginBottom: 14 }}>
          <Icon name="search" size={19} style={{ color: 'var(--ink-45)' }} />
          <input placeholder="Search clients…" value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={() => setQuery('')}><Icon name="close" size={18} /></button>}
        </div>

        {clients === null && <Spinner />}
        {clients && visible.length === 0 && (
          <Empty icon="clients" title={clients.length === 0 ? 'No clients yet' : 'No matches'}
            sub={clients.length === 0 ? 'Tap the ＋ button to onboard your first client.' : 'Try another search.'} />
        )}

        <div className="stack stack--tight">
          {visible.map(c => (
            <div key={c.id} className="listcard" onClick={() => setSelected(c)}>
              <div className="avatar">{initials(c.name || c.email)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
              </div>
              <span className="pill" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-60)', textTransform: 'capitalize' }}>{(c.pricelist || 'standard')}</span>
              <Icon name="chevron" size={18} style={{ color: 'var(--ink-30)', flex: '0 0 auto' }} />
            </div>
          ))}
        </div>

        {selected && (
          <ClientDetail sb={sb} client={selected} clientById={clientById}
            onClose={() => setSelected(null)} onChanged={onReload} />
        )}
      </div>
    );
  }

  window.MClients = { ClientsScreen, ClientDetail };
})();
