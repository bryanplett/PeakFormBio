/* PeakForm Bio — product photo lookup (shared by the Telegram store and the
   product pages). Mirrors PRODUCT_PHOTOS in ClientPortal.html. Longest match wins,
   so 'cjc-1295 + ipamorelin' beats 'cjc'. Exports window.getProductPhoto(label). */
(function () {
window.PFB_PRODUCT_PHOTOS = [
  { match: 'semaglutide',  src: 'assets/product-semaglutide.png' },
  { match: 'tirzepatide',  src: 'assets/product-tirzepatide.png' },
  { match: 'retatrutide',  src: 'assets/product-retatrutide.png' },
  { match: 'ghk',          src: 'assets/product-ghkcu.png' },
  { match: 'klow',         src: 'assets/product-klow.png' },
  { match: 'snap',         src: 'assets/product-snap8.png' },
  { match: 'kpv',          src: 'assets/product-kpv.png' },
  { match: 'pt-141',       src: 'assets/product-pt141.png' },
  { match: 'pt 141',       src: 'assets/product-pt141.png' },
  { match: 'hcg',          src: 'assets/product-hcg.png' },
  { match: 'cagrilintide', src: 'assets/product-cagrilintide.png' },
  { match: '5 amino',      src: 'assets/product-5amino1mq.png' },
  { match: 'cjc-1295 + ipamorelin', src: 'assets/product-cjc1295-ipamorelin.png' },
  { match: 'cjc',          src: 'assets/product-cjc1295.png' },
  { match: 'ipamorelin',   src: 'assets/product-ipamorelin.png' },
  { match: 'tesamorelin',  src: 'assets/product-tesamorelin.png' },
  { match: 'ghrp-2',       src: 'assets/product-ghrp2.png' },
  { match: 'ghrp-6',       src: 'assets/product-ghrp6.png' },
  { match: 'igf',          src: 'assets/product-igflr3.png' },
  { match: 'bpc',          src: 'assets/product-bpc157.png' },
  { match: 'tb-500',       src: 'assets/product-tb500.png' },
  { match: 'tb 500',       src: 'assets/product-tb500.png' },
  { match: 'wolverine',    src: 'assets/product-wolverine.png' },
  { match: 'semax-selank', src: 'assets/product-semax-selank.png' },
  { match: 'semax selank', src: 'assets/product-semax-selank.png' },
  { match: 'selank',       src: 'assets/product-selank.png' },
  { match: 'semax',        src: 'assets/product-semax.png' },
  { match: 'dsip',         src: 'assets/product-dsip.png' },
  { match: 'nad',          src: 'assets/product-nad.png' },
  { match: 'ss-31',        src: 'assets/product-ss31.png' },
  { match: 'ss 31',        src: 'assets/product-ss31.png' },
  { match: 'mots',         src: 'assets/product-motsc.png' },
  { match: 'epithalon',    src: 'assets/product-epithalon.png' },
  { match: 'mito magic',   src: 'assets/product-mitomagic.png' },
  { match: 'human growth hormone', src: 'assets/product-hgh.png' },
  { match: 'hgh',          src: 'assets/product-hgh.png' },
  { match: 'l-carnitine',  src: 'assets/product-lcarnitine.png' },
  { match: 'carnitine',    src: 'assets/product-lcarnitine.png' },
  { match: 'glutathione',  src: 'assets/product-glutathione.png' },
  { match: 'lipo-c',       src: 'assets/product-lipoc.png' },
  { match: 'lipo c',       src: 'assets/product-lipoc.png' },
  { match: 'supershred',   src: 'assets/product-supershred.png' },
  { match: 'b12',          src: 'assets/product-b12.png' },
  { match: 'trenergy',     src: 'assets/product-trenergy-pouches.png' },
  { match: 'reusable research peptide pen', src: 'assets/product-pen-reusable.png' },
  { match: 'disposable peptide pen', src: 'assets/product-pen-disposable.png' },
  { match: 'bacteriostatic', src: 'assets/product-bacwater.png' },
  { match: 'bac water',    src: 'assets/product-bacwater.png' },
  { match: 'nutrition plan', src: 'assets/program-nutrition.png' },
  { match: 'workout',      src: 'assets/program-workout.png' },
];

  window.getProductPhoto = function (label) {
    if (!label) return null;
    var lower = String(label).toLowerCase(), best = null;
    window.PFB_PRODUCT_PHOTOS.forEach(function (p) {
      if (lower.indexOf(p.match) >= 0 && (!best || p.match.length > best.match.length)) best = p;
    });
    return best ? best.src : null;
  };
})();
