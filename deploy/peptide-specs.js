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


  // Clinical Status for each product page, copied from the Peptide Library
  // (peptide-data.js "status"). Edit per product in Admin → Product Pages.
  var CLINICAL_STATUS = {
    "bpc-157": "Preclinical. Placed on the FDA Category 2 bulk-substance list in Sep 2023 (restricted from compounding). Human data limited to a few small pilot studies.",
    "tb-500": "Preclinical. On the FDA July 2026 PCAC review agenda. No completed Phase 3 human trials.",
    "selank": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "semax": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "kpv": "Preclinical; on the FDA July 2026 PCAC review agenda.",
    "dsip": "Preclinical — primarily animal/lab data. Not FDA-approved; human evidence limited.",
    "ss-31": "Approved for Barth syndrome; investigational for other mitochondrial conditions.",
    "cjc-1295-dac": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "5-amino-1mq": "Preclinical — primarily animal/lab data. Not FDA-approved; human evidence limited.",
    "snap-8": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "pt-141": "FDA-approved (Vyleesi) for premenopausal HSDD.",
    "mots-c": "Preclinical — primarily animal/lab data. Not FDA-approved; human evidence limited.",
    "epithalon": "Preclinical — primarily animal/lab data. Not FDA-approved; human evidence limited.",
    "ghrp-2": "Preclinical — primarily animal/lab data. Not FDA-approved; human evidence limited.",
    "ghrp-6": "Preclinical — primarily animal/lab data. Not FDA-approved; human evidence limited.",
    "ipamorelin": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "tesamorelin": "FDA-approved (Egrifta) for HIV-associated lipodystrophy.",
    "ghk-cu": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "glutathione": "Studied in Phase 2 clinical research. Not FDA-approved.",
    "semaglutide": "FDA-approved. Large Phase 3 trials show ~15% mean body-weight reduction at higher doses.",
    "tirzepatide": "FDA-approved. Phase 3 trials report ~20–22% mean weight loss at top dose.",
    "retatrutide": "Phase 3 (TRIUMPH program). Phase 2 showed ~24% mean weight loss at 48 weeks. Not FDA-approved.",
  };
  global.PEPTIDE_SPECS_SEED.forEach(function (s) { if (CLINICAL_STATUS[s.id] && !s.clinicalStatus) s.clinicalStatus = CLINICAL_STATUS[s.id]; });


  // Mechanism of Action for each product page, copied from the Peptide Library
  // (peptide-data.js "mechanism"). Edit per product in Admin → Product Pages.
  var MECHANISM = {
    "bpc-157": "Modulates the nitric-oxide system, promotes angiogenesis (new blood-vessel formation), upregulates growth-hormone receptor expression, and interacts with the dopaminergic system. Animal work reports accelerated tendon-, ligament-, and gut-tissue repair.",
    "tb-500": "Regulates actin, a cell-building protein, promoting cell migration, blood-vessel growth, and tissue remodeling. Animal studies report improved wound healing and reduced inflammation/scarring.",
    "selank": "Synthetic analog of the immunomodulatory peptide tuftsin; modulates GABA, serotonin, and BDNF pathways and stabilizes enkephalins.",
    "semax": "ACTH(4-10) analog that raises BDNF and NGF, modulates dopamine/serotonin, and is studied for neuroprotection.",
    "kpv": "Tripeptide fragment of α-MSH with intracellular anti-inflammatory action (NF-κB modulation); studied for gut and skin inflammation.",
    "dsip": "A neuromodulatory peptide that may promote delta-wave (deep) sleep and has been studied for stress, pain, and hormonal regulation.",
    "ss-31": "Concentrates in the inner mitochondrial membrane, stabilizing cardiolipin to improve mitochondrial energy production and reduce oxidative damage.",
    "cjc-1295-dac": "GHRH analog modified with a DAC group that binds serum albumin, sustaining GHRH activity for days and creating a continuous \"GH bleed\" rather than discrete pulses.",
    "5-amino-1mq": "Blocks the enzyme NNMT in fat cells, raising cellular NAD+ and SAM and promoting fat-cell metabolism — without acting on appetite.",
    "snap-8": "A peptide that competes with the SNARE complex involved in neurotransmitter release at the neuromuscular junction, gently reducing muscle contraction that causes expression lines.",
    "pt-141": "Melanocortin-receptor (MC4R) agonist that acts centrally on sexual-desire pathways rather than on blood flow.",
    "mots-c": "Mitochondrial-encoded peptide that activates AMPK and improves insulin sensitivity and metabolic flexibility.",
    "epithalon": "Synthetic analog of the pineal peptide epithalamin; research suggests it can activate telomerase and help regulate melatonin/circadian rhythm.",
    "ghrp-2": "Ghrelin-receptor agonist with potent GH-releasing action and somewhat less appetite stimulation than GHRP-6, though still some cortisol/prolactin effect.",
    "ghrp-6": "Ghrelin-receptor agonist that strongly stimulates GH release; also markedly increases hunger and can raise cortisol/prolactin at higher doses.",
    "ipamorelin": "Selective ghrelin/GH-secretagogue receptor agonist that triggers a pulse of growth hormone from the pituitary with minimal effect on cortisol or prolactin.",
    "tesamorelin": "Stabilized GHRH analog that raises GH and IGF-1, preferentially reducing visceral adipose tissue.",
    "ghk-cu": "Delivers copper to cells, stimulates collagen, elastin, and glycosaminoglycan synthesis, and has antioxidant and anti-inflammatory activity. Declines naturally with age.",
    "glutathione": "A tripeptide (glutamate-cysteine-glycine) that neutralizes free radicals, recycles other antioxidants, and supports liver detoxification pathways.",
    "semaglutide": "Mimics the incretin hormone GLP-1: suppresses appetite, slows gastric emptying, and improves insulin secretion and sensitivity.",
    "tirzepatide": "Activates both GIP and GLP-1 receptors for stronger appetite suppression and metabolic benefit than GLP-1 alone.",
    "retatrutide": "Adds glucagon-receptor activity to dual incretin action, boosting energy expenditure alongside appetite suppression.",
  };
  global.PEPTIDE_SPECS_SEED.forEach(function (s) { if (MECHANISM[s.id] && !s.mechanism) s.mechanism = MECHANISM[s.id]; });


  // Overview for each product page, copied from the Peptide Library
  // (peptide-data.js "overview"). Edit per product in Admin → Product Pages.
  var DESCRIPTION_COPY = {
    "bpc-157": "Synthetic 15-amino-acid fragment derived from a protein in human gastric juice. Studied extensively in animals for tissue healing.",
    "tb-500": "A synthetic fragment of the naturally occurring protein Thymosin Beta-4, used in research for tissue repair and recovery.",
    "selank": "Anxiolytic peptide approved in Russia; non-sedative and non-addictive.",
    "semax": "Nootropic peptide approved in Russia that supports focus, memory, and neuroplasticity.",
    "kpv": "Anti-inflammatory C-terminal fragment of alpha-MSH that does not cause immunosuppression.",
    "dsip": "Sleep-promoting peptide that may enhance deep sleep without suppressing REM.",
    "ss-31": "Mitochondria-targeted peptide; an approved indication exists for the rare disorder Barth syndrome.",
    "cjc-1295-dac": "Long-acting CJC-1295 with a Drug Affinity Complex that extends half-life to several days via albumin binding.",
    "5-amino-1mq": "NNMT inhibitor that boosts NAD+ for fat metabolism without affecting appetite.",
    "snap-8": "Topical peptide that reduces wrinkle depth by relaxing facial muscle contraction.",
    "pt-141": "FDA-approved for hypoactive sexual desire disorder; works through brain melanocortin pathways.",
    "mots-c": "Mitochondrial-derived peptide studied for metabolic regulation and as an exercise mimetic.",
    "epithalon": "Tetrapeptide studied as a telomerase activator for anti-aging effects on cellular lifespan.",
    "ghrp-2": "Potent GH-releasing peptide with strong GH output and less hunger than GHRP-6.",
    "ghrp-6": "First-generation GH secretagogue producing strong GH release with significant appetite stimulation.",
    "ipamorelin": "Selective growth-hormone secretagogue, considered one of the cleanest and best-tolerated GHRPs.",
    "tesamorelin": "FDA-approved GHRH analog indicated for reducing visceral fat in HIV-associated lipodystrophy.",
    "ghk-cu": "Naturally occurring copper-binding tripeptide widely used in skincare for wound healing and anti-aging.",
    "glutathione": "The body’s master antioxidant — critical for detoxification, immune function, and cellular protection.",
    "semaglutide": "GLP-1 receptor agonist, FDA-approved for type-2 diabetes and chronic weight management.",
    "tirzepatide": "Dual GLP-1 / GIP receptor agonist, FDA-approved for type-2 diabetes and weight management.",
    "retatrutide": "Triple receptor agonist (GLP-1 / GIP / glucagon) — the most potent weight-loss peptide currently in trials.",
  };
  global.PEPTIDE_SPECS_SEED.forEach(function (s) { if (DESCRIPTION_COPY[s.id] && !s.description) s.description = DESCRIPTION_COPY[s.id]; });

  // Reported Effects (one per line) for each product page, copied from the Peptide Library
  // (peptide-data.js "benefits"). Edit per product in Admin → Product Pages.
  var EFFECTS_COPY = {
    "bpc-157": "May accelerate tendon, ligament, and muscle healing\nAssociated with gut-lining repair in animal models\nPromotes new blood-vessel formation at injury sites\nMay reduce inflammation and oxidative stress\nStudied for neuroprotective effects in animals",
    "tb-500": "May support muscle, tendon, and ligament recovery\nPromotes cell migration to injury sites\nMay reduce inflammation and adhesions/scarring\nStudied for cardiac tissue repair",
    "selank": "Reduces anxiety without sedation\nMay improve focus and mental clarity\nNon-addictive profile",
    "semax": "May enhance focus and memory\nRaises BDNF/NGF in studies\nResearched for stroke recovery (in Russia)",
    "kpv": "Anti-inflammatory without immunosuppression\nStudied for IBD/gut and skin conditions\nMay aid healing of inflamed tissue",
    "dsip": "May improve deep-sleep quality\nStudied for stress resilience\nPossible mild analgesic effect",
    "ss-31": "Improves mitochondrial energy output\nStudied for heart failure and mitochondrial disease\nReduces oxidative stress",
    "cjc-1295-dac": "Once-weekly convenience\nSustained elevation of GH/IGF-1",
    "5-amino-1mq": "Promotes fat-cell metabolism\nRaises NAD+\nDoes not suppress appetite",
    "snap-8": "Softens expression wrinkles topically\nNeedle-free \"relaxing\" alternative concept\nSmoother forehead/eye-area appearance",
    "pt-141": "Increases sexual desire/arousal in both sexes (research)\nCentrally acting — not a vasodilator",
    "mots-c": "May improve metabolic health and insulin sensitivity\nStudied as an exercise-mimetic\nMitochondrial support",
    "epithalon": "Studied for telomere maintenance\nMay support sleep and circadian rhythm\nAntioxidant activity in studies",
    "ghrp-2": "Potent GH release\nLess hunger than GHRP-6",
    "ghrp-6": "Strong GH pulse\nAppetite stimulation (useful for bulking/underweight)",
    "ipamorelin": "Stimulates a natural GH pulse\nMinimal cortisol/prolactin impact vs older GHRPs\nMay support recovery, body composition, and sleep\nLittle appetite stimulation",
    "tesamorelin": "Reduces visceral (belly) fat in studies\nRaises GH/IGF-1\nMay improve some cognitive markers in research",
    "ghk-cu": "Stimulates collagen and elastin production\nImproves skin firmness and reduces fine lines\nSupports wound healing\nMay support hair-follicle health",
    "glutathione": "Master antioxidant / detox support\nImmune and liver support\nStudied for skin brightening (IV)",
    "semaglutide": "Significant appetite suppression and weight loss\nImproved glycemic control\nCardiovascular risk reduction in trials",
    "tirzepatide": "Greater weight loss than single-agonist GLP-1s in trials\nStrong glycemic control\nAppetite and craving reduction",
    "retatrutide": "Largest weight loss reported among incretin agents in trials\nImproves glycemic and metabolic markers\nMay benefit fatty-liver disease",
  };
  global.PEPTIDE_SPECS_SEED.forEach(function (s) { if (EFFECTS_COPY[s.id] && !s.effects) s.effects = EFFECTS_COPY[s.id]; });


  // Possible Side Effects for each product page, copied from the Peptide Library
  // (peptide-data.js "sideEffects", one per line). Edit per product in Admin → Product Pages.
  var SIDEEFFECTS_COPY = {
    "bpc-157": "Injection-site irritation\nOccasional nausea\nDizziness\nFatigue\nHeadache",
    "tb-500": "Injection-site reactions\nHead-rush / lightheadedness shortly after dosing\nFatigue",
    "selank": "Nasal irritation\nMild fatigue\nRare headache",
    "semax": "Nasal irritation\nOverstimulation at high doses",
    "kpv": "Generally well tolerated\nInjection-site irritation",
    "dsip": "Injection-site reactions\nGrogginess\nHeadache",
    "ss-31": "Injection-site reactions",
    "cjc-1295-dac": "Water retention\nTingling/numbness\nInjection-site reactions\nHeadache",
    "5-amino-1mq": "Generally well tolerated in early use\nPossible mild GI effects",
    "snap-8": "Rare mild irritation",
    "pt-141": "Nausea\nFlushing\nHeadache\nTransient blood-pressure rise",
    "mots-c": "Injection-site reactions\nFatigue",
    "epithalon": "Injection-site reactions\nGenerally well tolerated in studies",
    "ghrp-2": "Hunger\nWater retention\nFlushing\nMild prolactin/cortisol rise",
    "ghrp-6": "Strong hunger\nWater retention\nTingling\nCortisol/prolactin rise at higher doses",
    "ipamorelin": "Injection-site reactions\nHead-rush / flushing\nWater retention\nTingling",
    "tesamorelin": "Injection-site reactions\nJoint pain\nSwelling\nRaised blood glucose",
    "ghk-cu": "Mild skin irritation\nRedness at application site",
    "glutathione": "Generally well tolerated\nPossible bloating (oral)",
    "semaglutide": "Nausea\nConstipation / diarrhea\nReduced appetite\nInjection-site reactions",
    "tirzepatide": "Nausea\nDiarrhea / constipation\nDecreased appetite\nInjection-site reactions",
    "retatrutide": "Nausea\nGI upset\nAppetite loss\nIncreased heart rate",
  };
  global.PEPTIDE_SPECS_SEED.forEach(function (s) { if (SIDEEFFECTS_COPY[s.id] && !s.sideEffects) s.sideEffects = SIDEEFFECTS_COPY[s.id]; });

  // Contraindications & Warnings for each product page, copied from the Peptide Library
  // (peptide-data.js "warnings", one per line). Edit per product in Admin → Product Pages.
  var WARNINGS_COPY = {
    "bpc-157": "Theoretical caution with active cancer (promotes angiogenesis — unproven in humans)\nFDA Category 2 — restricted from compounding\nNot medical advice",
    "tb-500": "WADA-prohibited in sport\nTheoretical caution with active malignancy\nNot medical advice",
    "selank": "Not approved in the US\nNot medical advice",
    "semax": "Not approved in the US\nNot medical advice",
    "kpv": "Preclinical\nNot medical advice",
    "dsip": "Limited human data\nNot medical advice",
    "ss-31": "Approved only for specific indication\nNot medical advice",
    "cjc-1295-dac": "Caution with diabetes\nWADA-prohibited\nNot medical advice",
    "5-amino-1mq": "Preclinical/early data\nNot medical advice",
    "snap-8": "Topical use only\nNot medical advice",
    "pt-141": "Avoid with uncontrolled hypertension/CV disease\nMay darken skin/moles with repeated use\nNot medical advice",
    "mots-c": "Preclinical\nNot medical advice",
    "epithalon": "Human evidence limited\nNot medical advice",
    "ghrp-2": "Caution with diabetes\nWADA-prohibited\nNot medical advice",
    "ghrp-6": "Caution with diabetes\nWADA-prohibited\nNot medical advice",
    "ipamorelin": "Caution with diabetes/insulin resistance\nWADA-prohibited in sport\nNot medical advice",
    "tesamorelin": "Avoid with active malignancy\nCaution with diabetes\nPrescription only\nNot medical advice",
    "ghk-cu": "Patch-test topical products\nNot medical advice",
    "glutathione": "Caution with asthma (inhaled forms)\nNot medical advice",
    "semaglutide": "Boxed warning: thyroid C-cell tumor risk (rodents)\nAvoid with personal/family history of medullary thyroid carcinoma or MEN-2\nPancreatitis caution\nNot medical advice",
    "tirzepatide": "Boxed warning: thyroid C-cell tumor risk (rodents)\nAvoid with MTC/MEN-2 history\nPancreatitis caution\nNot medical advice",
    "retatrutide": "Investigational — not FDA-approved\nNot medical advice",
  };
  global.PEPTIDE_SPECS_SEED.forEach(function (s) { if (WARNINGS_COPY[s.id] && !s.warnings) s.warnings = WARNINGS_COPY[s.id]; });

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
