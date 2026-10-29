/* pricelist-manager.jsx — PeakForm Bio Admin → Pricelist
   ────────────────────────────────────────────────────────────────────────────
   See and edit the product pricelist that drives the Client Portal order form.
   Two modes, chosen with the selector at the top:

   • Base pricelist (all clients) — edit the Standard + Wholesale prices every
     client inherits. Saves to app_settings key='pricelist'.
   • A specific client — give that client custom prices on any product. A blank
     custom price means "use their tier price". Saves to app_settings
     key='price_overrides' as { [clientId]: { [productName]: price } }.

   Both fall back to the baked-in defaults in pricelists.js, and both need only
   the app_settings table (already created on boot) — no migration.

   Exposes: window.PricelistManager
   ──────────────────────────────────────────────────────────────────────────── */
(function (global) {
  const { useState, useEffect, useMemo } = React;

  let _rowSeq = 1;

  // Responsive layout for editor rows — keeps the Product name full-width and
  // visible on phones (fixed columns otherwise crush it to zero width).
  if (typeof document !== 'undefined' && !document.getElementById('plm-responsive-styles')) {
    const _st = document.createElement('style');
    _st.id = 'plm-responsive-styles';
    _st.textContent =
      '.plm-head,.plm-row{display:grid;gap:10px;align-items:center;}' +
      '@media (max-width:760px){' +
      '.plm-head{display:none;}' +
      '.plm-row{grid-template-columns:1fr 1fr;gap:8px 10px;padding:10px 6px !important;border-bottom:1px solid rgba(255,255,255,0.06);}' +
      '.plm-row .plm-name{grid-column:1 / -1;}' +
      '.plm-row .plm-cat{grid-column:1 / -1;}' +
      '}';
    document.head.appendChild(_st);
  }

  function mergeRows(pricelists, tierKeys) {
    const map = new Map();
    const order = [];
    tierKeys.forEach(tier => {
      (pricelists[tier]?.products || []).forEach(p => {
        if (!map.has(p.name)) {
          map.set(p.name, { _id: _rowSeq++, name: p.name, category: p.category || 'Other', public: p.public !== false, hidden: p.hidden === true, kit5: p.kit5 ?? '', kit10: p.kit10 ?? '', kit5Hidden: p.kit5Hidden === true, kit10Hidden: p.kit10Hidden === true, prices: {} });
          order.push(p.name);
        }
        const row = map.get(p.name);
        row.prices[tier] = p.price;
        if ((!row.category || row.category === 'Other') && p.category) row.category = p.category;
        if (row.kit5 === '' && p.kit5 != null) row.kit5 = p.kit5;
        if (row.kit10 === '' && p.kit10 != null) row.kit10 = p.kit10;
        if (p.kit5Hidden) row.kit5Hidden = true;
        if (p.kit10Hidden) row.kit10Hidden = true;
      });
    });
    return order.map(n => map.get(n));
  }

  function rebuild(rows, meta, tierKeys) {
    const out = {};
    tierKeys.forEach(tier => {
      out[tier] = { name: meta[tier].name, description: meta[tier].description, products: [] };
      rows.forEach(row => {
        const raw = row.prices[tier];
        if (raw === '' || raw == null || isNaN(Number(raw))) return;
        const name = (row.name || '').trim();
        if (!name) return;
        out[tier].products.push({ name, price: Number(raw), category: (row.category || '').trim() || 'Other', ...(row.public === false ? { public: false } : {}), ...(row.hidden ? { hidden: true } : {}),
          ...(row.kit5 !== '' && row.kit5 != null && !isNaN(Number(row.kit5)) ? { kit5: Number(row.kit5) } : {}),
          ...(row.kit10 !== '' && row.kit10 != null && !isNaN(Number(row.kit10)) ? { kit10: Number(row.kit10) } : {}),
          ...(row.kit5Hidden ? { kit5Hidden: true } : {}), ...(row.kit10Hidden ? { kit10Hidden: true } : {}) });
      });
    });
    return out;
  }

  // Group a list of items (each with .category) by category, first-seen order,
  // honouring a lowercase text filter on name/category.
  function groupItems(items, q) {
    const order = [];
    const byCat = {};
    items.forEach(it => {
      if (q && !(it.name || '').toLowerCase().includes(q) && !(it.category || '').toLowerCase().includes(q)) return;
      const c = (it.category || 'Other').trim() || 'Other';
      if (!byCat[c]) { byCat[c] = []; order.push(c); }
      byCat[c].push(it);
    });
    return order.map(c => ({ category: c, items: byCat[c] }));
  }

  const PricelistManager = ({ sb, onBack, clients }) => {
    const clientList = (clients || []).filter(c => c && c.id).slice().sort((a, b) =>
      (a.name || a.email || '').localeCompare(b.name || b.email || ''));

    // Shared
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [filter, setFilter] = useState('');
    const [mode, setMode] = useState('base'); // 'base' | clientId
    const [plTab, setPlTab] = useState('retail'); // 'retail' | 'wholesale'
    const [overrides, setOverrides] = useState({}); // { clientId: { product: price } }

    // Inventory — merged in from the old separate Inventory tab. Keyed by
    // product_name, value = stock count. Only relevant in base mode.
    const [inventory, setInventory] = useState(new Map());
    const [stockPopover, setStockPopover] = useState(null); // { id, name, mode: 'set'|'add', value }

    useEffect(() => {
      if (!stockPopover) return;
      const close = (e) => { if (!e.target.closest('.pl-stock-pop')) setStockPopover(null); };
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }, [stockPopover]);

    const loadInventory = async () => {
      const { data, error } = await sb.from('inventory').select('*');
      if (error) { console.error('Failed to load inventory:', error); return; }
      const m = new Map();
      (data || []).forEach(r => m.set(r.product_name, r.stock));
      setInventory(m);
    };

    const commitStock = async () => {
      if (!stockPopover) return;
      const raw = parseInt(stockPopover.value, 10);
      if (!isFinite(raw)) return;
      const current = inventory.get(stockPopover.name) ?? 0;
      const next = stockPopover.mode === 'add' ? current + raw : raw;
      const { error } = await sb.from('inventory').upsert(
        { product_name: stockPopover.name, stock: next, updated_at: new Date().toISOString() },
        { onConflict: 'product_name' }
      );
      if (error) { setMsg('Error saving stock: ' + error.message); return; }
      setInventory(prev => new Map(prev).set(stockPopover.name, next));
      setStockPopover(null);
    };

    // Base mode
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ wholesale: { name: 'Wholesale', description: '' } });
    const [tierKeys, setTierKeys] = useState(['wholesale']);
    const [source, setSource] = useState('');

    // Client mode — edits as { [productName]: stringValue }, '' = use tier price
    const [cEdits, setCEdits] = useState({});

    function hydrateBase(pricelists, src) {
      // The Telegram tier has been retired — it's dropped here and on the next save.
      const keys = Object.keys(pricelists).filter(k => k !== 'telegram');
      const m = {};
      keys.forEach(k => { m[k] = { name: pricelists[k].name || k, description: pricelists[k].description || '' }; });
      setTierKeys(keys);
      setMeta(m);
      setRows(mergeRows(pricelists, keys));
      setSource(src);
    }

    useEffect(() => {
      let cancelled = false;
      (async () => {
        const active = await global.loadPricelists(sb);
        const ov = await global.loadPriceOverrides(sb);
        const isDefault = JSON.stringify(active) === JSON.stringify(global.PRICELISTS_DEFAULT);
        if (!cancelled) {
          hydrateBase(JSON.parse(JSON.stringify(active)), isDefault ? 'default' : 'saved');
          setOverrides(JSON.parse(JSON.stringify(ov || {})));
          setLoading(false);
        }
        await loadInventory();
      })();
      return () => { cancelled = true; };
    }, []);

    const selectedClient = mode !== 'base' ? clientList.find(c => String(c.id) === String(mode)) : null;
    const clientTier = selectedClient ? (selectedClient.pricelist || 'wholesale') : null;

    // When switching to a client, seed cEdits from their saved overrides.
    const switchMode = (m) => {
      setMode(m); setMsg(''); setFilter('');
      if (m !== 'base') {
        const ov = overrides[m] || {};
        const seed = {};
        Object.keys(ov).forEach(k => { seed[k] = String(ov[k]); });
        setCEdits(seed);
      }
    };

    // ── Base-mode mutations ────────────────────────────────────────────────────
    const patchRow = (id, patch) => setRows(rs => rs.map(r => r._id === id ? { ...r, ...patch } : r));
    const patchPrice = (id, tier, val) =>
      setRows(rs => rs.map(r => r._id === id ? { ...r, prices: { ...r.prices, [tier]: val } } : r));
    const removeRow = (id) => setRows(rs => rs.filter(r => r._id !== id));
    const addRow = (category) => {
      const blank = { _id: _rowSeq++, name: '', category: category || ((window.CATEGORY_TITLES && window.CATEGORY_TITLES[0]) || 'Wellness'), public: true, hidden: false, prices: {} };
      tierKeys.forEach(t => { blank.prices[t] = ''; });
      setRows(rs => [...rs, blank]);
      setMsg('');
    };

    const categories = useMemo(() => {
      const seen = [];
      rows.forEach(r => { const c = (r.category || '').trim(); if (c && !seen.includes(c)) seen.push(c); });
      return seen;
    }, [rows]);

    const groupedBase = useMemo(() => groupItems(rows, filter.trim().toLowerCase()), [rows, filter]);
    const productCount = rows.filter(r => (r.name || '').trim()).length;

    // ── Client-mode derived rows ───────────────────────────────────────────────
    const clientProducts = useMemo(() => {
      if (mode === 'base' || !clientTier) return [];
      const pl = global.getPricelist(clientTier);
      return (pl.products || []).map(p => ({ name: p.name, category: p.category || 'Other', tierPrice: p.price }));
    }, [mode, clientTier, source]);
    const groupedClient = useMemo(() => groupItems(clientProducts, filter.trim().toLowerCase()), [clientProducts, filter]);
    const overrideCount = useMemo(() => {
      let n = 0;
      clientProducts.forEach(p => {
        const v = cEdits[p.name];
        if (v !== '' && v != null && !isNaN(Number(v)) && Number(v) !== p.tierPrice) n++;
      });
      return n;
    }, [cEdits, clientProducts]);

    const setClientPrice = (name, val) => setCEdits(e => ({ ...e, [name]: val.replace(/[^0-9.]/g, '') }));
    const clearClientPrice = (name) => setCEdits(e => { const n = { ...e }; delete n[name]; return n; });

    // ── Save ───────────────────────────────────────────────────────────────────
    const saveBase = async () => {
      for (const r of rows) {
        const name = (r.name || '').trim();
        const hasAnyPrice = tierKeys.some(t => r.prices[t] !== '' && r.prices[t] != null && !isNaN(Number(r.prices[t])));
        if (!name && hasAnyPrice) { setMsg('Error: a product row is missing a name.'); return; }
        if (name && !hasAnyPrice) { setMsg(`Error: "${name}" needs a price in at least one tier.`); return; }
      }
      const next = rebuild(rows.filter(r => (r.name || '').trim()), meta, tierKeys);
      setSaving(true); setMsg('');
      try {
        const { error } = await global.savePricelists(sb, next);
        if (error) throw error;
        setMsg('✓ Saved. The client portal and order form now use these prices.');
        setSource('saved');
      } catch (err) { handleSaveErr(err); } finally { setSaving(false); }
    };

    const saveClient = async () => {
      // Build this client's override map: only entries that differ from tier price.
      const map = {};
      clientProducts.forEach(p => {
        const v = cEdits[p.name];
        if (v !== '' && v != null && !isNaN(Number(v)) && Number(v) !== p.tierPrice) map[p.name] = Number(v);
      });
      const nextOv = { ...overrides };
      if (Object.keys(map).length) nextOv[mode] = map; else delete nextOv[mode];
      setSaving(true); setMsg('');
      try {
        const { error } = await global.savePriceOverrides(sb, nextOv);
        if (error) throw error;
        setOverrides(nextOv);
        const nm = selectedClient ? (selectedClient.name || selectedClient.email) : 'this client';
        setMsg(`✓ Saved. ${nm} now sees ${Object.keys(map).length} custom price${Object.keys(map).length === 1 ? '' : 's'} in their portal.`);
      } catch (err) { handleSaveErr(err); } finally { setSaving(false); }
    };

    const handleSaveErr = (err) => {
      const m = (err && err.message) || String(err);
      if (/relation .*app_settings.* does not exist|does not exist|not accessible/i.test(m)) {
        setMsg('Could not save: the settings table isn’t set up yet. Redeploy the backend (it creates the table on boot), then try again.');
      } else { setMsg('Error: ' + m); }
    };

    const resetDefaults = () => {
      hydrateBase(JSON.parse(JSON.stringify(global.PRICELISTS_DEFAULT)), 'default');
      setMsg('Reset to the shipped defaults (not saved yet — click Save to apply).');
    };
    const clearAllClient = () => { setCEdits({}); setMsg('Cleared all custom prices for this client (not saved yet — click Save to apply).'); };

    const gridCols = `1fr 180px 56px 56px ${tierKeys.map(() => '100px').join(' ')} 110px 34px`;
    const kitGridCols = '1fr 120px 64px 130px 140px';
    // Wholesale kit prices: blank = automatic (5 vials at 70%, 10 vials at 50% of the vial price).
    const isPeptideCat = (c) => !/accessor|supplement|program|service|lab suppl|sports nutrition|coaching/i.test(c || '');
    const unitFor = (r) => Number(r.prices.wholesale ?? r.prices[tierKeys[tierKeys.length - 1]]);
    const autoKit = (r, vials, pct) => { const u = unitFor(r); if (!(u > 0)) return '—'; const t = Math.round(u * vials * pct * 100) / 100; return String(Number.isInteger(t) ? t : t.toFixed(2)); };
    const cell = { padding: '7px 10px', fontSize: 13.5 };
    const priceField = (val, onChange, placeholder, width) => (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 9, fontSize: 12.5, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }}>$</span>
        <input value={val === '' || val == null ? '' : val} onChange={e => onChange(e.target.value)}
          inputMode="decimal" placeholder={placeholder}
          className="field-input"
          style={{ width: width || 86, padding: '7px 10px 7px 18px', fontSize: 13.5, fontVariantNumeric: 'tabular-nums' }} />
      </div>
    );

    return (
      <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
        {onBack && <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>← Back</button>}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f7' }}>Pricelist</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 5, lineHeight: 1.5 }}>
            Edit the base prices every client inherits, or pick a client to give them custom prices. Changes apply to the client portal instantly after saving — no redeploy.
          </p>
        </div>

        {/* Mode selector */}
        <div className="card" style={{ padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Editing prices for</label>
          <select value={mode} onChange={e => switchMode(e.target.value)} className="field-input"
            style={{ padding: '9px 12px', fontSize: 14, minWidth: 260, cursor: 'pointer' }}>
            <option value="base">Base pricelist — all clients</option>
            {clientList.length > 0 && <optgroup label="Custom prices for a client">
              {clientList.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.email}{c.pricelist === 'wholesale' ? ' · wholesale' : ''}{(overrides[c.id] && Object.keys(overrides[c.id]).length) ? ` · ${Object.keys(overrides[c.id]).length} custom` : ''}</option>
              ))}
            </optgroup>}
          </select>
          {mode !== 'base' && selectedClient && (
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
              On the <b style={{ color: 'rgba(255,255,255,0.7)' }}>{global.getPricelist(clientTier).name || clientTier}</b> tier · {overrideCount} custom price{overrideCount === 1 ? '' : 's'}
            </span>
          )}
          {clientList.length === 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>(client list unavailable here — open from the admin to set per-client prices)</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter products…"
                className="field-input" style={{ flex: '1 1 220px', padding: '9px 12px', fontSize: 13.5 }} />
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>
                {mode === 'base'
                  ? `${productCount} products · ${tierKeys.length} tiers${source === 'saved' ? ' · saved version' : source === 'default' ? ' · using defaults' : ''}`
                  : `${clientProducts.length} products · blank = uses tier price`}
              </span>
              {mode === 'base' && (
                <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => {
                  const tier = tierKeys.includes('wholesale') ? 'wholesale' : tierKeys[0];
                  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
                  const lines = [['Product', 'Category', 'Price'].join(',')];
                  rows.filter(r => (r.name || '').trim())
                    .slice().sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
                    .forEach(r => {
                      const p = r.prices[tier];
                      lines.push([esc(r.name.trim()), esc(r.category || ''), (p === '' || p == null) ? '' : Number(p).toFixed(2)].join(','));
                    });
                  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `PeakFormBio-Products-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a); a.click(); a.remove();
                }}>Export spreadsheet</button>
              )}
            </div>

            {/* Inventory quick stats (base mode only) */}
            {mode === 'base' && (() => {
              const named = rows.filter(r => (r.name || '').trim());
              const outOfStock = named.filter(r => inventory.has(r.name) && (inventory.get(r.name) ?? 0) <= 0).length;
              const lowStock = named.filter(r => { const s = inventory.get(r.name); return s !== undefined && s > 0 && s <= 3; }).length;
              const tracked = named.filter(r => inventory.has(r.name)).length;
              return (
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 980, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)' }}>{tracked}/{named.length} tracked</span>
                  <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 980, background: lowStock ? 'rgba(255,159,10,0.14)' : 'rgba(255,255,255,0.05)', color: lowStock ? '#ff9f0a' : 'rgba(255,255,255,0.4)' }}>{lowStock} low stock</span>
                  <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 980, background: outOfStock ? 'rgba(255,69,58,0.14)' : 'rgba(255,255,255,0.05)', color: outOfStock ? '#ff453a' : 'rgba(255,255,255,0.4)' }}>{outOfStock} out of stock</span>
                </div>
              );
            })()}

            <datalist id="pl-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>

            {mode === 'base' && (
              <div role="tablist" style={{ display: 'inline-flex', padding: 4, gap: 4, borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                {[['retail', 'Retail', 'Single vials & extras'], ['wholesale', 'Wholesale', '5 & 10 vial kits']].map(([id, label, sub]) => {
                  const on = plTab === id;
                  return (
                    <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setPlTab(id)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140, padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: on ? '#2997ff' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
                      <span style={{ fontSize: 11, opacity: on ? 0.9 : 0.6 }}>{sub}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── WHOLESALE KITS ────────────────────────────────────────────── */}
            {mode === 'base' && plTab === 'wholesale' && <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.5 }}>
                Each peptide is sold in the Wholesale store as 5 vials and 10 vials. Leave a price blank to use the automatic price (5 vials at 70%, 10 vials at 50% of the Wholesale vial price). Uncheck Store to hide just that kit. Retail is not affected.
              </p>
              <div className="plm-head" style={{ gridTemplateColumns: kitGridCols, padding: '0 14px 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
                <span>Kit</span><span style={{ textAlign: 'right' }}>Vial price</span><span style={{ textAlign: 'center' }}>Store</span><span style={{ textAlign: 'right' }}>Kit price</span><span style={{ textAlign: 'right' }}>Automatic</span>
              </div>
              <div style={{ display: 'grid', gap: 18 }}>
                {groupedBase.filter(g => isPeptideCat(g.category)).map(group => (
                  <div key={group.category}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 4px 8px' }}>{group.category}</h3>
                    <div className="card" style={{ padding: 8, display: 'grid', gap: 2 }}>
                      {group.items.filter(r => (r.name || '').trim() && unitFor(r) > 0).map(r => [[5, 0.7, 'kit5', 'kit5Hidden'], [10, 0.5, 'kit10', 'kit10Hidden']].map(([vials, pct, key, hk]) => {
                        const off = r.hidden || r[hk];
                        return (
                          <div key={r._id + '-' + vials} className="plm-row" style={{ padding: '4px 8px', gridTemplateColumns: kitGridCols, opacity: off ? 0.45 : 1, borderTop: vials === 5 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                            <span style={{ fontSize: 13.5, color: '#ededef' }}>{r.name} <strong style={{ color: '#2997ff', fontWeight: 600 }}>· {vials} Vials</strong></span>
                            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>${unitFor(r)}</span>
                            <label title={r.hidden ? 'Hidden in Retail too — turn on Store in the Retail tab first' : 'Show this kit in the Wholesale store'} style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                              <input type="checkbox" checked={!off} disabled={r.hidden} onChange={e => patchRow(r._id, { [hk]: !e.target.checked })} />
                            </label>
                            <div style={{ justifySelf: 'end' }}>{priceField(r[key], v => patchRow(r._id, { [key]: v }), autoKit(r, vials, pct), 100)}</div>
                            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>${autoKit(r, vials, pct)}</span>
                          </div>
                        );
                      }))}
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* ── BASE MODE ─────────────────────────────────────────────────── */}
            {mode === 'base' && plTab === 'retail' && <>
              <div className="plm-head" style={{ gridTemplateColumns: gridCols,
                padding: '0 14px 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
                <span>Product</span><span>Category</span><span style={{ textAlign: 'center' }}>Site</span><span style={{ textAlign: 'center' }} title="Show in the client portal store">Store</span>
                {tierKeys.map(t => <span key={t} style={{ textAlign: 'right' }}>{meta[t]?.name || t}</span>)}
                <span style={{ textAlign: 'right' }}>Stock</span>
                <span></span>
              </div>
              <div style={{ display: 'grid', gap: 18 }}>
                {groupedBase.map(group => (
                  <div key={group.category}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 4px 8px' }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group.category}</h3>
                      <button className="btn-ghost" onClick={() => addRow(group.category)} style={{ fontSize: 12, padding: '4px 10px' }}>+ Add to {group.category}</button>
                    </div>
                    <div className="card" style={{ padding: 8, display: 'grid', gap: 4 }}>
                      {group.items.map(r => (
                        <div key={r._id} className="plm-row" style={{ padding: '2px 6px', gridTemplateColumns: gridCols }}>
                          <input value={r.name} onChange={e => patchRow(r._id, { name: e.target.value })} placeholder="Product name…" className="field-input plm-name" style={cell} />
                          <select value={r.category} onChange={e => patchRow(r._id, { category: e.target.value })} className="field-input plm-cat" style={{ ...cell, cursor: 'pointer' }}>
                            {!(window.CATEGORY_TITLES || []).includes(r.category) && <option value={r.category}>{r.category || '— category —'}</option>}
                            {(window.CATEGORY_TITLES || []).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <label title="Show on public website" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={r.public !== false} onChange={e => patchRow(r._id, { public: e.target.checked })} />
                          </label>
                          <label title="Show in the client portal store (uncheck to hide)" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={!r.hidden} onChange={e => patchRow(r._id, { hidden: !e.target.checked })} />
                          </label>
                          {tierKeys.map(t => <div key={t} style={{ justifySelf: 'end' }}>{priceField(r.prices[t], v => patchPrice(r._id, t, v), '—')}</div>)}
                          <div className="pl-stock-pop" style={{ position: 'relative', justifySelf: 'end' }}>
                            {(() => {
                              const stock = inventory.get(r.name);
                              const known = stock !== undefined;
                              const tone = !known ? 'muted' : stock <= 0 ? 'err' : stock <= 3 ? 'warn' : 'ok';
                              const bg = { muted: 'rgba(255,255,255,0.06)', ok: 'rgba(52,199,89,0.14)', warn: 'rgba(255,159,10,0.16)', err: 'rgba(255,69,58,0.16)' }[tone];
                              const fg = { muted: 'rgba(255,255,255,0.4)', ok: '#34c759', warn: '#ff9f0a', err: '#ff453a' }[tone];
                              return (
                                <button type="button"
                                  onClick={() => setStockPopover(p => (p && p.id === r._id) ? null : { id: r._id, name: r.name, mode: 'set', value: String(stock ?? 0) })}
                                  disabled={!r.name}
                                  style={{ minWidth: 64, padding: '6px 10px', borderRadius: 8, background: bg, color: fg, fontSize: 12.5, fontWeight: 600, border: 'none', cursor: r.name ? 'pointer' : 'default', fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit' }}>
                                  {known ? stock : '—'}
                                </button>
                              );
                            })()}
                            {stockPopover && stockPopover.id === r._id && (
                              <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 50, background: '#1a1a1c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 10, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                  <button type="button" onClick={() => setStockPopover(p => ({ ...p, mode: 'set' }))} style={{ flex: 1, fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: stockPopover.mode === 'set' ? '#2997ff' : 'transparent', color: stockPopover.mode === 'set' ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit' }}>Set</button>
                                  <button type="button" onClick={() => setStockPopover(p => ({ ...p, mode: 'add' }))} style={{ flex: 1, fontSize: 11, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: stockPopover.mode === 'add' ? '#2997ff' : 'transparent', color: stockPopover.mode === 'add' ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit' }}>Restock +</button>
                                </div>
                                <input autoFocus type="number" value={stockPopover.value}
                                  onChange={e => setStockPopover(p => ({ ...p, value: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') commitStock(); }}
                                  className="field-input" style={{ fontSize: 13, padding: '6px 8px', marginBottom: 8, width: '100%' }} />
                                <button type="button" onClick={commitStock} className="btn-blue" style={{ width: '100%', fontSize: 12, padding: '6px' }}>
                                  {stockPopover.mode === 'add' ? 'Add stock' : 'Save'}
                                </button>
                              </div>
                            )}
                          </div>
                          <button onClick={() => removeRow(r._id)} title="Remove product"
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedBase.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No products match “{filter}”.</div>}
              </div>
              <div style={{ marginTop: 16 }}><button className="btn-ghost" onClick={() => addRow('')}>+ Add product</button></div>
            </>}

            {/* ── CLIENT MODE ───────────────────────────────────────────────── */}
            {mode !== 'base' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 110px 34px', gap: 10, alignItems: 'center',
                padding: '0 14px 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
                <span>Product</span><span>Category</span>
                <span style={{ textAlign: 'right' }}>Tier price</span>
                <span style={{ textAlign: 'right' }}>Custom price</span>
                <span></span>
              </div>
              <div style={{ display: 'grid', gap: 18 }}>
                {groupedClient.map(group => (
                  <div key={group.category}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 4px 8px' }}>{group.category}</h3>
                    <div className="card" style={{ padding: 8, display: 'grid', gap: 4 }}>
                      {group.items.map(p => {
                        const v = cEdits[p.name];
                        const isOverride = v !== '' && v != null && !isNaN(Number(v)) && Number(v) !== p.tierPrice;
                        return (
                          <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 110px 34px', gap: 10, alignItems: 'center', padding: '3px 6px' }}>
                            <span style={{ fontSize: 13.5, color: '#ededef' }}>{p.name}</span>
                            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{p.category}</span>
                            <span style={{ justifySelf: 'end', fontSize: 13.5, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums', paddingRight: 4 }}>${p.tierPrice}</span>
                            <div style={{ justifySelf: 'end', position: 'relative' }}>
                              {priceField(v, val => setClientPrice(p.name, val), '$' + p.tierPrice, 100)}
                              {isOverride && <span style={{ position: 'absolute', right: -2, top: -7, width: 7, height: 7, borderRadius: '50%', background: '#34c759' }} title="Custom price set" />}
                            </div>
                            <button onClick={() => clearClientPrice(p.name)} title="Use tier price" disabled={!isOverride}
                              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: isOverride ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)', cursor: isOverride ? 'pointer' : 'default', fontSize: 15, lineHeight: 1 }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {groupedClient.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No products match “{filter}”.</div>}
              </div>
            </>}

            {/* Sticky action bar */}
            <div style={{ position: 'sticky', bottom: 0, marginTop: 24, padding: '16px 0',
              background: 'linear-gradient(to top, rgba(10,10,10,0.96) 60%, transparent)',
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {mode === 'base' ? (
                <>
                  <button className="btn-blue" onClick={saveBase} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save pricelist'}</button>
                  <button className="btn-ghost" onClick={resetDefaults}>Reset to defaults</button>
                </>
              ) : (
                <>
                  <button className="btn-blue" onClick={saveClient} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save custom prices'}</button>
                  <button className="btn-ghost" onClick={clearAllClient}>Clear all custom prices</button>
                </>
              )}
              {msg && <span style={{ fontSize: 13, color: msg.startsWith('✓') ? '#34c759' : msg.startsWith('Error') ? '#ff453a' : 'rgba(255,255,255,0.6)', flex: '1 1 240px', lineHeight: 1.45 }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    );
  };

  global.PricelistManager = PricelistManager;
})(window);
