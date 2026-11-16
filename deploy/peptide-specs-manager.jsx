// peptide-specs-manager.jsx — Admin → Catalog → Spec Cards
// Edit the peptide spec database (name on card, molecular weight, formula, CAS,
// form, tagline). Every product on the pricelist whose base name matches a spec
// (by name or alias) automatically shows the spec card on the public catalog.
// Saves to app_settings 'peptide_specs' via POST /api/admin/peptide-specs.
// Exports: window.PeptideSpecsManager

(function (global) {
  const NON_PEPTIDE = /program|service|accessor|supplement|coaching|lab suppl|sports nutrition/i;
  const blank = () => ({ id: '', name: '', aliases: [], mw: '', formula: '', cas: '', form: '', tagline: '' });
  const slug = (s) => String(s || '').toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Every pricelist product, grouped by base name → { base, category, strengths[] }
  function pricelistProducts() {
    const PL = global.PRICELISTS || {};
    const map = {};
    Object.values(PL).forEach(t => (t.products || []).forEach(p => {
      if (NON_PEPTIDE.test(p.category || '')) return;
      const { base, strength } = global.splitProductName(p.name);
      const k = base.toLowerCase();
      if (!map[k]) map[k] = { base, category: p.category || '', strengths: [] };
      if (strength && !map[k].strengths.includes(strength)) map[k].strengths.push(strength);
    }));
    return Object.values(map).sort((a, b) => a.base.localeCompare(b.base));
  }

  const PeptideSpecsManager = ({ onBack }) => {
    const [specs, setSpecs] = React.useState(() => global.mergePeptideSpecs([]));
    const [deleted, setDeleted] = React.useState([]);          // seed ids removed by the admin
    const [sel, setSel] = React.useState(0);
    const [q, setQ] = React.useState('');
    const [msg, setMsg] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [dirty, setDirty] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const products = React.useMemo(pricelistProducts, []);

    React.useEffect(() => {
      fetch('/api/public/peptide-specs').then(r => r.ok ? r.json() : null).then(d => {
        const live = (d && d.specs) || [];
        setSpecs(global.mergePeptideSpecs(live));
        setDeleted(live.filter(s => s._deleted).map(s => s.id));
      }).catch(() => {});
    }, []);

    const cur = specs[sel] || null;
    const missing = products.filter(p => !global.findPeptideSpec(p.base, specs));
    const matched = cur ? products.filter(p => global.findPeptideSpec(p.base, [cur])) : [];
    const strength = matched[0] ? global.joinStrengths(matched[0].strengths) : '10 MG';

    const update = (patch) => {
      setSpecs(list => list.map((s, i) => i === sel ? { ...s, ...patch } : s));
      setDirty(true); setMsg('');
    };
    const addSpec = (fromName) => {
      const name = fromName ? fromName.toUpperCase() : 'NEW PEPTIDE';
      const s = { ...blank(), id: slug(fromName || 'new-peptide-' + Date.now()), name, aliases: fromName ? [fromName] : [] };
      setSpecs(list => [...list, s]); setSel(specs.length); setDirty(true);
    };
    const removeSpec = () => {
      if (!cur || !confirmDelete) return;
      const isSeed = (global.PEPTIDE_SPECS_SEED || []).some(s => s.id === cur.id);
      if (isSeed) setDeleted(d => [...d, cur.id]);
      setSpecs(list => list.filter((_, i) => i !== sel)); setSel(0); setDirty(true); setConfirmDelete(false);
    };
    const save = async () => {
      const bad = specs.find(s => !s.id || !s.name);
      if (bad) { setMsg('Every spec needs a name.'); return; }
      const ids = specs.map(s => s.id);
      if (new Set(ids).size !== ids.length) { setMsg('Two specs share the same id — rename one.'); return; }
      setSaving(true); setMsg('');
      try {
        const body = { specs: [...specs, ...deleted.filter(id => !ids.includes(id)).map(id => ({ id, _deleted: true }))] };
        const res = await fetch('/api/admin/peptide-specs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('_pfb_token') },
          body: JSON.stringify(body),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.message || ('HTTP ' + res.status));
        setDirty(false); setMsg('✓ Saved. Spec cards on the website update on next page load.');
      } catch (e) { setMsg('Could not save: ' + e.message); }
      finally { setSaving(false); }
    };

    const field = (label, key, placeholder, hint) => (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: 0.3 }}>{label}</div>
        <input className="field-input" value={key === 'aliases' ? (cur.aliases || []).join(', ') : (cur[key] || '')}
          placeholder={placeholder}
          onChange={e => update(key === 'aliases'
            ? { aliases: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }
            : { [key]: e.target.value })}
          style={{ width: '100%', padding: '9px 12px', fontSize: 14 }} />
        {hint && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{hint}</div>}
      </label>
    );

    const shown = specs.map((s, i) => ({ s, i })).filter(({ s }) => !q || (s.name + ' ' + (s.aliases || []).join(' ')).toLowerCase().includes(q.toLowerCase()));
    const D = global.PEPTIDE_SPEC_DEFAULTS || {};

    return (
      <div style={{ color: '#f5f5f7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {onBack && <button className="btn-ghost" onClick={onBack}>← Back</button>}
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Spec Cards</h2>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{specs.length} peptides in the database</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {msg && <span style={{ fontSize: 13, color: msg.startsWith('✓') ? '#30d158' : '#ff9f0a' }}>{msg}</span>}
            <button onClick={save} disabled={saving || !dirty}
              style={{ background: dirty ? '#0066cc' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 980,
                padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: dirty ? 'pointer' : 'default' }}>
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </div>

        {missing.length > 0 && (
          <div style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.3)', borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#ff9f0a', fontWeight: 600, marginBottom: 8 }}>
              {missing.length} pricelist product{missing.length === 1 ? '' : 's'} without a spec card (they show their photo instead). Click one to add it:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {missing.map(p => (
                <button key={p.base} onClick={() => addSpec(p.base)}
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#f5f5f7', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 980, padding: '5px 12px', fontSize: 12.5, cursor: 'pointer' }}>
                  + {p.base}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) minmax(280px, 1fr) minmax(260px, 340px)', gap: 20, alignItems: 'start' }}>
          {/* list */}
          <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 10 }}>
            <input className="field-input" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13.5, marginBottom: 8 }} />
            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              {shown.map(({ s, i }) => (
                <div key={s.id + i} onClick={() => { setSel(i); setConfirmDelete(false); }}
                  style={{ padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
                    background: i === sel ? 'rgba(41,151,255,0.16)' : 'transparent', color: i === sel ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                  {s.name || '(unnamed)'}
                  {!s.mw || !s.cas ? <span style={{ color: '#ff9f0a', fontSize: 11, marginLeft: 6 }}>incomplete</span> : null}
                </div>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => addSpec('')} style={{ width: '100%', marginTop: 8 }}>+ Add peptide</button>
          </div>

          {/* editor */}
          <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
            {cur ? (
              <>
                {field('Name on card', 'name', 'BPC-157', 'Shown big on the card. Shorter names display larger.')}
                {field('Pricelist names that use this card', 'aliases', 'BPC, BPC 157',
                  matched.length ? `Matches: ${matched.map(m => m.base + (m.strengths.length ? ' (' + m.strengths.join(', ') + ')' : '')).join(' · ')}`
                    : 'No pricelist product matches yet — add the product\'s name here (before the " — 10mg" part).')}
                {field('Molecular weight', 'mw', '1419.5 g/mol')}
                {field('Molecular formula', 'formula', 'C62H98N16O22', 'Type it plain — numbers become subscripts on the card.')}
                {field('CAS number', 'cas', '137525-51-0')}
                {field('Form', 'form', D.form, 'Leave blank for "' + D.form + '".')}
                {field('Tagline', 'tagline', D.tagline, 'Leave blank for the default line.')}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  {!confirmDelete
                    ? <button className="btn-ghost" onClick={() => setConfirmDelete(true)} style={{ color: '#ff453a' }}>Remove from database</button>
                    : <>
                        <span style={{ fontSize: 13, alignSelf: 'center', color: '#ff453a' }}>Remove {cur.name}? Its products go back to photos.</span>
                        <button className="btn-ghost" onClick={removeSpec} style={{ color: '#ff453a' }}>Remove</button>
                        <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                      </>}
                </div>
              </>
            ) : <div style={{ color: 'rgba(255,255,255,0.5)' }}>Select a peptide.</div>}
          </div>

          {/* live preview */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Live preview{matched[0] ? ` — ${matched[0].base}` : ''}</div>
            {cur && global.SpecCard && <global.SpecCard spec={cur} strength={strength} zoom={false} />}
          </div>
        </div>
      </div>
    );
  };

  global.PeptideSpecsManager = PeptideSpecsManager;
})(window);
