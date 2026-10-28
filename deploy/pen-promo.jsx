// "New at PeakFormBio" pen announcement popup for the client portal.
// Shows every time the portal page loads.
(function (global) {
  const PEN_PROMO_KEY = 'pfb_pen_promo_seen_v1';

  const PENS = [
    {
      id: 'disposable',
      name: 'Disposable Peptide Pen',
      full: 'Disposable Peptide Pen | Adjustable 0–60 Unit Dial',
      price: 10,
      img: 'assets/product-pen-disposable.png',
      imgBg: '#cfcfcf',
      points: ['Adjustable dose dial, 1–60 units', 'Includes one 3 mL cartridge', 'Clear, easy-to-read dose window', 'Lightweight BPA-free plastic, pocket-sized', 'Use for 30 days, then discard', 'Multiple cap colors for easy identification'],
    },
    {
      id: 'reusable',
      name: 'V2 Reusable Pen Injector',
      full: 'V2 Reusable Research Peptide Pen Injector',
      price: 25,
      img: 'assets/product-pen-reusable.png',
      imgBg: '#ffffff',
      points: ['Reusable, refillable pen', 'Compatible with 3 mL cartridges', 'Includes 2 empty 3 mL cartridges', 'Durable, lightweight and portable', 'Adjustable 0–60 unit dose dial', 'Black, pink, blue, gold or silver', 'Add your top 3 colors in order notes'],
    },
  ];

  const penS = {
    overlay: { position: 'fixed', inset: 0, zIndex: 950, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' },
    modal: { position: 'relative', width: '100%', maxWidth: 640, background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '32px 28px 26px', color: '#f5f5f7', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' },
    close: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' },
    badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2997ff', background: 'rgba(41,151,255,0.12)', border: '1px solid rgba(41,151,255,0.3)', borderRadius: 999, padding: '4px 12px', marginBottom: 14 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginTop: 24 },
    card: { display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' },
  };

  const PenPromoModal = ({ onClose, onAdd }) => (
    <div style={penS.overlay} onClick={onClose}>
      <div style={penS.modal} onClick={e => e.stopPropagation()} role="dialog" aria-label="New pen injectors">
        <button type="button" style={penS.close} onClick={onClose} aria-label="Close">×</button>
        <span style={penS.badge}>New at PeakFormBio</span>
        <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}>Peptide pen injectors are here</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, maxWidth: 500, textWrap: 'pretty' }}>
          Dial your dose and inject with a pen instead of a syringe. Choose a disposable pen or the reusable V2.
        </p>
        <div style={penS.grid}>
          {PENS.map(p => (
            <div key={p.id} style={penS.card}>
              <div style={{ aspectRatio: '4 / 3', background: p.imgBg }}>
                <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</h3>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#2997ff' }}>${p.price}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, flex: 1 }}>
                  {p.points.map(pt => (
                    <li key={pt} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                      <span style={{ color: '#2997ff', fontWeight: 700 }}>✓</span><span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn-primary" onClick={() => onAdd(p.full)} style={{ width: '100%', padding: '11px 16px', fontSize: 14 }}>Add to cart</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} style={{ display: 'block', margin: '18px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Maybe later</button>
      </div>
    </div>
  );

  // Mount once in the portal. Opens automatically the first time; also exposes
  // window.openPenPromo() so a banner/button can reopen it.
  const PenPromo = ({ onAdd }) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
      const t = setTimeout(() => setOpen(true), 900);
      global.openPenPromo = () => setOpen(true);
      return () => { if (t) clearTimeout(t); };
    }, []);
    const close = () => setOpen(false);
    if (!open) return null;
    return <PenPromoModal onClose={close} onAdd={(name) => { close(); onAdd(name); }} />;
  };

  global.PenPromo = PenPromo;
})(window);
