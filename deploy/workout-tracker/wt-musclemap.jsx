// ─── Muscle Map ───────────────────────────────────────────────────────────────
// Stylized anterior / posterior avatar. Muscle regions are simple rounded shapes
// keyed to the normalized muscle names used in exercise-db.js. Primary muscles
// render in the accent colour, secondary at reduced opacity, the rest neutral.
//
//   <MuscleMap primary={['chest']} secondary={['triceps','frontDelts']} accent="#2997ff" h={150} />

// Geometry — viewBox 120 × 240, figure centred on x = 60. Each piece is a muscle
// key (or 'base' for non-highlightable structure: head, neck, shins, feet).
const MM_FRONT = [
  { m: 'base', t: 'ellipse', cx: 60, cy: 19, rx: 11, ry: 12.5 },            // head
  { m: 'base', t: 'rect', x: 55, y: 30, w: 10, h: 8, rx: 4 },               // neck
  { m: 'traps', t: 'path', d: 'M48 40 Q60 35 72 40 L70 47 Q60 43 50 47 Z' },// upper traps (front)
  { m: 'frontDelts', t: 'ellipse', cx: 42, cy: 51, rx: 9.5, ry: 8.5 },
  { m: 'frontDelts', t: 'ellipse', cx: 78, cy: 51, rx: 9.5, ry: 8.5 },
  { m: 'chest', t: 'path', d: 'M50 48 Q59 49 59.5 50 L59.5 66 Q53 67 49 62 Q46 54 50 48 Z' },
  { m: 'chest', t: 'path', d: 'M70 48 Q61 49 60.5 50 L60.5 66 Q67 67 71 62 Q74 54 70 48 Z' },
  { m: 'biceps', t: 'rect', x: 30, y: 58, w: 9.5, h: 20, rx: 4.5 },
  { m: 'biceps', t: 'rect', x: 80.5, y: 58, w: 9.5, h: 20, rx: 4.5 },
  { m: 'forearms', t: 'rect', x: 27, y: 80, w: 9, h: 23, rx: 4 },
  { m: 'forearms', t: 'rect', x: 84, y: 80, w: 9, h: 23, rx: 4 },
  { m: 'abs', t: 'rect', x: 51, y: 69, w: 18, h: 33, rx: 5 },
  { m: 'obliques', t: 'rect', x: 44, y: 71, w: 6, h: 27, rx: 3 },
  { m: 'obliques', t: 'rect', x: 70, y: 71, w: 6, h: 27, rx: 3 },
  { m: 'quads', t: 'path', d: 'M47 106 Q53 105 58 107 L57 150 Q52 153 48 150 Q45 128 47 106 Z' },
  { m: 'quads', t: 'path', d: 'M73 106 Q67 105 62 107 L63 150 Q68 153 72 150 Q75 128 73 106 Z' },
  { m: 'base', t: 'rect', x: 48, y: 156, w: 10, h: 46, rx: 5 },             // shin L
  { m: 'base', t: 'rect', x: 62, y: 156, w: 10, h: 46, rx: 5 },            // shin R
  { m: 'base', t: 'ellipse', cx: 53, cy: 207, rx: 6, ry: 4 },              // foot L
  { m: 'base', t: 'ellipse', cx: 67, cy: 207, rx: 6, ry: 4 },             // foot R
];

const MM_BACK = [
  { m: 'base', t: 'ellipse', cx: 60, cy: 19, rx: 11, ry: 12.5 },           // head
  { m: 'base', t: 'rect', x: 55, y: 30, w: 10, h: 8, rx: 4 },              // neck
  { m: 'traps', t: 'path', d: 'M49 40 Q60 36 71 40 L68 60 Q60 56 52 60 Z' },
  { m: 'rearDelts', t: 'ellipse', cx: 42, cy: 51, rx: 9.5, ry: 8.5 },
  { m: 'rearDelts', t: 'ellipse', cx: 78, cy: 51, rx: 9.5, ry: 8.5 },
  { m: 'lats', t: 'path', d: 'M51 58 Q58 60 59.5 64 L59 92 Q52 90 48 80 Q46 66 51 58 Z' },
  { m: 'lats', t: 'path', d: 'M69 58 Q62 60 60.5 64 L61 92 Q68 90 72 80 Q74 66 69 58 Z' },
  { m: 'triceps', t: 'rect', x: 30, y: 58, w: 9.5, h: 21, rx: 4.5 },
  { m: 'triceps', t: 'rect', x: 80.5, y: 58, w: 9.5, h: 21, rx: 4.5 },
  { m: 'forearms', t: 'rect', x: 27, y: 81, w: 9, h: 23, rx: 4 },
  { m: 'forearms', t: 'rect', x: 84, y: 81, w: 9, h: 23, rx: 4 },
  { m: 'lowerBack', t: 'rect', x: 52, y: 92, w: 16, h: 16, rx: 4 },
  { m: 'glutes', t: 'path', d: 'M48 110 Q59 109 59.5 110 L59.5 128 Q53 131 49 126 Q46 117 48 110 Z' },
  { m: 'glutes', t: 'path', d: 'M72 110 Q61 109 60.5 110 L60.5 128 Q67 131 71 126 Q74 117 72 110 Z' },
  { m: 'hamstrings', t: 'path', d: 'M47 130 Q53 129 58 131 L57 158 Q52 160 48 158 Q45 144 47 130 Z' },
  { m: 'hamstrings', t: 'path', d: 'M73 130 Q67 129 62 131 L63 158 Q68 160 72 158 Q75 144 73 130 Z' },
  { m: 'calves', t: 'path', d: 'M48 164 Q53 163 58 165 L57 196 Q52 199 49 196 Q46 178 48 164 Z' },
  { m: 'calves', t: 'path', d: 'M72 164 Q67 163 62 165 L63 196 Q68 199 71 196 Q74 178 72 164 Z' },
  { m: 'base', t: 'ellipse', cx: 53, cy: 202, rx: 5.5, ry: 4 },           // heel L
  { m: 'base', t: 'ellipse', cx: 67, cy: 202, rx: 5.5, ry: 4 },          // heel R
];

function MM_piece(p, fill, i) {
  const common = { key: i, fill, stroke: 'rgba(0,0,0,0.25)', strokeWidth: 0.6 };
  if (p.t === 'ellipse') return <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} {...common} />;
  if (p.t === 'rect') return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} {...common} />;
  return <path d={p.d} {...common} />;
}

function MuscleFigure({ pieces, label, primary, secondary, accent }) {
  const base = 'rgba(255,255,255,0.10)';
  const fillFor = (m) => {
    if (m === 'base') return 'rgba(255,255,255,0.16)';
    if (primary.includes(m)) return accent;
    if (secondary.includes(m)) return accent + '66'; // ~40% alpha (hex accent must be #rrggbb)
    return base;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg viewBox="0 0 120 215" style={{ height: '100%', width: 'auto', display: 'block' }}>
        {pieces.map((p, i) => MM_piece(p, fillFor(p.m), i))}
      </svg>
      <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function MuscleMap({ primary = [], secondary = [], accent = '#2997ff', h = 160, views = 'both' }) {
  // accent must be a 6-digit hex for the +'66' alpha trick; fall back if not
  const acc = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#2997ff';
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 18, height: h }}>
      {(views === 'both' || views === 'front') &&
        <MuscleFigure pieces={MM_FRONT} label="Front" primary={primary} secondary={secondary} accent={acc} />}
      {(views === 'both' || views === 'back') &&
        <MuscleFigure pieces={MM_BACK} label="Back" primary={primary} secondary={secondary} accent={acc} />}
    </div>
  );
}

window.MuscleMap = MuscleMap;
