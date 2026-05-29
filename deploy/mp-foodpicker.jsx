/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Meal Planner shared bits (food helpers, FoodPicker, Bar)
   Extracted from meal-planner.jsx so the standalone planner can reuse them.
   Exposes: window.MP = { DB, CATS, byName, uid, r0, r1, mkItem, im,
                          fitServings, FoodPicker, Bar }
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useMemo } = React;
  const DB   = window.FOOD_DB || [];
  const CATS = window.FOOD_CATEGORIES || [];
  const byName = n => DB.find(f => f.name === n);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const r0 = n => Math.round(n);
  const r1 = n => Math.round(n * 10) / 10;

  const mkItem = (food, servings = 1) => {
    const u = (food.unit || '').trim();
    const isG = u.toLowerCase() === 'g';
    const pg = u.match(/\(([\d.]+)\s*g\)/);
    const gramsBase = isG ? food.qty : (pg ? parseFloat(pg[1]) : null); // grams in one base serving
    return {
      uid: uid(), foodId: food.id, name: food.name, cat: food.cat,
      baseQty: food.qty, unit: food.unit, kcal: food.kcal, p: food.p, c: food.c, f: food.f, servings,
      gramsBase, displayUnit: isG ? 'g' : 'native',
    };
  };
  const im = it => ({ kcal: it.kcal * it.servings, p: it.p * it.servings, c: it.c * it.servings, f: it.f * it.servings });

  // Fit servings of chosen foods to a macro target (damped per-coordinate descent).
  const fitServings = (foods, target) => {
    const t = [target.protein_g || 0, target.carbs_g || 0, target.fat_g || 0];
    const s = foods.map(() => 2);
    for (let iter = 0; iter < 6000; iter++) {
      let P = 0, C = 0, F = 0;
      foods.forEach((fd, i) => { P += s[i] * fd.p; C += s[i] * fd.c; F += s[i] * fd.f; });
      const d = [P - t[0], C - t[1], F - t[2]];
      foods.forEach((fd, i) => {
        const grad = d[0] * fd.p + d[1] * fd.c + d[2] * fd.f;
        const denom = (fd.p * fd.p + fd.c * fd.c + fd.f * fd.f) || 1;
        s[i] = Math.min(20, Math.max(0, s[i] - (grad / denom) * 0.4));
      });
    }
    return s;
  };

  // Open Food Facts → our food item shape
  const offNum = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const mapOFF = (pr) => {
    const n = pr.nutriments || {};
    const brand = pr.brands ? pr.brands.split(',')[0].trim() : '';
    const name = [brand, pr.product_name || 'Unknown product'].filter(Boolean).join(' ');
    const kcalServ = offNum(n['energy-kcal_serving']);
    if (pr.serving_size && kcalServ > 0) {
      return { id: 'off' + (pr.code || uid()), name, cat: 'Open Food Facts', qty: 1, unit: pr.serving_size,
        kcal: Math.round(kcalServ), p: Math.round(offNum(n.proteins_serving)), c: Math.round(offNum(n.carbohydrates_serving)), f: Math.round(offNum(n.fat_serving)) };
    }
    return { id: 'off' + (pr.code || uid()), name, cat: 'Open Food Facts', qty: 100, unit: 'g',
      kcal: Math.round(offNum(n['energy-kcal_100g'])), p: Math.round(offNum(n.proteins_100g)), c: Math.round(offNum(n.carbohydrates_100g)), f: Math.round(offNum(n.fat_100g)) };
  };

  /* ─── Food picker modal ──────────────────────────────────────────────── */
  const FoodPicker = ({ title, onPick, onClose, multi, onPickMulti }) => {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('all');
    const [source, setSource] = useState('library');
    const [offList, setOffList] = useState([]);
    const [offLoading, setOffLoading] = useState(false);
    const [offError, setOffError] = useState('');
    const [sel, setSel] = useState([]);

    const libList = useMemo(() => {
      const s = q.trim().toLowerCase();
      return DB.filter(f => (cat === 'all' || f.cat === cat) && (!s || f.name.toLowerCase().includes(s)));
    }, [q, cat]);

    React.useEffect(() => {
      if (source !== 'off') return;
      const s = q.trim();
      if (s.length < 2) { setOffList([]); setOffError(''); return; }
      let cancelled = false;
      setOffLoading(true); setOffError('');
      const timer = setTimeout(async () => {
        try {
          const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(s)}&search_simple=1&action=process&json=1&page_size=25&fields=code,product_name,brands,serving_size,nutriments`;
          const res = await fetch(url);
          const data = await res.json();
          if (cancelled) return;
          setOffList((data.products || []).map(mapOFF).filter(x => x.kcal > 0 && x.name.trim()));
        } catch (e) {
          if (!cancelled) setOffError('Could not reach Open Food Facts — check the connection.');
        } finally { if (!cancelled) setOffLoading(false); }
      }, 450);
      return () => { cancelled = true; clearTimeout(timer); };
    }, [q, source]);

    React.useEffect(() => {
      const onKey = e => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    const list = source === 'off' ? offList : libList;
    const isSelected = f => sel.some(x => x.id === f.id);
    const toggleSel = f => setSel(s => isSelected(f) ? s.filter(x => x.id !== f.id) : [...s, f]);
    const onRowClick = f => { if (multi) toggleSel(f); else onPick(f); };

    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
        <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: '100%', maxWidth: 560, background: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f7' }}>{title}</h3>
            <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontSize: 17 }}>×</button>
          </div>
          <div style={{ display: 'flex', marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', width: 'fit-content' }}>
            {[['library', 'Library'], ['off', 'Open Food Facts']].map(([k, lbl]) => (
              <button key={k} onClick={() => setSource(k)} style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '7px 16px', border: 'none', background: source === k ? '#0066cc' : 'transparent', color: source === k ? '#fff' : 'rgba(255,255,255,0.6)' }}>{lbl}</button>
            ))}
          </div>
          <input className="field-input" placeholder={source === 'off' ? 'Search brands & products…' : 'Search foods…'} value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 12 }} autoFocus />
          {source === 'library' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {['all', ...CATS].map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, padding: '5px 11px', borderRadius: 980, border: `1px solid ${cat === c ? 'rgba(41,151,255,0.5)' : 'rgba(255,255,255,0.1)'}`, background: cat === c ? 'rgba(41,151,255,0.14)' : 'transparent', color: cat === c ? '#2997ff' : 'rgba(255,255,255,0.6)' }}>{c === 'all' ? 'All' : c}</button>
              ))}
            </div>
          )}
          {multi && <div style={{ fontSize: 12, color: (sel.length >= 3 && sel.length <= 10) ? '#34c759' : 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{sel.length} selected · pick 3–10 foods, then fit to macros</div>}
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {source === 'off' && offLoading && <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Searching Open Food Facts…</div>}
            {source === 'off' && offError && <div style={{ textAlign: 'center', padding: 20, color: '#ff9f0a', fontSize: 12.5 }}>{offError}</div>}
            {list.map(f => {
              const seld = isSelected(f);
              return (
                <button key={f.id} onClick={() => onRowClick(f)} style={{ fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${seld ? 'rgba(41,151,255,0.6)' : 'rgba(255,255,255,0.07)'}`, background: seld ? 'rgba(41,151,255,0.14)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{multi && (seld ? '✓ ' : '')}{f.name}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>{f.qty} {f.unit}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'ui-monospace,monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{f.kcal} kcal</div>
                    <div>P{f.p} · C{f.c} · F{f.f}</div>
                  </div>
                </button>
              );
            })}
            {list.length === 0 && source === 'library' && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No foods match.</div>}
            {list.length === 0 && source === 'off' && !offLoading && q.trim().length >= 2 && !offError && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No products found.</div>}
            {source === 'off' && q.trim().length < 2 && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.35)', fontSize: 12.5 }}>Type at least 2 characters to search Open Food Facts.</div>}
          </div>
          {multi && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-blue" disabled={sel.length < 3 || sel.length > 10} onClick={() => onPickMulti(sel)} style={{ opacity: (sel.length < 3 || sel.length > 10) ? 0.5 : 1, cursor: (sel.length < 3 || sel.length > 10) ? 'not-allowed' : 'pointer' }}>Fit {sel.length} foods to macros →</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ─── Macro progress bar (totals vs target) ──────────────────────────── */
  const Bar = ({ label, cur, target, unit, color }) => {
    const pct = target > 0 ? Math.min(cur / target * 100, 100) : 0;
    const diff = cur - target;
    const within = target > 0 && Math.abs(diff) <= Math.max(target * 0.07, unit === 'g' ? 5 : 50);
    const over = diff > 0 && !within;
    const tone = within ? '#34c759' : over ? '#ff9f0a' : color;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
          <span style={{ fontSize: 12.5, fontFamily: 'ui-monospace,monospace', color: '#f5f5f7' }}>
            {r0(cur)}<span style={{ color: 'rgba(255,255,255,0.35)' }}> / {r0(target)}{unit}</span>
            <span style={{ marginLeft: 8, color: within ? '#34c759' : over ? '#ff9f0a' : 'rgba(255,255,255,0.4)' }}>
              {diff > 0 ? '+' : ''}{r0(diff)}
            </span>
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: tone, borderRadius: 999, transition: 'width 0.2s, background 0.2s' }} />
        </div>
      </div>
    );
  };

  window.MP = { DB, CATS, byName, uid, r0, r1, mkItem, im, fitServings, FoodPicker, Bar };
})();
