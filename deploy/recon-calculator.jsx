/* PeakFormBio — Reconstitution Calculator (Client Portal tab), beginner flow.
   Step 1 peptide → Step 2 vial size → recommended BAC water, dose and syringe (all changeable).
   Recommendations come from recon-presets.js, overridden by Admin → Client Tools → Calculator Guide.
   Deep-link: #calc=<preset id>. */
(function () {
  const { useState, useMemo, useEffect } = React;
  const rcBlue = '#2997ff', rcAmber = '#ff9f0a', rcGreen = '#30d158';
  const rcLabel = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 };
  const fmt = (n, d = 2) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
  const baseName = (n) => n.replace(/\s*—.*$/, '').trim();
  const SYRINGES = [[0.3, '0.3 mL', '30 units'], [0.5, '0.5 mL', '50 units'], [1, '1 mL', '100 units']];

  const Chip = ({ active, onClick, children, sub }) => (
    <button type="button" onClick={onClick} style={{
      fontFamily: 'inherit', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '10px 14px', borderRadius: 10, minHeight: 44, minWidth: 64,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      border: `1px solid ${active ? 'rgba(41,151,255,0.7)' : 'rgba(255,255,255,0.1)'}`,
      background: active ? 'rgba(41,151,255,0.16)' : 'rgba(255,255,255,0.03)', color: active ? '#f5f5f7' : 'rgba(255,255,255,0.65)',
    }}><span style={{ whiteSpace: 'nowrap' }}>{children}</span>{sub && <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{sub}</span>}</button>
  );

  const Step = ({ n, title, done, children, right }) => (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: children ? 16 : 0 }}>
        <span style={{ width: 28, height: 28, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
          background: done ? 'rgba(48,209,88,0.16)' : 'rgba(41,151,255,0.16)', color: done ? rcGreen : rcBlue }}>{done ? '✓' : n}</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', flex: 1 }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );

  const Recommended = ({ label, value, changed, onReset }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', background: changed ? 'rgba(255,159,10,0.08)' : 'rgba(48,209,88,0.08)',
      border: `1px solid ${changed ? 'rgba(255,159,10,0.3)' : 'rgba(48,209,88,0.28)'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
      <span style={{ fontSize: 13.5, color: changed ? rcAmber : rcGreen, fontWeight: 600 }}>{changed ? 'Changed from recommended' : 'Recommended'}: <span style={{ color: '#f5f5f7' }}>{value}</span></span>
      {changed && <button type="button" onClick={onReset} style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: rcBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>Use recommended</button>}
    </div>
  );

  const NumInput = ({ value, onChange, suffix }) => (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <input className="field-input" type="number" inputMode="decimal" min="0" value={value} onChange={e => onChange(e.target.value)} style={{ paddingRight: 48 }} />
      {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{suffix}</span>}
    </div>
  );

  const Syringe = ({ capacity, units }) => {
    const W = 560, H = 118, x0 = 44, x1 = 440, top = 44, bh = 36;
    const fill = Math.max(0, Math.min(units, capacity));
    const fx = x0 + (x1 - x0) * (fill / capacity);
    const step = capacity <= 50 ? 1 : 2, major = capacity <= 50 ? 5 : 10;
    const ticks = [];
    for (let u = 0; u <= capacity; u += step) {
      const x = x0 + (x1 - x0) * (u / capacity), isMajor = u % major === 0;
      ticks.push(<line key={u} x1={x} x2={x} y1={top} y2={top + (isMajor ? 15 : 8)} stroke="rgba(255,255,255,0.5)" strokeWidth={isMajor ? 1.3 : 0.8} />);
      if (isMajor) ticks.push(<text key={'t' + u} x={x} y={top + bh + 17} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.5)">{u}</text>);
    }
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label={`Syringe filled to ${fmt(units, 1)} units`}>
        <line x1="6" x2={x0} y1={top + bh / 2} y2={top + bh / 2} stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <rect x={x0} y={top} width={Math.max(0, fx - x0)} height={bh} fill="rgba(41,151,255,0.6)" />
        <rect x={x0} y={top} width={x1 - x0} height={bh} rx="3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        {ticks}
        <rect x={fx - 3} y={top - 5} width="6" height={bh + 10} rx="1.5" fill="#f5f5f7" />
        <polygon points={`${fx},${top - 8} ${fx - 7},${top - 20} ${fx + 7},${top - 20}`} fill={rcBlue} />
        <text x={Math.min(Math.max(fx, 60), x1)} y={top - 24} textAnchor="middle" fontSize="13" fontWeight="700" fill={rcBlue}>{fmt(units, 1)}</text>
        <line x1={fx} x2={x1 + 84} y1={top + bh / 2} y2={top + bh / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <rect x={x1 + 84} y={top - 7} width="9" height={bh + 14} rx="2" fill="rgba(255,255,255,0.35)" />
      </svg>
    );
  };

  const RCalc = () => {
    const [presets, setPresets] = useState(window.RECON_PRESETS || []);
    useEffect(() => { if (window.loadReconPresets) window.loadReconPresets().then(l => l && setPresets([...l])); }, []);

    const peptides = useMemo(() => {
      const g = {};
      presets.forEach(p => { const b = baseName(p.name); (g[b] = g[b] || []).push(p); });
      Object.values(g).forEach(a => a.sort((x, y) => x.vial - y.vial));
      return g;
    }, [presets]);
    const names = useMemo(() => Object.keys(peptides).sort((a, b) => a.localeCompare(b)), [peptides]);

    const hashId = (window.location.hash.match(/calc=([^&]+)/) || [])[1];
    const [pep, setPep] = useState('');
    const [presetId, setPresetId] = useState('');
    const [bac, setBac] = useState('');
    const [dose, setDose] = useState('');
    const [doseUnit, setDoseUnit] = useState('mcg');
    const [syringe, setSyringe] = useState(null); // null = recommended
    const [editBac, setEditBac] = useState(false);
    const [editDose, setEditDose] = useState(false);

    const preset = presets.find(p => p.id === presetId);
    const rec = preset ? window.reconDoseOf(preset) : null;

    const choose = (p) => {
      setPresetId(p ? p.id : ''); setSyringe(null); setEditBac(false); setEditDose(false);
      if (!p) return;
      const d = window.reconDoseOf(p);
      setBac(String(p.bac)); setDose(String(d.amt)); setDoseUnit(d.unit);
      try { window.history.replaceState({}, '', window.location.pathname + window.location.search + '#calc=' + p.id); } catch (e) {}
    };
    const choosePeptide = (name) => {
      setPep(name);
      const sizes = peptides[name] || [];
      choose(sizes.length === 1 ? sizes[0] : null);
    };
    useEffect(() => {
      if (!hashId || presetId) return;
      const p = presets.find(x => x.id === decodeURIComponent(hashId));
      if (p) { setPep(baseName(p.name)); choose(p); }
    }, [presets]);

    const isIU = preset && preset.vialUnit === 'IU';
    const bacN = parseFloat(bac), doseN = parseFloat(dose);
    const units = preset ? window.reconUnitsFor(preset.vial, preset.vialUnit, bacN, doseN, isIU ? 'IU' : doseUnit) : 0;
    const recSyringe = window.reconSyringeFor ? window.reconSyringeFor(units, preset && preset.syringe) : 1;
    const syr = syringe || recSyringe;
    const capacity = Math.round(syr * 100);
    const over = units > capacity;
    const ready = preset && bacN > 0 && doseN > 0;
    const doseInVial = isIU ? doseN : (doseUnit === 'mg' ? doseN : doseN / 1000);
    const doses = ready ? preset.vial / doseInVial : 0;
    const conc = ready ? preset.vial / bacN : 0;
    const bacChanged = preset && parseFloat(bac) !== preset.bac;
    const doseChanged = rec && (parseFloat(dose) !== rec.amt || (!isIU && doseUnit !== rec.unit));
    const doseLabel = (a, u) => `${fmt(a, 3)} ${u}`;

    return (
      <div className="fade-in" style={{ maxWidth: 760 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', color: '#f5f5f7' }}>Reconstitution Calculator</h2>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.55)', marginTop: 4, marginBottom: 22, lineHeight: 1.5 }}>Pick your peptide and vial size. We'll tell you how much BAC water to add, which syringe to use and exactly where to draw to.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Step n={1} title="Choose your peptide" done={!!pep}>
            <select className="field-input" value={pep} onChange={e => choosePeptide(e.target.value)}>
              <option value="">Select a peptide…</option>
              {names.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Step>

          {pep && (
            <Step n={2} title="Choose your vial size" done={!!preset}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(peptides[pep] || []).map(p => <Chip key={p.id} active={presetId === p.id} onClick={() => choose(p)}>{fmt(p.vial, 0)} {p.vialUnit}</Chip>)}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 10 }}>The amount is printed on your vial label.</div>
            </Step>
          )}

          {preset && (
            <Step n={3} title="Add bacteriostatic (BAC) water" done={bacN > 0}
              right={!editBac && <button type="button" onClick={() => setEditBac(true)} style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: rcBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>Change</button>}>
              <Recommended value={`${fmt(preset.bac)} mL`} changed={bacChanged} onReset={() => { setBac(String(preset.bac)); setEditBac(false); }} />
              {editBac ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[1, 2, 2.5, 3, 5].map(v => <Chip key={v} active={bacN === v} onClick={() => setBac(String(v))}>{v} mL</Chip>)}
                  </div>
                  <NumInput value={bac} onChange={setBac} suffix="mL" />
                </div>
              ) : (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>Add <strong style={{ color: '#f5f5f7' }}>{fmt(bacN)} mL</strong> of BAC water to your {fmt(preset.vial, 0)} {preset.vialUnit} vial.</div>
              )}
            </Step>
          )}

          {preset && bacN > 0 && (
            <Step n={4} title="Your dose" done={doseN > 0}
              right={!editDose && <button type="button" onClick={() => setEditDose(true)} style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: rcBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>Change</button>}>
              <Recommended value={doseLabel(rec.amt, rec.unit)} changed={doseChanged} onReset={() => { setDose(String(rec.amt)); setDoseUnit(rec.unit); setEditDose(false); }} />
              {editDose ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <NumInput value={dose} onChange={setDose} suffix={isIU ? 'IU' : ''} />
                  {!isIU && (
                    <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
                      {['mcg', 'mg'].map(u => (
                        <button key={u} type="button" onClick={() => setDoseUnit(u)} style={{ fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '0 16px', minHeight: 44, border: 'none',
                          background: doseUnit === u ? '#0066cc' : 'transparent', color: doseUnit === u ? '#fff' : 'rgba(255,255,255,0.55)' }}>{u}</button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                  <strong style={{ color: '#f5f5f7' }}>{doseLabel(doseN, isIU ? 'IU' : doseUnit)}</strong> per injection
                  {(preset.frequency || preset.cycle) && <span>{preset.frequency ? ` · ${preset.frequency}` : ''}{preset.cycle ? ` · ${preset.cycle}` : ''}</span>}
                </div>
              )}
            </Step>
          )}

          {ready && (
            <div className="card" style={{ padding: 22, border: '1px solid rgba(41,151,255,0.3)' }}>
              <span style={rcLabel}>Syringe to use</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                {SYRINGES.map(([v, l, sub]) => <Chip key={v} active={syr === v} onClick={() => setSyringe(v === recSyringe ? null : v)} sub={v === recSyringe ? 'Recommended' : sub}>{l}</Chip>)}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '18px 0' }}></div>
              <span style={rcLabel}>Draw to</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', color: over ? rcAmber : rcBlue, lineHeight: 1 }}>{fmt(units, 1)}</span>
                <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)' }}>units</span>
              </div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>{fmt(units / 100, 3)} mL on your {syr} mL syringe</div>
              <Syringe capacity={capacity} units={units} />
              {over && <div style={{ marginTop: 12, fontSize: 13.5, color: rcAmber, lineHeight: 1.5 }}>This dose won't fit in a {syr} mL syringe. Pick the recommended size above.</div>}
              {!over && units < 3 && <div style={{ marginTop: 12, fontSize: 13.5, color: '#ffd60a', lineHeight: 1.5 }}>This is a very small amount to measure. Adding more BAC water makes it easier.</div>}

              <div style={{ marginTop: 22 }}>
                <span style={rcLabel}>Step by step</span>
                <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                  <li>Wipe the tops of the peptide vial and the BAC water with an alcohol wipe.</li>
                  <li>Draw <strong style={{ color: '#f5f5f7' }}>{fmt(bacN)} mL</strong> of BAC water{bacN > 1 ? ' (you may need to fill the syringe more than once)' : ''}.</li>
                  <li>Inject it slowly down the inside wall of the peptide vial.</li>
                  <li>Gently swirl until clear. Do not shake.</li>
                  <li>With your {syr} mL syringe, draw to the <strong style={{ color: '#f5f5f7' }}>{fmt(units, 1)} unit</strong> line.</li>
                  <li>Store the mixed vial in the refrigerator.</li>
                </ol>
              </div>

              <div style={{ marginTop: 22 }}>
                <span style={rcLabel}>Watch how it's done</span>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <iframe src="https://www.youtube.com/embed/6NWvdXJ0G4s?si=d0991Ib9N6x4E_PY&rel=0" title="How to reconstitute a peptide" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}></iframe>
                </div>
              </div>

              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  ['Strength after mixing', isIU ? `${fmt(conc, 1)} IU per mL` : `${fmt(conc, 2)} mg per mL`],
                  ['Doses in this vial', `about ${Math.floor(doses + 1e-9)}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>{l}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>On a U-100 insulin syringe, 100 units = 1 mL. This tool is a measurement aid for educational purposes only and is not dosing advice.</p>
        </div>
      </div>
    );
  };

  window.ReconstitutionCalculator = RCalc;
})();
