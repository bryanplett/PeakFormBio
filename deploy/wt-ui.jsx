// ─── Shared UI kit for the workout tracker ─────────────────────────────────────
// Icons, formatting helpers, demo-media placeholder, mini charts, chips, sheets.
// All components read accent + unit from WTCtx so Tweaks can recolour / switch units.

const WTCtx = React.createContext({ accent: '#2997ff', unit: 'lb', showRpe: true });
window.WTCtx = WTCtx;

// ── weight helpers ────────────────────────────────────────────────────────────
// Canonical storage is lb (matches weigh_ins.weight_lb). Display converts on the fly.
const LB_PER_KG = 2.2046226218;
function toDisplay(lb, unit) {
  if (lb == null || lb === '') return '';
  const v = unit === 'kg' ? lb / LB_PER_KG : lb;
  return Math.round(v * 10) / 10;
}
function fromDisplay(val, unit) {
  if (val === '' || val == null) return '';
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  return unit === 'kg' ? n * LB_PER_KG : n;
}
function fmtVol(lb, unit) {
  const v = unit === 'kg' ? lb / LB_PER_KG : lb;
  return Math.round(v).toLocaleString();
}
// Epley estimated 1-rep max (in lb), used for PR detection / strength score
function e1rm(weightLb, reps) {
  if (!weightLb || !reps) return 0;
  return weightLb * (1 + reps / 30);
}
window.WTUtil = { toDisplay, fromDisplay, fmtVol, e1rm, LB_PER_KG };

// ── icons (stroke, currentColor) ────────────────────────────────────────────────
const WTIcon = ({ name, size = 22, stroke = 1.8, color = 'currentColor', fill = 'none', style }) => {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <path d="M3 10.5L12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" {...p} />,
    dumbbell: <g {...p}><path d="M6.5 8v8M3.5 9.5v5M17.5 8v8M20.5 9.5v5M6.5 12h11" /></g>,
    history: <g {...p}><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5V9h4.5M12 7.5V12l3 2" /></g>,
    chart: <g {...p}><path d="M4 4v16h16" /><path d="M8 14l3-3 2.5 2.5L19 8" /></g>,
    user: <g {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></g>,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...p} />,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    timer: <g {...p}><circle cx="12" cy="13" r="8" /><path d="M12 13V9M9.5 2.5h5M19 6l1.5-1.5" /></g>,
    search: <g {...p}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></g>,
    chevron: <path d="M9 6l6 6-6 6" {...p} />,
    chevronDown: <path d="M6 9l6 6 6-6" {...p} />,
    back: <path d="M15 6l-6 6 6 6" {...p} />,
    flame: <path d="M12 3c3 3.5 5 6 5 9a5 5 0 0 1-10 0c0-1.2.5-2.3 1.2-3.2.3 1 1 1.7 1.8 1.7 1 0 1.3-1 .8-2.3C11 6.5 11.5 4.5 12 3z" {...p} />,
    trophy: <g {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10M17 5h3v1.5A3.5 3.5 0 0 1 17 10M9.5 14h5l.7 3.5h-6.4z" /><path d="M8 20.5h8" /></g>,
    play: <path d="M8 5.5v13l10-6.5-10-6.5z" fill={color} stroke="none" />,
    swap: <g {...p}><path d="M4 8h12l-3-3M20 16H8l3 3" /></g>,
    info: <g {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></g>,
    ellipsis: <g fill={color} stroke="none"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></g>,
    edit: <g {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></g>,
    calendar: <g {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></g>,
    target: <g {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.6" fill={color} /></g>,
    swatch: <g {...p}><rect x="4" y="4" width="16" height="16" rx="4" /></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }}>{paths[name]}</svg>;
};
window.WTIcon = WTIcon;

// ── exercise demo media (placeholder for real photo / GIF) ──────────────────────
// Diagonal-stripe slot with a play glyph + monospace label. A coach drops the real
// how-to clip in later; the slot is keyed by exercise id so it reads as intentional.
const WTDemo = ({ ex, height = 200, radius = 16, showLabel = true }) => {
  const { accent } = React.useContext(WTCtx);
  const hue = ex ? (ex.id.charCodeAt(0) * 7 + ex.id.length * 13) % 360 : 210;
  return (
    <div style={{
      position: 'relative', height, borderRadius: radius, overflow: 'hidden',
      background: `linear-gradient(135deg, hsl(${hue} 18% 16%), hsl(${(hue + 40) % 360} 16% 11%))`,
      border: '1px solid rgba(255,255,255,0.07)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* hatch */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 11px)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <WTIcon name="play" size={24} color="#fff" style={{ marginLeft: 3 }} />
        </div>
      </div>
      {showLabel && (
        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10,
            letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            demo · {ex ? ex.name : 'exercise'}
          </span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            {ex ? ex.equip : ''}
          </span>
        </div>
      )}
    </div>
  );
};
window.WTDemo = WTDemo;

// Small square thumbnail used in lists
const WTThumb = ({ ex, size = 46, radius = 11 }) => {
  const hue = ex ? (ex.id.charCodeAt(0) * 7 + ex.id.length * 13) % 360 : 210;
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, position: 'relative',
      overflow: 'hidden', background: `linear-gradient(135deg, hsl(${hue} 20% 20%), hsl(${(hue + 40) % 360} 18% 13%))`,
      border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 8px)' }} />
      <WTIcon name="play" size={15} color="rgba(255,255,255,0.6)" style={{ marginLeft: 2 }} />
    </div>
  );
};
window.WTThumb = WTThumb;

// ── chips & segmented control ───────────────────────────────────────────────────
const WTChip = ({ active, children, onClick, accent }) => {
  const acc = accent || '#2997ff';
  return (
    <button onClick={onClick} type="button" style={{
      flexShrink: 0, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all .12s',
      background: active ? acc : 'rgba(255,255,255,0.06)',
      color: active ? '#fff' : 'rgba(255,255,255,0.65)',
      border: `1px solid ${active ? acc : 'rgba(255,255,255,0.09)'}`,
    }}>{children}</button>
  );
};
window.WTChip = WTChip;

const WTSeg = ({ options, value, onChange, accent }) => {
  const acc = accent || '#2997ff';
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, gap: 3 }}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const on = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} type="button" style={{
            flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all .12s',
            background: on ? acc : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,0.6)',
          }}>{label}</button>
        );
      })}
    </div>
  );
};
window.WTSeg = WTSeg;

// ── mini progress charts ────────────────────────────────────────────────────────
// Line chart for e1RM / weight over time
const WTLineChart = ({ data, accent, height = 110, unit = 'lb' }) => {
  const acc = accent || '#2997ff';
  if (!data || data.length < 2) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Log 2+ sessions to see your trend.</div>;
  }
  const W = 300, H = height, pad = 10;
  const vals = data.map(d => d.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = i => pad + (i / (data.length - 1)) * (W - pad * 2);
  const y = v => pad + (1 - (v - min) / span) * (H - pad * 2 - 6);
  const pts = data.map((d, i) => [x(i), y(d.v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${x(data.length - 1)} ${H - pad} L${x(0)} ${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="wtla" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={acc} stopOpacity="0.28" />
          <stop offset="1" stopColor={acc} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wtla)" />
      <path d={line} fill="none" stroke={acc} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.6}
        fill={i === pts.length - 1 ? acc : '#161617'} stroke={acc} strokeWidth="1.6" />)}
    </svg>
  );
};
window.WTLineChart = WTLineChart;

// Weekly volume bars
const WTBars = ({ data, accent, height = 90 }) => {
  const acc = accent || '#2997ff';
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: `${Math.max(4, (d.v / max) * 100)}%`, borderRadius: 6,
              background: d.on ? acc : 'rgba(255,255,255,0.10)', transition: 'height .3s' }} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};
window.WTBars = WTBars;

// ── bottom sheet ─────────────────────────────────────────────────────────────────
const WTSheet = ({ open, onClose, title, children, maxHeight = '82%' }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 400, display: 'flex',
      alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      animation: 'wtFade .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight, background: '#161617', borderTopLeftRadius: 22, borderTopRightRadius: 22,
        borderTop: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 -12px 40px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', animation: 'wtSlideUp .26s cubic-bezier(.2,.8,.2,1)',
        paddingBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 38, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
        </div>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px 6px' }}>
            <h3 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>
              <WTIcon name="x" size={17} />
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', padding: '6px 18px 0', WebkitOverflowScrolling: 'touch' }}>{children}</div>
      </div>
    </div>
  );
};
window.WTSheet = WTSheet;

// ── small stat block ─────────────────────────────────────────────────────────────
const WTStat = ({ value, label, sub, color }) => (
  <div style={{ flex: 1, textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: color || '#f5f5f7',
      fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>}
  </div>
);
window.WTStat = WTStat;

// muscle summary chips (primary / secondary)
const WTMuscleChips = ({ ex, accent }) => {
  const acc = accent || '#2997ff';
  const L = window.MUSCLE_LABELS || {};
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(ex.primary || []).map(m => (
        <span key={m} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
          color: acc, background: acc + '22', border: `1px solid ${acc}44` }}>{L[m] || m}</span>
      ))}
      {(ex.secondary || []).map(m => (
        <span key={m} style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 999,
          color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)' }}>{L[m] || m}</span>
      ))}
    </div>
  );
};
window.WTMuscleChips = WTMuscleChips;
