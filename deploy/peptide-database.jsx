/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Peptide Library UI
   Renders the library grid, filters/search, detail panel, side-by-side compare,
   and a reconstitution calculator. Matches the Client Portal dark theme.
   Depends on window.PEPTIDE_DATA / PEPTIDE_CATEGORIES / PEPTIDE_PHASES.
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useMemo, useEffect } = React;

  const DATA   = window.PEPTIDE_DATA || [];
  const CATS   = window.PEPTIDE_CATEGORIES || [];
  const PHASES = window.PEPTIDE_PHASES || [];
  const catLabel = (key) => (CATS.find(c => c.key === key) || {}).label || key;

  // Phase → accent color
  const PHASE_COLOR = {
    'FDA Approved': { fg: '#7be39a', bg: 'rgba(52,199,89,0.12)',  bd: 'rgba(52,199,89,0.32)' },
    'Phase 3':      { fg: '#2997ff', bg: 'rgba(41,151,255,0.12)', bd: 'rgba(41,151,255,0.32)' },
    'Phase 2':      { fg: '#5ac8fa', bg: 'rgba(90,200,250,0.12)', bd: 'rgba(90,200,250,0.32)' },
    'Phase 1':      { fg: '#ffd60a', bg: 'rgba(255,214,10,0.12)', bd: 'rgba(255,214,10,0.30)' },
    'Preclinical':  { fg: '#c9a3ff', bg: 'rgba(191,90,242,0.12)', bd: 'rgba(191,90,242,0.30)' },
  };

  const PhaseBadge = ({ phase, small }) => {
    const c = PHASE_COLOR[phase] || PHASE_COLOR['Preclinical'];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
        padding: small ? '2px 8px' : '3px 10px', borderRadius: 980,
        fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: c.fg, background: c.bg, border: `1px solid ${c.bd}`,
      }}>{phase}</span>
    );
  };

  /* ─── Reconstitution Calculator ──────────────────────────────────────── */
  // Shared calculator body (used both in the modal and as a standalone tab).
  const CalcBody = () => {
    const [mg, setMg]         = useState('5');     // peptide in vial (mg)
    const [water, setWater]   = useState('2');     // BAC water (mL)
    const [dose, setDose]     = useState('250');   // target dose (value)
    const [doseUnit, setUnit] = useState('mcg');   // 'mcg' | 'mg'

    const mgN = parseFloat(mg), waterN = parseFloat(water), doseRaw = parseFloat(dose);
    const doseMcg = doseUnit === 'mg' ? doseRaw * 1000 : doseRaw;   // normalize to mcg
    const valid = mgN > 0 && waterN > 0 && doseMcg > 0;
    const concMcgPerMl = valid ? (mgN * 1000) / waterN : 0;       // mcg per mL
    const drawMl       = valid ? doseMcg / concMcgPerMl : 0;       // mL to draw
    const units        = valid ? drawMl * 100 : 0;               // U-100 syringe units
    const dosesPerVial = valid ? (mgN * 1000) / doseMcg : 0;

    const Row = ({ label, value }) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>{value}</span>
      </div>
    );

    const fieldLabel = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };

    return (
      <React.Fragment>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginBottom: 20 }}>
          Enter your vial size, the bacteriostatic water you'll add, and your target dose to get the exact volume and U-100 syringe units to draw.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <label style={{ display: 'block' }}>
            <span style={fieldLabel}>Peptide in vial</span>
            <div style={{ position: 'relative' }}>
              <input className="field-input" type="number" inputMode="decimal" value={mg}
                onChange={e => setMg(e.target.value)} style={{ paddingRight: 38 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>mg</span>
            </div>
          </label>
          <label style={{ display: 'block' }}>
            <span style={fieldLabel}>BAC water</span>
            <div style={{ position: 'relative' }}>
              <input className="field-input" type="number" inputMode="decimal" value={water}
                onChange={e => setWater(e.target.value)} style={{ paddingRight: 38 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>mL</span>
            </div>
          </label>
        </div>
        {/* Target dose with mcg/mg toggle */}
        <div style={{ marginBottom: 22 }}>
          <span style={fieldLabel}>Target dose</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="field-input" type="number" inputMode="decimal" value={dose}
              onChange={e => setDose(e.target.value)} style={{ flex: 1 }} />
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
              {['mcg', 'mg'].map(u => (
                <button key={u} type="button" onClick={() => setUnit(u)} style={{
                  fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  padding: '0 16px', border: 'none', minWidth: 52,
                  background: doseUnit === u ? '#0066cc' : 'transparent',
                  color: doseUnit === u ? '#fff' : 'rgba(255,255,255,0.55)',
                }}>{u}</button>
              ))}
            </div>
          </div>
          {doseUnit === 'mg' && valid && (
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>= {doseMcg.toLocaleString()} mcg</div>
          )}
        </div>
        {valid ? (
          <div style={{ background: 'rgba(41,151,255,0.06)', border: '1px solid rgba(41,151,255,0.22)', borderRadius: 14, padding: '8px 18px 14px' }}>
            <Row label="Concentration" value={`${concMcgPerMl.toLocaleString(undefined,{maximumFractionDigits:0})} mcg/mL (${(concMcgPerMl/1000).toLocaleString(undefined,{maximumFractionDigits:2})} mg/mL)`} />
            <Row label="Volume to draw" value={`${drawMl.toFixed(3)} mL`} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0 4px' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Draw to</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#2997ff' }}>{units.toFixed(1)} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>units</span></span>
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>on a U-100 insulin syringe</div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>≈ {Math.floor(dosesPerVial)} doses per vial</div>
            {units < 5 && <div style={{ marginTop: 10, fontSize: 12, color: '#ffd60a' }}>⚠ Draw volume is very small — consider using more BAC water for measurement accuracy.</div>}
          </div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: 20 }}>Enter all three values to calculate.</div>
        )}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 18, lineHeight: 1.5 }}>
          On a U-100 syringe, 100 units = 1 mL. This tool is a measurement aid for educational purposes only and is not dosing advice.
        </p>
      </React.Fragment>
    );
  };

  // Modal wrapper (opened from the Peptide Library "Reconstitution Calculator" button)
  const Calculator = ({ onClose }) => (
    <Modal onClose={onClose} title="Reconstitution Calculator" maxWidth={520}><CalcBody /></Modal>
  );

  // Standalone panel for the dedicated Client-Portal tab
  window.ReconstitutionCalculator = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', color: '#f5f5f7' }}>Reconstitution Calculator</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 22 }}>Work out exactly how much to draw after mixing your peptide with bacteriostatic water.</p>
      <div className="card" style={{ maxWidth: 560, padding: 28 }}><CalcBody /></div>
    </div>
  );

  /* ─── Compare tool ───────────────────────────────────────────────────── */
  const Compare = ({ initial, onClose }) => {
    const [a, setA] = useState(initial || (DATA[0] && DATA[0].slug) || '');
    const [b, setB] = useState((DATA[1] && DATA[1].slug) || '');
    const pa = DATA.find(p => p.slug === a);
    const pb = DATA.find(p => p.slug === b);

    const options = useMemo(() => DATA.slice().sort((x, y) => x.name.localeCompare(y.name)), []);
    const Picker = ({ value, set }) => (
      <select className="field-input" value={value} onChange={e => set(e.target.value)}>
        {options.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
      </select>
    );

    const fields = [
      ['Category',        p => catLabel(p.category)],
      ['Clinical phase',  p => p.phase, true],
      ['Overview',        p => p.overview],
      ['Mechanism',       p => p.mechanism || '—'],
      ['Typical dose',    p => p.dosing ? p.dosing.dose : '—'],
      ['Frequency',       p => p.dosing ? p.dosing.frequency : '—'],
      ['Route',           p => p.dosing ? p.dosing.route : '—'],
      ['Side effects',    p => (p.sideEffects && p.sideEffects.join(', ')) || '—'],
    ];

    return (
      <Modal onClose={onClose} title="Compare Peptides" maxWidth={760}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <Picker value={a} set={setA} />
          <Picker value={b} set={setB} />
        </div>
        {pa && pb && (
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            {fields.map(([label, fn, isPhase], i) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ gridColumn: '1 / -1', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', padding: '12px 16px 4px' }}>{label}</div>
                {[pa, pb].map((p, idx) => (
                  <div key={idx} style={{ padding: '0 16px 14px', fontSize: 13.5, color: '#e8e8ea', lineHeight: 1.5, borderLeft: idx ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    {isPhase ? <PhaseBadge phase={fn(p)} small /> : fn(p)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  };

  /* ─── Detail panel ───────────────────────────────────────────────────── */
  const Section = ({ title, children }) => (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{title}</h3>
      {children}
    </div>
  );
  const Bullets = ({ items, color }) => (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((t, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#e8e8ea', lineHeight: 1.5 }}>
          <span style={{ color: color || '#2997ff', flexShrink: 0, marginTop: 1 }}>•</span><span>{t}</span>
        </li>
      ))}
    </ul>
  );

  const Detail = ({ peptide, onClose, onCompare }) => {
    const p = peptide;
    const d = p.dosing;
    const dl = d && [['Dose', d.dose], ['Frequency', d.frequency], ['Route', d.route], ['Timing', d.timing], ['With food', d.food], ['Duration', d.duration]].filter(x => x[1]);
    return (
      <Modal onClose={onClose} maxWidth={680}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7' }}>{p.name}</h2>
            {p.aka && p.aka.length > 0 && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Also known as: {p.aka.join(', ')}</p>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <span className="tag" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{catLabel(p.category)}</span>
              <PhaseBadge phase={p.phase} />
            </div>
          </div>
          <button onClick={() => onCompare(p.slug)} className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>Compare</button>
        </div>

        {p.sequence && (
          <div style={{ marginTop: 18, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, letterSpacing: '0.05em', color: '#5ac8fa', background: 'rgba(90,200,250,0.07)', border: '1px solid rgba(90,200,250,0.18)', borderRadius: 8, padding: '8px 12px', wordBreak: 'break-all' }}>{p.sequence}</div>
        )}

        <Section title="Clinical Status">
          <p style={{ fontSize: 14, color: '#e8e8ea', lineHeight: 1.6 }}>{p.status}</p>
        </Section>

        <Section title="Overview">
          <p style={{ fontSize: 14.5, color: '#e8e8ea', lineHeight: 1.6 }}>{p.overview}</p>
        </Section>

        {p.mechanism && (
          <Section title="Mechanism of Action">
            <p style={{ fontSize: 14, color: '#e8e8ea', lineHeight: 1.6 }}>{p.mechanism}</p>
          </Section>
        )}

        {p.benefits && p.benefits.length > 0 && (
          <Section title="Reported Effects (Research)"><Bullets items={p.benefits} color="#7be39a" /></Section>
        )}

        {d && (
          <Section title="Dosing Notes (from literature)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              {dl.map(([k, v]) => (
                <div key={k} style={{ background: '#161618', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: '#f5f5f7', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {d.range && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Typical range: {d.range}</div>}
            {d.notes && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6, lineHeight: 1.55 }}>{d.notes}</div>}
          </Section>
        )}

        {p.sideEffects && p.sideEffects.length > 0 && (
          <Section title="Possible Side Effects"><Bullets items={p.sideEffects} color="#ffd60a" /></Section>
        )}

        {p.warnings && p.warnings.length > 0 && (
          <Section title="Contraindications & Warnings"><Bullets items={p.warnings} color="#ff6b6b" /></Section>
        )}

        {!p.hasDetail && (
          <div style={{ marginTop: 22, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
            A full dosing & mechanism monograph for this compound is being added. Ask your specialist for protocol guidance.
          </div>
        )}

        <div style={{ marginTop: 26, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.55 }}>
          For educational purposes only — not medical advice. Dosing reflects research literature and community reports, not a prescription. Always consult your specialist before starting any peptide.
        </div>
      </Modal>
    );
  };

  /* ─── Modal shell ────────────────────────────────────────────────────── */
  const Modal = ({ children, onClose, title, maxWidth = 600 }) => {
    useEffect(() => {
      const onKey = e => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, []);
    return (
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: '40px 20px', overflowY: 'auto',
      }}>
        <div onClick={e => e.stopPropagation()} className="fade-in" style={{
          width: '100%', maxWidth, background: '#141416', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 22, padding: 32, position: 'relative',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: title ? 22 : 0 }}>
            {title ? <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f7' }}>{title}</h2> : <span />}
            <button onClick={onClose} aria-label="Close" style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  /* ─── Peptide card ───────────────────────────────────────────────────── */
  const Card = ({ p, onOpen }) => {
    const [hover, setHover] = useState(false);
    return (
      <button onClick={() => onOpen(p)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
          background: 'linear-gradient(180deg, #1a1a1c 0%, #141416 100%)',
          border: `1px solid ${hover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
          transition: 'border-color 0.14s, transform 0.14s', transform: hover ? 'translateY(-2px)' : 'none',
        }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>{p.name}</span>
          <PhaseBadge phase={p.phase} small />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>{catLabel(p.category)}</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, flex: 1 }}>{p.overview}</span>
      </button>
    );
  };

  /* ─── Main library view ──────────────────────────────────────────────── */
  const PeptideDatabase = () => {
    const [query, setQuery]   = useState('');
    const [cat, setCat]       = useState('all');
    const [phase, setPhase]   = useState('all');
    const [open, setOpen]     = useState(null);   // peptide detail
    const [compare, setCompare] = useState(null); // slug or true
    const [calc, setCalc]     = useState(false);
    const [showDisc, setShowDisc] = useState(() => {
      try { return localStorage.getItem('pfb_peptide_disclaimer') !== '1'; } catch { return true; }
    });
    const dismissDisc = () => { try { localStorage.setItem('pfb_peptide_disclaimer', '1'); } catch {} setShowDisc(false); };

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return DATA.filter(p => {
        if (cat !== 'all' && p.category !== cat) return false;
        if (phase !== 'all' && p.phase !== phase) return false;
        if (q) {
          const hay = (p.name + ' ' + (p.aka || []).join(' ') + ' ' + p.overview).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }, [query, cat, phase]);

    const catCounts = useMemo(() => {
      const m = {}; DATA.forEach(p => { m[p.category] = (m[p.category] || 0) + 1; }); return m;
    }, []);

    return (
      <div className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', color: '#f5f5f7' }}>Peptide Library</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{DATA.length} compounds across {CATS.length} categories — research-backed reference.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '9px 16px' }} onClick={() => setCompare(true)}>Compare</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '9px 16px' }} onClick={() => setCalc(true)}>Reconstitution Calculator</button>
          </div>
        </div>

        {/* Disclaimer */}
        {showDisc && (
          <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(255,214,10,0.06)', border: '1px solid rgba(255,214,10,0.25)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, lineHeight: 1.2 }}>⚠</span>
            <div style={{ flex: 1, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              This library is for <strong style={{ color: '#f5f5f7' }}>educational and research purposes only</strong> and is not medical advice. Dosing reflects published research and community reports — not a prescription. Always consult your specialist before using any peptide.
            </div>
            <button onClick={dismissDisc} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', flexShrink: 0 }}>Dismiss</button>
          </div>
        )}

        {/* Search */}
        <div style={{ marginTop: 22, position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input className="field-input" placeholder="Search peptides — name, alias, or use…" value={query}
            onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>

        {/* Phase filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {['all', ...PHASES].map(ph => {
            const active = phase === ph;
            return (
              <button key={ph} onClick={() => setPhase(ph)} style={{
                fontFamily: 'inherit', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                padding: '6px 12px', borderRadius: 980,
                border: `1px solid ${active ? 'rgba(41,151,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: active ? 'rgba(41,151,255,0.14)' : 'transparent',
                color: active ? '#2997ff' : 'rgba(255,255,255,0.6)',
              }}>{ph === 'all' ? 'All phases' : ph}</button>
            );
          })}
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <Chip active={cat === 'all'} onClick={() => setCat('all')} label={`All (${DATA.length})`} />
          {CATS.map(c => <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={`${c.label} (${catCounts[c.key] || 0})`} />)}
        </div>

        {/* Grid */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {filtered.map(p => <Card key={p.slug} p={p} onOpen={setOpen} />)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No peptides match your filters.</div>
        )}

        {open && <Detail peptide={open} onClose={() => setOpen(null)} onCompare={(slug) => { setOpen(null); setCompare(slug); }} />}
        {compare && <Compare initial={typeof compare === 'string' ? compare : null} onClose={() => setCompare(null)} />}
        {calc && <Calculator onClose={() => setCalc(false)} />}
      </div>
    );
  };

  const Chip = ({ active, onClick, label }) => (
    <button onClick={onClick} style={{
      fontFamily: 'inherit', cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 600 : 500,
      padding: '7px 13px', borderRadius: 10,
      border: `1px solid ${active ? 'rgba(255,255,255,0.0)' : 'rgba(255,255,255,0.08)'}`,
      background: active ? '#0066cc' : 'rgba(255,255,255,0.04)',
      color: active ? '#fff' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', transition: 'all 0.12s',
    }}>{label}</button>
  );

  window.PeptideDatabase = PeptideDatabase;
})();
