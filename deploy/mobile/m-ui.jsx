/* m-ui.jsx — shared mobile UI primitives → window.MUI
   Simple iconographic SVGs + Sheet/Pill/Toast/Empty helpers. */
(function () {
const ICONS = {
  home:    'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  orders:  'M6 3.5h12v17l-2.2-1.4-2 1.4-1.8-1.4-1.8 1.4-2-1.4L6 20.5zM9 8h6M9 11.5h6M9 15h4',
  clients: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5M16 11.2a2.6 2.6 0 1 0-1.6-4.7M15.4 14.4c2.2.2 4.1 1.6 4.1 4.1',
  add:     'M12 5v14M5 12h14',
  inventory:'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.7 7.6 12 12l8.3-4.4M12 12v9',
  more:    'M5 7h14M5 12h14M5 17h14',
  grid:    'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  search:  'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  back:    'M15 5l-7 7 7 7',
  close:   'M6 6l12 12M18 6 6 18',
  check:   'M5 12.5 10 17.5 19 7',
  chevron: 'M9 5l7 7-7 7',
  share:   'M16 7a3 3 0 1 0-2.8-4M8 14a3 3 0 1 0 0-0.01M16 21a3 3 0 1 0-2.8-4M10.6 13 14 7.6M10.6 14.6 14 20',
  copy:    'M9 9h10v11H9zM5 15V4h10',
  phone:   'M6 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.7 2 2 0 0 1 6 3.5Z',
  mail:    'M3.5 6h17v12h-17zM4 7l8 6 8-6',
  edit:    'M15.5 5.5 18.5 8.5 8 19l-3.5 1 1-3.5zM14 7l3 3',
  scale:   'M5 8h14l-2.2 5.5a4.9 4.9 0 0 1-9.6 0zM12 8V5M9 5h6',
  dumbbell:'M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10',
  food:    'M5 3v8a2 2 0 0 0 4 0V3M7 3v18M16 3c-1.5 1-2 3-2 5s.5 3 2 3v10',
  tag:     'M4 11 11 4h7v7l-7 7zM15.5 8.5h.01',
  card:    'M3.5 6h17v12h-17zM3.5 10h17M7 15h4',
  recipe:  'M6 3.5h9l4 4V20.5H6zM14 3.5V8h4M9 12h6M9 15.5h6',
  logout:  'M14 5H6v14h8M10 12h10M17 9l3 3-3 3',
  filter:  'M4 6h16M7 12h10M10 18h4',
  refresh: 'M19 12a7 7 0 1 1-2-4.9M19 4v3.5h-3.5',
  calendar:'M5 5h14v15H5zM5 9h14M9 3v4M15 3v4',
  trash:   'M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13',
  dollar:  'M12 3v18M16 7c0-2-2-3-4-3s-4 1-4 3 2 3 4 3 4 1 4 3-2 3-4 3-4-1-4-3',
  user:    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5',
  dice:    'M5 5h14v14H5zM9 9h.01M15 15h.01M12 12h.01',
  bolt:    'M13 3 5 13h6l-1 8 8-10h-6z',
  bell:    'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
  external:'M14 4h6v6M20 4l-9 9M18 13v6H5V6h6',
  message: 'M4 5h16v11H8l-4 4z',
};

function Icon({ name, size = 22, stroke = 2, fill = 'none', style }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function IconBtn({ name, onClick, accent, size = 22, label, style }) {
  return (
    <button className={'iconbtn' + (accent ? ' iconbtn--accent' : '')}
      onClick={onClick} aria-label={label} style={style}>
      <Icon name={name} size={size} />
    </button>
  );
}

const fmtMoney = (n) => '$' + (Number(n) || 0).toFixed(2);
const fmtDate = (d) => {
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const fmtDateTime = (d) => {
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const initials = (s) => {
  const t = (s || '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/);
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

function StatusPill({ status }) {
  const c = (window.PFBOrders.STATUS_COLORS)[status] || window.PFBOrders.STATUS_COLORS.pending;
  return <span className="pill" style={{ background: c.bg, color: c.fg }}><span className="dot" />{status}</span>;
}

function Spinner() { return <div className="center-load"><div className="spinner" /></div>; }

function Empty({ icon = 'orders', title, sub }) {
  return (
    <div className="empty fade-in">
      <div style={{ width: 54, height: 54, borderRadius: 18, display: 'grid', placeItems: 'center',
        background: 'rgba(255,255,255,0.05)', color: 'var(--ink-30)' }}>
        <Icon name={icon} size={26} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-60)' }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, maxWidth: 260, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function Sheet({ title, onClose, children, headRight }) {
  return (
    <React.Fragment>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        <div className="sheet__head">
          <div className="sheet__title">{title}</div>
          {headRight}
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="close" size={22} /></button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </React.Fragment>
  );
}

// Full-screen overlay with its own Material app bar + back button.
function Overlay({ title, onClose, children, headRight, flush }) {
  return (
    <div className="overlay">
      <header className="appbar">
        <button className="iconbtn" onClick={onClose} aria-label="Back"><Icon name="back" /></button>
        <div className="appbar__title">{title}</div>
        {headRight}
      </header>
      <div className={'screen' + (flush ? ' screen--flush' : '')}>{children}</div>
    </div>
  );
}

let _toastTimer = null;
function useToast() {
  const [toast, setToast] = React.useState(null);
  const show = React.useCallback((msg) => {
    setToast(msg);
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => setToast(null), 2400);
  }, []);
  const node = toast ? <div className="toast">{toast}</div> : null;
  return [node, show];
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    return ok;
  }
}

async function shareText(text, title) {
  if (navigator.share) {
    try { await navigator.share({ title: title || 'PeakForm Bio', text }); return 'shared'; }
    catch (e) { return 'cancel'; }
  }
  const ok = await copyText(text);
  return ok ? 'copied' : 'fail';
}

window.MUI = {
  Icon, IconBtn, StatusPill, Spinner, Empty, Sheet, Overlay,
  useToast, copyText, shareText,
  fmtMoney, fmtDate, fmtDateTime, initials,
};
})();
