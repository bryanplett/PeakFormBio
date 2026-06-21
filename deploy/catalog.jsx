// catalog.jsx — PeakForm Bio Product Catalog (public site)
// Data-driven: builds the catalog from the shared category list (categories.js)
// + the product pricelist (pricelists.js), then overlays the LIVE public feed
// (/api/public/catalog) so category edits made in Admin reflect here. Falls back
// to the bundled pricelist if the feed is unavailable or not yet migrated.
// Exports: ProductCatalog

// ── Build [{id,title,tint,blurb,products:[{name,photo}]}] from a product list ──
function buildCatalogData(products) {
  const cats = window.CATALOG_CATEGORIES || [];
  const buckets = {};
  cats.forEach(c => { buckets[c.title] = { id: c.id, title: c.title, tint: c.tint, blurb: c.blurb, products: [] }; });
  const seen = new Set();
  (products || []).forEach(p => {
    if (p.public === false) return;                 // portal-only
    const bucket = buckets[p.category];
    if (!bucket) return;                            // unknown category → skip
    const base = window.baseProductName ? window.baseProductName(p.name) : p.name;
    const key = bucket.id + '|' + base.toLowerCase();
    if (seen.has(key)) return;                      // dedupe strength variants
    seen.add(key);
    bucket.products.push({ name: base, photo: window.getProductPhoto ? window.getProductPhoto(base) : null });
  });
  return cats.map(c => buckets[c.title]).filter(b => b.products.length);
}

// Bundled fallback: products from the baked-in pricelist (standard tier).
function bundledProducts() {
  const PL = window.PRICELISTS || {};
  const tier = PL.standard || Object.values(PL)[0] || { products: [] };
  return tier.products || [];
}

// ─── Placeholder visual (CSS vial) — used only when a product has no photo. ──
const VialMark = ({ name, strength, tint, size = 140 }) => (
  <div style={{
    width: size, height: size * 1.5, position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    pointerEvents: 'none',
  }}>
    <div style={{
      width: size * 0.4, height: size * 0.18,
      background: 'linear-gradient(180deg, #d4d4d8 0%, #71717a 50%, #3f3f46 100%)',
      borderRadius: '6px 6px 2px 2px',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
    }} />
    <div style={{ width: size * 0.45, height: size * 0.05, background: '#52525b' }} />
    <div style={{
      width: size * 0.7, height: size * 0.95,
      background: `linear-gradient(135deg, rgba(255,255,255,0.18) 0%, ${tint}33 40%, ${tint}55 100%)`,
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '4px 4px 12px 12px',
      position: 'relative', overflow: 'hidden',
      boxShadow: `inset -8px 0 16px rgba(0,0,0,0.3), inset 8px 0 12px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.4)`,
    }}>
      <div style={{
        position: 'absolute', top: '6%', left: '12%', width: '14%', height: '60%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '50%', filter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
        background: `linear-gradient(180deg, ${tint}99 0%, ${tint}cc 100%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '82%', padding: '6px 4px',
        background: 'rgba(255,255,255,0.94)',
        borderRadius: 4, textAlign: 'center', color: '#1a1a1c',
        fontSize: size * 0.085, fontWeight: 700, letterSpacing: 0.3, lineHeight: 1.15,
      }}>
        <div style={{ fontSize: size * 0.07, color: '#2997ff', fontWeight: 800 }}>PFB</div>
        <div style={{ fontSize: size * 0.075 }}>{name.length > 14 ? name.slice(0, 14) + '…' : name}</div>
        <div style={{ fontSize: size * 0.065, fontWeight: 500, color: '#52525b' }}>{strength}</div>
      </div>
    </div>
  </div>
);

// ─── Self-contained product card (full Canva art, no crop) ──────────────────
const RevealCard = ({ product, tint, onSchedule }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: 20,
        background: '#0f0f10',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer', overflow: 'hidden',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hover
          ? `0 24px 60px -16px ${tint}55, 0 8px 24px rgba(0,0,0,0.5)`
          : '0 2px 10px rgba(0,0,0,0.4)',
        transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s, border-color 0.3s',
      }}>
      {product.photo ? (
        <img
          src={product.photo}
          alt={product.strength ? `${product.name} ${product.strength}` : product.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VialMark name={product.name} strength={product.strength || ''} tint={tint} size={120} />
        </div>
      )}
      {/* Inquire reveal */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '44px 16px 18px',
        display: 'flex', justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(8,10,18,0) 0%, rgba(8,10,18,0.72) 100%)',
        opacity: hover ? 1 : 0,
        transform: hover ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s, transform 0.3s',
        pointerEvents: hover ? 'auto' : 'none',
      }}>
        <button onClick={(e) => { e.stopPropagation(); onSchedule && onSchedule(); }} style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 980, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: 0.2,
        }}>Inquire</button>
      </div>
    </div>
  );
};

// ─── Category section ───────────────────────────────────────────────────────
const CategorySection = ({ category, onSchedule }) => (
  <div style={{ marginBottom: 80 }}>
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
      <div style={{
        width: 6, height: 28, borderRadius: 3, background: category.tint,
        boxShadow: `0 0 16px ${category.tint}80`,
      }} />
      <h3 style={{
        fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: '#f5f5f7',
        letterSpacing: '-0.02em',
      }}>{category.title}</h3>
      <p style={{
        fontSize: 14, color: 'rgba(255,255,255,0.55)',
        maxWidth: 480, lineHeight: 1.45, marginLeft: 'auto',
      }}>{category.blurb}</p>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 20,
    }}>
      {category.products.map(p => (
        <RevealCard key={p.name} product={p} tint={category.tint} onSchedule={onSchedule} />
      ))}
    </div>
  </div>
);

// ─── Catalog component ──────────────────────────────────────────────────────
const ProductCatalog = ({ onSchedule }) => {
  const [catalog, setCatalog] = React.useState(() => buildCatalogData(bundledProducts()));

  // Overlay the LIVE public feed so Admin category edits show here. The feed
  // returns public products only ([{ name, category }]). We adopt it only when
  // it maps cleanly onto the canonical categories, so a not-yet-migrated
  // pricelist can never blank out the page.
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/public/catalog', { headers: { 'Accept': 'application/json' } })
      .then(r => (r && r.ok) ? r.json() : null)
      .then(data => {
        if (cancelled || !data || !Array.isArray(data.products) || !data.products.length) return;
        const feed = data.products.map(p => ({ name: p.name, category: p.category, public: true }));
        const known = feed.filter(p => window.getCategoryMeta && window.getCategoryMeta(p.category));
        if (known.length && known.length >= feed.length * 0.6) {
          const next = buildCatalogData(known);
          if (next.length) setCatalog(next);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="catalog" style={{
      background: '#0a0a0a',
      padding: '120px 24px',
      color: '#f5f5f7',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{
            fontSize: 12, letterSpacing: 2, color: '#2997ff', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 12,
          }}>Our Catalog</p>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600,
            letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18,
          }}>The toolkit, made specific.</h2>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.5, fontWeight: 300,
          }}>Hover any product to learn more. Every protocol is prescribed based on your bloodwork, goals, and a consultation — never off-the-shelf.</p>
        </div>

        {catalog.map(cat => <CategorySection key={cat.id} category={cat} onSchedule={onSchedule} />)}
      </div>
    </section>
  );
};

window.ProductCatalog = ProductCatalog;
