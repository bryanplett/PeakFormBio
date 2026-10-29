// hormone-site.jsx — public-site TRT / HRT pieces: split hero + program section.
// Edit HORMONE_SITE below to change wording or add a starting price.

const HORMONE_SITE = {
  startingPrice: '',          // e.g. '$149/mo' — leave '' to hide the "Starting at" line
  steps: [
    { n: '01', title: 'Intake questionnaire', body: 'Tell us about your symptoms, history and goals. It takes about ten minutes.' },
    { n: '02', title: 'Lab work', body: 'A comprehensive hormone and health panel gives your provider a clear baseline.' },
    { n: '03', title: 'Provider consultation', body: 'Review your results one-on-one with a licensed provider from our partner clinic.' },
    { n: '04', title: 'Your protocol', body: 'If treatment is appropriate, your provider prescribes a plan built around your labs.' },
    { n: '05', title: 'Ongoing monitoring', body: 'Follow-up labs and check-ins keep your levels on target and your plan adjusted.' },
  ],
  includes: ['Comprehensive baseline labs', 'Licensed provider consultation', 'Personalized protocol', 'Follow-up monitoring labs', 'Client portal with your plan, labs and resources'],
};

const hsEyebrow = { fontSize: 13, fontWeight: 600, color: '#2997ff', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 16 };

const HormoneSplitHero = ({ onSchedule }) => (
  <section className="hs-hero" style={{ background: '#000', paddingTop: 40 }}>
    <style>{`
      .hs-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:12px;padding:12px;min-height:calc(100vh - 92px)}
      .hs-panel{position:relative;overflow:hidden;border-radius:24px;display:flex;flex-direction:column;justify-content:flex-end;padding:56px}
      .hs-panel h1,.hs-panel h2{color:#fff;letter-spacing:-0.04em;line-height:1.02;text-wrap:balance}
      @media (max-width:900px){.hs-grid{grid-template-columns:1fr;min-height:0}.hs-panel{padding:36px 26px;min-height:440px}}
    `}</style>
    <div className="hs-grid">
      <div className="hs-panel" style={{ background: 'radial-gradient(120% 90% at 0% 0%, #10243d 0%, #0a0a0a 60%)' }}>
        <img src="1_5058098532557259934/PNG/VV/Asset 1@4x.png" alt="PeakForm Bio"
          style={{ display: 'block', width: 180, height: 'auto', opacity: 0.95, marginBottom: 'auto', paddingBottom: 32, alignSelf: 'flex-start' }} />
        <p style={hsEyebrow}>Hormone Optimization · TRT / HRT</p>
        <h1 style={{ fontSize: 'clamp(44px, 6vw, 80px)', fontWeight: 700, marginBottom: 22 }}>Feel like<br />yourself again.</h1>
        <p style={{ fontSize: 19, fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, maxWidth: 520, marginBottom: 34 }}>
          Lab-guided hormone therapy for men and women, overseen by a licensed provider and built around your results.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => onSchedule('Hormone Therapy (TRT / HRT)')} style={{ padding: '16px 34px', fontSize: 18 }}>Book a consultation</button>
          <a href="#hormone" className="btn-ghost-light" style={{ padding: '15px 30px', fontSize: 17 }}>How it works</a>
        </div>
        {HORMONE_SITE.startingPrice && (
          <p style={{ marginTop: 22, fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Starting at <strong style={{ color: '#fff' }}>{HORMONE_SITE.startingPrice}</strong></p>
        )}
      </div>

      <div className="hs-panel" style={{ background: '#0a0a0a' }}>
        <img src="uploads/ChatGPT Image Apr 26, 2026, 03_02_19 PM.png" alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.15) 100%)' }} />
        <div style={{ position: 'relative' }}>
          <p style={hsEyebrow}>Peptides · Fitness · Nutrition</p>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 700, marginBottom: 18 }}>Your health, optimized.</h2>
          <p style={{ fontSize: 17, fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, maxWidth: 420, marginBottom: 28 }}>
            Research peptides, training and nutrition plans tailored to you.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#supplementation" className="btn-ghost-light" style={{ padding: '13px 26px', fontSize: 16 }}>Explore peptides</a>
            <button className="btn-ghost-light" onClick={() => onSchedule('')} style={{ padding: '13px 26px', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>Request information</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HormoneSection = ({ onSchedule }) => (
  <section id="hormone" style={{ background: '#000', color: '#f5f5f7', padding: '120px 24px' }}>
    <style>{`
      .hs-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
      .hs-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-top:12px}
      @media (max-width:1000px){.hs-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media (max-width:700px){.hs-steps,.hs-two{grid-template-columns:1fr}}
    `}</style>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <p style={hsEyebrow}>How it works</p>
      <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, maxWidth: 760, marginBottom: 20, textWrap: 'balance' }}>
        Hormone therapy, guided by your labs.
      </h2>
      <p style={{ fontSize: 19, fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 640, marginBottom: 56 }}>
        Low energy, poor sleep, stalled progress and low drive can all have hormonal causes. Our program starts with data and keeps checking it.
      </p>

      <div className="hs-steps">
        {HORMONE_SITE.steps.map(s => (
          <div key={s.n} style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2997ff', marginBottom: 18 }}>{s.n}</div>
            <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 10 }}>{s.title}</h3>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{s.body}</p>
          </div>
        ))}
      </div>

      <div className="hs-two">
        <div style={{ background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px' }}>
          <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 20 }}>What's included</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HORMONE_SITE.includes.map(i => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ color: '#2997ff', fontWeight: 700 }}>✓</span>{i}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: 'linear-gradient(160deg, #0d2a4a 0%, #0a0a0a 75%)', border: '1px solid rgba(41,151,255,0.25)', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 28 }}>
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>Start with a consultation</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              We'll walk you through labs, timelines and what to expect. Members get their full plan, lab results and resources in the PeakForm Bio client portal.
            </p>
            {HORMONE_SITE.startingPrice && (
              <p style={{ marginTop: 18, fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>Starting at <strong style={{ color: '#fff', fontSize: 22 }}>{HORMONE_SITE.startingPrice}</strong></p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onSchedule('Hormone Therapy (TRT / HRT)')} style={{ padding: '15px 30px', fontSize: 17 }}>Book a consultation</button>
            <a href="ClientPortal.html" className="btn-ghost-light" style={{ padding: '14px 26px', fontSize: 16 }}>Client login</a>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 28, maxWidth: 860 }}>
        Prescriptions are issued only by a licensed provider through our partner clinic, after a consultation and lab review, and only when clinically appropriate. Individual results vary.
      </p>
    </div>
  </section>
);

Object.assign(window, { HormoneSplitHero, HormoneSection, HORMONE_SITE });
