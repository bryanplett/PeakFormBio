// "Restock & Upgrade" announcement popup for the client portal.
// Shows each time the portal loads, until the restock window ends (end of 12/6/2026).
(function (global) {
  const RESTOCK_END = new Date(2026, 11, 7); // local midnight, Dec 7 2026 (after 12/6 ends)

  const rnS = {
    overlay: { position: 'fixed', inset: 0, zIndex: 950, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' },
    modal: { position: 'relative', width: '100%', maxWidth: 560, margin: 'auto 0', background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '32px 28px 26px', color: '#f5f5f7', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' },
    close: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' },
    badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2997ff', background: 'rgba(41,151,255,0.12)', border: '1px solid rgba(41,151,255,0.3)', borderRadius: 999, padding: '4px 12px', marginBottom: 14 },
    item: { display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' },
    icon: { flexShrink: 0, width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'rgba(41,151,255,0.12)', color: '#2997ff' },
    itemTitle: { fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 3 },
    itemBody: { fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, textWrap: 'pretty' },
  };

  const ITEMS = [
    {
      icon: '⏱',
      title: 'Up to 96 hours to ship',
      body: 'Orders placed between 11/30/2026 and 12/6/2026 may take up to 96 hours to ship while we restock and upgrade.',
    },
    {
      icon: '%',
      title: '30% off during the restock',
      body: 'We appreciate your patience. To make up for any inconvenience, enjoy 30% off for the full duration of the restock and upgrade.',
      code: 'Restock',
      highlight: true,
    },
    {
      icon: '$',
      title: 'All GLPs (20mg and up) now $125',
      body: 'For the rest of the year, every GLP 20mg and up is reduced to $125 to lessen the cost of titrating up in dose.',
    },
  ];

  const RestockNoticeModal = ({ onClose }) => (
    <div style={rnS.overlay} onClick={onClose}>
      <style>{`
        @media (max-width: 600px) {
          .restock-notice-modal { padding: 26px 16px 18px !important; border-radius: 18px !important; }
          .restock-notice-modal h2 { font-size: 22px !important; }
        }
      `}</style>
      <div className="restock-notice-modal" style={rnS.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Store restock and upgrade notice">
        <button type="button" style={rnS.close} onClick={onClose} aria-label="Close">×</button>
        <span style={rnS.badge}>Store update · Nov 30 – Dec 6</span>
        <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10, paddingRight: 36 }}>We're restocking &amp; upgrading</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, textWrap: 'pretty' }}>
          From <strong style={{ color: '#f5f5f7' }}>11/30/2026</strong> through <strong style={{ color: '#f5f5f7' }}>12/6/2026</strong>, PeakFormBio will be restocking and upgrading the store. We're making these improvements for you, so you get a better experience every time you order.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          {ITEMS.map(it => (
            <div key={it.title} style={it.highlight ? { ...rnS.item, border: '1px solid rgba(41,151,255,0.35)', background: 'rgba(41,151,255,0.06)' } : rnS.item}>
              <div style={rnS.icon} aria-hidden="true">{it.icon}</div>
              <div>
                <div style={rnS.itemTitle}>{it.title}</div>
                <div style={rnS.itemBody}>{it.body}</div>
                {it.code && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Use code</span>
                    <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#2997ff', border: '1px dashed rgba(41,151,255,0.6)', borderRadius: 8, padding: '4px 10px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{it.code}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>at checkout</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginTop: 18, textAlign: 'center' }}>
          Thank you for your patience and for being part of PeakFormBio.
        </p>
        <button type="button" className="btn-primary" onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 14, padding: '12px 16px', fontSize: 14 }}>Got it</button>
      </div>
    </div>
  );

  // Mount once in the portal. Opens automatically on load until the restock
  // window ends; also exposes window.openRestockNotice() so a banner can reopen it.
  const RestockNotice = () => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
      global.openRestockNotice = () => setOpen(true);
      if (new Date() >= RESTOCK_END) return;
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }, []);
    if (!open) return null;
    return <RestockNoticeModal onClose={() => setOpen(false)} />;
  };

  global.RestockNotice = RestockNotice;
})(window);
