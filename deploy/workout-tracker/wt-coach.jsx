// ─── Coach Admin — full desktop dashboard ──────────────────────────────────────
// Read-only-ish coaching console: client roster, KPI cards, weekly-volume chart,
// session log table with drill-in detail, plan adherence, top lifts (e1RM trend),
// and the training split. Reuses window.WTData / WTUtil / WTLineChart / WTBars /
// WTIcon / MuscleMap / exerciseByName. No backend — pure props.

const { useState: useStateC } = React;
const C_ACC = '#2997ff';
const C_BLUE = '#0066cc';

function cWeeklyVolume(sessions, weeks = 8) {
  const out = [];
  const ws = window.WTData._weekStart(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const start = ws - i * 7 * 864e5, end = start + 7 * 864e5;
    const v = sessions.filter(s => { const t = +new Date(s.date); return t >= start && t < end; })
      .reduce((a, s) => a + (s.totalVolumeLb || 0), 0);
    const d = new Date(start);
    out.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, v: Math.round(v / 1000), on: v > 0 });
  }
  return out;
}

const CKpi = ({ value, label, sub, accent }) => (
  <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '15px 17px', flex: '1 1 140px' }}>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 25, fontWeight: 700, color: accent || '#f5f5f7', marginTop: 7, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</div>}
  </div>
);

const CCard = ({ title, action, children, style }) => (
  <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, ...style }}>
    {title && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
        {action}
      </div>
    )}
    {children}
  </div>
);

function CoachAdmin({ sessions, plan, athlete, clients }) {
  const [clientId, setClientId] = useStateC('ava');
  const [selSession, setSelSession] = useStateC(null);

  const isAva = clientId === 'ava';
  const data = isAva ? sessions : [];
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  const client = clients.find(c => c.id === clientId) || clients[0];

  const wk = window.WTData.weekStats(data);
  const totals = window.WTData.allTimeStats(data);
  const monthPRs = data.filter(s => (Date.now() - new Date(s.date)) < 30 * 864e5).reduce((a, s) => a + (s.prs ? s.prs.length : 0), 0);
  const avgMin = data.length ? Math.round(data.reduce((a, s) => a + s.durationSec, 0) / data.length / 60) : 0;
  const lastDate = sorted[0] ? new Date(sorted[0].date) : null;
  const weeklyVol = cWeeklyVolume(data);
  const topLifts = window.WTData.allPRs(data, 'lb').slice(0, 4);
  const dist = window.WTData.muscleDistribution(data);
  const maxDist = Math.max(...dist.map(d => d.sets), 1);

  // plan adherence — which of this week's planned training days have a logged session
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const wsMs = window.WTData._weekStart(new Date());
  const loggedDows = new Set(data.filter(s => +new Date(s.date) >= wsMs).map(s => new Date(s.date).getDay()));
  const planDays = (plan.plan_data || []).map(d => ({
    day: d.day, focus: d.focus, rest: d.restDay,
    done: loggedDows.has(DAY_NAMES.indexOf(d.day)),
  }));

  return (
    <div style={{ display: 'flex', gap: 0, maxWidth: 1240, margin: '0 auto', minHeight: '78vh', alignItems: 'stretch' }}>
      {/* sidebar */}
      <div style={{ width: 232, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', padding: '14px 14px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px 16px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <window.WTIcon name="dumbbell" size={17} color="#fff" />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f5f5f7' }}>Coaching</div>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 8px 8px' }}>Clients</div>
        {clients.map(c => {
          const on = c.id === clientId;
          return (
            <button key={c.id} onClick={() => { setClientId(c.id); setSelSession(null); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10,
              background: on ? 'rgba(41,151,255,0.12)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: on ? `linear-gradient(135deg,${C_ACC},${C_BLUE})` : 'rgba(255,255,255,0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: on ? '#f5f5f7' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.id === 'ava' ? 'Active · today' : c.status}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, padding: '16px 22px 40px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${C_ACC},${C_BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#fff' }}>
            {client.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7' }}>{client.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{isAva ? `${plan.goal} · ${plan.title}` : 'No plan assigned'}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
              Last session<br /><b style={{ color: '#f5f5f7', fontSize: 13 }}>{lastDate ? lastDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</b>
            </div>
            <button style={{ background: C_BLUE, border: 'none', borderRadius: 10, padding: '10px 16px', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Open plan editor</button>
          </div>
        </div>

        {!isAva ? (
          <CCard style={{ padding: 50, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f7', marginBottom: 6 }}>No workouts logged yet</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>{client.name} hasn\u2019t started tracking. Assign a plan to get them going.</div>
          </CCard>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <CKpi value={`${wk.thisWeek}/5`} label="This week" sub="planned sessions" accent={wk.thisWeek >= 3 ? '#34c759' : '#f5f5f7'} />
              <CKpi value={window.WTUtil.fmtVol(wk.weekVolume, 'lb')} label="Volume · wk" sub="lb lifted" />
              <CKpi value={totals.count} label="Sessions" sub="all time" />
              <CKpi value={monthPRs} label="PRs · 30d" sub="new records" accent={C_ACC} />
              <CKpi value={`${avgMin}m`} label="Avg length" sub="per session" />
              <CKpi value={totals.streak} label="Week streak" sub="consecutive" accent="#ff9f0a" />
            </div>

            {/* two columns */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* left column */}
              <div style={{ flex: '2 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <CCard title="Weekly volume · last 8 weeks" action={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>×1,000 lb</span>}>
                  <window.WTBars data={weeklyVol} accent={C_ACC} height={120} />
                </CCard>

                <CCard title="Session log" action={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{sorted.length} logged</span>}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '0 14px', fontSize: 11, fontWeight: 700,
                    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <span>Workout</span><span>Dur</span><span>Sets</span><span>Volume</span><span>PR</span>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {sorted.map(s => (
                      <button key={s.id} onClick={() => setSelSession(s)} style={{ width: '100%', display: 'grid',
                        gridTemplateColumns: '1fr auto auto auto auto', gap: '0 14px', alignItems: 'center', textAlign: 'left',
                        padding: '11px 4px', background: selSession && selSession.id === s.id ? 'rgba(41,151,255,0.08)' : 'none',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', borderRadius: 6 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>{new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        </div>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{window.WTData.fmtDur(s.durationSec)}</span>
                        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{window.WTData.sessionSets(s)}</span>
                        <span style={{ fontSize: 12.5, color: '#f5f5f7', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{window.WTUtil.fmtVol(s.totalVolumeLb, 'lb')}</span>
                        <span style={{ minWidth: 34, textAlign: 'right' }}>{s.prs && s.prs.length > 0
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#ffd60a' }}>{s.prs.length}</span>
                          : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>—</span>}</span>
                      </button>
                    ))}
                  </div>
                </CCard>
              </div>

              {/* right column */}
              <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selSession ? (
                  <CCard title="Session detail" action={
                    <button onClick={() => setSelSession(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <window.WTIcon name="x" size={15} color="rgba(255,255,255,0.7)" />
                    </button>}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f7' }}>{selSession.title}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', margin: '2px 0 14px' }}>
                      {new Date(selSession.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {window.WTData.fmtDur(selSession.durationSec)} · {window.WTUtil.fmtVol(selSession.totalVolumeLb, 'lb')} lb
                    </div>
                    {selSession.exercises.map((b, i) => (
                      <div key={i} style={{ marginBottom: 13 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f5f5f7', marginBottom: 6 }}>{b.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {b.sets.map((st, j) => (
                            <span key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums',
                              background: st.pr ? 'rgba(255,214,10,0.13)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${st.pr ? 'rgba(255,214,10,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '3px 8px' }}>
                              {st.weightLb}×{st.reps}{st.pr ? ' 🏆' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CCard>
                ) : (
                  <>
                    <CCard title="Plan adherence · this week">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {planDays.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 34, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{d.day.slice(0, 3)}</span>
                            <span style={{ flex: 1, fontSize: 12.5, color: d.rest ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.focus}</span>
                            {d.rest
                              ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>rest</span>
                              : d.done
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#34c759' }}><window.WTIcon name="check" size={13} color="#34c759" stroke={2.4} /> done</span>
                                : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>pending</span>}
                          </div>
                        ))}
                      </div>
                    </CCard>

                    <CCard title="Top lifts · est. 1RM">
                      {topLifts.map(p => {
                        const series = window.WTData.e1rmSeries(p.name, data);
                        return (
                          <div key={p.name} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: 8 }}>{p.name}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: C_ACC, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(p.e)} lb</span>
                            </div>
                            <div style={{ height: 34 }}><window.WTLineChart data={series} accent={C_ACC} height={34} unit="lb" /></div>
                          </div>
                        );
                      })}
                    </CCard>

                    <CCard title="Training split · sets">
                      {dist.map(d => (
                        <div key={d.group} style={{ marginBottom: 9 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{d.group}</span>
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{d.sets}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ width: `${(d.sets / maxDist) * 100}%`, height: '100%', background: C_ACC }} />
                          </div>
                        </div>
                      ))}
                    </CCard>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
window.CoachAdmin = CoachAdmin;
