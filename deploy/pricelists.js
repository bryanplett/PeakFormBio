// Shared pricelists for both Admin (reference) and ClientPortal (order form).
// Two pricelists: 'standard' (default — retail clients) and 'wholesale'
// (discounted — for resellers / VIP / bulk buyers).
//
// To change a price: edit the number next to the product name and redeploy.
// To add a product: add it to BOTH pricelists with the appropriate price.
// To rename a pricelist: change the `name` field — but DO NOT change the
// key (e.g. 'standard') because that's what's stored on each client row.

window.PRICELISTS = {
  standard: {
    name: 'Standard',
    description: 'Retail pricing — default for new clients.',
    products: [
      { name: 'Nutrition Plan — 1 Month',                       price: 350, category: 'Programs / Services' },
      { name: 'Workout Plan — 12 weeks',                        price: 250, category: 'Programs / Services' },
      { name: 'Nutrition / Workout / Hormone Bundle — 1 Month', price: 600, category: 'Programs / Services', public: false },
      { name: 'Selank — 10mg',         price: 150, category: 'Cognitive / Mood / Sleep' },
      { name: 'Semax — 10mg',          price: 150, category: 'Cognitive / Mood / Sleep' },
      { name: 'Semax-Selank Blend — 10mg', price: 175, category: 'Cognitive / Mood / Sleep' },
      { name: 'KPV — 10mg',            price: 125, category: 'Skin / Beauty / Anti-Aging' },
      { name: 'DSIP — 10mg',           price: 175, category: 'Cognitive / Mood / Sleep' },
      { name: 'SS-31 — 10mg',          price: 125, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'SS-31 — 30mg',          price: 175, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'CJC 1295 DAC — 5mg',    price: 150, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'BPC — 10mg',            price: 175, category: 'Growth Hormone / Recovery / Muscle' },
      { name: '5 Amino — 50mg',        price: 175, category: 'Metabolic / Weight Management' },
      { name: 'SNAP-8 — 8mg',          price: 100, category: 'Skin / Beauty / Anti-Aging' },
      { name: 'TB-500 — 10mg',         price: 175, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'PT-141 — 10mg',         price: 125, category: 'Hormonal / Sexual Wellness' },
      { name: 'Mito Magic — 120mg',    price:  65, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'MOTS-c — 10mg',         price: 125, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'MOTS-c — 40mg',         price: 200, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'Epithalon — 50mg',      price: 225, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'GHRP-2 — 10mg',         price: 150, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'GHRP-6 — 10mg',         price: 150, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'HCG — 5000IU',          price: 150, category: 'Hormonal / Sexual Wellness' },
      { name: 'CJC-1295 + Ipamorelin — 5+5mg', price: 175, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'Ipamorelin — 10mg',     price: 125, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'IGF LR3 — 1mg',         price: 200, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'Cagrilintide — 10mg',   price: 150, category: 'Metabolic / Weight Management', public: false },
      { name: 'KLOW — 80mg',           price: 200, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'NAD+ — 1000mg',         price: 150, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'Glutathione — 1200mg',  price: 125, category: 'Wellness' },
      { name: 'Tesamorelin — 10mg',    price:  80, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'Wolverine — 10mg',      price: 125, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'GHK-Cu — 50mg',         price:  55, category: 'Skin / Beauty / Anti-Aging' },
      { name: 'HGH — 10IU',            price:  45, category: 'Growth Hormone / Recovery / Muscle', public: false },
      { name: 'HGH — 36IU',            price:  85, category: 'Growth Hormone / Recovery / Muscle', public: false },
      { name: 'Lipo-C',                price:  100, category: 'Wellness' },
      { name: 'Supershred',            price:  100, category: 'Wellness' },
      { name: 'B12',                   price:  65, category: 'Wellness' },
      { name: 'L-Carnitine',           price: 100, category: 'Metabolic / Weight Management' },
      { name: 'Semaglutide — 10mg',    price: 150, category: 'Metabolic / Weight Management', public: false },
      { name: 'Semaglutide — 15mg',    price: 175, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 10mg',    price: 150, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 20mg',    price: 175, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 30mg',    price: 200, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 40mg',    price: 225, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 60mg',    price: 250, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 10mg',    price: 160, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 12mg',    price: 170, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 15mg',    price: 180, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 20mg',    price: 200, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 30mg',    price: 225, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 60mg',    price: 275, category: 'Metabolic / Weight Management', public: false },
      { name: 'BAC Water — 10mL',        price:  15, category: 'Accessories', public: false },
      { name: 'Accessory Pack — 01',     price:   5, category: 'Accessories', public: false },
      { name: 'Accessory Pack — 02',     price:  10, category: 'Accessories', public: false },
      { name: 'Accessory Pack — 03',     price:  15, category: 'Accessories', public: false },
    ],
  },

  wholesale: {
    name: 'Wholesale',
    description: 'Discounted pricing — for resellers, VIPs, or bulk buyers.',
    products: [
      { name: 'Nutrition Plan — 1 Month',                       price: 195, category: 'Programs / Services' },
      { name: 'Workout Plan — 12 weeks',                        price: 150, category: 'Programs / Services' },
      { name: 'Nutrition / Workout / Hormone Bundle — 1 Month', price: 395, category: 'Programs / Services', public: false },
      { name: 'Selank — 10mg',         price:  50, category: 'Cognitive / Mood / Sleep' },
      { name: 'Semax — 10mg',          price:  50, category: 'Cognitive / Mood / Sleep' },
      { name: 'Semax-Selank Blend — 10mg', price:  65, category: 'Cognitive / Mood / Sleep' },
      { name: 'KPV — 10mg',            price:  45, category: 'Skin / Beauty / Anti-Aging' },
      { name: 'DSIP — 10mg',           price:  55, category: 'Cognitive / Mood / Sleep' },
      { name: 'SS-31 — 10mg',          price:  65, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'SS-31 — 30mg',          price: 110, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'CJC 1295 DAC — 5mg',    price:  45, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'BPC — 10mg',            price:  65, category: 'Growth Hormone / Recovery / Muscle' },
      { name: '5 Amino — 50mg',        price:  85, category: 'Metabolic / Weight Management' },
      { name: 'SNAP-8 — 8mg',          price:  40, category: 'Skin / Beauty / Anti-Aging' },
      { name: 'TB-500 — 10mg',         price:  70, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'PT-141 — 10mg',         price:  45, category: 'Hormonal / Sexual Wellness' },
      { name: 'Mito Magic — 120mg',    price:  65, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'MOTS-c — 10mg',         price:  40, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'MOTS-c — 40mg',         price: 110, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'Epithalon — 50mg',      price:  85, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'GHRP-2 — 10mg',         price:  40, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'GHRP-6 — 10mg',         price:  40, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'HCG — 5000IU',          price:  55, category: 'Hormonal / Sexual Wellness' },
      { name: 'CJC-1295 + Ipamorelin — 5+5mg', price:  65, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'Ipamorelin — 10mg',     price:  50, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'IGF LR3 — 1mg',         price:  85, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'Cagrilintide — 10mg',   price:  95, category: 'Metabolic / Weight Management', public: false },
      { name: 'KLOW — 80mg',           price: 100, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'NAD+ — 1000mg',         price:  75, category: 'Longevity / Cellular Health / Mitochondrial' },
      { name: 'Glutathione — 1200mg',  price:  55, category: 'Wellness' },
      { name: 'Tesamorelin — 10mg',    price:  75, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'Wolverine — 10mg',      price:  65, category: 'Growth Hormone / Recovery / Muscle' },
      { name: 'GHK-Cu — 50mg',         price:  35, category: 'Skin / Beauty / Anti-Aging' },
      { name: 'HGH — 10IU',            price:  45, category: 'Growth Hormone / Recovery / Muscle', public: false },
      { name: 'HGH — 36IU',            price:  85, category: 'Growth Hormone / Recovery / Muscle', public: false },
      { name: 'Lipo-C',                price:  55, category: 'Wellness' },
      { name: 'Supershred',            price:  55, category: 'Wellness' },
      { name: 'B12',                   price:  35, category: 'Wellness' },
      { name: 'L-Carnitine',           price:  55, category: 'Metabolic / Weight Management' },
      { name: 'Semaglutide — 10mg',    price:  95, category: 'Metabolic / Weight Management', public: false },
      { name: 'Semaglutide — 15mg',    price: 115, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 10mg',    price:  90, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 20mg',    price: 120, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 30mg',    price: 140, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 40mg',    price: 155, category: 'Metabolic / Weight Management', public: false },
      { name: 'Tirzepatide — 60mg',    price: 175, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 10mg',    price: 100, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 12mg',    price: 110, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 15mg',    price: 120, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 20mg',    price: 125, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 30mg',    price: 150, category: 'Metabolic / Weight Management', public: false },
      { name: 'Retatrutide — 60mg',    price: 195, category: 'Metabolic / Weight Management', public: false },
      { name: 'BAC Water — 10mL',        price:  10, category: 'Accessories', public: false },
      { name: 'Accessory Pack — 01',     price:   5, category: 'Accessories', public: false },
      { name: 'Accessory Pack — 02',     price:  10, category: 'Accessories', public: false },
      { name: 'Accessory Pack — 03',     price:  15, category: 'Accessories', public: false },
    ],
  },
};

// Helper used by ClientPortal: get the right product list for a client.
// Falls back to 'standard' if pricelist is missing or unknown.
window.getPricelist = function(key) {
  return window.PRICELISTS[key] || window.PRICELISTS.standard;
};

// Helper: flat list of "Name — $price" strings, for the simple <select> dropdown.
window.getPricelistAsLabels = function(key) {
  const pl = window.getPricelist(key);
  return pl.products.map(p => `${p.name} — $${p.price}`);
};

// Convenience: list of pricelist keys + names for dropdowns.
window.getPricelistOptions = function() {
  return Object.entries(window.PRICELISTS).map(([key, pl]) => ({
    value: key, label: pl.name,
  }));
};

// ─── Runtime (DB-backed) pricelist ───────────────────────────────────────────
// The object above (window.PRICELISTS) is the BAKED-IN default that ships with
// the code. The admin can override it at runtime by editing the pricelist in
// Admin → Pricelist, which saves to the `app_settings` table (key='pricelist').
//
// On load, both Admin and ClientPortal call window.loadPricelists(sb). If an
// admin-saved version exists in the DB it replaces window.PRICELISTS (so every
// helper above automatically returns the live prices); otherwise the baked-in
// defaults are used. This mirrors how payment methods work (app_settings /
// key='payment_methods'), so it needs the same 2026_app_settings.sql table.

// Frozen deep-copy of the shipped defaults, so "Reset to defaults" in the editor
// and the fallback path always have a clean copy to return to.
window.PRICELISTS_DEFAULT = JSON.parse(JSON.stringify(window.PRICELISTS));

// Basic shape check so a malformed/empty DB row never blanks out the catalog.
function _validPricelists(v) {
  if (!v || typeof v !== 'object') return false;
  return Object.keys(v).some(k =>
    v[k] && Array.isArray(v[k].products) && v[k].products.length > 0);
}

// Load the admin-saved pricelist from the DB and make it the active one.
// Returns the active pricelists object (DB version if present, else defaults).
// Never throws — on any error it leaves the baked-in defaults in place.
window.loadPricelists = async function(sb) {
  if (!sb) return window.PRICELISTS;
  try {
    const { data, error } = await sb.from('app_settings')
      .select('*').eq('key', 'pricelist').maybeSingle();
    if (error || !data || !_validPricelists(data.value)) return window.PRICELISTS;
    // Replace the active object IN PLACE-style (reassign) so all helpers that
    // read window.PRICELISTS pick up the live version immediately.
    window.PRICELISTS = data.value;
    return window.PRICELISTS;
  } catch (_err) {
    return window.PRICELISTS;
  }
};

// Persist an edited pricelists object to the DB (admin only). Also updates the
// in-memory copy so the rest of the page reflects the change without a reload.
// Returns { error } — null on success.
window.savePricelists = async function(sb, pricelists) {
  if (!sb) return { error: { message: 'No backend connection.' } };
  if (!_validPricelists(pricelists)) {
    return { error: { message: 'Pricelist looks empty — every tier needs at least one product.' } };
  }
  const res = await sb.from('app_settings')
    .upsert({ key: 'pricelist', value: pricelists, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select().single();
  if (!res.error) window.PRICELISTS = pricelists;
  return { error: res.error || null };
};

// ─── Per-client price overrides ──────────────────────────────────────────────
// A single app_settings row (key='price_overrides') holds a map of
//   { [clientId]: { [productName]: priceNumber } }
// When a client has an override for a product, that price wins over their tier
// price. Stored admin-write-only; read by the portal to price that client's
// catalog. Falls back to {} (no overrides) when the row is absent.
window.PRICE_OVERRIDES = {};

window.loadPriceOverrides = async function(sb) {
  if (!sb) return window.PRICE_OVERRIDES;
  try {
    const { data, error } = await sb.from('app_settings')
      .select('*').eq('key', 'price_overrides').maybeSingle();
    if (error || !data || !data.value || typeof data.value !== 'object') return window.PRICE_OVERRIDES;
    window.PRICE_OVERRIDES = data.value;
    return window.PRICE_OVERRIDES;
  } catch (_err) {
    return window.PRICE_OVERRIDES;
  }
};

window.savePriceOverrides = async function(sb, overrides) {
  if (!sb) return { error: { message: 'No backend connection.' } };
  const clean = overrides && typeof overrides === 'object' ? overrides : {};
  const res = await sb.from('app_settings')
    .upsert({ key: 'price_overrides', value: clean, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select().single();
  if (!res.error) window.PRICE_OVERRIDES = clean;
  return { error: res.error || null };
};

// The base (tier) price for a product, ignoring overrides. Null if not in tier.
window.getBasePrice = function(tierKey, productName) {
  const pl = window.getPricelist(tierKey);
  const p = (pl.products || []).find(x => x.name === productName);
  return p ? p.price : null;
};

// The effective price for a specific client: their override if present, else
// their tier price. Null if the product isn't on their tier.
window.getClientPrice = function(clientId, tierKey, productName) {
  const ov = window.PRICE_OVERRIDES[clientId];
  if (ov && ov[productName] != null && !isNaN(Number(ov[productName]))) return Number(ov[productName]);
  return window.getBasePrice(tierKey, productName);
};

// Labels ("Name — $price") for a client, applying their overrides. Used by the
// portal so the cart, totals, and saved order all reflect the custom prices.
window.getPricelistAsLabelsForClient = function(clientId, tierKey) {
  const pl = window.getPricelist(tierKey);
  return pl.products.map(p => {
    const price = window.getClientPrice(clientId, tierKey, p.name);
    return `${p.name} — $${price}`;
  });
};
