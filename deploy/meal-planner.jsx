/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Meal Plan Builder
   Builds a day of meals that fits a client's calculated macro target. Add /
   remove / swap food items, adjust servings, auto-fill to target, then push the
   full plan into the client's nutrition_plans row (read by the Client Portal).
   Depends on window.FOOD_DB / FOOD_CATEGORIES.
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useMemo } = React;
  const DB   = window.FOOD_DB || [];
  const CATS = window.FOOD_CATEGORIES || [];
  const byName = n => DB.find(f => f.name === n);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const r0 = n => Math.round(n);
  const r1 = n => Math.round(n * 10) / 10;

  const mkItem = (food, servings = 1) => ({
    uid: uid(), foodId: food.id, name: food.name, cat: food.cat,
    baseQty: food.qty, unit: food.unit, kcal: food.kcal, p: food.p, c: food.c, f: food.f, servings,
  });
  const im = it => ({ kcal: it.kcal * it.servings, p: it.p * it.servings, c: it.c * it.servings, f: it.f * it.servings });

  const DEFAULT_MEALS = () => ([
    { id: uid(), name: 'Breakfast', items: [] },
    { id: uid(), name: 'Lunch',     items: [] },
    { id: uid(), name: 'Dinner',    items: [] },
    { id: uid(), name: 'Snack',     items: [] },
  ]);

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const initDays = () => DAY_NAMES.map(d => ({ id: uid(), day: d, meals: DEFAULT_MEALS() }));
  const cloneMeals = (meals) => meals.map(m => ({ id: uid(), name: m.name, items: m.items.map(it => ({ ...it, uid: uid() })) }));

  // Fit servings of chosen foods to a macro target (least-squares via damped
  // per-coordinate descent). Minimizes protein/carb/fat error; calories follow.
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
    const [source, setSource] = useState('library'); // 'library' | 'off'
    const [offList, setOffList] = useState([]);
    const [offLoading, setOffLoading] = useState(false);
    const [offError, setOffError] = useState('');
    const [sel, setSel] = useState([]);

    const libList = useMemo(() => {
      const s = q.trim().toLowerCase();
      return DB.filter(f => (cat === 'all' || f.cat === cat) && (!s || f.name.toLowerCase().includes(s)));
    }, [q, cat]);

    // Open Food Facts live search (debounced)
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
          {/* Source toggle */}
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

  /* ─── Macro progress bar ─────────────────────────────────────────────── */
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

  /* ─── Main builder ───────────────────────────────────────────────────── */
  const MealPlanner = ({ target, goalLabel, clients, sb }) => {
    const [days, setDays] = useState(initDays);
    const [ai, setAi] = useState(0); // active day index
    const [picker, setPicker] = useState(null); // { mealId, swapUid? } or { multiFit:true }
    const [selectedClientId, setSelectedClientId] = useState('');
    const [pushMsg, setPushMsg] = useState('');
    const [pushing, setPushing] = useState(false);
    const [complexity, setComplexity] = useState('moderate'); // simple | moderate | complex

    const dayMeals = days[ai].meals;
    const totals = useMemo(() => {
      let t = { kcal: 0, p: 0, c: 0, f: 0 };
      dayMeals.forEach(m => m.items.forEach(it => { const x = im(it); t.kcal += x.kcal; t.p += x.p; t.c += x.c; t.f += x.f; }));
      return t;
    }, [days, ai]);

    const setMealsForActive = (fn) => setDays(ds => ds.map((d, i) => i === ai ? { ...d, meals: fn(d.meals) } : d));
    const updateMeal = (mealId, fn) => setMealsForActive(ms => ms.map(m => m.id === mealId ? fn(m) : m));
    const addItem = (mealId, food) => updateMeal(mealId, m => ({ ...m, items: [...m.items, mkItem(food)] }));
    const removeItem = (mealId, u) => updateMeal(mealId, m => ({ ...m, items: m.items.filter(it => it.uid !== u) }));
    const setServings = (mealId, u, s) => updateMeal(mealId, m => ({ ...m, items: m.items.map(it => it.uid === u ? { ...it, servings: Math.max(0.05, s) } : it) }));
    const setAmount = (mealId, u, amt) => updateMeal(mealId, m => ({ ...m, items: m.items.map(it => it.uid === u ? { ...it, servings: Math.max(0.05, (parseFloat(amt) || 0) / it.baseQty) } : it) }));
    const swapItem = (mealId, u, food) => updateMeal(mealId, m => ({ ...m, items: m.items.map(it => it.uid === u ? mkItem(food, it.servings) : it) }));

    const onPick = (food) => {
      if (!picker) return;
      if (picker.swapUid) swapItem(picker.mealId, picker.swapUid, food);
      else addItem(picker.mealId, food);
      setPicker(null);
    };

    // Greedy auto-fill: hit protein, then carbs, then fat with whole-ish servings.
    // Variety scales with complexity (Simple = few foods, Complex = more).
    const autoFill = () => {
      const next = DEFAULT_MEALS();
      const mealAt = i => next[i % 4];
      const rem = { p: target.protein_g, c: target.carbs_g, f: target.fat_g };

      const POOLS = {
        simple: {
          proteins: ['Chicken breast, grilled', 'Whey protein powder'],
          carbs: ['White rice, cooked', 'Oats, dry'],
          fats: ['Olive oil', 'Almonds'],
          veg: ['Broccoli, steamed'],
        },
        moderate: {
          proteins: ['Chicken breast, grilled', 'Whey protein powder', 'Salmon, baked', 'Greek yogurt, nonfat', 'Whole eggs'],
          carbs: ['Oats, dry', 'White rice, cooked', 'Sweet potato, baked', 'Banana', 'Whole wheat bread'],
          fats: ['Almonds', 'Peanut butter', 'Olive oil', 'Avocado'],
          veg: ['Broccoli, steamed', 'Mixed salad greens', 'Asparagus, cooked'],
        },
        complex: {
          proteins: ['Chicken breast, grilled', 'Whey protein powder', 'Salmon, baked', 'Greek yogurt, nonfat', 'Whole eggs', 'Lean ground beef (93/7), cooked', 'Tuna, canned in water', 'Cottage cheese, low-fat', 'Shrimp, cooked'],
          carbs: ['Oats, dry', 'White rice, cooked', 'Sweet potato, baked', 'Banana', 'Whole wheat bread', 'Quinoa, cooked', 'Brown rice, cooked', 'Pasta, cooked', 'Apple'],
          fats: ['Almonds', 'Peanut butter', 'Olive oil', 'Avocado', 'Walnuts', 'Cashews', 'Chia seeds'],
          veg: ['Broccoli, steamed', 'Mixed salad greens', 'Asparagus, cooked', 'Green beans, cooked', 'Bell pepper'],
        },
      };
      const pool = POOLS[complexity] || POOLS.moderate;
      const { proteins, carbs, fats, veg } = pool;

      let guard = 0, i = 0;
      while (rem.p > 8 && guard++ < 40) {
        const f = byName(proteins[i % proteins.length]); i++;
        if (!f) break;
        mealAt(i).items.push(mkItem(f));
        rem.p -= f.p; rem.c -= f.c; rem.f -= f.f;
      }
      guard = 0; i = 0;
      while (rem.c > 12 && guard++ < 40) {
        const f = byName(carbs[i % carbs.length]); i++;
        if (!f) break;
        mealAt(i).items.push(mkItem(f));
        rem.c -= f.c; rem.f -= f.f; rem.p -= f.p;
      }
      guard = 0; i = 0;
      while (rem.f > 6 && guard++ < 30) {
        const f = byName(fats[i % fats.length]); i++;
        if (!f) break;
        mealAt(i + 2).items.push(mkItem(f));
        rem.f -= f.f; rem.c -= f.c;
      }
      veg.forEach((v, idx) => { const f = byName(v); if (f && idx < 4) next[idx].items.push(mkItem(f)); });

      setMealsForActive(() => next);
    };

    // Fit a hand-picked set of foods (3–10) to the macro target, then distribute.
    const fitChosenFoods = (foods) => {
      const servs = fitServings(foods, target);
      const next = DEFAULT_MEALS();
      foods.forEach((fd, idx) => {
        const s = Math.max(0.25, Math.round(servs[idx] * 4) / 4);
        next[idx % 4].items.push(mkItem(fd, s));
      });
      setMealsForActive(() => next);
      setPicker(null);
    };

    const clearDay = () => setMealsForActive(() => DEFAULT_MEALS());
    const copyToAll = () => setDays(ds => ds.map((d, i) => i === ai ? d : { ...d, meals: cloneMeals(dayMeals) }));

    const pushToClient = async () => {
      if (!selectedClientId) return;
      setPushing(true); setPushMsg('');
      const client = clients.find(c => c.id === selectedClientId);
      try {
        const plan_data = days.map(d => ({
          day: d.day,
          meals: d.meals.map(m => ({
            name: m.name,
            items: m.items.map(it => ({
              ingredient: it.name,
              qty: String(r1(it.baseQty * it.servings)),
              unit: it.unit,
              calories: r0(it.kcal * it.servings),
              protein: r0(it.p * it.servings),
              carbs: r0(it.c * it.servings),
              fat: r0(it.f * it.servings),
            })),
          })),
        }));

        const payload = {
          title: 'Meal Plan',
          goal: goalLabel || 'Custom',
          daily_calories: target.calories,
          protein_g: target.protein_g,
          carbs_g: target.carbs_g,
          fats_g: target.fat_g,
          plan_data,
          active: true,
          updated_at: new Date().toISOString(),
        };

        const { data: existing } = await sb.from('nutrition_plans')
          .select('*').eq('client_id', selectedClientId).eq('active', true)
          .order('created_at', { ascending: false }).limit(1);

        let res;
        if (existing && existing.length) {
          res = await sb.from('nutrition_plans').update(payload).eq('id', existing[0].id).select().single();
        } else {
          res = await sb.from('nutrition_plans').insert({ client_id: selectedClientId, ...payload }).select().single();
        }
        if (res.error) throw res.error;
        setPushMsg(`✓ Meal plan pushed to ${client.name}'s portal.`);
      } catch (err) {
        setPushMsg('Error: ' + (err.message || err));
      } finally { setPushing(false); }
    };

    const dayHasItems = dayMeals.some(m => m.items.length > 0);
    const hasItems = days.some(d => d.meals.some(m => m.items.length > 0));

    return (
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>Meal Plan Builder</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Build each day to fit this target. Add, swap, or remove foods and set exact amounts — totals update live.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Complexity */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
              {[['simple', 'Simple'], ['moderate', 'Moderate'], ['complex', 'Complex']].map(([k, lbl]) => (
                <button key={k} onClick={() => setComplexity(k)} title="Variety of foods auto-fill uses" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 11px', border: 'none', background: complexity === k ? '#0066cc' : 'transparent', color: complexity === k ? '#fff' : 'rgba(255,255,255,0.6)' }}>{lbl}</button>
              ))}
            </div>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={autoFill}>⚡ Auto-fill day</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => setPicker({ multiFit: true })}>🎯 Fit my foods</button>
            {dayHasItems && <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={copyToAll}>Copy day → all 7</button>}
            {dayHasItems && <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={clearDay}>Clear day</button>}
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {days.map((d, i) => {
            let dk = 0; d.meals.forEach(m => m.items.forEach(it => dk += im(it).kcal));
            const filled = dk > 0;
            return (
              <button key={d.id} onClick={() => setAi(i)} style={{
                fontFamily: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: ai === i ? 600 : 500,
                padding: '7px 13px', borderRadius: 10, border: 'none', position: 'relative',
                background: ai === i ? '#0066cc' : 'rgba(255,255,255,0.06)',
                color: ai === i ? '#fff' : 'rgba(255,255,255,0.6)',
              }}>
                {d.day.slice(0, 3)}
                {filled && <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'ui-monospace,monospace', color: ai === i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>{r0(dk)}</span>}
              </button>
            );
          })}
        </div>

        {/* Live totals vs target */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', marginBottom: 18, display: 'grid', gap: 12 }}>
          <Bar label="Calories" cur={totals.kcal} target={target.calories} unit=" kcal" color="#2997ff" />
          <Bar label="Protein"  cur={totals.p}    target={target.protein_g} unit="g" color="#2997ff" />
          <Bar label="Carbs"    cur={totals.c}    target={target.carbs_g}   unit="g" color="#ff9f0a" />
          <Bar label="Fat"      cur={totals.f}    target={target.fat_g}     unit="g" color="#bf5af2" />
        </div>

        {/* Meals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {dayMeals.map(meal => {
            let mk = 0; meal.items.forEach(it => mk += im(it).kcal);
            return (
              <div key={meal.id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>{meal.name}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'ui-monospace,monospace' }}>{r0(mk)} kcal</span>
                </div>
                <div style={{ padding: '6px 10px' }}>
                  {meal.items.map(it => {
                    const m = im(it);
                    return (
                      <div key={it.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'ui-monospace,monospace' }}>{r0(m.kcal)} kcal · P{r0(m.p)} C{r0(m.c)} F{r0(m.f)}</div>
                        </div>
                        {/* Editable amount (weight / size) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <input type="number" inputMode="decimal" value={r1(it.baseQty * it.servings)}
                            onChange={e => setAmount(meal.id, it.uid, e.target.value)} style={amtInput} />
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', width: 70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.unit}</span>
                        </div>
                        <button onClick={() => setPicker({ mealId: meal.id, swapUid: it.uid })} title="Swap" style={iconBtn}>⇄</button>
                        <button onClick={() => removeItem(meal.id, it.uid)} title="Remove" style={{ ...iconBtn, color: 'rgba(255,90,90,0.8)' }}>×</button>
                      </div>
                    );
                  })}
                  <button onClick={() => setPicker({ mealId: meal.id })} style={{
                    fontFamily: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left',
                    padding: '9px 4px', background: 'transparent', border: 'none', color: '#2997ff', fontSize: 13, fontWeight: 500,
                  }}>+ Add food</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Push to client */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Push meal plan to client</h4>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.55 }}>
            Replaces the client's active nutrition plan with this 7-day meal plan and sets their daily macro targets. They'll see it in their portal under Nutrition Plan.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="field-input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={{ flex: '1 1 240px', minWidth: 240 }}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-blue" disabled={!selectedClientId || pushing || !hasItems} onClick={pushToClient}
              style={{ opacity: (!selectedClientId || pushing || !hasItems) ? 0.5 : 1, cursor: (!selectedClientId || pushing || !hasItems) ? 'not-allowed' : 'pointer' }}>
              {pushing ? 'Pushing…' : 'Push meal plan →'}
            </button>
          </div>
          {pushMsg && <p style={{ marginTop: 12, fontSize: 13, color: pushMsg.startsWith('Error') ? '#ff453a' : '#34c759' }}>{pushMsg}</p>}
        </div>

        {picker && (picker.multiFit
          ? <FoodPicker title="Pick foods to fit your macros" multi onPickMulti={fitChosenFoods} onClose={() => setPicker(null)} />
          : <FoodPicker title={picker.swapUid ? 'Swap food' : 'Add food'} onPick={onPick} onClose={() => setPicker(null)} />)}
      </div>
    );
  };

  const stepBtn = { width: 24, height: 24, borderRadius: 7, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#f5f5f7', cursor: 'pointer', fontSize: 15, lineHeight: 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const amtInput = { width: 58, padding: '5px 7px', fontSize: 12.5, textAlign: 'right', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, background: 'rgba(255,255,255,0.06)', color: '#f5f5f7', outline: 'none', fontFamily: 'ui-monospace,monospace' };
  const iconBtn = { width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'inherit', flexShrink: 0 };

  window.MealPlanner = MealPlanner;
})();
