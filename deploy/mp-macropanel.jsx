/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Macro Target Panel
   The client's daily macro target, shown at the top of the standalone planner.
   • Calories is the anchor. Editing it rescales the UNLOCKED macros to fit.
   • Protein / Carbs / Fat sliders, each with a LOCK. Dragging an unlocked macro
     redistributes the OTHER unlocked macros so total calories stay constant; any
     locked macro is held exactly where you left it.
   • If the two macros you aren't dragging are both locked, the calorie total
     follows that slider (nothing left to absorb the change).
   Exposes: window.MacroTargetPanel
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState } = React;
  const r0 = n => Math.round(n);
  const KCAL = { protein_g: 4, carbs_g: 4, fat_g: 9 };
  const KEYS = ['protein_g', 'carbs_g', 'fat_g'];
  const kcalOf = t => t.protein_g * 4 + t.carbs_g * 4 + t.fat_g * 9;

  // Move `which` to `newG` grams. Hold total calories constant by redistributing
  // across the UNLOCKED other macros (by their current calorie share). Locked
  // macros never move. If no unlocked macro is free to absorb, total shifts.
  const redistribute = (target, which, newG, locks) => {
    const total = kcalOf(target);
    const k = KCAL[which];
    const lockedKeys = KEYS.filter(x => x !== which && locks[x]);
    const freeKeys = KEYS.filter(x => x !== which && !locks[x]);
    const lockedKcal = lockedKeys.reduce((s, x) => s + target[x] * KCAL[x], 0);

    if (freeKeys.length === 0) {
      // Both others locked — can't hold total; this slider drives calories.
      newG = Math.max(0, newG);
      const out = { ...target, [which]: newG };
      out.calories = kcalOf(out);
      return out;
    }
    const budget = Math.max(0, total - lockedKcal);
    newG = Math.max(0, Math.min(newG, budget / k));
    const remaining = Math.max(0, budget - k * newG);
    const fKcal = freeKeys.map(x => target[x] * KCAL[x]);
    const fSum = fKcal.reduce((a, b) => a + b, 0);
    const shares = fSum > 0 ? fKcal.map(v => v / fSum) : freeKeys.map(() => 1 / freeKeys.length);
    const out = { ...target, [which]: newG };
    freeKeys.forEach((x, i) => { out[x] = (remaining * shares[i]) / KCAL[x]; });
    out.calories = kcalOf(out);
    return out;
  };

  // Edit total calories: keep locked macros fixed, scale the unlocked ones to fit.
  const rescaleCalories = (target, newCal, locks) => {
    newCal = Math.max(0, newCal);
    const lockedKeys = KEYS.filter(x => locks[x]);
    const freeKeys = KEYS.filter(x => !locks[x]);
    if (freeKeys.length === 0) {
      const cur = kcalOf(target) || 1, sc = newCal / cur, out = {};
      KEYS.forEach(x => out[x] = target[x] * sc); out.calories = newCal; return out;
    }
    const lockedKcal = lockedKeys.reduce((s, x) => s + target[x] * KCAL[x], 0);
    const needed = Math.max(0, newCal - lockedKcal);
    const freeCur = freeKeys.reduce((s, x) => s + target[x] * KCAL[x], 0);
    const out = { ...target };
    if (freeCur > 0) { const sc = needed / freeCur; freeKeys.forEach(x => out[x] = target[x] * sc); }
    else { freeKeys.forEach(x => out[x] = (needed / freeKeys.length) / KCAL[x]); }
    out.calories = kcalOf(out);
    return out;
  };

  const LockIcon = ({ locked, color }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke={locked ? color : 'rgba(255,255,255,0.4)'} strokeWidth="1.9" fill={locked ? color : 'none'} fillOpacity={locked ? 0.18 : 0} />
      {locked
        ? <path d="M8 11V8a4 4 0 018 0v3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
        : <path d="M8 11V8a4 4 0 017.5-2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.9" strokeLinecap="round" />}
    </svg>
  );

  const MacroSlider = ({ label, color, grams, kcal, pctCal, max, locked, onToggleLock, onSlide, onType }) => (
    <div style={{ background: locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${locked ? color + '66' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '13px 15px', transition: 'border-color .15s, background .15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f5f7' }}>{label}</span>
          <button onClick={onToggleLock} title={locked ? 'Unlock — let this macro rebalance' : 'Lock — hold this macro fixed'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: 'inherit',
              background: locked ? color + '22' : 'transparent', border: `1px solid ${locked ? color + '88' : 'rgba(255,255,255,0.14)'}`,
              borderRadius: 7, padding: '2px 7px', color: locked ? color : 'rgba(255,255,255,0.5)', fontSize: 10.5, fontWeight: 600 }}>
            <LockIcon locked={locked} color={color} />{locked ? 'Locked' : 'Lock'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '3px 8px', background: locked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)' }}>
            <input type="number" inputMode="numeric" value={r0(grams)} disabled={locked}
              onChange={e => onType(parseFloat(e.target.value) || 0)}
              style={{ width: 46, border: 'none', background: 'transparent', color: locked ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: 14, fontWeight: 700, textAlign: 'right', outline: 'none', fontFamily: 'ui-monospace,monospace' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>g</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'ui-monospace,monospace', width: 92, textAlign: 'right' }}>{r0(kcal)} kcal · {r0(pctCal)}%</span>
        </div>
      </div>
      <input type="range" min={0} max={Math.max(1, r0(max))} step={1} value={r0(grams)} disabled={locked}
        onChange={e => onSlide(parseFloat(e.target.value))}
        className="macro-range" style={{ ['--c']: color, width: '100%', opacity: locked ? 0.4 : 1, cursor: locked ? 'not-allowed' : 'pointer' }} />
    </div>
  );

  const MacroTargetPanel = ({ target, onChange, onRecalc, goalLabel, dirty }) => {
    const [calEdit, setCalEdit] = useState(false);
    const [calDraft, setCalDraft] = useState('');
    const [locks, setLocks] = useState({ protein_g: false, carbs_g: false, fat_g: false });
    const total = kcalOf(target);
    const pKcal = target.protein_g * 4, cKcal = target.carbs_g * 4, fKcal = target.fat_g * 9;

    const lockedCount = KEYS.filter(k => locks[k]).length;
    const toggleLock = (which) => setLocks(l => {
      // never allow all three locked (leaves nothing to balance)
      if (!l[which] && KEYS.filter(k => l[k]).length >= 2) return l;
      return { ...l, [which]: !l[which] };
    });
    const setMacro = (which, g) => { if (locks[which]) return; onChange(redistribute(target, which, g, locks)); };
    const maxFor = (which) => {
      const lockedKcal = KEYS.filter(x => x !== which && locks[x]).reduce((s, x) => s + target[x] * KCAL[x], 0);
      const free = KEYS.filter(x => x !== which && !locks[x]);
      return free.length === 0 ? (total * 1.6) / KCAL[which] : Math.max(1, (total - lockedKcal) / KCAL[which]);
    };
    const commitCal = () => {
      const v = parseFloat(calDraft);
      if (Number.isFinite(v) && v > 0) onChange(rescaleCalories(target, v, locks));
      setCalEdit(false);
    };

    return (
      <div className="card" style={{ marginBottom: 18, padding: 24, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Daily macro target</h3>
              {goalLabel && <span style={{ fontSize: 11, fontWeight: 600, color: '#2997ff', background: 'rgba(41,151,255,0.12)', border: '1px solid rgba(41,151,255,0.25)', borderRadius: 999, padding: '2px 10px' }}>{goalLabel}</span>}
              {dirty && <span style={{ fontSize: 11, fontWeight: 600, color: '#ff9f0a', background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 999, padding: '2px 10px' }}>Edited</span>}
            </div>
            {calEdit ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input className="field-input" type="number" autoFocus value={calDraft}
                  onChange={e => setCalDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitCal(); if (e.key === 'Escape') setCalEdit(false); }}
                  style={{ width: 150, fontSize: 28, fontWeight: 700, padding: '4px 12px' }} />
                <button className="btn-blue" style={{ padding: '8px 16px', fontSize: 13 }} onClick={commitCal}>Set</button>
                <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setCalEdit(false)}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setCalDraft(String(r0(total))); setCalEdit(true); }}
                title="Click to edit total calories — unlocked macros rescale to fit"
                style={{ display: 'flex', alignItems: 'baseline', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                <span style={{ fontSize: 46, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{r0(total).toLocaleString()}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>kcal / day</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 2, opacity: 0.4 }}><path d="M4 20h4l10-10-4-4L4 16v4z M14 6l4 4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>
          <button className="btn-ghost" onClick={onRecalc} style={{ fontSize: 13, padding: '9px 16px', whiteSpace: 'nowrap' }}>↻ Recalculate (full quiz)</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="#34c759" strokeWidth="1.8"/><path d="M8 11V8a4 4 0 018 0v3" stroke="#34c759" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {lockedCount > 0
            ? <span>Calories locked · {lockedCount} macro{lockedCount > 1 ? 's' : ''} held fixed — drag an unlocked macro and the remaining one absorbs it.</span>
            : <span>Calories locked — adjust one macro and the others rebalance to keep the daily total. Lock a macro to hold it.</span>}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <MacroSlider label="Protein" color="#2997ff" grams={target.protein_g} kcal={pKcal} pctCal={total ? pKcal / total * 100 : 0}
            max={maxFor('protein_g')} locked={locks.protein_g} onToggleLock={() => toggleLock('protein_g')} onSlide={g => setMacro('protein_g', g)} onType={g => setMacro('protein_g', g)} />
          <MacroSlider label="Carbs" color="#ff9f0a" grams={target.carbs_g} kcal={cKcal} pctCal={total ? cKcal / total * 100 : 0}
            max={maxFor('carbs_g')} locked={locks.carbs_g} onToggleLock={() => toggleLock('carbs_g')} onSlide={g => setMacro('carbs_g', g)} onType={g => setMacro('carbs_g', g)} />
          <MacroSlider label="Fat" color="#bf5af2" grams={target.fat_g} kcal={fKcal} pctCal={total ? fKcal / total * 100 : 0}
            max={maxFor('fat_g')} locked={locks.fat_g} onToggleLock={() => toggleLock('fat_g')} onSlide={g => setMacro('fat_g', g)} onType={g => setMacro('fat_g', g)} />
        </div>
      </div>
    );
  };

  window.MacroTargetPanel = MacroTargetPanel;
})();
