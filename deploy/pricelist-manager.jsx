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
      '.plm-head,.plm-row{display:grid;grid-template-columns:1fr 180px 56px 100px 100px 34px;gap:10px;align-items:center;}' +
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
          map.set(p.name, { _id: _rowSeq++, name: p.name, category: p.category || 'Other', public: p.public !== false, prices: {} });
          order.push(p.name);
        }
        const row = map.get(p.name);
        row.prices[tier] = p.price;
        if ((!row.category || row.category === 'Other') && p.category) row.category = p.category;
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
        out[tier].products.push({ name, price: Number(raw), category: (row.category || '').trim() || 'Other', ...(row.public === false ? { public: false } : {}) });
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
    const [overrides, setOverrides] = useState({}); // { clientId: { product: price } }

    // Base mode
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ standard: { name: 'Standard', description: '' }, wholesale: { name: 'Wholesale', description: '' } });
    const [tierKeys, setTierKeys] = useState(['standard', 'wholesale']);
    const [source, setSource] = useState('');

    // Client mode — edits as { [productName]: stringValue }, '' = use tier price
    const [cEdits, setCEdits] = useState({});

    function hydrateBase(pricelists, src) {
      const keys = Object.keys(pricelists);
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
      })();
      return () => { cancelled = true; };
    }, []);

    const selectedClient = mode !== 'base' ? clientList.find(c => String(c.id) === String(mode)) : null;
    const clientTier = selectedClient ? (selectedClient.pricelist || 'standard') : null;

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
      const blank = { _id: _rowSeq++, name: '', category: category || ((window.CATEGORY_TITLES && window.CATEGORY_TITLES[0]) || 'Wellness'), public: true, prices: {} };
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
            </div>

            <datalist id="pl-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>

            {/* ── BASE MODE ─────────────────────────────────────────────────── */}
            {mode === 'base' && <>
              <div className="plm-head" style={{
                padding: '0 14px 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
                <span>Product</span><span>Category</span><span style={{ textAlign: 'center' }}>Site</span>
                <span style={{ textAlign: 'right' }}>{meta[tierKeys[0]]?.name || 'Standard'}</span>
                <span style={{ textAlign: 'right' }}>{meta[tierKeys[1]]?.name || 'Wholesale'}</span>
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
                        <div key={r._id} className="plm-row" style={{ padding: '2px 6px' }}>
                          <input value={r.name} onChange={e => patchRow(r._id, { name: e.target.value })} placeholder="Product name…" className="field-input plm-name" style={cell} />
                          <select value={r.category} onChange={e => patchRow(r._id, { category: e.target.value })} className="field-input plm-cat" style={{ ...cell, cursor: 'pointer' }}>
                            {!(window.CATEGORY_TITLES || []).includes(r.category) && <option value={r.category}>{r.category || '— category —'}</option>}
                            {(window.CATEGORY_TITLES || []).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <label title="Show on public website" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={r.public !== false} onChange={e => patchRow(r._id, { public: e.target.checked })} />
                          </label>
                          <div style={{ justifySelf: 'end' }}>{priceField(r.prices[tierKeys[0]], v => patchPrice(r._id, tierKeys[0], v), '—')}</div>
                          <div style={{ justifySelf: 'end' }}>{priceField(r.prices[tierKeys[1]], v => patchPrice(r._id, tierKeys[1], v), '—')}</div>
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
