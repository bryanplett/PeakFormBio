// ─── Today / History / Profile / Finish screens ────────────────────────────────
const { useState: useStateS, useContext: useCtxS, useMemo: useMemoS } = React;

// muscle dots summarising a session / day
function MuscleDots({ muscles, accent, max = 5 }) {
  const L = window.MUSCLE_LABELS || {};
  const shown = muscles.slice(0, max);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {shown.map(m => (
        <span key={m} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          background: accent + '18', border: `1px solid ${accent}33`, padding: '2px 8px', borderRadius: 999 }}>{L[m] || m}</span>
      ))}
      {muscles.length > max && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>+{muscles.length - max}</span>}
    </div>
  );
}

// ─── TODAY ──────────────────────────────────────────────────────────────────────
function TodayScreen({ plan, sessions, athlete, onStartDay, onStartEmpty, onPreviewDay }) {
  const { accent, unit } = useCtxS(WTCtx);
  const today = new Date();
  const wd = today.getDay(); // 0 Sun..6 Sat
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const week = (plan && plan.plan_data) || [];
  const todayBlock = week.find(d => d.day === DAY_NAMES[wd]);
  const trainingDays = week.filter(d => !d.restDay && (d.exercises || []).length);

  const stats = window.WTData.weekStats(sessions);
  const last7 = window.WTData.last7Volume(sessions, unit);

  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '52px 16px 110px' }}>
      <div style={{ marginBottom: 4, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
        {greeting}, {athlete.name.split(' ')[0]}
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f7', marginBottom: 16 }}>
        {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </h1>

      {/* streak / week summary */}
      <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
        padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', marginBottom: 14 }}>
          <WTStat value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <WTIcon name="flame" size={18} color="#ff9f0a" />{stats.streak}</span>} label="Week streak" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <WTStat value={`${stats.thisWeek}`} label="This week" sub={`of ${trainingDays.length || 4} planned`} />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <WTStat value={window.WTUtil.fmtVol(stats.weekVolume, unit)} label={`${unit} this wk`} />
        </div>
        <window.WTBars data={last7} accent={accent} height={64} />
      </div>

      {/* today's session */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
        letterSpacing: '0.07em', margin: '4px 4px 8px' }}>Today</div>
      {todayBlock && !todayBlock.restDay && (todayBlock.exercises || []).length ? (
        <div style={{ background: `linear-gradient(150deg, ${accent}22, #161617 55%)`, border: `1px solid ${accent}44`,
          borderRadius: 18, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {plan.goal || 'Training'} · coach plan
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f5f7', letterSpacing: '-0.02em', margin: '4px 0 10px' }}>
            {todayBlock.focus}
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              <b style={{ color: '#f5f5f7' }}>{todayBlock.exercises.length}</b> exercises
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              ~<b style={{ color: '#f5f5f7' }}>{window.WTData.estMinutes(todayBlock)}</b> min
            </span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <MuscleDots muscles={window.WTData.dayMuscles(todayBlock)} accent={accent} />
          </div>
          <button onClick={() => onStartDay(todayBlock)} style={{ width: '100%', padding: '14px', borderRadius: 13,
            background: accent, border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
            fontSize: 16, fontWeight: 700 }}>Start workout</button>
        </div>
      ) : (
        <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18,
          padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#f5f5f7', marginBottom: 4 }}>Rest day</div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {(todayBlock && todayBlock.restMessage) || 'Recovery is where growth happens. Walk, stretch, sleep well.'}
          </div>
        </div>
      )}

      {/* plan this week */}
      {trainingDays.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
            letterSpacing: '0.07em', margin: '6px 4px 8px' }}>Your plan this week</div>
          <div style={{ marginBottom: 16 }}>
            {trainingDays.map((d, i) => {
              const isToday = d.day === DAY_NAMES[wd];
              return (
                <button key={i} onClick={() => onPreviewDay(d)} style={{ width: '100%', display: 'flex',
                  alignItems: 'center', gap: 12, padding: '13px 14px', background: '#161617',
                  border: `1px solid ${isToday ? accent + '55' : 'rgba(255,255,255,0.06)'}`, borderRadius: 13,
                  marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>{d.day.slice(0, 3)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: '#f5f5f7', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.focus}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{d.exercises.length} exercises{isToday ? ' · today' : ''}</div>
                  </div>
                  <WTIcon name="chevron" size={18} color="rgba(255,255,255,0.3)" />
                </button>
              );
            })}
          </div>
        </>
      )}

      <button onClick={onStartEmpty} style={{ width: '100%', padding: '14px', borderRadius: 13,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
        color: '#f5f5f7', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <WTIcon name="plus" size={18} color="#f5f5f7" /> Start an empty workout
      </button>
    </div>
  );
}
window.TodayScreen = TodayScreen;

// ─── HISTORY ──────────────────────────────────────────────────────────────────────
function HistoryScreen({ sessions, onOpenExercise }) {
  const { accent, unit } = useCtxS(WTCtx);
  const [sel, setSel] = useStateS(null);
  const sorted = useMemoS(() => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)), [sessions]);
  const totals = window.WTData.allTimeStats(sessions);
  const heat = window.WTData.heatmap(sessions); // last 35 days

  return (
    <div style={{ padding: '52px 16px 110px' }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f7', marginBottom: 16 }}>History</h1>

      <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', marginBottom: 16 }}>
          <WTStat value={totals.count} label="Workouts" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <WTStat value={window.WTUtil.fmtVol(totals.volume, unit)} label={`${unit} lifted`} />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <WTStat value={totals.hours} label="Hours" />
        </div>
        {/* heatmap */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
          {heat.map((wk, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {wk.map((d, j) => (
                <div key={j} title={d.date} style={{ width: 13, height: 13, borderRadius: 3,
                  background: d.level === 0 ? 'rgba(255,255,255,0.05)' : accent,
                  opacity: d.level === 0 ? 1 : 0.3 + d.level * 0.23 }} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 8, textAlign: 'right' }}>last 5 weeks</div>
      </div>

      {sorted.map(s => {
        const muscles = window.WTData.sessionMuscles(s);
        return (
          <button key={s.id} onClick={() => setSel(s)} style={{ width: '100%', textAlign: 'left',
            background: '#161617', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 15, padding: 15,
            marginBottom: 10, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f7', letterSpacing: '-0.01em' }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  {new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              {s.prs && s.prs.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,214,10,0.14)',
                  border: '1px solid rgba(255,214,10,0.3)', borderRadius: 999, padding: '3px 9px' }}>
                  <WTIcon name="trophy" size={12} color="#ffd60a" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#ffd60a' }}>{s.prs.length} PR</span>
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}><b style={{ color: '#f5f5f7' }}>{window.WTData.fmtDur(s.durationSec)}</b></span>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}><b style={{ color: '#f5f5f7' }}>{window.WTData.sessionSets(s)}</b> sets</span>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}><b style={{ color: '#f5f5f7' }}>{window.WTUtil.fmtVol(s.totalVolumeLb, unit)}</b> {unit}</span>
            </div>
            <MuscleDots muscles={muscles} accent={accent} />
          </button>
        );
      })}

      {/* session detail sheet */}
      <WTSheet open={!!sel} onClose={() => setSel(null)} title={sel ? sel.title : ''}>
        {sel && (
          <div style={{ paddingBottom: 10 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '0 2px' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(sel.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{window.WTData.fmtDur(sel.durationSec)}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{window.WTUtil.fmtVol(sel.totalVolumeLb, unit)} {unit}</span>
            </div>
            {sel.exercises.map((b, i) => {
              const ex = window.exerciseByName(b.name);
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <button onClick={() => { setSel(null); onOpenExercise(ex); }} style={{ display: 'flex', alignItems: 'center',
                    gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>
                    <WTThumb ex={ex} size={34} radius={9} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f5f5f7' }}>{b.name}</span>
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 44 }}>
                    {b.sets.map((st, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'rgba(255,255,255,0.7)',
                        fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ width: 18, color: 'rgba(255,255,255,0.4)' }}>{j + 1}</span>
                        <span style={{ color: '#f5f5f7', fontWeight: 600 }}>{window.WTUtil.toDisplay(st.weightLb, unit)} {unit} × {st.reps}</span>
                        {st.pr && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#ffd60a', fontWeight: 700, fontSize: 11 }}><WTIcon name="trophy" size={11} color="#ffd60a" /> PR</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </WTSheet>
    </div>
  );
}
window.HistoryScreen = HistoryScreen;

// ─── PROFILE ──────────────────────────────────────────────────────────────────────
function ProfileScreen({ sessions, athlete }) {
  const { accent, unit } = useCtxS(WTCtx);
  const totals = window.WTData.allTimeStats(sessions);
  const prs = window.WTData.allPRs(sessions, unit);
  const dist = window.WTData.muscleDistribution(sessions);
  const maxDist = Math.max(...dist.map(d => d.sets), 1);

  return (
    <div style={{ padding: '52px 16px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>
          {athlete.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7' }}>{athlete.name}</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{athlete.goal || 'Member'} · {totals.count} workouts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[
          { v: totals.count, l: 'Workouts', i: 'dumbbell' },
          { v: window.WTUtil.fmtVol(totals.volume, unit), l: `${unit} lifted`, i: 'chart' },
          { v: totals.hours, l: 'Hours trained', i: 'timer' },
          { v: totals.streak, l: 'Week streak', i: 'flame' },
        ].map(s => (
          <div key={s.l} style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '15px 16px' }}>
            <WTIcon name={s.i} size={18} color={accent} />
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f5f7', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* PRs */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
        letterSpacing: '0.07em', margin: '4px 4px 8px' }}>Personal records</div>
      <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '4px 14px', marginBottom: 18 }}>
        {prs.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>Log workouts to set records.</div>}
        {prs.slice(0, 6).map((p, i) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: i < Math.min(prs.length, 6) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <WTIcon name="trophy" size={16} color="#ffd60a" />
              <span style={{ fontSize: 14.5, color: '#f5f5f7', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 10 }}>
              {p.weight} {unit} × {p.reps}
            </span>
          </div>
        ))}
      </div>

      {/* muscle distribution */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
        letterSpacing: '0.07em', margin: '4px 4px 8px' }}>Training split (sets logged)</div>
      <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16 }}>
        {dist.map(d => (
          <div key={d.group} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{d.group}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{d.sets}</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ width: `${(d.sets / maxDist) * 100}%`, height: '100%', borderRadius: 999, background: accent }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.ProfileScreen = ProfileScreen;

// ─── FINISH SUMMARY ───────────────────────────────────────────────────────────────
function FinishSummary({ result, onDone }) {
  const { accent, unit } = useCtxS(WTCtx);
  const muscles = window.WTData.sessionMuscles(result);
  const primary = [...new Set(result.exercises.flatMap(b => { const e = window.exerciseByName(b.name); return e ? e.primary : []; }))];
  const secondary = [...new Set(result.exercises.flatMap(b => { const e = window.exerciseByName(b.name); return e ? e.secondary : []; }))].filter(m => !primary.includes(m));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '64px 18px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
          background: 'rgba(52,199,89,0.15)', border: '1px solid rgba(52,199,89,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WTIcon name="check" size={38} color="#34c759" stroke={2.6} />
        </div>
        <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7' }}>Workout complete</h1>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.55)', marginTop: 4, marginBottom: 22 }}>{result.title}</p>

        <div style={{ display: 'flex', background: '#161617', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '18px 8px', marginBottom: 14 }}>
          <WTStat value={window.WTData.fmtDur(result.durationSec)} label="Time" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <WTStat value={window.WTData.sessionSets(result)} label="Sets" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.07)' }} />
          <WTStat value={window.WTUtil.fmtVol(result.totalVolumeLb, unit)} label={`${unit}`} />
        </div>

        {result.prs && result.prs.length > 0 && (
          <div style={{ background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.25)',
            borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, justifyContent: 'center' }}>
              <WTIcon name="trophy" size={18} color="#ffd60a" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ffd60a' }}>{result.prs.length} new personal record{result.prs.length > 1 ? 's' : ''}!</span>
            </div>
            {result.prs.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{p.name}</span>
                <span style={{ color: '#f5f5f7', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{window.WTUtil.toDisplay(p.weightLb, unit)} {unit} × {p.reps}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
          padding: '18px 14px 12px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 6 }}>Muscles worked</div>
          <window.MuscleMap primary={primary} secondary={secondary} accent={accent} h={160} />
        </div>
      </div>

      <div style={{ padding: '12px 18px 28px', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onDone} style={{ width: '100%', padding: '15px', borderRadius: 14, background: accent,
          border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700 }}>
          Save & finish
        </button>
      </div>
    </div>
  );
}
window.FinishSummary = FinishSummary;
