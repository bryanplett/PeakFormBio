/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Meal Planner shared bits (food helpers, FoodPicker, Bar)
   Exposes: window.MP = { DB, CATS, byName, uid, r0, r1, mkItem, im,
                          fitServings, getServingPresets, FoodPicker, Bar }
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
    const gramsBase = isG ? food.qty : (pg ? parseFloat(pg[1]) : null);
    return {
      uid: uid(), foodId: food.id, name: food.name, cat: food.cat,
      baseQty: food.qty, unit: food.unit, kcal: food.kcal, p: food.p, c: food.c, f: food.f, servings,
      gramsBase, displayUnit: isG ? 'g' : 'native',
    };
  };
  const im = it => ({ kcal: it.kcal * it.servings, p: it.p * it.servings, c: it.c * it.servings, f: it.f * it.servings });

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

  // ── Smart serving presets ─────────────────────────────────────────────────
  const getServingPresets = (food) => {
    const u   = (food.unit || '').toLowerCase();
    const n   = (food.name || '').toLowerCase();
    const qty = food.qty || 1;

    // Eggs — count by whole number
    if (n.includes('egg white') || n.includes('egg whites') || (n.includes('egg') && u.includes('cup')))
      return [{l:'1',v:1},{l:'2',v:2},{l:'3',v:3},{l:'4',v:4},{l:'6',v:6},{l:'8',v:8}];
    if (n.includes('egg') && !u.includes('g'))
      return [{l:'1',v:1},{l:'2',v:2},{l:'3',v:3},{l:'4',v:4},{l:'5',v:5},{l:'6',v:6}];

    // Weight per 100g (meats, fish, tofu) — oz AND grams
    if (u === 'g')
      return [
        {l:'50g',v:0.5},{l:'75g',v:0.75},{l:'2 oz · 57g',v:0.57},
        {l:'3 oz · 85g',v:0.85},{l:'100g',v:1},{l:'4 oz · 113g',v:1.13},
        {l:'5 oz · 142g',v:1.42},{l:'150g',v:1.5},{l:'6 oz · 170g',v:1.7},
        {l:'200g',v:2},{l:'8 oz · 227g',v:2.27},{l:'12 oz · 340g',v:3.4},
      ];

    // Scoop
    if (u.includes('scoop'))
      return [{l:'½ scoop',v:0.5},{l:'1 scoop',v:1},{l:'1½ scoops',v:1.5},{l:'2 scoops',v:2},{l:'3 scoops',v:3}];

    // Cup
    if (u.includes('cup'))
      return [
        {l:'¼ cup',v:0.25},{l:'⅓ cup',v:0.33},{l:'½ cup',v:0.5},{l:'¾ cup',v:0.75},
        {l:'1 cup',v:1},{l:'1½ cups',v:1.5},{l:'2 cups',v:2},{l:'3 cups',v:3},
      ];

    // Tablespoon
    if (u.includes('tbsp')) {
      if (qty >= 2)
        return [{l:'1 tsp',v:1/(qty*3)},{l:'½ tbsp',v:0.5/qty},{l:'1 tbsp',v:1/qty},{l:'2 tbsp',v:2/qty},{l:'3 tbsp',v:3/qty},{l:'4 tbsp',v:4/qty}];
      return [{l:'¼ tsp',v:0.083},{l:'½ tsp',v:0.167},{l:'1 tsp',v:0.33},{l:'1 tbsp',v:1},{l:'2 tbsp',v:2},{l:'3 tbsp',v:3}];
    }

    // Slice
    if (u.includes('slice'))
      return [{l:'½',v:0.5},{l:'1',v:1},{l:'2',v:2},{l:'3',v:3},{l:'4',v:4},{l:'5',v:5}];

    // oz items (nuts, cheese, jerky)
    if (/\d+\s*oz/.test(u) || u.startsWith('oz'))
      return [{l:'½ oz',v:0.5},{l:'1 oz',v:1},{l:'1½ oz',v:1.5},{l:'2 oz',v:2},{l:'3 oz',v:3},{l:'4 oz',v:4}];

    // Tsp
    if (u.includes('tsp'))
      return [{l:'¼ tsp',v:0.25},{l:'½ tsp',v:0.5},{l:'1 tsp',v:1},{l:'2 tsp',v:2},{l:'1 tbsp',v:3},{l:'2 tbsp',v:6}];

    // Single-unit items
    if (/\b(bar|bottle|packet|link|shake|can|muffin|waffle|pancake|frank|wing|bun|roll|bagel|sandwich|burger|burrito|taco|sub|bowl|enchilada)\b/.test(u))
      return [{l:'½',v:0.5},{l:'1',v:1},{l:'2',v:2},{l:'3',v:3}];

    // Whole fruit / medium/large items
    if (/medium|large|small|xl/.test(u))
      return [{l:'¼',v:0.25},{l:'½',v:0.5},{l:'1',v:1},{l:'2',v:2},{l:'3',v:3}];

    // Default
    return [{l:'¼',v:0.25},{l:'½',v:0.5},{l:'1',v:1},{l:'1½',v:1.5},{l:'2',v:2},{l:'3',v:3}];
  };

  // ── Open Food Facts mapper ────────────────────────────────────────────────
  const offNum = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const mapOFF = (pr) => {
    const n = pr.nutriments || {};
    const brand = pr.brands ? pr.brands.split(',')[0].trim() : '';
    const name = [brand, pr.product_name || 'Unknown product'].filter(Boolean).join(' ');
    const kcalServ = offNum(n['energy-kcal_serving']);
    if (pr.serving_size && kcalServ > 0) {
      return { id: 'off' + (pr.code || uid()), name, cat: 'Open Food Facts', qty: 1, unit: pr.serving_size,
        kcal: Math.round(kcalServ), p: Math.round(offNum(n.proteins_serving)),
        c: Math.round(offNum(n.carbohydrates_serving)), f: Math.round(offNum(n.fat_serving)) };
    }
    return { id: 'off' + (pr.code || uid()), name, cat: 'Open Food Facts', qty: 100, unit: 'g',
      kcal: Math.round(offNum(n['energy-kcal_100g'])), p: Math.round(offNum(n.proteins_100g)),
      c: Math.round(offNum(n.carbohydrates_100g)), f: Math.round(offNum(n.fat_100g)) };
  };

  // ── ServingSizePicker (step 2 inside FoodPicker) ──────────────────────────
  const ServingSizePicker = ({ food, mealLabel, onConfirm, onBack }) => {
    const [servMult, setServMult] = useState(1);
    const [gramInput, setGramInput] = useState('');
    const presets = getServingPresets(food);
    const mult    = Math.max(0.1, servMult);

    // Derive grams per 1× serving multiplier (enables weight-based entry)
    const gPerServing = useMemo(() => {
      const u = food.unit || '';
      if (u.toLowerCase() === 'g') return food.qty;
      const pg = u.match(/\(([\d.]+)\s*g\)/i);
      return pg ? parseFloat(pg[1]) : null;
    }, [food]);

    const handlePreset = (v) => {
      setServMult(v);
      if (gPerServing) setGramInput(String(Math.round(v * gPerServing)));
      else setGramInput('');
    };

    const handleStepper = (v) => {
      const clamped = Math.max(0.1, r1(v));
      setServMult(clamped);
      if (gPerServing) setGramInput(String(Math.round(clamped * gPerServing)));
    };

    const handleGramInput = (raw) => {
      setGramInput(raw);
      const g = parseFloat(raw);
      if (gPerServing && g > 0) setServMult(r1(g / gPerServing));
    };

    const aKcal = r0(food.kcal * mult);
    const aP    = r0(food.p    * mult);
    const aC    = r0(food.c    * mult);
    const aF    = r0(food.f    * mult);
    const displayGrams = gPerServing ? Math.round(mult * gPerServing) : null;

    return (
      <div>
        {/* Back */}
        <button onClick={onBack}
          style={{ background:'transparent', border:'none', color:'#2997ff', fontWeight:600,
            fontSize:13, cursor:'pointer', fontFamily:'inherit', padding:0,
            marginBottom:14, display:'flex', alignItems:'center', gap:5 }}>
          ← Back to results
        </button>

        {/* Food title */}
        <div style={{ fontSize:17, fontWeight:700, color:'#f5f5f7', marginBottom:2 }}>{food.name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:16 }}>
          Base serving: <span style={{ color:'rgba(255,255,255,0.7)' }}>{food.qty} {food.unit}</span>
          &nbsp;·&nbsp;{food.kcal} kcal · P{food.p} C{r0(food.c)} F{food.f}
        </div>

        {/* Presets */}
        <div style={{ marginBottom:4 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)',
            textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
            Quick amounts
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {presets.map(p => {
              const active = Math.abs(mult - p.v) < 0.015;
              return (
                <button key={p.l} onClick={() => handlePreset(p.v)}
                  style={{ fontFamily:'inherit', cursor:'pointer',
                    border: `1.5px solid ${active ? 'rgba(41,151,255,0.8)' : 'rgba(255,255,255,0.14)'}`,
                    background: active ? 'rgba(41,151,255,0.18)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#2997ff' : '#f5f5f7',
                    borderRadius:10, padding:'7px 13px', fontWeight:active?700:500, fontSize:13 }}>
                  {p.l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom multiplier stepper */}
        <div style={{ marginTop:14, marginBottom: gPerServing ? 10 : 16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)',
            textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
            Custom amount
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10,
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:12, padding:'6px 10px' }}>
            <button onClick={() => handleStepper(mult - 0.25)}
              style={{ width:32, height:32, borderRadius:8, border:'1px solid rgba(255,255,255,0.15)',
                background:'transparent', color:'#f5f5f7', cursor:'pointer', fontSize:18,
                fontFamily:'inherit', flexShrink:0 }}>−</button>
            <div style={{ flex:1, textAlign:'center' }}>
              <input type="number" inputMode="decimal" value={servMult}
                onChange={e => handleStepper(parseFloat(e.target.value) || 0.1)}
                style={{ width:'100%', background:'transparent', border:'none', color:'#f5f5f7',
                  fontSize:20, fontWeight:700, fontFamily:'inherit', outline:'none',
                  textAlign:'center' }} />
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                × {food.unit}{displayGrams ? ` = ${displayGrams}g` : ''}
              </div>
            </div>
            <button onClick={() => handleStepper(mult + 0.25)}
              style={{ width:32, height:32, borderRadius:8, border:'1px solid rgba(255,255,255,0.15)',
                background:'transparent', color:'#f5f5f7', cursor:'pointer', fontSize:18,
                fontFamily:'inherit', flexShrink:0 }}>+</button>
          </div>
        </div>

        {/* Weight in grams — shown when gram data is derivable */}
        {gPerServing && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)',
              textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
              Or enter weight in grams
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:12, padding:'8px 14px' }}>
              <input type="number" inputMode="decimal" min="1"
                placeholder={String(displayGrams || '')}
                value={gramInput}
                onChange={e => handleGramInput(e.target.value)}
                style={{ flex:1, background:'transparent', border:'none', color:'#f5f5f7',
                  fontSize:22, fontWeight:700, fontFamily:'inherit', outline:'none',
                  textAlign:'center' }} />
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:16, fontWeight:600, flexShrink:0 }}>g</span>
            </div>
          </div>
        )}

        {/* Macro preview */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[['kcal', aKcal, '#2997ff'],['P', aP+'g', '#34c759'],['C', aC+'g', '#ff9f0a'],['F', aF+'g', '#bf5af2']].map(([lbl,val,col]) => (
            <div key={lbl} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:10, padding:'10px 6px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:col }}>{val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:600,
                textTransform:'uppercase', marginTop:3 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Confirm */}
        <button onClick={() => onConfirm(food, mult)}
          style={{ width:'100%', background:'#0066cc', color:'#fff', border:'none',
            borderRadius:12, padding:'13px', fontSize:15, fontWeight:600,
            cursor:'pointer', fontFamily:'inherit' }}>
          {mealLabel ? `Add to ${mealLabel}` : 'Add food'}
        </button>
      </div>
    );
  };

  // ── FoodPicker modal ──────────────────────────────────────────────────────
  const FoodPicker = ({ title, onPick, onClose, multi, onPickMulti }) => {
    const [q, setQ]             = useState('');
    const [cat, setCat]         = useState('all');
    const [source, setSource]   = useState('library');
    const [offList, setOffList] = useState([]);
    const [offLoading, setOffLoading] = useState(false);
    const [offError, setOffError]     = useState('');
    const [sel, setSel]         = useState([]);
    const [sizing, setSizing]   = useState(null); // food being portion-sized (single mode only)

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
          const res  = await fetch(url);
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
      const onKey = e => { if (e.key === 'Escape') { if (sizing) setSizing(null); else onClose(); } };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [sizing]);

    const list       = source === 'off' ? offList : libList;
    const isSelected = f => sel.some(x => x.id === f.id);
    const toggleSel  = f => setSel(s => isSelected(f) ? s.filter(x => x.id !== f.id) : [...s, f]);

    const onRowClick = f => {
      if (multi) { toggleSel(f); }
      else { setSizing(f); }          // single mode → go to serving picker
    };

    const handleConfirm = (food, servings) => {
      onPick(food, servings);         // caller receives (food, servings)
    };

    // Extract meal label from title string (e.g. "Add food to Breakfast" → "Breakfast")
    const mealLabel = title ? title.replace(/^(add food|swap food)\s*(to\s*)?/i, '').trim() : '';

    return (
      <div onClick={() => { if (!sizing) onClose(); }}
        style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)',
          backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-start',
          justifyContent:'center', padding:'40px 20px', overflowY:'auto' }}>
        <div onClick={e => e.stopPropagation()} className="fade-in"
          style={{ width:'100%', maxWidth:560, background:'#141416',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:24,
            boxShadow:'0 30px 80px -20px rgba(0,0,0,0.7)' }}>

          {sizing ? (
            /* ── Step 2: Serving size picker ── */
            <ServingSizePicker
              food={sizing}
              mealLabel={mealLabel}
              onConfirm={handleConfirm}
              onBack={() => setSizing(null)}
            />
          ) : (
            /* ── Step 1: Search + food list ── */
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                marginBottom:14 }}>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#f5f5f7' }}>{title}</h3>
                <button onClick={onClose} aria-label="Close"
                  style={{ width:32, height:32, borderRadius:'50%',
                    background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
                    color:'#fff', cursor:'pointer', fontSize:17 }}>×</button>
              </div>

              {/* Library / Open Food Facts toggle */}
              <div style={{ display:'flex', marginBottom:12, borderRadius:10, overflow:'hidden',
                border:'1px solid rgba(255,255,255,0.12)', width:'fit-content' }}>
                {[['library','Library'],['off','Open Food Facts']].map(([k,lbl]) => (
                  <button key={k} onClick={() => setSource(k)}
                    style={{ fontFamily:'inherit', cursor:'pointer', fontSize:12.5, fontWeight:600,
                      padding:'7px 16px', border:'none',
                      background: source === k ? '#0066cc' : 'transparent',
                      color: source === k ? '#fff' : 'rgba(255,255,255,0.6)' }}>{lbl}</button>
                ))}
              </div>

              <input className="field-input"
                placeholder={source === 'off' ? 'Search brands & products…' : 'Search foods…'}
                value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom:12 }} autoFocus />

              {source === 'library' && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {['all', ...CATS].map(c => (
                    <button key={c} onClick={() => setCat(c)}
                      style={{ fontFamily:'inherit', cursor:'pointer', fontSize:11.5, fontWeight:600,
                        padding:'5px 11px', borderRadius:980,
                        border:`1px solid ${cat === c ? 'rgba(41,151,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        background: cat === c ? 'rgba(41,151,255,0.14)' : 'transparent',
                        color: cat === c ? '#2997ff' : 'rgba(255,255,255,0.6)' }}>
                      {c === 'all' ? 'All' : c}
                    </button>
                  ))}
                </div>
              )}

              {multi && (
                <div style={{ fontSize:12, color:(sel.length >= 3 && sel.length <= 10) ? '#34c759' : 'rgba(255,255,255,0.5)', marginBottom:10 }}>
                  {sel.length} selected · pick 3–10 foods, then fit to macros
                </div>
              )}

              <div style={{ maxHeight:360, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                {source === 'off' && offLoading && (
                  <div style={{ textAlign:'center', padding:20, color:'rgba(255,255,255,0.4)', fontSize:13 }}>
                    Searching Open Food Facts…
                  </div>
                )}
                {source === 'off' && offError && (
                  <div style={{ textAlign:'center', padding:20, color:'#ff9f0a', fontSize:12.5 }}>
                    {offError}
                  </div>
                )}
                {list.map(f => {
                  const seld = isSelected(f);
                  return (
                    <button key={f.id} onClick={() => onRowClick(f)}
                      style={{ fontFamily:'inherit', textAlign:'left', cursor:'pointer',
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        gap:12, padding:'10px 14px', borderRadius:10,
                        border:`1px solid ${seld ? 'rgba(41,151,255,0.6)' : 'rgba(255,255,255,0.07)'}`,
                        background: seld ? 'rgba(41,151,255,0.14)' : 'rgba(255,255,255,0.03)' }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:500, color:'#f5f5f7',
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {multi && (seld ? '✓ ' : '')}{f.name}
                        </div>
                        <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)' }}>
                          {f.qty} {f.unit}
                        </div>
                      </div>
                      <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.55)',
                        fontFamily:'ui-monospace,monospace', textAlign:'right', whiteSpace:'nowrap',
                        flexShrink:0 }}>
                        <div style={{ color:'#fff', fontWeight:600 }}>{f.kcal} kcal</div>
                        <div>P{f.p} · C{r0(f.c)} · F{f.f}</div>
                      </div>
                      {/* Arrow hint for single mode */}
                      {!multi && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink:0 }}>
                          <path d="M7 5l5 5-5 5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
                {list.length === 0 && source === 'library' && (
                  <div style={{ textAlign:'center', padding:30, color:'rgba(255,255,255,0.4)', fontSize:13 }}>
                    No foods match — try a different search or category.
                  </div>
                )}
                {list.length === 0 && source === 'off' && !offLoading && q.trim().length >= 2 && !offError && (
                  <div style={{ textAlign:'center', padding:30, color:'rgba(255,255,255,0.4)', fontSize:13 }}>
                    No products found.
                  </div>
                )}
                {source === 'off' && q.trim().length < 2 && (
                  <div style={{ textAlign:'center', padding:30, color:'rgba(255,255,255,0.35)', fontSize:12.5 }}>
                    Type at least 2 characters to search Open Food Facts.
                  </div>
                )}
              </div>

              {multi && (
                <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
                  <button className="btn-blue"
                    disabled={sel.length < 3 || sel.length > 10}
                    onClick={() => onPickMulti(sel)}
                    style={{ opacity:(sel.length < 3 || sel.length > 10) ? 0.5 : 1,
                      cursor:(sel.length < 3 || sel.length > 10) ? 'not-allowed' : 'pointer' }}>
                    Fit {sel.length} foods to macros →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  /* ─── Macro progress bar ─────────────────────────────────────────────────── */
  const Bar = ({ label, cur, target, unit, color }) => {
    const pct  = target > 0 ? Math.min(cur / target * 100, 100) : 0;
    const diff = cur - target;
    const within = target > 0 && Math.abs(diff) <= Math.max(target * 0.07, unit === 'g' ? 5 : 50);
    const over   = diff > 0 && !within;
    const tone   = within ? '#34c759' : over ? '#ff9f0a' : color;
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>{label}</span>
          <span style={{ fontSize:12.5, fontFamily:'ui-monospace,monospace', color:'#f5f5f7' }}>
            {r0(cur)}<span style={{ color:'rgba(255,255,255,0.35)' }}> / {r0(target)}{unit}</span>
            <span style={{ marginLeft:8, color:within?'#34c759':over?'#ff9f0a':'rgba(255,255,255,0.4)' }}>
              {diff > 0 ? '+' : ''}{r0(diff)}
            </span>
          </span>
        </div>
        <div style={{ height:7, borderRadius:999, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
          <div style={{ width:pct+'%', height:'100%', background:tone, borderRadius:999,
            transition:'width 0.2s, background 0.2s' }} />
        </div>
      </div>
    );
  };

  window.MP = { DB, CATS, byName, uid, r0, r1, mkItem, im, fitServings, getServingPresets, FoodPicker, Bar };
})();
