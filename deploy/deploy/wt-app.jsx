// ─── Workout Tracker — main app shell ──────────────────────────────────────────
// Ties screens together: bottom-tab nav, active-workout overlay, rest timer,
// exercise detail, finish flow. Owns the active session (persisted to localStorage)
// and the pure data helpers (window.WTData) used across every screen.

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp, useContext: useCtxApp } = React;

// ─── pure data helpers ──────────────────────────────────────────────────────────
const WTData = {
  fmtDur(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}m`;
  },
  parseRest(str) {
    if (!str) return 90;
    const s = String(str).toLowerCase();
    if (s.includes('min')) return Math.round(parseFloat(s) * 60) || 120;
    const n = parseInt(s, 10);
    return isNaN(n) ? 90 : n;
  },
  parseSetCount(v) { const n = parseInt(v, 10); return isNaN(n) ? 3 : Math.min(8, Math.max(1, n)); },
  restSeconds(block, ex) {
    if (block.restSec) return block.restSec;
    return 90;
  },
  estMinutes(day) {
    const sets = (day.exercises || []).reduce((a, e) => a + WTData.parseSetCount(e.sets), 0);
    return Math.round(sets * 2.7); // ~2.7 min/set incl rest
  },
  dayMuscles(day) {
    const set = [];
    (day.exercises || []).forEach(e => {
      const x = window.exerciseByName(e.name);
      if (x) x.primary.forEach(m => { if (!set.includes(m)) set.push(m); });
    });
    return set;
  },
  // build an active-session exercise list from a coach plan day
  sessionFromDay(day) {
    return (day.exercises || []).map(e => {
      const count = WTData.parseSetCount(e.sets);
      const sets = [];
      for (let i = 0; i < count; i++) sets.push({ kind: 'work', weightLb: '', reps: '', rpe: '', done: false });
      return {
        name: e.name,
        target: `${count} × ${e.reps || '8–12'}${e.rest ? ' · rest ' + e.rest : ''}`,
        note: e.notes || '',
        restSec: WTData.parseRest(e.rest),
        sets: window.WTrenumber(sets),
      };
    });
  },
  emptyBlock(ex) {
    return { name: ex.name, target: '', note: '', restSec: 90,
      sets: window.WTrenumber([{ kind: 'work', weightLb: '', reps: '', rpe: '', done: false },
        { kind: 'work', weightLb: '', reps: '', rpe: '', done: false },
        { kind: 'work', weightLb: '', reps: '', rpe: '', done: false }]) };
  },
  // sessions that include an exercise, newest first
  _withEx(name, sessions) {
    const n = name.toLowerCase();
    return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(s => ({ date: s.date, block: s.exercises.find(b => b.name.toLowerCase() === n) }))
      .filter(x => x.block);
  },
  prevSets(name, sessions) {
    const w = WTData._withEx(name, sessions);
    return w.length ? w[0].block.sets : [];
  },
  bestSet(name, sessions) {
    let best = null, bestE = 0;
    WTData._withEx(name, sessions).forEach(({ block }) => block.sets.forEach(s => {
      const e = window.WTUtil.e1rm(Number(s.weightLb), Number(s.reps));
      if (e > bestE) { bestE = e; best = s; }
    }));
    return best;
  },
  bestE1rm(name, sessions) {
    let m = 0;
    WTData._withEx(name, sessions).forEach(({ block }) => block.sets.forEach(s =>
      { m = Math.max(m, window.WTUtil.e1rm(Number(s.weightLb), Number(s.reps))); }));
    return m;
  },
  // is set si the highest-e1rm done set in its block (so we flag only one PR row)
  isTopSet(sets, si) {
    const e = (s) => (s.done ? window.WTUtil.e1rm(Number(s.weightLb), Number(s.reps)) : 0);
    const target = e(sets[si]);
    if (!target) return false;
    return sets.every((s, i) => i === si || e(s) < target || (e(s) === target && i > si));
  },
  e1rmSeries(name, sessions) {
    return WTData._withEx(name, sessions).reverse().map(({ date, block }) => {
      const best = Math.max(...block.sets.map(s => window.WTUtil.e1rm(Number(s.weightLb), Number(s.reps))), 0);
      return { v: Math.round(best), date };
    });
  },
  historyFor(name, sessions) {
    return WTData._withEx(name, sessions).map(({ date, block }) => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      sets: block.sets,
    }));
  },
  sessionSets(s) { return s.exercises.reduce((a, b) => a + b.sets.length, 0); },
  sessionMuscles(s) {
    const set = [];
    s.exercises.forEach(b => { const x = window.exerciseByName(b.name); if (x) x.primary.forEach(m => { if (!set.includes(m)) set.push(m); }); });
    return set;
  },
  allTimeStats(sessions) {
    const volume = sessions.reduce((a, s) => a + (s.totalVolumeLb || 0), 0);
    const secs = sessions.reduce((a, s) => a + (s.durationSec || 0), 0);
    return { count: sessions.length, volume, hours: Math.round(secs / 360) / 10, streak: WTData._streak(sessions) };
  },
  _weekStart(date) {
    const x = new Date(date); const dow = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x.getTime();
  },
  // consecutive weeks (Mon-anchored) with at least one session — the metric that
  // actually fits a multi-day split. Current week in progress doesn't break it.
  _streak(sessions) {
    const weeks = new Set(sessions.map(s => WTData._weekStart(s.date)));
    let streak = 0; const cur = new Date(); cur.setTime(WTData._weekStart(cur));
    if (!weeks.has(cur.getTime())) cur.setDate(cur.getDate() - 7);
    while (weeks.has(cur.getTime())) { streak++; cur.setDate(cur.getDate() - 7); }
    return streak;
  },
  weekStats(sessions) {
    const now = new Date(); const monday = new Date(now); const dow = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - dow); monday.setHours(0, 0, 0, 0);
    const wk = sessions.filter(s => new Date(s.date) >= monday);
    return { streak: WTData._streak(sessions), thisWeek: wk.length, weekVolume: wk.reduce((a, s) => a + (s.totalVolumeLb || 0), 0) };
  },
  last7Volume(sessions, unit) {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const vol = sessions.filter(s => { const t = new Date(s.date); return t >= d && t < next; })
        .reduce((a, s) => a + (s.totalVolumeLb || 0), 0);
      out.push({ label: days[d.getDay()], v: unit === 'kg' ? vol / window.WTUtil.LB_PER_KG : vol, on: vol > 0 });
    }
    return out;
  },
  heatmap(sessions) {
    const byDay = {};
    sessions.forEach(s => { const k = new Date(s.date).toDateString(); byDay[k] = (byDay[k] || 0) + (s.totalVolumeLb || 0); });
    const maxV = Math.max(...Object.values(byDay), 1);
    const weeks = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const start = new Date(today); start.setDate(today.getDate() - dow - 28); // 5 weeks back, week-aligned
    for (let w = 0; w < 5; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(start); cur.setDate(start.getDate() + w * 7 + d);
        const v = byDay[cur.toDateString()] || 0;
        const level = v === 0 ? 0 : Math.min(3, Math.ceil((v / maxV) * 3));
        col.push({ date: cur.toLocaleDateString(), level, future: cur > today });
      }
      weeks.push(col);
    }
    return weeks;
  },
  allPRs(sessions, unit) {
    const names = [...new Set(sessions.flatMap(s => s.exercises.map(b => b.name)))];
    return names.map(name => {
      const best = WTData.bestSet(name, sessions);
      return best ? { name, weight: window.WTUtil.toDisplay(best.weightLb, unit), reps: best.reps, e: window.WTUtil.e1rm(best.weightLb, best.reps) } : null;
    }).filter(Boolean).sort((a, b) => b.e - a.e);
  },
  muscleDistribution(sessions) {
    const groups = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 };
    sessions.forEach(s => s.exercises.forEach(b => {
      const x = window.exerciseByName(b.name);
      if (x && groups[x.group] != null) groups[x.group] += b.sets.length;
    }));
    return Object.entries(groups).map(([group, sets]) => ({ group, sets })).sort((a, b) => b.sets - a.sets);
  },
  // finalise an in-progress session into a stored record + compute PRs
  finalize(session, sessions) {
    const exercises = session.exercises.map(b => ({
      name: b.name,
      sets: b.sets.filter(s => s.done && s.kind === 'work' && s.weightLb !== '' && s.reps !== '')
        .map(s => ({ weightLb: Number(s.weightLb), reps: Number(s.reps), pr: false })),
    })).filter(b => b.sets.length);

    const prs = [];
    exercises.forEach(b => {
      const prior = WTData.bestE1rm(b.name, sessions);
      let topIdx = -1, topE = prior;
      b.sets.forEach((s, i) => { const e = window.WTUtil.e1rm(s.weightLb, s.reps); if (e > topE + 0.5) { topE = e; topIdx = i; } });
      if (topIdx >= 0) { b.sets[topIdx].pr = true; prs.push({ name: b.name, weightLb: b.sets[topIdx].weightLb, reps: b.sets[topIdx].reps }); }
    });

    const totalVolumeLb = exercises.reduce((a, b) => a + b.sets.reduce((x, s) => x + s.weightLb * s.reps, 0), 0);
    return {
      id: 'sess-' + Date.now(),
      date: new Date().toISOString(),
      title: session.title,
      durationSec: Math.max(60, Math.floor((Date.now() - session.startedAt) / 1000)),
      totalVolumeLb, prs, exercises,
    };
  },
};
window.WTData = WTData;

// ─── rest timer bar ───────────────────────────────────────────────────────────────
function RestBar({ rest, onAdjust, onSkip, accent, bottom }) {
  if (!rest.running) return null;
  const pct = rest.total ? (rest.remaining / rest.total) * 100 : 0;
  const mm = Math.floor(rest.remaining / 60), ss = String(rest.remaining % 60).padStart(2, '0');
  const done = rest.remaining <= 0;
  return (
    <div style={{ position: 'absolute', left: 12, right: 12, bottom, zIndex: 350,
      background: 'rgba(28,28,30,0.92)', backdropFilter: 'blur(16px)', borderRadius: 16,
      border: `1px solid ${done ? '#34c759' : accent + '55'}`, boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
      overflow: 'hidden', animation: 'wtSlideUp .24s ease' }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: `${pct}%`,
        background: done ? '#34c759' : accent, transition: 'width 1s linear' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px' }}>
        <WTIcon name="timer" size={20} color={done ? '#34c759' : accent} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{done ? 'Rest complete' : 'Rest timer'}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f5f7', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {done ? "Let's go" : `${mm}:${ss}`}
          </div>
        </div>
        <button onClick={() => onAdjust(-15)} style={restBtn}>−15</button>
        <button onClick={() => onAdjust(15)} style={restBtn}>+15</button>
        <button onClick={onSkip} style={{ ...restBtn, background: accent, color: '#fff', border: 'none' }}>
          {done ? 'Done' : 'Skip'}
        </button>
      </div>
    </div>
  );
}
const restBtn = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 9, padding: '8px 11px', color: '#f5f5f7', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' };

// ─── bottom tab bar ─────────────────────────────────────────────────────────────────
function TabBar({ tab, setTab, accent }) {
  const tabs = [
    { id: 'today', icon: 'home', label: 'Today' },
    { id: 'exercises', icon: 'dumbbell', label: 'Exercises' },
    { id: 'history', icon: 'history', label: 'History' },
    { id: 'profile', icon: 'user', label: 'Profile' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 200,
      background: 'rgba(10,10,10,0.86)', backdropFilter: 'blur(18px)', borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', padding: '8px 6px 26px' }}>
      {tabs.map(t => {
        const on = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0' }}>
            <WTIcon name={t.icon} size={24} color={on ? accent : 'rgba(255,255,255,0.45)'} stroke={on ? 2.1 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: on ? accent : 'rgba(255,255,255,0.45)' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── main component ─────────────────────────────────────────────────────────────────
function WorkoutTracker({ plan, sessions, athlete, onSaveSession, config }) {
  const [tab, setTab] = useStateApp('today');
  const [active, setActive] = useStateApp(() => {
    try { return JSON.parse(localStorage.getItem('pfb_wt_active')); } catch { return null; }
  });
  const [detailEx, setDetailEx] = useStateApp(null);
  const [picker, setPicker] = useStateApp(false);
  const [finishing, setFinishing] = useStateApp(null);
  const [confirmCancel, setConfirmCancel] = useStateApp(false);
  const [rest, setRest] = useStateApp({ running: false, remaining: 0, total: 0 });

  // persist active session
  useEffectApp(() => {
    if (active) localStorage.setItem('pfb_wt_active', JSON.stringify(active));
    else localStorage.removeItem('pfb_wt_active');
  }, [active]);

  // rest countdown
  useEffectApp(() => {
    if (!rest.running) return;
    const iv = setInterval(() => setRest(r => {
      if (!r.running) return r;
      if (r.remaining <= -1) return { ...r, running: false };
      return { ...r, remaining: r.remaining - 1 };
    }), 1000);
    return () => clearInterval(iv);
  }, [rest.running]);

  const startRest = (sec) => setRest({ running: true, remaining: sec, total: sec });
  const adjustRest = (d) => setRest(r => ({ ...r, remaining: Math.max(0, r.remaining + d), total: Math.max(r.total, r.remaining + d) }));
  const skipRest = () => setRest({ running: false, remaining: 0, total: 0 });

  const startDay = (day) => {
    setActive({ title: day.focus || 'Workout', startedAt: Date.now(), exercises: window.WTData.sessionFromDay(day) });
  };
  const startEmpty = () => setActive({ title: 'New Workout', startedAt: Date.now(), exercises: [] });

  const addExerciseToActive = (ex) => {
    setActive(a => ({ ...a, exercises: [...a.exercises, window.WTData.emptyBlock(ex)] }));
    setPicker(false); setDetailEx(null);
  };

  const doFinish = () => {
    const result = window.WTData.finalize(active, sessions);
    setFinishing(result);
  };
  const saveFinished = () => {
    onSaveSession(finishing);
    setActive(null); setFinishing(null); setRest({ running: false, remaining: 0, total: 0 });
    setTab('history');
  };

  const ctxVal = { accent: config.accent, unit: config.unit, showRpe: config.showRpe };

  return (
    <WTCtx.Provider value={ctxVal}>
      <div style={{ position: 'relative', height: '100%', background: '#0a0a0a', overflow: 'hidden' }}>
        {/* base: tabs */}
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {tab === 'today' && <TodayScreen plan={plan} sessions={sessions} athlete={athlete}
            onStartDay={startDay} onStartEmpty={startEmpty} onPreviewDay={startDay} />}
          {tab === 'exercises' && <ExerciseLibrary onOpen={setDetailEx} />}
          {tab === 'history' && <HistoryScreen sessions={sessions} onOpenExercise={setDetailEx} />}
          {tab === 'profile' && <ProfileScreen sessions={sessions} athlete={athlete} />}
        </div>
        {!active && <TabBar tab={tab} setTab={setTab} accent={config.accent} />}

        {/* active workout overlay */}
        {active && !finishing && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
            <ActiveWorkout session={active} setSession={setActive} sessions={sessions}
              onFinish={doFinish} onCancel={() => setConfirmCancel(true)}
              onStartRest={startRest} onOpenExercise={setDetailEx} onAddExercise={() => setPicker(true)} />
          </div>
        )}

        {/* rest timer */}
        <RestBar rest={rest} onAdjust={adjustRest} onSkip={skipRest} accent={config.accent}
          bottom={active ? 46 : 92} />

        {/* exercise detail overlay */}
        {detailEx && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 300 }}>
            <ExerciseDetail ex={detailEx} sessions={sessions} onClose={() => setDetailEx(null)}
              inWorkout={!!active} onAdd={addExerciseToActive} />
          </div>
        )}

        {/* add-exercise picker */}
        {picker && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 320, background: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '52px 14px 6px' }}>
              <button onClick={() => setPicker(false)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none',
                borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WTIcon name="x" size={19} color="#f5f5f7" />
              </button>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f5f7' }}>Add exercise</div>
            </div>
            <div style={{ position: 'absolute', top: 92, left: 0, right: 0, bottom: 0 }}>
              <ExerciseLibrary pickMode onPick={addExerciseToActive}
                excludeNames={active.exercises.map(b => b.name)} onOpen={setDetailEx} />
            </div>
          </div>
        )}

        {/* finish summary */}
        {finishing && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 360 }}>
            <FinishSummary result={finishing} onDone={saveFinished} />
          </div>
        )}

        {/* cancel confirm */}
        {confirmCancel && (
          <div onClick={() => setConfirmCancel(false)} style={{ position: 'absolute', inset: 0, zIndex: 380,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#1c1c1e', borderRadius: 18, padding: 22,
              width: '100%', maxWidth: 320, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f5f7', marginBottom: 6 }}>Discard workout?</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', marginBottom: 18, lineHeight: 1.4 }}>
                Your logged sets won't be saved.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, padding: 12, borderRadius: 11,
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: '#f5f5f7', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Keep going</button>
                <button onClick={() => { setActive(null); setConfirmCancel(false); setRest({ running: false, remaining: 0, total: 0 }); }}
                  style={{ flex: 1, padding: 12, borderRadius: 11, background: '#ff453a', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WTCtx.Provider>
  );
}
window.WorkoutTracker = WorkoutTracker;
