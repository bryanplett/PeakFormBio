// hormone-site.jsx — public-site TRT / HRT pieces: split hero + program section.
// Edit HORMONE_SITE below to change wording or add a starting price.

const HORMONE_SITE = {
  startingPrice: '',          // e.g. '$149/mo' — leave '' to hide the "Starting at" line
  heroImage: '',              // photo for the TRT/HRT slide, e.g. 'uploads/trt-hero.png' — '' uses the drafted background
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

// Full-screen hero slideshow: TRT/HRT slide and peptides slide, same type
// scale on both. Auto-advances every 7s (pauses on hover); arrows, dots, swipe.
const HormoneSplitHero = ({ onSchedule }) => {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const touch = React.useRef(null);
  const N = 2;
  const go = (n) => setI(((n % N) + N) % N);
  React.useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(i + 1), 7000);
    return () => clearTimeout(t);
  }, [i, paused]);

  const eyebrow = { fontSize: 13, fontWeight: 600, color: '#2997ff', letterSpacing: '0.10em', marginBottom: 20, textTransform: 'uppercase' };
  const title = { fontSize: 'clamp(52px, 7vw, 84px)', fontWeight: 700, color: '#fff', lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: 24, textWrap: 'balance' };
  const sub = { fontSize: 20, fontWeight: 300, color: 'rgba(255,255,255,0.68)', lineHeight: 1.55, letterSpacing: '-0.01em', maxWidth: 500, marginBottom: 44 };
  const logo = <img className="hs-logo" src="1_5058098532557259934/PNG/VV/Asset 1@4x.png" alt="PeakForm Bio" style={{ display: 'block', width: 260, height: 'auto', marginBottom: 36 }} />;
  const overlay = { position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.10) 100%)', pointerEvents: 'none' };
  const arrow = (dir) => (
    <button type="button" aria-label={dir < 0 ? 'Previous slide' : 'Next slide'} onClick={() => go(i + dir)} className="hs-arrow"
      style={{ position: 'absolute', top: '50%', [dir < 0 ? 'left' : 'right']: 20, transform: 'translateY(-50%)', zIndex: 5, width: 48, height: 48, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 22, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(6px)' }}>{dir < 0 ? '‹' : '›'}</button>
  );

  return (
    <section className="hs-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={e => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={e => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); touch.current = null; }}
      style={{ position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
      <style>{`
        .hs-track{display:flex;width:200%;transition:transform .8s cubic-bezier(.65,0,.35,1)}
        .hs-slide{position:relative;width:50%;min-height:100vh;display:flex;align-items:center;overflow:hidden}
        .hs-content{position:relative;z-index:2;padding:120px 96px 110px;max-width:760px}
        .hs-rings{position:absolute;right:-10%;top:50%;width:min(1100px,95vw);aspect-ratio:1;transform:translateY(-50%);border-radius:50%;
          background:repeating-radial-gradient(circle at center, rgba(41,151,255,0.10) 0 1px, transparent 1px 46px);
          -webkit-mask:radial-gradient(circle at center, #000 0%, #000 45%, transparent 70%);mask:radial-gradient(circle at center, #000 0%, #000 45%, transparent 70%)}
        @media (max-width:900px){.hs-content{padding:100px 26px 120px}.hs-arrow{display:none}.hs-logo{width:190px!important}}
      `}</style>

      <div className="hs-track" style={{ transform: `translateX(-${i * 50}%)` }}>
        {/* Slide 1 — TRT / HRT */}
        <div className="hs-slide" aria-hidden={i !== 0}>
          {HORMONE_SITE.heroImage
            ? <img src={HORMONE_SITE.heroImage} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.8 }} />
            : <>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 90% at 78% 45%, #0f3a66 0%, #0a1a2e 38%, #0a0a0a 72%)' }} />
                <div className="hs-rings" />
                <div style={{ position: 'absolute', right: '14%', top: '50%', width: 'min(420px,40vw)', aspectRatio: '1', transform: 'translateY(-50%)', borderRadius: '50%',
                  background: 'radial-gradient(circle at 40% 35%, rgba(41,151,255,0.55) 0%, rgba(0,102,204,0.25) 40%, transparent 70%)', filter: 'blur(8px)' }} />
              </>}
          <div style={overlay} />
          <div className="hs-content">
            {logo}
            <p style={eyebrow}>Hormone Optimization · TRT / HRT</p>
            <h1 style={title}>Feel like<br />yourself again.</h1>
            <p style={sub}>Lab-guided hormone therapy for men and women, overseen by a licensed provider and built around your results.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => onSchedule('Hormone Therapy (TRT / HRT)')} style={{ padding: '16px 36px', fontSize: 18 }}>Book a consultation</button>
              <a href="#hormone" className="btn-ghost-light" style={{ padding: '15px 32px', fontSize: 17 }}>How it works</a>
            </div>
            {HORMONE_SITE.startingPrice && (
              <p style={{ marginTop: 22, fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Starting at <strong style={{ color: '#fff' }}>{HORMONE_SITE.startingPrice}</strong></p>
            )}
          </div>
        </div>

        {/* Slide 2 — Peptides / fitness / nutrition */}
        <div className="hs-slide" aria-hidden={i !== 1}>
          <img src="uploads/ChatGPT Image Apr 26, 2026, 03_02_19 PM.png" alt="" aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.8 }} />
          <div style={overlay} />
          <div className="hs-content">
            {logo}
            <p style={eyebrow}>Peptides · Fitness · Nutrition</p>
            <h2 style={title}>Your health,<br />optimized.</h2>
            <p style={sub}>Personalized plans built on evidence. Supplementation, fitness, and nutrition — tailored to you.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => onSchedule('')} style={{ padding: '16px 36px', fontSize: 18 }}>Request Information</button>
              <a href="#supplementation" className="btn-ghost-light" style={{ padding: '15px 32px', fontSize: 17 }}>Explore peptides</a>
            </div>
          </div>
        </div>
      </div>

      {arrow(-1)}{arrow(1)}
      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'center', gap: 10 }}>
        {['Hormone therapy', 'Peptides & wellness'].map((label, n) => (
          <button key={label} type="button" onClick={() => go(n)} aria-label={label}
            style={{ height: 6, width: i === n ? 34 : 12, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
              background: i === n ? '#2997ff' : 'rgba(255,255,255,0.35)', transition: 'width .3s, background .3s' }} />
        ))}
      </div>
    </section>
  );
};

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
