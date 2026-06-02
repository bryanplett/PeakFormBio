// ─── Active Workout (the live logging screen) ──────────────────────────────────
// Hevy / Strong-style fast logging: per-set rows with the previous session's
// numbers inline, tap-to-complete check that auto-fills + auto-starts the rest
// timer, inline PR detection, warm-up sets, add/remove set & exercise.
// Reads accent / unit / showRpe from WTCtx. Pure data helpers live on window.WTData.

const { useContext: useCtxA, useState: useStateA, useRef: useRefA, useEffect: useEffectA } = React;

// numeric field used for weight / reps / rpe
const WTNum = ({ value, onChange, placeholder, w = '100%', done, accent, align = 'center' }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    inputMode="decimal" enterKeyHint="next"
    style={{
      width: w, textAlign: align, padding: '9px 4px', borderRadius: 9, fontFamily: 'inherit',
      fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      color: value ? '#f5f5f7' : 'rgba(255,255,255,0.3)',
      background: done ? 'rgba(52,199,89,0.10)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${done ? 'rgba(52,199,89,0.28)' : 'rgba(255,255,255,0.09)'}`,
      outline: 'none', WebkitAppearance: 'none',
    }}
    onFocus={e => { e.target.style.borderColor = accent; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
    onBlur={e => { e.target.style.borderColor = done ? 'rgba(52,199,89,0.28)' : 'rgba(255,255,255,0.09)';
      e.target.style.background = done ? 'rgba(52,199,89,0.10)' : 'rgba(255,255,255,0.05)'; }}
  />
);

// one set row
function WTSetRow({ s, idx, prev, onPatch, onRemove, onToggleDone, accent, unit, showRpe, isPR }) {
  const setLabel = s.kind === 'warmup' ? 'W' : String(s.workIndex);
  const prevText = prev ? `${window.WTUtil.toDisplay(prev.weightLb, unit)}×${prev.reps}` : '—';
  const cols = showRpe ? '30px 64px 1fr 1fr 50px 38px' : '30px 70px 1fr 1fr 40px';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 7, alignItems: 'center',
      padding: '4px 0', position: 'relative' }}>
      {/* set number / warmup toggle */}
      <button onClick={() => onPatch({ kind: s.kind === 'warmup' ? 'work' : 'warmup' })}
        title="Tap to toggle warm-up set" style={{
          width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          background: s.kind === 'warmup' ? 'rgba(255,159,10,0.16)' : 'rgba(255,255,255,0.06)',
          color: s.kind === 'warmup' ? '#ff9f0a' : 'rgba(255,255,255,0.6)',
        }}>{setLabel}</button>
      {/* previous */}
      <button onClick={() => prev && onPatch({ weightLb: prev.weightLb, reps: prev.reps })}
        disabled={!prev} style={{
          fontSize: 12.5, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums',
          background: 'none', border: 'none', cursor: prev ? 'pointer' : 'default', fontFamily: 'inherit',
          textAlign: 'center', whiteSpace: 'nowrap', padding: 0,
        }}>{prevText}</button>
      {/* weight */}
      <WTNum value={s.weightLb === '' ? '' : window.WTUtil.toDisplay(s.weightLb, unit)}
        onChange={v => onPatch({ weightLb: window.WTUtil.fromDisplay(v, unit) })}
        placeholder={prev ? String(window.WTUtil.toDisplay(prev.weightLb, unit)) : '0'} done={s.done} accent={accent} />
      {/* reps */}
      <WTNum value={s.reps} onChange={v => onPatch({ reps: v.replace(/[^0-9]/g, '') })}
        placeholder={prev ? String(prev.reps) : '0'} done={s.done} accent={accent} />
      {/* rpe */}
      {showRpe && (
        <WTNum value={s.rpe} onChange={v => onPatch({ rpe: v.replace(/[^0-9.]/g, '').slice(0, 3) })}
          placeholder="–" done={s.done} accent={accent} />
      )}
      {/* check */}
      <button onClick={onToggleDone} style={{
        width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', transition: 'all .14s', justifySelf: 'end',
        background: s.done ? '#34c759' : 'rgba(255,255,255,0.07)',
        boxShadow: s.done ? '0 2px 8px rgba(52,199,89,0.35)' : 'none',
      }}>
        <WTIcon name="check" size={19} color={s.done ? '#fff' : 'rgba(255,255,255,0.4)'} stroke={2.4} />
      </button>
      {isPR && s.done && (
        <div style={{ position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,214,10,0.16)',
          border: '1px solid rgba(255,214,10,0.35)', borderRadius: 999, padding: '2px 7px', pointerEvents: 'none' }}>
          <WTIcon name="trophy" size={11} color="#ffd60a" stroke={2} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#ffd60a', letterSpacing: '0.04em' }}>PR</span>
        </div>
      )}
    </div>
  );
}

// one exercise block within the active workout
function WTExerciseBlock({ block, bi, sessions, accent, unit, showRpe, onPatch, onOpenInfo, onMenu }) {
  const ex = window.exerciseByName(block.name);
  const prevSets = window.WTData.prevSets(block.name, sessions);
  const bestPrior = window.WTData.bestE1rm(block.name, sessions);

  const patchSet = (si, patch) => {
    const sets = block.sets.map((s, i) => i === si ? { ...s, ...patch } : s);
    onPatch({ sets: renumber(sets) });
  };
  const toggleDone = (si) => {
    const sets = block.sets.map((s, i) => {
      if (i !== si) return s;
      const turningOn = !s.done;
      const prev = prevSets[s.workIndex - 1];
      if (turningOn && !prev && s.weightLb === '' && s.reps === '') return s; // nothing to log
      const patch = { done: turningOn };
      if (turningOn) {                       // auto-fill from last session if left blank
        if (prev) {
          if (s.weightLb === '') patch.weightLb = prev.weightLb;
          if (s.reps === '') patch.reps = prev.reps;
        }
      }
      return { ...s, ...patch };
    });
    onPatch({ sets: renumber(sets) });
  };
  const removeSet = (si) => onPatch({ sets: renumber(block.sets.filter((_, i) => i !== si)) });
  const addSet = () => {
    const last = [...block.sets].reverse().find(s => s.kind === 'work');
    onPatch({ sets: renumber([...block.sets, { kind: 'work', weightLb: last ? last.weightLb : '', reps: last ? last.reps : '', rpe: '', done: false }]) });
  };

  const doneCount = block.sets.filter(s => s.done).length;
  const colHdr = showRpe ? '30px 64px 1fr 1fr 50px 38px' : '30px 70px 1fr 1fr 40px';

  return (
    <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
      padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
        <button onClick={onOpenInfo} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <WTThumb ex={ex} size={42} />
        </button>
        <button onClick={onOpenInfo} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none',
          padding: 0, cursor: 'pointer', minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: '#f5f5f7', letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {block.name}
            <WTIcon name="info" size={14} color="rgba(255,255,255,0.3)" />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {block.target || (ex ? `${ex.group} · ${ex.equip}` : '')}
            {doneCount > 0 && <span style={{ color: '#34c759', fontWeight: 600 }}> · {doneCount}/{block.sets.length} done</span>}
          </div>
        </button>
        <button onClick={onMenu} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
          width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WTIcon name="ellipsis" size={18} color="rgba(255,255,255,0.55)" />
        </button>
      </div>

      {block.note && (
        <div style={{ fontSize: 12.5, color: accent, background: accent + '14', borderRadius: 8,
          padding: '7px 10px', marginBottom: 10, lineHeight: 1.4 }}>{block.note}</div>
      )}

      {/* column header */}
      <div style={{ display: 'grid', gridTemplateColumns: colHdr, gap: 7, padding: '0 0 4px',
        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span style={{ textAlign: 'center' }}>Set</span>
        <span style={{ textAlign: 'center' }}>Prev</span>
        <span style={{ textAlign: 'center' }}>{unit}</span>
        <span style={{ textAlign: 'center' }}>Reps</span>
        {showRpe && <span style={{ textAlign: 'center' }}>RPE</span>}
        <span />
      </div>

      {block.sets.map((s, si) => {
        const isPR = s.done && s.weightLb && s.reps &&
          window.WTUtil.e1rm(Number(s.weightLb), Number(s.reps)) > bestPrior + 0.5 &&
          window.WTData.isTopSet(block.sets, si);
        return (
          <WTSetRow key={si} s={s} idx={si} prev={prevSets[s.workIndex - 1]}
            onPatch={p => patchSet(si, p)} onRemove={() => removeSet(si)}
            onToggleDone={() => toggleDone(si)}
            accent={accent} unit={unit} showRpe={showRpe} isPR={isPR} />
        );
      })}

      <button onClick={addSet} style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 9,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
        color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <WTIcon name="plus" size={15} color="rgba(255,255,255,0.7)" /> Add set
      </button>
    </div>
  );
}

// renumber work sets (warm-ups don't count)
function renumber(sets) {
  let n = 0;
  return sets.map(s => s.kind === 'warmup' ? { ...s } : { ...s, workIndex: ++n });
}
window.WTrenumber = renumber;

// ─── main active workout screen ────────────────────────────────────────────────
function ActiveWorkout({ session, setSession, sessions, onFinish, onCancel, onStartRest, onOpenExercise, onAddExercise }) {
  const { accent, unit, showRpe } = useCtxA(WTCtx);
  const [now, setNow] = useStateA(Date.now());
  const [menuFor, setMenuFor] = useStateA(null); // block index for the … menu

  useEffectA(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const totalSets = session.exercises.reduce((a, b) => a + b.sets.length, 0);
  const doneSets = session.exercises.reduce((a, b) => a + b.sets.filter(s => s.done).length, 0);
  const volume = session.exercises.reduce((a, b) =>
    a + b.sets.filter(s => s.done && s.kind === 'work').reduce((x, s) => x + (Number(s.weightLb) || 0) * (Number(s.reps) || 0), 0), 0);

  const patchBlock = (bi, patch, justCheckedRest) => {
    setSession(prev => ({ ...prev, exercises: prev.exercises.map((b, i) => i === bi ? { ...b, ...patch } : b) }));
  };

  // detect a fresh check to start rest timer
  const handleBlockPatch = (bi, patch) => {
    const before = session.exercises[bi];
    patchBlock(bi, patch);
    if (patch.sets) {
      const newlyDone = patch.sets.some((s, i) => s.done && (!before.sets[i] || !before.sets[i].done));
      if (newlyDone) {
        const ex = window.exerciseByName(before.name);
        onStartRest(window.WTData.restSeconds(before, ex));
      }
    }
  };

  const removeBlock = (bi) => { setSession(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== bi) })); setMenuFor(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* header */}
      <div style={{ padding: '54px 16px 12px', background: 'linear-gradient(#161617,#0a0a0a)',
        borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 9,
            padding: '8px 12px', color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Workout</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
              {mm}:{ss}
            </div>
          </div>
          <button onClick={onFinish} disabled={doneSets === 0} style={{
            background: doneSets === 0 ? 'rgba(255,255,255,0.08)' : '#34c759', border: 'none', borderRadius: 9,
            padding: '8px 16px', color: doneSets === 0 ? 'rgba(255,255,255,0.35)' : '#fff', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: doneSets === 0 ? 'default' : 'pointer' }}>
            Finish
          </button>
        </div>
        <input value={session.title} onChange={e => setSession(p => ({ ...p, title: e.target.value }))}
          style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', outline: 'none',
            color: '#f5f5f7', fontFamily: 'inherit', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', padding: 0 }} />
        <div style={{ display: 'flex', gap: 18, marginTop: 8 }}>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
            <b style={{ color: '#f5f5f7' }}>{doneSets}</b>/{totalSets} sets
          </span>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
            <b style={{ color: '#f5f5f7' }}>{window.WTUtil.fmtVol(volume, unit)}</b> {unit} volume
          </span>
        </div>
      </div>

      {/* exercise list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 120px', WebkitOverflowScrolling: 'touch' }}>
        {session.exercises.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>Empty workout</div>
            <div style={{ fontSize: 13 }}>Add your first exercise to start logging.</div>
          </div>
        )}
        {session.exercises.map((block, bi) => (
          <WTExerciseBlock key={bi} block={block} bi={bi} sessions={sessions}
            accent={accent} unit={unit} showRpe={showRpe}
            onPatch={p => handleBlockPatch(bi, p)}
            onOpenInfo={() => onOpenExercise(window.exerciseByName(block.name))}
            onMenu={() => setMenuFor(bi)} />
        ))}

        <button onClick={onAddExercise} style={{ width: '100%', padding: '13px', borderRadius: 13,
          background: accent + '1a', border: `1px solid ${accent}55`, cursor: 'pointer', color: accent,
          fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 7 }}>
          <WTIcon name="plus" size={18} color={accent} /> Add exercise
        </button>
      </div>

      {/* per-exercise menu */}
      <WTSheet open={menuFor !== null} onClose={() => setMenuFor(null)}
        title={menuFor !== null ? session.exercises[menuFor].name : ''}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
          <SheetAction icon="info" label="View instructions"
            onClick={() => { onOpenExercise(window.exerciseByName(session.exercises[menuFor].name)); setMenuFor(null); }} />
          <SheetAction icon="x" label="Remove from workout" danger onClick={() => removeBlock(menuFor)} />
        </div>
      </WTSheet>
    </div>
  );
}

const SheetAction = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
    borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
    color: danger ? '#ff453a' : '#f5f5f7', width: '100%', textAlign: 'left' }}>
    <WTIcon name={icon} size={19} color={danger ? '#ff453a' : 'rgba(255,255,255,0.7)'} /> {label}
  </button>
);
window.SheetAction = SheetAction;

window.ActiveWorkout = ActiveWorkout;
