// ─── Exercise Library + Detail ─────────────────────────────────────────────────
// Jefit-style searchable database and a rich how-to detail page: demo media,
// muscle map, step instructions, coaching tips, and the athlete's own PR history.

const { useState: useStateL, useMemo: useMemoL, useContext: useCtxL } = React;

const WT_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const WT_EQUIP = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'];

function ExerciseLibrary({ onOpen, onPick, pickMode = false, excludeNames = [] }) {
  const { accent } = useCtxL(WTCtx);
  const [q, setQ] = useStateL('');
  const [group, setGroup] = useStateL('All');
  const [equip, setEquip] = useStateL(null);

  const list = useMemoL(() => {
    const qq = q.trim().toLowerCase();
    return window.EXERCISE_DB.filter(e => {
      if (group !== 'All' && e.group !== group) return false;
      if (equip && e.equip !== equip) return false;
      if (qq && !e.name.toLowerCase().includes(qq) &&
        !(e.primary || []).some(m => (window.MUSCLE_LABELS[m] || '').toLowerCase().includes(qq))) return false;
      return true;
    });
  }, [q, group, equip]);

  // group results by body part for a sectioned list (only when not searching)
  const sections = useMemoL(() => {
    if (group !== 'All' || q.trim()) return [{ key: '', items: list }];
    const by = {};
    list.forEach(e => { (by[e.group] = by[e.group] || []).push(e); });
    return WT_GROUPS.slice(1).filter(g => by[g]).map(g => ({ key: g, items: by[g] }));
  }, [list, group, q]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* sticky search + filters */}
      <div style={{ padding: '8px 16px 10px', background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <WTIcon name="search" size={18} color="rgba(255,255,255,0.4)" />
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${window.EXERCISE_DB.length} exercises or a muscle…`}
            style={{ width: '100%', padding: '11px 12px 11px 40px', borderRadius: 11, fontFamily: 'inherit',
              fontSize: 15, color: '#f5f5f7', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, marginBottom: 8 }}>
          {WT_GROUPS.map(g => <WTChip key={g} active={group === g} onClick={() => setGroup(g)} accent={accent}>{g}</WTChip>)}
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
          {WT_EQUIP.map(eq => <WTChip key={eq} active={equip === eq} onClick={() => setEquip(equip === eq ? null : eq)} accent={accent}>{eq}</WTChip>)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 110px', WebkitOverflowScrolling: 'touch' }}>
        {list.length === 0 && (
          <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            No exercises match those filters.
          </div>
        )}
        {sections.map(sec => (
          <div key={sec.key}>
            {sec.key && <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.07em', margin: '16px 4px 8px' }}>{sec.key}</div>}
            {sec.items.map(ex => {
              const added = excludeNames.includes(ex.name);
              return (
                <button key={ex.id} onClick={() => pickMode ? onPick(ex) : onOpen(ex)} disabled={added}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px',
                    background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: added ? 'default' : 'pointer', textAlign: 'left', opacity: added ? 0.45 : 1 }}>
                  <WTThumb ex={ex} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      {(ex.primary || []).map(m => window.MUSCLE_LABELS[m]).join(', ')}
                    </div>
                  </div>
                  {pickMode ? (
                    added
                      ? <span style={{ fontSize: 12, color: '#34c759', fontWeight: 700 }}>Added</span>
                      : <div style={{ width: 30, height: 30, borderRadius: 8, background: accent + '22',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <WTIcon name="plus" size={17} color={accent} />
                        </div>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.06)', padding: '4px 9px', borderRadius: 999 }}>{ex.equip}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
window.ExerciseLibrary = ExerciseLibrary;

// ─── Exercise Detail ────────────────────────────────────────────────────────────
function ExerciseDetail({ ex, sessions, onClose, onAdd, inWorkout }) {
  const { accent, unit } = useCtxL(WTCtx);
  const [tab, setTab] = useStateL('how');
  if (!ex) return null;

  const best = window.WTData.bestSet(ex.name, sessions);
  const series = window.WTData.e1rmSeries(ex.name, sessions);
  const history = window.WTData.historyFor(ex.name, sessions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '52px 14px 10px',
        position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 6 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
          width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WTIcon name="back" size={20} color="#f5f5f7" />
        </button>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#f5f5f7', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 110px', WebkitOverflowScrolling: 'touch' }}>
        <WTDemo ex={ex} height={196} />
        <h2 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7', margin: '14px 0 4px' }}>{ex.name}</h2>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
          {[ex.group, ex.equip, ex.mechanic].map(t => (
            <span key={t} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              padding: '4px 10px', borderRadius: 999 }}>{t}</span>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <WTSeg options={[{ value: 'how', label: 'How-to' }, { value: 'muscles', label: 'Muscles' }, { value: 'history', label: 'History' }]}
            value={tab} onChange={setTab} accent={accent} />
        </div>

        {tab === 'how' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18 }}>
              {ex.instructions.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flexShrink: 0, width: 25, height: 25, borderRadius: '50%', background: accent + '22',
                    color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700 }}>{i + 1}</div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.82)', paddingTop: 2 }}>{step}</p>
                </div>
              ))}
            </div>
            {ex.tips && ex.tips.length > 0 && (
              <div style={{ background: 'rgba(255,214,10,0.07)', border: '1px solid rgba(255,214,10,0.18)',
                borderRadius: 13, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <WTIcon name="flame" size={16} color="#ffd60a" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#ffd60a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coach tips</span>
                </div>
                {ex.tips.map((t, i) => (
                  <p key={i} style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)', marginBottom: i < ex.tips.length - 1 ? 7 : 0 }}>{t}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'muscles' && (
          <div>
            <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
              padding: '18px 14px 14px', marginBottom: 14 }}>
              <window.MuscleMap primary={ex.primary} secondary={ex.secondary} accent={accent} h={170} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 8 }}>Primary</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {ex.primary.map(m => (
                  <span key={m} style={{ fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 999,
                    color: accent, background: accent + '20', border: `1px solid ${accent}44` }}>{window.MUSCLE_LABELS[m]}</span>
                ))}
              </div>
              {ex.secondary.length > 0 && <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: 8 }}>Secondary</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ex.secondary.map(m => (
                    <span key={m} style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 999,
                      color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)' }}>{window.MUSCLE_LABELS[m]}</span>
                  ))}
                </div>
              </>}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {/* PR cards */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#161617', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 13, padding: '13px 14px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best set</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#f5f5f7', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {best ? `${window.WTUtil.toDisplay(best.weightLb, unit)} × ${best.reps}` : '—'}
                </div>
              </div>
              <div style={{ flex: 1, background: '#161617', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 13, padding: '13px 14px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. 1RM</div>
                <div style={{ fontSize: 19, fontWeight: 700, color: accent, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {best ? `${window.WTUtil.toDisplay(Math.round(window.WTUtil.e1rm(best.weightLb, best.reps)), unit)} ${unit}` : '—'}
                </div>
              </div>
            </div>
            <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
              padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Estimated 1RM trend</div>
              <window.WTLineChart data={series} accent={accent} height={110} unit={unit} />
            </div>
            {history.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', margin: '4px 4px 8px' }}>Recent sessions</div>
                {history.slice(0, 6).map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 12px', background: '#161617', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 11, marginBottom: 7 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{h.date}</span>
                    <span style={{ fontSize: 13.5, color: '#f5f5f7', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {h.sets.map(s => `${window.WTUtil.toDisplay(s.weightLb, unit)}×${s.reps}`).join('  ·  ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>
                No logged history yet — this exercise will start tracking once you train it.
              </div>
            )}
          </div>
        )}
      </div>

      {/* add to workout */}
      {inWorkout && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px',
          background: 'linear-gradient(transparent, #0a0a0a 30%)' }}>
          <button onClick={() => onAdd(ex)} style={{ width: '100%', padding: '15px', borderRadius: 14,
            background: accent, border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
            fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <WTIcon name="plus" size={19} color="#fff" /> Add to workout
          </button>
        </div>
      )}
    </div>
  );
}
window.ExerciseDetail = ExerciseDetail;
