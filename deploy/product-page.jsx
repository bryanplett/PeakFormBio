// product-page.jsx — full product page opened from a store card (Client Portal
// order form + Telegram store). Dark PeakForm theme.
//
// Content comes from the peptide spec database (peptide-specs.js, edited in
// Admin → Catalog → Spec Cards): chemistry fields fill the Specifications table,
// and the "Product page" fields (description, key points, purity, storage,
// sequence, synonyms, COA link) are free text the admin writes. Empty fields
// are simply not shown. Products with no spec entry still get a page (photo,
// price, options, card blurb).
//
// Props:
//   name           product base name, e.g. "BPC"
//   categoryTitle  e.g. "Tissue Repair & Regenerative"
//   tint           category accent colour
//   photo          image URL (optional)
//   blurb          one-line card description (optional)
//   options        [{ key, label, sub, price, inCart, outOfStock }]  (key = cart label)
//   initialKey     option key to preselect
//   onAdd(key)     add that option to the cart
//   onClose()      leave the page
//   related        [{ key, name, photo, price }]  other products in the category
//   onOpenRelated(key)
//
// Exports: window.ProductPage

(function () {
  const BLUE = '#2997ff';
  const slugify = (s) => String(s || '').toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const lines = (s) => String(s || '').split(/\r?\n/).map(x => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

  const CSS = `
  .pp-wrap{position:fixed;inset:0;z-index:300;background:#0a0a0a;overflow-y:auto;-webkit-overflow-scrolling:touch;animation:ppIn .22s ease-out;color:#f5f5f7}
  @keyframes ppIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .pp-bar{position:sticky;top:0;z-index:5;background:rgba(10,10,10,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.07)}
  .pp-bar-in{max-width:1180px;margin:0 auto;height:58px;padding:0 20px;display:flex;align-items:center;gap:14px}
  .pp-back{flex:none;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#f5f5f7;border-radius:980px;padding:8px 16px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit}
  .pp-back:hover{background:rgba(255,255,255,.1)}
  .pp-crumb{font-size:13px;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pp-main{max-width:1180px;margin:0 auto;padding:28px 20px 90px}
  .pp-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:44px;align-items:start}
  @media (max-width:860px){.pp-hero{grid-template-columns:1fr;gap:26px}.pp-main{padding-top:18px}}
  .pp-stage{position:relative;border-radius:24px;background:linear-gradient(180deg,#1a1a1c,#0f0f10);border:1px solid rgba(255,255,255,.07);aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .pp-thumbs{display:flex;gap:10px;margin-top:12px}
  .pp-thumb{width:76px;height:76px;border-radius:14px;background:#161617;border:1px solid rgba(255,255,255,.1);cursor:pointer;padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:inherit}
  .pp-chip{border-radius:10px;padding:9px 14px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;display:flex;flex-direction:column;align-items:flex-start;gap:2px;position:relative}
  .pp-sec{background:#161617;border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:26px 28px;margin-top:22px}
  @media (max-width:600px){.pp-sec{padding:20px 18px}}
  .pp-h2{font-size:20px;font-weight:600;letter-spacing:-.01em;margin:0 0 14px}
  .pp-row{display:grid;grid-template-columns:200px 1fr;gap:16px;padding:12px 0;border-top:1px solid rgba(255,255,255,.06);font-size:14.5px}
  .pp-row:first-child{border-top:none}
  @media (max-width:600px){.pp-row{grid-template-columns:1fr;gap:3px}}
  .pp-k{color:rgba(255,255,255,.5)}
  .pp-v{color:#f5f5f7;word-break:break-word}
  .pp-rel{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
  .pp-relcard{background:linear-gradient(180deg,#1a1a1c,#111112);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:12px;cursor:pointer;text-align:left;color:#f5f5f7;font-family:inherit}
  .pp-relcard:hover{border-color:rgba(255,255,255,.18)}
  `;

  // C62H98N16O22 → subscripts
  const Formula = ({ value }) => {
    const v = String(value || '');
    if (!/^[A-Z][A-Za-z0-9]*$/.test(v)) return v;
    return v.split(/(\d+)/).map((part, i) => /^\d+$/.test(part) ? <sub key={i} style={{ fontSize: '0.75em' }}>{part}</sub> : <React.Fragment key={i}>{part}</React.Fragment>);
  };

  const Check = ({ tint }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" style={{ flex: 'none', marginTop: 1 }}>
      <circle cx="10" cy="10" r="9" fill={tint + '22'} stroke={tint} strokeWidth="1.3" />
      <path d="M6 10.3l2.6 2.6L14 7.6" fill="none" stroke={tint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ProductPage = (props) => {
    const { name, categoryTitle, tint = BLUE, photo, blurb, notice, options = [], initialKey, onAdd, onClose, related = [], onOpenRelated } = props;
    if (window.usePeptideSpecs) window.usePeptideSpecs();
    const spec = window.findPeptideSpec ? window.findPeptideSpec(name) : null;
    const D = window.PEPTIDE_SPEC_DEFAULTS || {};
    const wrapRef = React.useRef(null);

    const [selKey, setSelKey] = React.useState(initialKey || (options[0] && options[0].key));
    React.useEffect(() => { setSelKey(initialKey || (options[0] && options[0].key)); if (wrapRef.current) wrapRef.current.scrollTop = 0; }, [name]);
    const sel = options.find(o => o.key === selKey) || options[0] || null;
    const [justAdded, setJustAdded] = React.useState(false);
    React.useEffect(() => { setJustAdded(false); }, [selKey, name]);

    // Browser/phone back button closes the page: push a history entry on open,
    // swap it when moving between products, pop it when closing.
    const closingRef = React.useRef(false);
    React.useEffect(() => {
      const hash = '#product/' + slugify(name);
      if (history.state && history.state.pfbProduct) history.replaceState({ pfbProduct: 1 }, '', hash);
      else history.pushState({ pfbProduct: 1 }, '', hash);
    }, [name]);
    React.useEffect(() => {
      const onPop = () => { closingRef.current = true; onClose && onClose(); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      window.addEventListener('popstate', onPop);
      window.addEventListener('keydown', onKey);
      return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
    }, []);
    const close = () => {
      if (history.state && history.state.pfbProduct) history.back(); // → popstate → onClose
      else onClose && onClose();
    };

    // Gallery: product photo, plus the spec card when the database has chemistry data.
    const strength = window.splitProductName && sel ? window.splitProductName(`${name} — ${sel.label || ''}`).strength : '';
    const hasSpecCard = !!(spec && spec.cas && window.SpecCard);
    const views = [photo && 'photo', hasSpecCard && 'spec'].filter(Boolean);
    const [view, setView] = React.useState(views[0] || null);
    React.useEffect(() => { setView(views[0] || null); }, [name]);

    const add = () => {
      if (!sel || sel.outOfStock) return;
      onAdd && onAdd(sel.key);
      setJustAdded(true);
    };

    // "Semaglutide" stays as the store spells it; "BPC" shows the full "BPC-157".
    const nk = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9+]/g, '');
    const displayName = spec && spec.name && nk(spec.name) !== nk(name) ? spec.name : name;
    const specRows = spec ? [
      ['CAS number', spec.cas],
      ['Molecular formula', spec.formula && <Formula value={spec.formula} />],
      ['Molecular weight', spec.mw],
      ['Sequence', spec.sequence && <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13.5, letterSpacing: 0.5 }}>{spec.sequence}</span>],
      ['Synonyms', spec.synonyms],
      ['Form', spec.cas ? (spec.form || D.form) : spec.form],
      ['Purity', spec.purity],
      ['Available strengths', options.length > 1 ? [...new Set(options.map(o => o.label).filter(Boolean))].join(' · ') : null],
    ].filter(r => r[1]) : [];

    const inCartAny = options.some(o => o.inCart);

    return (
      <div className="pp-wrap" ref={wrapRef} role="dialog" aria-modal="true" aria-label={`${displayName} product page`}>
        <style>{CSS}</style>
        <div className="pp-bar">
          <div className="pp-bar-in">
            <button type="button" className="pp-back" onClick={close}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to store
            </button>
            <div className="pp-crumb">{categoryTitle ? `${categoryTitle}  /  ` : ''}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{displayName}</span></div>
          </div>
        </div>

        <div className="pp-main">
          <div className="pp-hero">
            {/* Gallery */}
            <div>
              <div className="pp-stage">
                <div style={{ position: 'absolute', inset: '15%', background: `radial-gradient(circle, ${tint}40 0%, transparent 70%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
                {view === 'photo' && <img src={photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative' }} />}
                {view === 'spec' && (
                  <div style={{ height: '92%', aspectRatio: '746 / 1075', position: 'relative' }}>
                    <window.SpecCard spec={spec} strength={strength} />
                  </div>
                )}
                {!view && (
                  <div style={{ position: 'relative', textAlign: 'center', padding: 30 }}>
                    <div style={{ fontSize: 13, color: tint, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PEAKFORM BIO</div>
                    <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>{displayName}</div>
                    {strength && <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>{strength}</div>}
                  </div>
                )}
              </div>
              {views.length > 1 && (
                <div className="pp-thumbs">
                  {views.map(v => (
                    <button key={v} type="button" className="pp-thumb" onClick={() => setView(v)} aria-label={v === 'photo' ? 'Product photo' : 'Spec sheet'}
                      style={{ borderColor: view === v ? tint : 'rgba(255,255,255,0.1)', boxShadow: view === v ? `0 0 0 1px ${tint}` : 'none' }}>
                      {v === 'photo'
                        ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ height: '88%', aspectRatio: '746 / 1075', pointerEvents: 'none' }}><window.SpecCard spec={spec} strength={strength} zoom={false} /></div>}
                    </button>
                  ))}
                  {hasSpecCard && <div style={{ alignSelf: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{view === 'spec' ? 'Tap the card to enlarge' : 'Spec sheet →'}</div>}
                </div>
              )}
            </div>

            {/* Buy box */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 980, background: 'rgba(41,151,255,0.10)', border: '1px solid rgba(41,151,255,0.22)', fontSize: 11.5, fontWeight: 600, color: BLUE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE }} /> Research use only
              </div>
              <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, margin: '14px 0 8px' }}>{displayName}</h1>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
                {[categoryTitle, spec && spec.cas ? 'Third-party tested' : null].filter(Boolean).join('  ·  ')}
              </div>
              {(blurb || (spec && spec.tagline)) && (
                <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', margin: '0 0 18px' }}>{blurb || spec.tagline}</p>
              )}

              {notice && (
                <div role="note" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', margin: '0 0 18px', borderRadius: 12,
                  background: 'rgba(255,159,10,0.10)', border: '1px solid rgba(255,159,10,0.45)', color: '#ffb340', fontSize: 14.5, lineHeight: 1.45, fontWeight: 500 }}>
                  <span aria-hidden="true">⚠</span><span>{notice}</span>
                </div>
              )}

              {sel && sel.price && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 20px' }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: tint }}>{sel.price}</span>
                  {sel.label && <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>/ {sel.label}{sel.sub ? ` · ${sel.sub}` : ''}</span>}
                </div>
              )}

              {options.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Choose option</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {options.map(o => {
                      const on = sel && o.key === sel.key;
                      return (
                        <button key={o.key} type="button" className="pp-chip" onClick={() => setSelKey(o.key)}
                          style={{ background: on ? tint + '22' : 'rgba(255,255,255,0.04)', color: on ? '#fff' : 'rgba(255,255,255,0.8)', border: `1px solid ${on ? tint : 'rgba(255,255,255,0.12)'}`, opacity: o.outOfStock ? 0.5 : 1 }}>
                          <span>{o.label || '—'}{o.sub ? <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}> · {o.sub}</span> : null}</span>
                          {o.price && <span style={{ fontSize: 12.5, color: tint }}>{o.price}{o.outOfStock ? ' · sold out' : ''}</span>}
                          {o.inCart && <span style={{ position: 'absolute', top: -4, right: -4, width: 11, height: 11, borderRadius: '50%', background: tint, border: '2px solid #0a0a0a' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sel && (
                <button type="button" onClick={add} disabled={sel.outOfStock}
                  style={{ width: '100%', minHeight: 52, borderRadius: 980, border: 'none', fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
                    cursor: sel.outOfStock ? 'not-allowed' : 'pointer', transition: 'background .2s',
                    background: sel.outOfStock ? 'rgba(255,255,255,0.06)' : justAdded ? tint : '#0066cc',
                    color: sel.outOfStock ? 'rgba(255,255,255,0.35)' : justAdded ? '#000' : '#fff' }}>
                  {sel.outOfStock ? 'Out of stock' : justAdded ? '✓ Added to cart — tap to add another' : 'Add to cart'}
                </button>
              )}
              {(justAdded || inCartAny) && (
                <button type="button" onClick={close} style={{ width: '100%', marginTop: 10, minHeight: 44, borderRadius: 980, background: 'transparent', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Continue shopping
                </button>
              )}

              <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
                {[
                  spec && spec.cas ? 'Third-party tested' : null,
                  spec && spec.purity ? `Purity: ${spec.purity}` : null,
                  spec && spec.coaUrl ? <a href={spec.coaUrl} target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>View certificate of analysis</a> : null,
                  'For laboratory research use only — not for human consumption',
                ].filter(Boolean).map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}><Check tint={tint} />{t}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Specifications */}
          {specRows.length > 0 && (
            <section className="pp-sec">
              <h2 className="pp-h2">Specifications</h2>
              <div>
                {specRows.map(([k, v]) => (
                  <div key={k} className="pp-row"><div className="pp-k">{k}</div><div className="pp-v">{v}</div></div>
                ))}
              </div>
            </section>
          )}

          {/* Admin-written sections, in this order, each hidden when empty */}
          {spec && (() => {
            const paras = (t) => String(t || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', margin: '0 0 14px', whiteSpace: 'pre-line' }}>{para}</p>
            ));
            const bullets = (t, icon) => {
              const items = lines(t);
              if (!items.length) return null;
              return (
                <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'grid', gap: 10 }}>
                  {items.map((h, i) => <li key={i} style={{ display: 'flex', gap: 10, fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)' }}>{icon}{h}</li>)}
                </ul>
              );
            };
            const Dot = <span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: tint, marginTop: 8 }} />;
            const Warn = (
              <svg width="18" height="18" viewBox="0 0 20 20" style={{ flex: 'none', marginTop: 1 }}>
                <path d="M10 2.5L18.5 17H1.5Z" fill="rgba(255,159,10,0.15)" stroke="#ff9f0a" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M10 8v4" stroke="#ff9f0a" strokeWidth="1.8" strokeLinecap="round" /><circle cx="10" cy="14.4" r="1" fill="#ff9f0a" />
              </svg>
            );
            const sections = [
              ['Clinical Status', paras(spec.clinicalStatus)],
              ['Overview', (spec.description || spec.highlights) ? <>{paras(spec.description)}{bullets(spec.highlights, <Check tint={tint} />)}</> : null],
              ['Mechanism of Action', paras(spec.mechanism)],
              ['Reported Effects', bullets(spec.effects, Dot)],
              ['Possible Side Effects', bullets(spec.sideEffects, Dot)],
              ['Contraindications & Warnings', bullets(spec.warnings, Warn)],
              ['Handling & Storage', (spec.storage || spec.shelfLife || spec.handling) ? <>
                {[['Storage', spec.storage], ['Shelf life', spec.shelfLife]].filter(r => r[1]).map(([k, v]) => (
                  <div key={k} className="pp-row"><div className="pp-k">{k}</div><div className="pp-v">{v}</div></div>
                ))}
                {lines(spec.handling).length > 0 && <div style={{ marginTop: (spec.storage || spec.shelfLife) ? 14 : 0 }}>{bullets(spec.handling, Dot)}</div>}
              </> : null],
            ].filter(([, body]) => body && (!Array.isArray(body) || body.length));
            return sections.map(([title, body]) => (
              <section key={title} className="pp-sec" style={title === 'Contraindications & Warnings' ? { borderColor: 'rgba(255,159,10,0.25)' } : null}>
                <h2 className="pp-h2">{title}</h2>
                {body}
              </section>
            ));
          })()}

          {/* Related */}
          {related.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2 className="pp-h2">More from {categoryTitle || 'this category'}</h2>
              <div className="pp-rel">
                {related.slice(0, 8).map(r => (
                  <button key={r.key} type="button" className="pp-relcard" onClick={() => onOpenRelated && onOpenRelated(r.key)}>
                    <div style={{ aspectRatio: '1 / 1', borderRadius: 12, overflow: 'hidden', background: '#0f0f10', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      {r.photo ? <img src={r.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 15, fontWeight: 700, color: tint, padding: 10, textAlign: 'center' }}>{r.name}</span>}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{r.name}</div>
                    {r.price && <div style={{ fontSize: 13.5, color: tint, marginTop: 4, fontWeight: 600 }}>{r.price}</div>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Disclaimer */}
          <section style={{ marginTop: 40, padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>RESEARCH USE ONLY</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              This product is sold strictly for laboratory and in-vitro research by qualified professionals. It is not a drug, food,
              cosmetic or dietary supplement, is not intended to diagnose, treat, cure or prevent any disease, and is not for human
              or animal consumption. Statements on this page have not been evaluated by the FDA.
            </p>
          </section>
        </div>
      </div>
    );
  };

  window.ProductPage = ProductPage;
})();
