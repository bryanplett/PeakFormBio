/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Standalone Meal Planner
   Decoupled from the Macros Calculator. Pick a client, choose to continue their
   last plan or start fresh, edit meals across up to 2 weeks, adjust macros inline
   (calorie-locked sliders) or via the full quiz, then push to their portal.
   Depends on: window.MP (mp-foodpicker.jsx), window.MacroTargetPanel (mp-macropanel.jsx),
               window.FOOD_DB. Optional: window.MacrosCalculator for full recalc.
   Exposes: window.StandaloneMealPlanner
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useMemo, useEffect } = React;
  const MP = window.MP;
  const { DB, byName, uid, r0, r1, mkItem, im, fitServings, FoodPicker, Bar } = MP;

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DEFAULT_MEALS = () => ([
    { id: uid(), name: 'Breakfast', items: [] },
    { id: uid(), name: 'Lunch',     items: [] },
    { id: uid(), name: 'Dinner',    items: [] },
    { id: uid(), name: 'Snack',     items: [] },
  ]);
  const makeWeek = (label) => ({ id: uid(), label, days: DAY_NAMES.map(d => ({ id: uid(), day: d, meals: DEFAULT_MEALS() })) });
  const cloneMeals = (meals) => meals.map(m => ({ id: uid(), name: m.name, items: m.items.map(it => ({ ...it, uid: uid() })) }));

  const kcalSum = t => Math.round(t.protein_g * 4 + t.carbs_g * 4 + t.fat_g * 9);
  const cname = c => (c && (c.name || c.email)) || 'Client';

  /* ─── Food weight units (g / oz / native serving) ────────────────────── */
  const OZ = 28.3495;
  // Returns 'IS_G' if the unit is plain grams, a number if grams are embedded
  // in the unit string (e.g. "cup (158g)"), else null (not weight-convertible).
  const parseGrams = (unit) => {
    if (!unit) return null;
    const u = unit.trim().toLowerCase();
    if (u === 'g' || u === 'gram' || u === 'grams') return 'IS_G';
    const m = /\(([\d.]+)\s*g\)/.exec(unit);
    if (m) return parseFloat(m[1]);
    if (/^[\d.]*\s*g\b/.test(u)) return 'IS_G';
    return null;
  };
  // grams in one base serving — prefer the explicit value stored on the item.
  const gramsBaseOf = (it) => {
    if (typeof it.gramsBase === 'number') return it.gramsBase;
    const p = parseGrams(it.unit);
    if (p === 'IS_G') return it.baseQty;
    if (typeof p === 'number') return p;
    return null;
  };
  const nativeLabel = (unit) => {
    if (!unit) return 'serving';
    const base = String(unit).replace(/\s*\([^)]*\)/, '').trim();
    return base || 'serving';
  };
  const unitOptions = (it) => {
    const g = gramsBaseOf(it);
    const nativeIsG = parseGrams(it.unit) === 'IS_G';
    const opts = [];
    if (!nativeIsG) opts.push({ key: 'native', label: nativeLabel(it.unit) });
    if (g != null) { opts.push({ key: 'g', label: 'g' }); opts.push({ key: 'oz', label: 'oz' }); }
    if (!opts.length) opts.push({ key: 'native', label: nativeLabel(it.unit) });
    return opts;
  };
  const amountInUnit = (it) => {
    const du = it.displayUnit || 'native';
    const g = gramsBaseOf(it);
    if (du === 'g' && g != null) return r1(g * it.servings);
    if (du === 'oz' && g != null) return r1(g * it.servings / OZ);
    return r1(it.baseQty * it.servings);
  };
  const servingsFromAmount = (it, value, du) => {
    const v = parseFloat(value) || 0;
    const g = gramsBaseOf(it);
    if (du === 'g' && g) return Math.max(0.0001, v / g);
    if (du === 'oz' && g) return Math.max(0.0001, (v * OZ) / g);
    return Math.max(0.0001, v / it.baseQty);
  };

  // Reconstruct an editable item from a saved plan_data item.
  const itemFromSaved = (s) => {
    const qty = parseFloat(s.qty) || 1;
    const unit = s.unit || '';
    const p = parseGrams(unit);
    let gramsBase = null;
    if (typeof s.grams === 'number') gramsBase = s.grams;   // explicit (new push format)
    else if (p === 'IS_G') gramsBase = qty;                 // weight unit
    else if (typeof p === 'number') gramsBase = p;          // paren grams = grams of this serving
    return {
      uid: uid(), foodId: 'saved-' + uid(), name: s.ingredient || 'Food', cat: 'Saved',
      baseQty: qty, unit,
      kcal: parseFloat(s.calories) || 0, p: parseFloat(s.protein) || 0, c: parseFloat(s.carbs) || 0, f: parseFloat(s.fat) || 0,
      servings: 1, gramsBase,
      displayUnit: unit.trim().toLowerCase() === 'g' ? 'g' : 'native',
    };
  };

  // Parse saved plan_data (flat array of days, optionally "Week N · Day"-prefixed)
  // back into weeks. Returns array of weeks.
  const weeksFromPlanData = (plan_data) => {
    const arr = Array.isArray(plan_data) ? plan_data : (plan_data && plan_data.days) || [];
    if (!arr.length) return [makeWeek('Week 1')];
    const buckets = {}; const order = [];
    arr.forEach(d => {
      const m = /^Week\s+(\d+)\s*[·:-]\s*(.+)$/.exec(d.day || '');
      const wk = m ? `Week ${m[1]}` : 'Week 1';
      const dayName = m ? m[2].trim() : (d.day || 'Day');
      if (!buckets[wk]) { buckets[wk] = []; order.push(wk); }
      buckets[wk].push({
        id: uid(), day: dayName,
        meals: (d.meals || []).map(meal => ({
          id: uid(), name: meal.name || 'Meal',
          items: (meal.items || []).map(itemFromSaved),
        })),
      });
    });
    return order.map(wk => ({ id: uid(), label: wk, days: buckets[wk] }));
  };

  const POOLS = {
    simple:   { proteins: ['Chicken breast, grilled', 'Whey protein powder'], carbs: ['White rice, cooked', 'Oats, dry'], fats: ['Olive oil', 'Almonds'], veg: ['Broccoli, steamed'] },
    moderate: { proteins: ['Chicken breast, grilled', 'Whey protein powder', 'Salmon, baked', 'Greek yogurt, nonfat', 'Whole eggs'], carbs: ['Oats, dry', 'White rice, cooked', 'Sweet potato, baked', 'Banana', 'Whole wheat bread'], fats: ['Almonds', 'Peanut butter', 'Olive oil', 'Avocado'], veg: ['Broccoli, steamed', 'Mixed salad greens', 'Asparagus, cooked'] },
    complex:  { proteins: ['Chicken breast, grilled', 'Whey protein powder', 'Salmon, baked', 'Greek yogurt, nonfat', 'Whole eggs', 'Lean ground beef (93/7), cooked', 'Tuna, canned in water', 'Cottage cheese, low-fat', 'Shrimp, cooked'], carbs: ['Oats, dry', 'White rice, cooked', 'Sweet potato, baked', 'Banana', 'Whole wheat bread', 'Quinoa, cooked', 'Brown rice, cooked', 'Pasta, cooked', 'Apple'], fats: ['Almonds', 'Peanut butter', 'Olive oil', 'Avocado', 'Walnuts', 'Cashews', 'Chia seeds'], veg: ['Broccoli, steamed', 'Mixed salad greens', 'Asparagus, cooked', 'Green beans, cooked', 'Bell pepper'] },
  };

  const fmtDate = (iso) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch (e) { return null; }
  };

  /* ─── Landing: client list ───────────────────────────────────────────── */
  const ClientList = ({ clients, plans, loading, onOpen }) => (
    <div className="fade-in">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f7' }}>Meal Planner</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>Pick a client to build or update their plan. Macros carry over — recalculation is optional.</p>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading clients…</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {clients.map(c => {
            const p = plans[c.id];
            const hasPlan = p && Array.isArray(p.plan_data) ? p.plan_data.length > 0 : !!(p && p.plan_data);
            const cals = p && (p.protein_g || p.carbs_g || p.fats_g) ? kcalSum({ protein_g: p.protein_g||0, carbs_g: p.carbs_g||0, fat_g: p.fats_g||0 }) : null;
            return (
              <button key={c.id} onClick={() => onOpen(c)} style={{
                fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', width: '100%',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)', transition: 'border-color .15s, background .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(41,151,255,0.5)'; e.currentTarget.style.background = 'rgba(41,151,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 4 }}>{cname(c)}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {cals ? <span style={{ fontFamily: 'ui-monospace,monospace' }}>{r0(cals)} kcal · P{r0(p.protein_g)} C{r0(p.carbs_g)} F{r0(p.fats_g)}</span>
                          : <span style={{ color: 'rgba(255,255,255,0.35)' }}>No macros set yet</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    {hasPlan
                      ? <><div style={{ fontSize: 11.5, fontWeight: 600, color: '#34c759' }}>Plan active</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{fmtDate(p.updated_at) ? 'Updated ' + fmtDate(p.updated_at) : 'Ready to edit'}</div></>
                      : <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>No plan yet</div>}
                  </div>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </button>
            );
          })}
          {clients.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No clients found.</div>}
        </div>
      )}
    </div>
  );

  /* ─── Start choice modal ─────────────────────────────────────────────── */
  const StartChoice = ({ client, plan, onContinue, onFresh, onClose }) => {
    const hasPlan = plan && Array.isArray(plan.plan_data) && plan.plan_data.length > 0;
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: '100%', maxWidth: 460, background: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 26, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
          <h3 style={{ fontSize: 19, fontWeight: 600, color: '#f5f5f7', marginBottom: 4 }}>{cname(client)}</h3>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.5 }}>How do you want to start this plan? Either way, their saved macros carry over.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            <button onClick={onContinue} disabled={!hasPlan} style={{
              fontFamily: 'inherit', textAlign: 'left', cursor: hasPlan ? 'pointer' : 'not-allowed', opacity: hasPlan ? 1 : 0.45,
              padding: '16px 18px', borderRadius: 13, border: '1.5px solid rgba(41,151,255,0.5)', background: 'rgba(41,151,255,0.10)', color: '#f5f5f7',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Continue last plan</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{hasPlan ? "Load last week's meals so you can tweak a few items." : 'No saved plan to continue yet.'}</div>
            </button>
            <button onClick={onFresh} style={{
              fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
              padding: '16px 18px', borderRadius: 13, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f5f5f7',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Start fresh</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>Empty days, macros pre-filled. Build from scratch or auto-fill.</div>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Recalc overlay (optional full quiz) ────────────────────────────── */
  const RecalcOverlay = ({ clients, sb, onApply, onClose }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(8,8,9,0.96)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recalculate macros</span>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 13 }}>← Back to meal plan</button>
        </div>
        {window.MacrosCalculator
          ? <window.MacrosCalculator sb={sb} clients={clients} onBack={onClose} onApplyTarget={onApply} />
          : <div className="card" style={{ marginTop: 12 }}>Macros Calculator unavailable in this preview.</div>}
      </div>
    </div>
  );

  /* ─── Plan editor ────────────────────────────────────────────────────── */
  const PlanEditor = ({ client, plan, mode, sb, clients, onExit }) => {
    // Macro target — carried over from the saved plan (or sensible default).
    // Calories are always the live sum of the macros so the lock stays consistent.
    const baseTarget = useMemo(() => {
      if (plan && (plan.protein_g || plan.carbs_g || plan.fats_g)) {
        const t = { protein_g: plan.protein_g || 0, carbs_g: plan.carbs_g || 0, fat_g: plan.fats_g || 0 };
        return { ...t, calories: kcalSum(t) };
      }
      return { calories: 2200, protein_g: 165, carbs_g: 220, fat_g: 73 };
    }, [plan]);

    const [target, setTarget] = useState(baseTarget);
    const [macrosDirty, setMacrosDirty] = useState(false);
    const [weeks, setWeeks] = useState(() => mode === 'continue' ? weeksFromPlanData(plan && plan.plan_data) : [makeWeek('Week 1')]);
    const [wi, setWi] = useState(0);
    const [ai, setAi] = useState(0);
    const [picker, setPicker] = useState(null);
    const [complexity, setComplexity] = useState('moderate');
    const [pushMsg, setPushMsg] = useState('');
    const [pushing, setPushing] = useState(false);
    const [recalc, setRecalc] = useState(false);

    const week = weeks[wi];
    const dayMeals = week.days[ai].meals;

    const totals = useMemo(() => {
      let t = { kcal: 0, p: 0, c: 0, f: 0 };
      dayMeals.forEach(m => m.items.forEach(it => { const x = im(it); t.kcal += x.kcal; t.p += x.p; t.c += x.c; t.f += x.f; }));
      return t;
    }, [weeks, wi, ai]);

    const target4 = { calories: kcalSum(target), protein_g: r0(target.protein_g), carbs_g: r0(target.carbs_g), fat_g: r0(target.fat_g) };

    const onTargetChange = (t) => { setTarget(t); setMacrosDirty(true); };

    // week/day mutation helpers (scoped to active week + day)
    const setDaysForWeek = (fn) => setWeeks(ws => ws.map((w, i) => i === wi ? { ...w, days: fn(w.days) } : w));
    const setMealsForActive = (fn) => setDaysForWeek(ds => ds.map((d, i) => i === ai ? { ...d, meals: fn(d.meals) } : d));
    const updateMeal = (mealId, fn) => setMealsForActive(ms => ms.map(m => m.id === mealId ? fn(m) : m));
    const addItem = (mealId, food) => updateMeal(mealId, m => ({ ...m, items: [...m.items, mkItem(food)] }));
    const removeItem = (mealId, u) => updateMeal(mealId, m => ({ ...m, items: m.items.filter(it => it.uid !== u) }));
    const setAmount = (mealId, u, amt) => updateMeal(mealId, m => ({ ...m, items: m.items.map(it => it.uid === u ? { ...it, servings: servingsFromAmount(it, amt, it.displayUnit || 'native') } : it) }));
    const setDisplayUnit = (mealId, u, du) => updateMeal(mealId, m => ({ ...m, items: m.items.map(it => it.uid === u ? { ...it, displayUnit: du } : it) }));
    const swapItem = (mealId, u, food) => updateMeal(mealId, m => ({ ...m, items: m.items.map(it => it.uid === u ? mkItem(food, it.servings) : it) }));

    const onPick = (food) => {
      if (!picker) return;
      if (picker.swapUid) swapItem(picker.mealId, picker.swapUid, food);
      else addItem(picker.mealId, food);
      setPicker(null);
    };

    const autoFill = () => {
      const next = DEFAULT_MEALS();
      const mealAt = i => next[i % 4];
      const rem = { p: target4.protein_g, c: target4.carbs_g, f: target4.fat_g };
      const pool = POOLS[complexity] || POOLS.moderate;
      const { proteins, carbs, fats, veg } = pool;
      let guard = 0, i = 0;
      while (rem.p > 8 && guard++ < 40) { const f = byName(proteins[i % proteins.length]); i++; if (!f) break; mealAt(i).items.push(mkItem(f)); rem.p -= f.p; rem.c -= f.c; rem.f -= f.f; }
      guard = 0; i = 0;
      while (rem.c > 12 && guard++ < 40) { const f = byName(carbs[i % carbs.length]); i++; if (!f) break; mealAt(i).items.push(mkItem(f)); rem.c -= f.c; rem.f -= f.f; rem.p -= f.p; }
      guard = 0; i = 0;
      while (rem.f > 6 && guard++ < 30) { const f = byName(fats[i % fats.length]); i++; if (!f) break; mealAt(i + 2).items.push(mkItem(f)); rem.f -= f.f; rem.c -= f.c; }
      veg.forEach((v, idx) => { const f = byName(v); if (f && idx < 4) next[idx].items.push(mkItem(f)); });
      setMealsForActive(() => next);
    };

    const fitChosenFoods = (foods) => {
      const servs = fitServings(foods, target4);
      const next = DEFAULT_MEALS();
      foods.forEach((fd, idx) => { const s = Math.max(0.25, Math.round(servs[idx] * 4) / 4); next[idx % 4].items.push(mkItem(fd, s)); });
      setMealsForActive(() => next);
      setPicker(null);
    };

    const clearDay = () => setMealsForActive(() => DEFAULT_MEALS());
    const copyDayToWeek = () => setDaysForWeek(ds => ds.map((d, i) => i === ai ? d : { ...d, meals: cloneMeals(dayMeals) }));
    const copyWeekToNext = () => {
      if (weeks.length < 2) return;
      const src = weeks[wi];
      setWeeks(ws => ws.map((w, i) => i === wi ? w : { ...w, days: w.days.map((d, di) => ({ ...d, meals: cloneMeals(src.days[di].meals) })) }));
    };

    const setPlanLength = (n) => {
      setWeeks(ws => {
        if (n === ws.length) return ws;
        if (n === 2) return [ws[0], makeWeek('Week 2')];
        return [ws[0]];
      });
      if (n === 1) setWi(0);
    };

    const hasItems = weeks.some(w => w.days.some(d => d.meals.some(m => m.items.length > 0)));

    const applyRecalc = (t) => {
      setTarget({ calories: t.calories, protein_g: t.protein_g, carbs_g: t.carbs_g, fat_g: t.fat_g });
      setMacrosDirty(true);
      setRecalc(false);
    };

    const pushToClient = async () => {
      setPushing(true); setPushMsg('');
      try {
        const allDays = [];
        weeks.forEach(w => w.days.forEach(d => {
          allDays.push({
            day: weeks.length > 1 ? `${w.label} · ${d.day}` : d.day,
            meals: d.meals.map(m => ({
              name: m.name,
              items: m.items.map(it => {
                const du = it.displayUnit || 'native';
                const opts = unitOptions(it);
                const lbl = (opts.find(o => o.key === du) || opts[0]).label;
                const g = gramsBaseOf(it);
                return {
                  ingredient: it.name, qty: String(amountInUnit(it)), unit: lbl,
                  grams: g != null ? r1(g * it.servings) : undefined,
                  calories: r0(it.kcal * it.servings), protein: r0(it.p * it.servings), carbs: r0(it.c * it.servings), fat: r0(it.f * it.servings),
                };
              }),
            })),
          });
        }));
        const payload = {
          title: 'Meal Plan', goal: (plan && plan.goal) || 'Custom',
          daily_calories: target4.calories, protein_g: target4.protein_g, carbs_g: target4.carbs_g, fats_g: target4.fat_g,
          plan_data: allDays, active: true, updated_at: new Date().toISOString(),
        };
        const { data: existing } = await sb.from('nutrition_plans')
          .select('*').eq('client_id', client.id).eq('active', true)
          .order('created_at', { ascending: false }).limit(1);
        let res;
        if (existing && existing.length) res = await sb.from('nutrition_plans').update(payload).eq('id', existing[0].id).select().single();
        else res = await sb.from('nutrition_plans').insert({ client_id: client.id, ...payload }).select().single();
        if (res.error) throw res.error;
        setPushMsg(`✓ ${weeks.length > 1 ? '2-week plan' : 'Meal plan'} pushed to ${cname(client)}'s portal.`);
        setMacrosDirty(false);
      } catch (err) { setPushMsg('Error: ' + (err.message || err)); }
      finally { setPushing(false); }
    };

    const dayHasItems = dayMeals.some(m => m.items.length > 0);

    return (
      <div className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={onExit}>← Clients</button>
            <div>
              <h2 style={{ fontSize: 21, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>{cname(client)}</h2>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{mode === 'continue' ? 'Editing last plan' : 'New plan'}</p>
            </div>
          </div>
          {/* Plan length */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Plan length</span>
            <div style={{ display: 'flex', borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
              {[[1, '1 week'], [2, '2 weeks']].map(([n, lbl]) => (
                <button key={n} onClick={() => setPlanLength(n)} style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '7px 14px', border: 'none', background: weeks.length === n ? '#0066cc' : 'transparent', color: weeks.length === n ? '#fff' : 'rgba(255,255,255,0.6)' }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Macro target panel */}
        <window.MacroTargetPanel target={target} onChange={onTargetChange} onRecalc={() => setRecalc(true)} goalLabel={plan && plan.goal} dirty={macrosDirty} />

        {/* Builder */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f7' }}>Meals</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                {[['simple', 'Simple'], ['moderate', 'Moderate'], ['complex', 'Complex']].map(([k, lbl]) => (
                  <button key={k} onClick={() => setComplexity(k)} title="Variety auto-fill uses" style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 11px', border: 'none', background: complexity === k ? '#0066cc' : 'transparent', color: complexity === k ? '#fff' : 'rgba(255,255,255,0.6)' }}>{lbl}</button>
                ))}
              </div>
              <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={autoFill}>⚡ Auto-fill day</button>
              <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => setPicker({ multiFit: true })}>🎯 Fit my foods</button>
            </div>
          </div>

          {/* Week tabs (only when 2 weeks) */}
          {weeks.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {weeks.map((w, i) => (
                <button key={w.id} onClick={() => { setWi(i); setAi(0); }} style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, border: `1px solid ${wi === i ? 'rgba(41,151,255,0.6)' : 'rgba(255,255,255,0.1)'}`, background: wi === i ? 'rgba(41,151,255,0.16)' : 'transparent', color: wi === i ? '#2997ff' : 'rgba(255,255,255,0.6)' }}>{w.label}</button>
              ))}
              {wi === 0 && <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px', marginLeft: 'auto' }} onClick={copyWeekToNext}>Copy Week 1 → Week 2</button>}
            </div>
          )}

          {/* Day tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {week.days.map((d, i) => {
              let dk = 0; d.meals.forEach(m => m.items.forEach(it => dk += im(it).kcal));
              const filled = dk > 0;
              return (
                <button key={d.id} onClick={() => setAi(i)} style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: ai === i ? 600 : 500, padding: '7px 13px', borderRadius: 10, border: 'none', background: ai === i ? '#0066cc' : 'rgba(255,255,255,0.06)', color: ai === i ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {d.day.slice(0, 3)}
                  {filled && <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'ui-monospace,monospace', color: ai === i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>{r0(dk)}</span>}
                </button>
              );
            })}
          </div>

          {/* Live totals vs target */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'grid', gap: 12 }}>
            <Bar label="Calories" cur={totals.kcal} target={target4.calories} unit=" kcal" color="#2997ff" />
            <Bar label="Protein"  cur={totals.p}    target={target4.protein_g} unit="g" color="#2997ff" />
            <Bar label="Carbs"    cur={totals.c}    target={target4.carbs_g}   unit="g" color="#ff9f0a" />
            <Bar label="Fat"      cur={totals.f}    target={target4.fat_g}     unit="g" color="#bf5af2" />
          </div>

          {/* Day actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {dayHasItems && <button className="btn-ghost" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={copyDayToWeek}>Copy day → whole week</button>}
            {dayHasItems && <button className="btn-ghost" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={clearDay}>Clear day</button>}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            <input type="number" inputMode="decimal" value={amountInUnit(it)} onChange={e => setAmount(meal.id, it.uid, e.target.value)} style={amtInput} />
                            {(() => { const opts = unitOptions(it); const du = it.displayUnit || 'native';
                              return opts.length > 1
                                ? <select value={du} onChange={e => setDisplayUnit(meal.id, it.uid, e.target.value)} style={unitSelect} title="Change weight unit">
                                    {opts.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                                  </select>
                                : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', width: 64, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opts[0].label}</span>;
                            })()}
                          </div>
                          <button onClick={() => setPicker({ mealId: meal.id, swapUid: it.uid })} title="Swap" style={iconBtn}>⇄</button>
                          <button onClick={() => removeItem(meal.id, it.uid)} title="Remove" style={{ ...iconBtn, color: 'rgba(255,90,90,0.8)' }}>×</button>
                        </div>
                      );
                    })}
                    <button onClick={() => setPicker({ mealId: meal.id })} style={{ fontFamily: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '9px 4px', background: 'transparent', border: 'none', color: '#2997ff', fontSize: 13, fontWeight: 500 }}>+ Add food</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Push */}
        <div className="card" style={{ marginBottom: 18 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Push to {cname(client)}'s portal</h4>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.55 }}>
            Updates {cname(client)}'s active nutrition plan with this {weeks.length > 1 ? '2-week' : '7-day'} plan{macrosDirty ? ' and the edited macro targets' : ' (macros unchanged)'}. They'll see it in their portal under Nutrition Plan.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-blue" disabled={pushing || !hasItems} onClick={pushToClient} style={{ opacity: (pushing || !hasItems) ? 0.5 : 1, cursor: (pushing || !hasItems) ? 'not-allowed' : 'pointer' }}>
              {pushing ? 'Pushing…' : 'Push meal plan →'}
            </button>
            {!hasItems && <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>Add at least one food to push.</span>}
          </div>
          {pushMsg && <p style={{ marginTop: 12, fontSize: 13, color: pushMsg.startsWith('Error') ? '#ff453a' : '#34c759' }}>{pushMsg}</p>}
        </div>

        {picker && (picker.multiFit
          ? <FoodPicker title="Pick foods to fit your macros" multi onPickMulti={fitChosenFoods} onClose={() => setPicker(null)} />
          : <FoodPicker title={picker.swapUid ? 'Swap food' : 'Add food'} onPick={onPick} onClose={() => setPicker(null)} />)}

        {recalc && <RecalcOverlay clients={clients} sb={sb} onApply={applyRecalc} onClose={() => setRecalc(false)} />}
      </div>
    );
  };

  /* ─── Orchestrator ───────────────────────────────────────────────────── */
  const StandaloneMealPlanner = ({ sb, clients, onBack, initialClientId }) => {
    const [plans, setPlans] = useState({});
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState(null); // client awaiting start choice
    const [session, setSession] = useState(null); // { client, plan, mode }

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const { data } = await sb.from('nutrition_plans').select('*');
          if (cancelled) return;
          const map = {};
          (data || []).forEach(p => { if (!map[p.client_id] || (p.active)) map[p.client_id] = p; });
          setPlans(map);
        } finally { if (!cancelled) setLoading(false); }
      })();
      return () => { cancelled = true; };
    }, []);

    // Per-client deep link (from Admin client profile shortcut)
    useEffect(() => {
      if (initialClientId && !loading) {
        const c = clients.find(x => x.id === initialClientId);
        if (c) openClient(c);
      }
    }, [initialClientId, loading]);

    const openClient = (client) => {
      const plan = plans[client.id];
      const hasPlan = plan && Array.isArray(plan.plan_data) && plan.plan_data.length > 0;
      if (hasPlan) setPending(client);
      else setSession({ client, plan, mode: 'fresh' });
    };

    return (
      <div>
        {onBack && !session && (
          <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 18, fontSize: 13 }}>← Back</button>
        )}
        {!session && <ClientList clients={clients} plans={plans} loading={loading} onOpen={openClient} />}
        {session && <PlanEditor client={session.client} plan={session.plan} mode={session.mode} sb={sb} clients={clients} onExit={() => setSession(null)} />}
        {pending && (
          <StartChoice client={pending} plan={plans[pending.id]}
            onContinue={() => { setSession({ client: pending, plan: plans[pending.id], mode: 'continue' }); setPending(null); }}
            onFresh={() => { setSession({ client: pending, plan: plans[pending.id], mode: 'fresh' }); setPending(null); }}
            onClose={() => setPending(null)} />
        )}
      </div>
    );
  };

  const amtInput = { width: 58, padding: '5px 7px', fontSize: 12.5, textAlign: 'right', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, background: 'rgba(255,255,255,0.06)', color: '#f5f5f7', outline: 'none', fontFamily: 'ui-monospace,monospace' };
  const unitSelect = { width: 78, padding: '5px 6px', fontSize: 11.5, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' };
  const iconBtn = { width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'inherit', flexShrink: 0 };

  window.StandaloneMealPlanner = StandaloneMealPlanner;
})();
