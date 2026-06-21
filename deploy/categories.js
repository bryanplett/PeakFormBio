// categories.js — Shared catalog category definitions + product→photo mapping.
// Single source of truth for category order, titles, accent colors, and blurbs,
// used by the public site (catalog.jsx) and the client portal (ClientPortal.html).
// Load as a plain <script> BEFORE those files.
(function (global) {
  'use strict';

  global.CATALOG_CATEGORIES = [
    { id: 'metabolic',   title: 'Metabolic / Weight Management',               tint: '#ff9f0a', blurb: 'Compounds that support metabolic health, appetite regulation, and body composition.' },
    { id: 'growth',      title: 'Growth Hormone / Recovery / Muscle',          tint: '#34c759', blurb: 'Peptides that support endogenous growth hormone, lean tissue, and recovery.' },
    { id: 'longevity',   title: 'Longevity / Cellular Health / Mitochondrial', tint: '#bf5af2', blurb: 'Compounds targeting cellular energetics, mitochondrial function, and healthspan.' },
    { id: 'cognitive',   title: 'Cognitive / Mood / Sleep',                    tint: '#2997ff', blurb: 'Peptides supporting cognition, mood regulation, and restorative sleep.' },
    { id: 'beauty',      title: 'Skin / Beauty / Anti-Aging',                  tint: '#ff375f', blurb: 'Topical and systemic peptides for skin health, repair, and aesthetic outcomes.' },
    { id: 'hormonal',    title: 'Hormonal / Sexual Wellness',                  tint: '#ff6482', blurb: 'Compounds for hormonal balance and sexual wellness.' },
    { id: 'wellness',    title: 'Wellness',                                    tint: '#ffd60a', blurb: 'Lipotropic and wellness compounds supporting fat metabolism, energy, detoxification, and recovery.' },
    { id: 'accessories', title: 'Accessories',                                 tint: '#8e8e93', blurb: 'Reconstitution supplies and curated accessory packs.' },
    { id: 'programs',    title: 'Programs / Services',                         tint: '#5ac8fa', blurb: 'Personalized coaching plans built on bloodwork, lifestyle, and goals.' },
  ];

  // Ordered list of the canonical category titles (for the Admin dropdown).
  global.CATEGORY_TITLES = global.CATALOG_CATEGORIES.map(function (c) { return c.title; });

  // Look up a category by its title (preferred) or id. Case-insensitive.
  global.getCategoryMeta = function (titleOrId) {
    var v = String(titleOrId || '').trim().toLowerCase();
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
    { match: 'lipo', src: 'assets/product-lipoc.png' },
    { match: 'supershred', src: 'assets/product-supershred.png' },
    { match: 'b12', src: 'assets/product-b12.png' },
    { match: 'l-carnitine', src: 'assets/product-lcarnitine.png' },
    { match: 'carnitine', src: 'assets/product-lcarnitine.png' },
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
