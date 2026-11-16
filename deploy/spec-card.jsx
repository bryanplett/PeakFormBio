// spec-card.jsx — PeakForm Bio product spec card (HTML/CSS rebuild of the Canva design)
// Renders the white "verified" spec card for one peptide. Everything on it scales
// with the card's width (CSS container units), so it fits any tile size.
//
//   <SpecCard spec={spec} strength="10 MG" />
//   spec: { name, mw, formula, cas, form?, tagline? }   (see peptide-specs.js)
//
// Artwork lives in assets/spec-card/ (extracted from the Canva export). Set
// window.SPEC_CARD_ASSET_BASE before this script loads to serve it elsewhere.
// Exports: window.SpecCard

(function () {
  const BASE = window.SPEC_CARD_ASSET_BASE || 'assets/spec-card/';
  const W = 746;                       // design width in px (card = 746 × 1075)
  const u = (px) => `${(px / W) * 100}cqw`;
  const BLUE = '#1D5FC4', NAVY = '#0B1F3A', INK = '#1A2B45', RULE = '#C9D3E0';
  const FONT = "'PFB Arimo', Arimo, Arial, Helvetica, sans-serif";
  const DISPLAY = "'PFB Fredoka', Fredoka, 'Arial Rounded MT Bold', sans-serif";

  // Load the two card fonts once.
  if (!document.getElementById('pfb-spec-card-fonts')) {
    const st = document.createElement('style');
    st.id = 'pfb-spec-card-fonts';
    st.textContent =
      `@font-face{font-family:'PFB Fredoka';font-weight:700;font-display:swap;src:url(${BASE}fonts/fredoka-latin-700-normal.woff2) format('woff2')}` +
      `@font-face{font-family:'PFB Arimo';font-weight:700;font-display:swap;src:url(${BASE}fonts/arimo-latin-700-normal.woff2) format('woff2')}`;
    document.head.appendChild(st);
  }

  // C62H98N16O22 → C₆₂H₉₈N₁₆O₂₂ (as <sub>); free text (e.g. "Glycoprotein") passes through.
  const Formula = ({ value }) => {
    const v = String(value || '');
    if (!/^([A-Z][a-z]?\d*)+$/.test(v)) return v || '—';
    return v.split(/(\d+)/).filter(Boolean).map((part, i) =>
      /^\d+$/.test(part)
        ? <sub key={i} style={{ fontSize: '0.68em', verticalAlign: '-0.28em', lineHeight: 0 }}>{part}</sub>
        : <React.Fragment key={i}>{part}</React.Fragment>);
  };

  // Shrink long names so they stay on one line inside ~690px of card width.
  const nameSize = (name) => {
    const n = String(name || '').length || 1;
    return Math.min(132, 690 / (n * 0.6));
  };

  const ROWS = [
    { key: 'form',    label: 'FORM',              icon: 'icon-vial.webp',     box: [52.9, 13.7, 68, 73] },
    { key: 'mw',      label: 'MOLECULAR WEIGHT',  icon: 'icon-scale.webp',    box: [56.4, 17.6, 61, 61] },
    { key: 'formula', label: 'MOLECULAR FORMULA', icon: 'icon-molecule.webp', box: [-28.6, 16.6, 168.9, 103] },
    { key: 'cas',     label: 'CAS NUMBER',        icon: 'icon-cas.webp',      box: [46.4, 4, 83, 83] },
  ];
  const ROW_TOPS = [460, 572, 684, 796];

  const abs = (l, t, w, h, extra) => ({ position: 'absolute', left: u(l), top: u(t), width: w == null ? undefined : u(w), height: h == null ? undefined : u(h), ...extra });

  const SpecCard = ({ spec, strength, style }) => {
    const d = window.PEPTIDE_SPEC_DEFAULTS || {};
    const s = spec || {};
    const values = { form: s.form || d.form || '—', mw: s.mw || '—', formula: s.formula, cas: s.cas || '—' };
    const name = s.name || '—';
    // First guess from length, then measure the rendered text and shrink to fit
    // (re-checked once the display font has loaded).
    const [fit, setFit] = React.useState(1);
    const nameRef = React.useRef(null);
    React.useLayoutEffect(() => {
      setFit(1);
      const el = nameRef.current;
      if (!el) return;
      const measure = () => {
        const box = el.parentElement.getBoundingClientRect().width;
        const text = el.getBoundingClientRect().width / (parseFloat(el.dataset.fit) || 1);
        if (box && text) setFit(Math.min(1, box / text));
      };
      measure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    }, [name]);
    const ns = nameSize(name) * fit;
    const footer = [['RESEARCH', 'USE ONLY'], ['NOT FOR', 'HUMAN', 'CONSUMPTION'], ['THIRD-PARTY', 'TESTED']];

    return (
      <div style={{ containerType: 'inline-size', width: '100%', ...style }}>
        <div role="img" aria-label={`${name} ${strength || ''} — molecular weight ${values.mw}, CAS ${values.cas}`}
          style={{
            position: 'relative', width: '100%', aspectRatio: '746 / 1075', overflow: 'hidden',
            background: '#fff', borderRadius: u(40), boxShadow: `inset 0 0 0 ${u(1.5)} #D5DEEA`,
            fontFamily: FONT, fontWeight: 700, color: INK, userSelect: 'none',
          }}>
          {/* water splash */}
          <img src={BASE + 'water-splash.webp'} alt="" draggable="false"
            style={abs(-202.9, 86, 1108.4, 1002.5, { maxWidth: 'none', pointerEvents: 'none', opacity: 0.62 })} />

          {/* header */}
          <img src={BASE + 'logo.webp'} alt="PeakForm Bio" draggable="false" style={abs(39.7, 12.3, 231.9, 132.9)} />
          <svg viewBox="0 0 34 40" style={abs(380, 40, 34, 40)}>
            <path d="M17 2 L32 8 V19 C32 29 25 35 17 38 C9 35 2 29 2 19 V8 Z" fill="#fff" stroke={BLUE} strokeWidth="2.5" />
            <path d="M10.5 20.5 L15.5 25.5 L24 15" fill="none" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={abs(428, 42, 1.5, 38, { background: '#A9B6C8' })} />
          <div style={abs(440, 44, 220, null, { fontSize: u(13), lineHeight: 1.3, color: NAVY, letterSpacing: '0.01em' })}>
            RESEARCH GRADE<br />QUALITY ASSURED
          </div>

          {/* peptide name */}
          <div style={abs(28, 236 - ns * 0.62, 690, null, {
            fontFamily: DISPLAY, fontSize: u(ns), lineHeight: 1, color: BLUE, textAlign: 'center',
            letterSpacing: '0.035em', whiteSpace: 'nowrap',
          })}><span ref={nameRef} data-fit={fit} style={{ display: 'inline-block' }}>{name}</span></div>
          <div style={abs(36, 313, 360, 2.5, { background: BLUE })} />

          {/* dose + tagline (a flex row, so a wide dose like "1000 MG" pushes the tagline over) */}
          <div style={abs(36, 344, 674, 84, { display: 'flex', alignItems: 'center' })}>
            <div style={{
              height: '100%', minWidth: u(200), padding: `0 ${u(16)}`, boxSizing: 'border-box', flex: 'none',
              border: `${u(5)} solid ${BLUE}`, borderRadius: u(14), background: 'rgba(255,255,255,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: BLUE, fontSize: u(strength && strength.length > 7 ? 42 : 54), lineHeight: 1, whiteSpace: 'nowrap',
            }}>{strength || '—'}</div>
            <div style={{ width: u(2), height: u(60), background: RULE, margin: `0 ${u(24)} 0 ${u(26)}`, flex: 'none' }} />
            <div style={{ maxWidth: u(300), fontSize: u(25), lineHeight: 1.35, color: BLUE }}>
              {s.tagline || d.tagline}
            </div>
          </div>

          {/* spec rows */}
          {ROWS.map((r, i) => {
            const top = ROW_TOPS[i];
            const [il, it, iw, ih] = r.box;
            return (
              <React.Fragment key={r.key}>
                <div style={abs(36, top, 674, 96, {
                  background: 'rgba(255,255,255,0.74)', borderRadius: u(14),
                  boxShadow: `inset 0 0 0 ${u(1.5)} #D9E1EC, 0 ${u(3)} 0 rgba(200,212,230,0.55)`,
                })} />
                <div style={abs(54, top + 14, 68, 68, { background: BLUE, borderRadius: u(12) })} />
                <img src={BASE + r.icon} alt="" draggable="false" style={abs(il, top + it, iw, ih, { pointerEvents: 'none' })} />
                <div style={abs(142, top + 22, 1.5, 52, { background: RULE })} />
                <div style={abs(166, top + 15, 530, null, { fontSize: u(26.5), lineHeight: 1.2, color: BLUE })}>{r.label}</div>
                <div style={abs(166, top + 51, 530, null, { fontSize: u(26), lineHeight: 1.25, color: INK, whiteSpace: 'nowrap' })}>
                  {r.key === 'formula' ? <Formula value={values.formula} /> : values[r.key]}
                </div>
              </React.Fragment>
            );
          })}

          {/* footer band */}
          <div style={abs(0, 938, 746, 137, {
            background: 'linear-gradient(90deg, rgba(22,72,140,0.86) 0%, rgba(30,100,175,0.80) 55%, rgba(44,128,206,0.74) 100%)',
          })} />
          {[248, 497].map(x => <div key={x} style={abs(x, 981, 2, 52, { background: 'rgba(255,255,255,0.55)' })} />)}
          {footer.map((lines, i) => (
            <div key={i} style={abs(i * 249, 938, 249, 137, {
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              color: '#fff', fontSize: u(26.5), lineHeight: 1.3,
            })}>
              <div>{lines.map((l, j) => <div key={j}>{l}</div>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  window.SpecCard = SpecCard;
})();
