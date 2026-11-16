/* ────────────────────────────────────────────────────────────────────────────
   PeakForm Bio — Peptide spec database (feeds the product spec cards)

   • PEPTIDE_SPECS_SEED is the bundled starting list. Admin → Catalog → Spec Cards
     saves edits/additions to app_settings key 'peptide_specs'; the live list from
     /api/public/peptide-specs overrides the seed entry-by-entry (matched by id).
   • A pricelist product gets a spec card when its base name (the part before
     " — ") matches a spec's name or one of its aliases (case/punctuation-blind).
   • The card's MG box comes from the product's strength ("BPC — 10mg" → 10 MG),
     so one spec entry covers every strength you stock.

   Values: formula + CAS from supplier/registry data (MedChemExpress, Selleck,
   ChemicalBook, USP/KEGG); every molecular weight was cross-checked against its
   formula. Formula is plain text (C62H98N16O22) — the card renders subscripts.
   ──────────────────────────────────────────────────────────────────────────── */
(function (global) {
  var LYO = 'Lyophilized powder vial';

  global.PEPTIDE_SPEC_DEFAULTS = {
    form: LYO,
    tagline: 'High purity peptide for research applications.',
  };

  global.PEPTIDE_SPECS_SEED = [
    { id: 'bpc-157',      name: 'BPC-157',      aliases: ['BPC', 'BPC 157'],                  mw: '1419.5 g/mol',  formula: 'C62H98N16O22',        cas: '137525-51-0' },
    { id: 'tb-500',       name: 'TB-500',       aliases: ['TB500', 'Thymosin Beta-4'],        mw: '4963.4 g/mol',  formula: 'C212H350N56O78S',     cas: '77591-33-4' },
    { id: 'selank',       name: 'SELANK',       aliases: [],                                  mw: '751.9 g/mol',   formula: 'C33H57N11O9',         cas: '129954-34-3' },
    { id: 'semax',        name: 'SEMAX',        aliases: [],                                  mw: '813.9 g/mol',   formula: 'C37H51N9O10S',        cas: '80714-61-0' },
    { id: 'kpv',          name: 'KPV',          aliases: [],                                  mw: '342.4 g/mol',   formula: 'C16H30N4O4',          cas: '67727-97-3' },
    { id: 'dsip',         name: 'DSIP',         aliases: [],                                  mw: '848.8 g/mol',   formula: 'C35H48N10O15',        cas: '62568-57-4' },
    { id: 'ss-31',        name: 'SS-31',        aliases: ['Elamipretide'],                    mw: '639.8 g/mol',   formula: 'C32H49N9O5',          cas: '736992-21-5' },
    { id: 'cjc-1295-dac', name: 'CJC-1295 DAC', aliases: ['CJC 1295 DAC'],                    mw: '3647.3 g/mol',  formula: 'C165H269N47O46',      cas: '863288-34-0' },
    { id: '5-amino-1mq',  name: '5-AMINO-1MQ',  aliases: ['5 Amino', '5-Amino', '5 Amino 1MQ'], mw: '286.1 g/mol', formula: 'C10H11IN2',           cas: '42464-96-0', form: 'Iodide salt, powder vial' },
    { id: 'snap-8',       name: 'SNAP-8',       aliases: ['Acetyl Octapeptide-3'],            mw: '1075.2 g/mol',  formula: 'C41H70N16O16S',       cas: '868844-74-0' },
    { id: 'pt-141',       name: 'PT-141',       aliases: ['Bremelanotide'],                   mw: '1025.2 g/mol',  formula: 'C50H68N14O10',        cas: '189691-06-3' },
    { id: 'mots-c',       name: 'MOTS-c',       aliases: [],                                  mw: '2174.6 g/mol',  formula: 'C101H152N28O22S2',    cas: '1627580-64-6' },
    { id: 'epithalon',    name: 'EPITHALON',    aliases: ['Epitalon'],                        mw: '390.4 g/mol',   formula: 'C14H22N4O9',          cas: '307297-39-8' },
    { id: 'ghrp-2',       name: 'GHRP-2',       aliases: ['Pralmorelin'],                     mw: '818.0 g/mol',   formula: 'C45H55N9O6',          cas: '158861-67-7' },
    { id: 'ghrp-6',       name: 'GHRP-6',       aliases: [],                                  mw: '873.0 g/mol',   formula: 'C46H56N12O6',         cas: '87616-84-0' },
    { id: 'ipamorelin',   name: 'IPAMORELIN',   aliases: [],                                  mw: '711.9 g/mol',   formula: 'C38H49N9O5',          cas: '170851-70-4' },
    { id: 'igf-1-lr3',    name: 'IGF-1 LR3',    aliases: ['IGF LR3', 'IGF1 LR3'],             mw: '9117.6 g/mol',  formula: 'C400H625N111O115S9',  cas: '946870-92-4' },
    { id: 'tesamorelin',  name: 'TESAMORELIN',  aliases: [],                                  mw: '5135.9 g/mol',  formula: 'C221H366N72O67S',     cas: '218949-48-5' },
    { id: 'ghk-cu',       name: 'GHK-Cu',       aliases: ['GHK Cu', 'Copper Peptide'],        mw: '401.9 g/mol',   formula: 'C14H22CuN6O4',        cas: '89030-95-5' },
    { id: 'nad',          name: 'NAD+',         aliases: ['NAD'],                             mw: '663.4 g/mol',   formula: 'C21H27N7O14P2',       cas: '53-84-9' },
    { id: 'glutathione',  name: 'GLUTATHIONE',  aliases: [],                                  mw: '307.3 g/mol',   formula: 'C10H17N3O6S',         cas: '70-18-8' },
    { id: 'hcg',          name: 'HCG',          aliases: ['Chorionic Gonadotropin'],          mw: '~37.9 kDa',     formula: 'Glycoprotein (α + β)', cas: '9002-61-3' },
    { id: 'hgh',          name: 'HGH',          aliases: ['Somatropin'],                      mw: '22,125 g/mol',  formula: 'C990H1528N262O300S7', cas: '12629-01-5' },
    { id: 'cagrilintide', name: 'CAGRILINTIDE', aliases: [],                                  mw: '4409.0 g/mol',  formula: 'C194H312N54O59S2',    cas: '1415456-99-3' },
    { id: 'semaglutide',  name: 'SEMAGLUTIDE',  aliases: [],                                  mw: '4113.6 g/mol',  formula: 'C187H291N45O59',      cas: '910463-68-2' },
    { id: 'tirzepatide',  name: 'TIRZEPATIDE',  aliases: [],                                  mw: '4813.5 g/mol',  formula: 'C225H348N48O68',      cas: '2023788-19-2' },
    { id: 'retatrutide',  name: 'RETATRUTIDE',  aliases: [],                                  mw: '4731.3 g/mol',  formula: 'C221H342N46O68',      cas: '2381089-83-2' },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9+]/g, ''); };

  // "BPC — 10mg" → { base: 'BPC', strength: '10 MG' }
  global.splitProductName = function (name) {
    var parts = String(name || '').split(/\s*[—–]\s*/);
    var base = (parts[0] || '').trim();
    var raw = (parts[1] || '').trim();
    var strength = raw
      ? raw.replace(/(\d)\s*(mg|mcg|iu|ml|g)\b/gi, function (_, d, u) { return d + ' ' + u.toUpperCase(); })
           .replace(/\bmg\b/g, 'MG')
      : '';
    return { base: base, strength: strength };
  };

  // Several strengths of one product → "10 / 30 MG" (same unit) or "10 MG · 30 MG".
  global.joinStrengths = function (list) {
    var uniq = (list || []).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (uniq.length <= 1) return uniq[0] || '';
    var units = uniq.map(function (s) { var m = s.match(/\s([A-Z]+)$/); return m ? m[1] : ''; });
    if (units.every(function (u) { return u && u === units[0]; })) {
      return uniq.map(function (s) { return s.replace(/\s[A-Z]+$/, ''); }).join(' / ') + ' ' + units[0];
    }
    return uniq.join(' · ');
  };

  // Merge live specs over the seed (live wins by id; live-only entries appended).
  global.mergePeptideSpecs = function (live) {
    var out = (global.PEPTIDE_SPECS_SEED || []).map(function (s) { return Object.assign({}, s); });
    (Array.isArray(live) ? live : []).forEach(function (s) {
      if (!s || !s.id) return;
      var i = out.findIndex(function (o) { return o.id === s.id; });
      if (s._deleted) { if (i >= 0) out.splice(i, 1); return; }
      if (i >= 0) out[i] = Object.assign({}, out[i], s); else out.push(Object.assign({}, s));
    });
    return out;
  };

  // Find the spec for a product name (base name or full "Name — 10mg").
  global.findPeptideSpec = function (productName, specs) {
    var base = norm(global.splitProductName(productName).base);
    if (!base) return null;
    var list = specs || global.PEPTIDE_SPECS || global.PEPTIDE_SPECS_SEED || [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var keys = [s.name, s.id].concat(s.aliases || []).map(norm);
      if (keys.indexOf(base) >= 0) return s;
    }
    return null;
  };

  // Load live specs once; resolves to the merged list and caches it globally.
  var pending = null;
  global.loadPeptideSpecs = function () {
    if (!pending) {
      global.PEPTIDE_SPECS = global.mergePeptideSpecs([]);
      pending = fetch('/api/public/peptide-specs', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (d) { global.PEPTIDE_SPECS = global.mergePeptideSpecs(d && d.specs); return global.PEPTIDE_SPECS; })
        .catch(function () { return global.PEPTIDE_SPECS; });
    }
    return pending;
  };
})(window);
