// categories.js — Shared catalog category definitions + product→photo mapping.
// Single source of truth for category order, titles, accent colors, and blurbs,
// used by the public site (catalog.jsx) and the client portal (ClientPortal.html).
// Load as a plain <script> BEFORE those files.
(function (global) {
  'use strict';

  global.CATALOG_CATEGORIES = [
    { id: 'glp',      title: 'Glucagon Like Peptides (GLP)',          tint: '#ff9f0a', blurb: 'GLP-1 and related incretin peptides for appetite regulation and metabolic research.' },
    { id: 'ghs',      title: 'Growth Hormone Secretagogues',          tint: '#34c759', blurb: 'Peptides that stimulate endogenous growth hormone and IGF-1 signaling.' },
    { id: 'repair',   title: 'Tissue Repair & Regenerative',          tint: '#64d2ff', blurb: 'Peptides studied for tissue repair, recovery and regeneration.' },
    { id: 'bioreg',   title: 'Bioregulators',                         tint: '#c9a46b', blurb: 'Short peptide bioregulators studied for tissue-specific and healthspan support.' },
    { id: 'mito',     title: 'Mitochondrial Peptides',                tint: '#bf5af2', blurb: 'Compounds targeting mitochondrial function and cellular energy.' },
    { id: 'neuro',    title: 'Neuropeptides / Nootropics',            tint: '#2997ff', blurb: 'Peptides supporting cognition, mood regulation and restorative sleep.' },
    { id: 'immune',   title: 'Immunomodulatory & Anti-Inflammatory',  tint: '#5e5ce6', blurb: 'Peptides studied for immune modulation and inflammation.' },
    { id: 'melano',   title: 'Melanocortin Peptides',                 tint: '#ff6482', blurb: 'Melanocortin receptor peptides for pigmentation and sexual wellness research.' },
    { id: 'cosmetic', title: 'Cosmetic & Copper Peptides',            tint: '#ff375f', blurb: 'Copper and cosmetic peptides for skin health and anti-aging.' },
    { id: 'gonad',    title: 'Gonadotropins',                         tint: '#ff9fb2', blurb: 'Gonadotropin hormones for endogenous hormone support.' },
    { id: 'vitamins', title: 'Vitamins & Lipotropics',                tint: '#ffd60a', blurb: 'Vitamins, antioxidants and lipotropic blends supporting energy and fat metabolism.' },
    { id: 'sports',   title: 'Sports Nutrition',                      tint: '#30d158', blurb: 'Pre-workout and energy products.' },
    { id: 'lab',      title: 'Lab Supplies',                          tint: '#8e8e93', blurb: 'Reconstitution supplies, pens and accessory packs.' },
    { id: 'coaching', title: 'Coaching & Programs',                   tint: '#5ac8fa', blurb: 'Personalized coaching plans built on bloodwork, lifestyle and goals.' },
  ];

  // Product → category, from PeakFormBio-Products-Recategorized.csv.
  // Full product names first; base names (without strength) as a fallback.
  var PRODUCT_CATEGORY = {
    "cagrilintide — 10mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 5mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 10mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 12mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 15mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 20mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 30mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 40mg": "Glucagon Like Peptides (GLP)",
    "retatrutide — 60mg": "Glucagon Like Peptides (GLP)",
    "semaglutide — 10mg": "Glucagon Like Peptides (GLP)",
    "semaglutide — 15mg": "Glucagon Like Peptides (GLP)",
    "tirzepatide — 10mg": "Glucagon Like Peptides (GLP)",
    "tirzepatide — 20mg": "Glucagon Like Peptides (GLP)",
    "tirzepatide — 30mg": "Glucagon Like Peptides (GLP)",
    "tirzepatide — 40mg": "Glucagon Like Peptides (GLP)",
    "tirzepatide — 60mg": "Glucagon Like Peptides (GLP)",
    "cjc 1295 dac — 5mg": "Growth Hormone Secretagogues",
    "cjc-1295 + ipamorelin no dac — 10+10mg": "Growth Hormone Secretagogues",
    "ghrp-2 — 10mg": "Growth Hormone Secretagogues",
    "ghrp2 — 10mg": "Growth Hormone Secretagogues",
    "ghrp-6 — 10mg": "Growth Hormone Secretagogues",
    "ghrp6 — 10mg": "Growth Hormone Secretagogues",
    "ipamorelin — 10mg": "Growth Hormone Secretagogues",
    "tesamorelin — 10mg": "Growth Hormone Secretagogues",
    "follistatin 344 — 1mg": "Growth Hormone Secretagogues",
    "igf lr3 — 1mg": "Growth Hormone Secretagogues",
    "bpc — 10mg": "Tissue Repair & Regenerative",
    "tb-500 — 10mg": "Tissue Repair & Regenerative",
    "wolverine — 10mg": "Tissue Repair & Regenerative",
    "wolverine — 20mg": "Tissue Repair & Regenerative",
    "btk — 30mg": "Tissue Repair & Regenerative",
    "glow — 70mg": "Tissue Repair & Regenerative",
    "klow — 80mg": "Tissue Repair & Regenerative",
    "cartalax — 10mg": "Bioregulators",
    "epithalon — 50mg": "Bioregulators",
    "mots-c — 10mg": "Mitochondrial Peptides",
    "mots-c — 40mg": "Mitochondrial Peptides",
    "ss-31 — 10mg": "Mitochondrial Peptides",
    "ss-31 — 50mg": "Mitochondrial Peptides",
    "mito magic — 120mg": "Mitochondrial Peptides",
    "dsip — 10mg": "Neuropeptides / Nootropics",
    "dsip — 15mg": "Neuropeptides / Nootropics",
    "dsip nasal — 10mg": "Neuropeptides / Nootropics",
    "selank — 10mg": "Neuropeptides / Nootropics",
    "selank — 30mg": "Neuropeptides / Nootropics",
    "selank nasal — 10mg": "Neuropeptides / Nootropics",
    "semax — 10mg": "Neuropeptides / Nootropics",
    "semax — 30mg": "Neuropeptides / Nootropics",
    "semax nasal — 10mg": "Neuropeptides / Nootropics",
    "semax-selank blend — 20mg": "Neuropeptides / Nootropics",
    "ara-290 — 10mg": "Immunomodulatory & Anti-Inflammatory",
    "kpv — 10mg": "Immunomodulatory & Anti-Inflammatory",
    "kpv — 30mg": "Immunomodulatory & Anti-Inflammatory",
    "thymosin alpha 1 — 10mg": "Immunomodulatory & Anti-Inflammatory",
    "melanotan 1 — 10mg": "Melanocortin Peptides",
    "pt-141 — 10mg": "Melanocortin Peptides",
    "ghk-cu — 50mg": "Cosmetic & Copper Peptides",
    "ghk-cu — 100mg": "Cosmetic & Copper Peptides",
    "snap-8 — 8mg": "Cosmetic & Copper Peptides",
    "hcg — 5000iu": "Gonadotropins",
    "hcg — 10000iu": "Gonadotropins",
    "hair growth helper — 10iu": "Growth Hormone Secretagogues",
    "hair growth helper — 36iu": "Growth Hormone Secretagogues",
    "nad+ — 500mg": "Mitochondrial Peptides",
    "nad+ — 1000mg": "Mitochondrial Peptides",
    "5 amino — 50mg": "Mitochondrial Peptides",
    "b12": "Vitamins & Lipotropics",
    "glutathione — 1200mg": "Vitamins & Lipotropics",
    "l-carnitine": "Vitamins & Lipotropics",
    "lipo-c": "Vitamins & Lipotropics",
    "lipo-c fatblaster": "Vitamins & Lipotropics",
    "supershred": "Vitamins & Lipotropics",
    "pre-workout — watermelon": "Sports Nutrition",
    "trenergy caffeine pouches, watermelon, 100mg (20 pouches)": "Sports Nutrition",
    "bac water — 3ml": "Lab Supplies",
    "bac water — 10ml": "Lab Supplies",
    "disposable peptide pen | adjustable 0–60 unit dial": "Lab Supplies",
    "v2 reusable research peptide pen injector": "Lab Supplies",
    "accessory pack — 01": "Lab Supplies",
    "accessory pack — 02": "Lab Supplies",
    "accessory pack — 03": "Lab Supplies",
    "accessory pack — 04": "Lab Supplies",
    "nutrition / workout / hormone bundle — 1 month": "Coaching & Programs",
    "nutrition plan — 1 month": "Coaching & Programs",
    "workout plan — 12 weeks": "Coaching & Programs"
  };
  var BASE_CATEGORY = {};
  Object.keys(PRODUCT_CATEGORY).forEach(function (k) {
    var b = k.split(/[—–]/)[0].trim();
    if (!BASE_CATEGORY[b]) BASE_CATEGORY[b] = PRODUCT_CATEGORY[k];
  });
  // Old category titles → new, for products not in the list.
  var LEGACY = {
    'metabolic / weight management': 'Glucagon Like Peptides (GLP)',
    'growth hormone / recovery / muscle': 'Growth Hormone Secretagogues',
    'longevity / cellular health / mitochondrial': 'Mitochondrial Peptides',
    'cognitive / mood / sleep': 'Neuropeptides / Nootropics',
    'skin / beauty / anti-aging': 'Cosmetic & Copper Peptides',
    'hormonal / sexual wellness': 'Melanocortin Peptides',
    'wellness': 'Vitamins & Lipotropics',
    'supplements': 'Sports Nutrition',
    'accessories': 'Lab Supplies',
    'programs / services': 'Coaching & Programs',
  };
  // Resolve a product's category: the list above wins, then its saved category
  // (translated from the old names if needed).
  global.resolveCategory = function (name, saved) {
    var n = String(name || '').replace(/\s*[—–]\s*\$[\d,.]+\s*$/, '').trim().toLowerCase();
    if (PRODUCT_CATEGORY[n]) return PRODUCT_CATEGORY[n];
    var b = n.split(/[—–]/)[0].trim();
    if (BASE_CATEGORY[b]) return BASE_CATEGORY[b];
    var s = String(saved || '').trim();
    return LEGACY[s.toLowerCase()] || s;
  };
  // Rewrite every pricelist product's category in place.
  global.applyProductCategories = function (pricelists) {
    Object.keys(pricelists || {}).forEach(function (k) {
      var t = pricelists[k];
      (t && t.products || []).forEach(function (p) { if (p && p.name) p.category = global.resolveCategory(p.name, p.category); });
    });
    return pricelists;
  };
  if (global.PRICELISTS) global.applyProductCategories(global.PRICELISTS);

  // Ordered list of the canonical category titles (for the Admin dropdown).
  global.CATEGORY_TITLES = global.CATALOG_CATEGORIES.map(function (c) { return c.title; });

  // Look up a category by its title (preferred) or id. Case-insensitive.
  global.getCategoryMeta = function (titleOrId) {
    var v = String(titleOrId || '').trim().toLowerCase();
    if (LEGACY[v]) v = LEGACY[v].toLowerCase();
    return global.CATALOG_CATEGORIES.find(function (c) {
      return c.title.toLowerCase() === v || c.id === v;
    }) || null;
  };

  // Strip the strength/variant segment: "SS-31 — 30mg" → "SS-31".
  global.baseProductName = function (name) {
    return String(name || '').split(/[—–]/)[0].trim();
  };

  // Product name (or label) → card image path. Longest substring match wins.
  var PHOTOS = [
    { match: 'semaglutide', src: 'assets/product-semaglutide.png' },
    { match: 'tirzepatide', src: 'assets/product-tirzepatide.png' },
    { match: 'retatrutide', src: 'assets/product-retatrutide.png' },
    { match: 'cagrilintide', src: 'assets/product-cagrilintide.png' },
    { match: '5 amino', src: 'assets/product-5amino1mq.png' },
    { match: 'cjc-1295 + ipamorelin', src: 'assets/product-cjc1295-ipamorelin.png' },
    { match: 'cjc', src: 'assets/product-cjc1295.png' },
    { match: 'ipamorelin', src: 'assets/product-ipamorelin.png' },
    { match: 'tesamorelin', src: 'assets/product-tesamorelin.png' },
    { match: 'ghrp-2', src: 'assets/product-ghrp2.png' },
    { match: 'ghrp-6', src: 'assets/product-ghrp6.png' },
    { match: 'igf', src: 'assets/product-igflr3.png' },
    { match: 'bpc', src: 'assets/product-bpc157.png' },
    { match: 'tb-500', src: 'assets/product-tb500.png' },
    { match: 'wolverine', src: 'assets/product-wolverine.png' },
    { match: 'human growth hormone', src: 'assets/product-hgh.png' },
    { match: 'hgh', src: 'assets/product-hgh.png' },
    { match: 'ss-31', src: 'assets/product-ss31.png' },
    { match: 'mots', src: 'assets/product-motsc.png' },
    { match: 'mito magic', src: 'assets/product-mitomagic.png' },
    { match: 'nad', src: 'assets/product-nad.png' },
    { match: 'epithalon', src: 'assets/product-epithalon.png' },
    { match: 'semax-selank', src: 'assets/product-semax-selank.png' },
    { match: 'semax selank', src: 'assets/product-semax-selank.png' },
    { match: 'selank', src: 'assets/product-selank.png' },
    { match: 'semax', src: 'assets/product-semax.png' },
    { match: 'dsip', src: 'assets/product-dsip.png' },
    { match: 'ghk', src: 'assets/product-ghkcu.png' },
    { match: 'snap', src: 'assets/product-snap8.png' },
    { match: 'kpv', src: 'assets/product-kpv.png' },
    { match: 'klow', src: 'assets/product-klow.png' },
    { match: 'hcg', src: 'assets/product-hcg.png' },
    { match: 'pt-141', src: 'assets/product-pt141.png' },
    { match: 'pt 141', src: 'assets/product-pt141.png' },
    { match: 'lipo-c fatblaster', src: 'assets/product-lipoc.png' },
    { match: 'fatblaster', src: 'assets/product-lipoc.png' },
    { match: 'supershred', src: 'assets/product-supershred.png' },
    { match: 'b12', src: 'assets/product-b12.png' },
    { match: 'l-carnitine', src: 'assets/product-lcarnitine.png' },
    { match: 'carnitine', src: 'assets/product-lcarnitine.png' },
    { match: 'pre-workout', src: 'assets/product-preworkout.png' },
    { match: 'pre workout', src: 'assets/product-preworkout.png' },
    { match: 'trenergy', src: 'assets/product-preworkout.png' },
    { match: 'glutathione', src: 'assets/product-glutathione.png' },
    { match: 'bacteriostatic', src: 'assets/product-bacwater.png' },
    { match: 'bac water', src: 'assets/product-bacwater.png' },
    { match: 'nutrition plan', src: 'assets/program-nutrition.png' },
    { match: 'workout', src: 'assets/program-workout.png' },
  ];
  global.PRODUCT_PHOTOS = PHOTOS;
  global.getProductPhoto = function (name) {
    var lower = String(name || '').toLowerCase();
    var best = null;
    for (var i = 0; i < PHOTOS.length; i++) {
      var p = PHOTOS[i];
      if (lower.indexOf(p.match) !== -1 && (!best || p.match.length > best.match.length)) best = p;
    }
    return best ? best.src : null;
  };
})(window);
