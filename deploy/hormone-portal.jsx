// hormone-portal.jsx — "Hormone Program" tab in the client portal (TRT / HRT).
// Shown to clients whose profile has portal_type 'hormone' or 'both'.
// Edit HORMONE_PORTAL to change wording, labs, FAQs or add videos.

const HORMONE_PORTAL = {
  phone: '669-333-6600',
  // Add injection how-to videos as YouTube embed links, e.g.
  // { title: 'Subcutaneous injection', url: 'https://www.youtube.com/embed/VIDEO_ID' }
  videos: [],
  timeline: [
    { when: 'Week 0', title: 'Intake & baseline labs', body: 'Complete your intake questionnaire and baseline blood panel.' },
    { when: 'Week 1–2', title: 'Provider consultation', body: 'Your provider reviews your labs and history with you and decides whether treatment is appropriate.' },
    { when: 'Week 2–3', title: 'Start your protocol', body: 'If prescribed, your medication and supplies are prepared and your protocol appears on this page.' },
    { when: 'Week 6–8', title: 'First follow-up labs', body: 'Labs confirm how your body is responding. Your provider may adjust your dose.' },
    { when: 'Every 3–6 months', title: 'Ongoing monitoring', body: 'Regular labs and check-ins keep your levels in range and your plan current.' },
  ],
  labs: [
    { name: 'Total testosterone', what: 'The overall amount of testosterone in your blood.' },
    { name: 'Free testosterone', what: 'The unbound portion your body can use directly.' },
    { name: 'Estradiol (E2)', what: 'The main estrogen. Important to monitor for both men and women on therapy.' },
    { name: 'SHBG', what: 'Sex hormone-binding globulin. Binds hormones and affects how much is available.' },
    { name: 'LH & FSH', what: 'Pituitary signals that drive natural hormone production.' },
    { name: 'Progesterone', what: 'Key hormone for women, especially around perimenopause and menopause.' },
    { name: 'CBC (hematocrit & hemoglobin)', what: 'Red blood cell levels, which can rise on testosterone therapy.' },
    { name: 'CMP', what: 'Liver, kidney, electrolyte and glucose markers.' },
    { name: 'Lipid panel', what: 'Cholesterol and triglycerides for cardiovascular health.' },
    { name: 'PSA (men)', what: 'Prostate-specific antigen, a routine prostate health screen.' },
    { name: 'TSH / thyroid', what: 'Thyroid function, which can cause similar symptoms to low hormones.' },
  ],
  faqs: [
    { q: 'How soon will I notice a difference?', a: 'Many people notice changes in energy, sleep or mood within a few weeks. Body composition and other changes usually take longer. Your provider will review progress at each follow-up.' },
    { q: 'Do I need labs before starting?', a: 'Yes. A baseline panel is required so your provider can decide whether therapy is appropriate and set a starting point.' },
    { q: 'How often will I need follow-up labs?', a: 'Typically 6–8 weeks after starting, then every 3–6 months once your levels are stable. Your provider may ask for labs sooner after a dose change.' },
    { q: 'Can I change my dose myself?', a: 'No. Only your provider can change your protocol. If something feels off, request a follow-up below.' },
    { q: 'How do I store my medication?', a: 'Follow the storage directions on your label. Keep it out of direct heat and sunlight and out of reach of children.' },
    { q: 'What if I miss a dose?', a: 'Contact us before doubling up. We\'ll confirm with your provider what to do.' },
  ],
  orderItems: ['Medication refill (current prescription)', 'Injection supplies (syringes, needles, wipes)', 'Follow-up lab kit / lab order', 'Other (describe in notes)'],
};

const hpS = {
  card: { background: '#161617', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 28 },
  h2: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f7', marginBottom: 6 },
  sub: { fontSize: 14.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginBottom: 22 },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 },
};

const HP_SECTIONS = [
  ['hp-overview', 'Overview'], ['hp-protocol', 'My protocol'], ['hp-labs', 'Labs'], ['hp-order', 'Order'],
  ['hp-followup', 'Follow-ups'], ['hp-videos', 'Videos'], ['hp-faq', 'FAQ'],
];

const HormoneOrderRequest = ({ sb, userData, kind }) => {
  const isFollowup = kind === 'followup';
  const [item, setItem] = React.useState(isFollowup ? 'Follow-up consultation request' : HORMONE_PORTAL.orderItems[0]);
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState('');
  const [err, setErr] = React.useState('');
  const submit = async () => {
    if (isFollowup && !notes.trim()) { setErr('Please add your preferred days and times.'); return; }
    setBusy(true); setErr('');
    const reference = 'HRT-' + String(Date.now()).slice(-6);
    try {
      const { error } = await sb.from('orders').insert({
        client_id: userData.id, product: (isFollowup ? '' : 'Hormone program: ') + item, quantity: 1,
        status: 'pending', payment_method: 'Invoice', shipping_method: 'Hormone program request',
        notes: notes.trim() || null, phone_at_order: userData.phone || null, order_reference: reference,
      });
      if (error) throw error;
      setDone(reference); setNotes('');
    } catch (e) { setErr(e.message || 'Something went wrong. Please call us.'); }
    setBusy(false);
  };
  if (done) return (
    <div style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.3)', borderRadius: 12, padding: '16px 18px', fontSize: 14.5, color: '#f5f5f7', lineHeight: 1.55 }}>
      Request <strong>{done}</strong> received. We'll contact you to confirm{isFollowup ? ' your appointment' : ' and send an invoice if needed'}.
      <button type="button" className="btn-ghost" onClick={() => setDone('')} style={{ marginLeft: 12, padding: '6px 14px', fontSize: 13 }}>New request</button>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!isFollowup && (
        <div>
          <span style={hpS.label}>What do you need?</span>
          <select className="field-input" value={item} onChange={e => setItem(e.target.value)}>
            {HORMONE_PORTAL.orderItems.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      )}
      <div>
        <span style={hpS.label}>{isFollowup ? 'Preferred days & times, and anything to discuss' : 'Notes (optional)'}</span>
        <textarea className="field-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }}
          placeholder={isFollowup ? 'e.g. Tue or Thu afternoons. Want to discuss energy levels.' : 'e.g. running low, need by Friday'} />
      </div>
      {err && <div style={{ color: '#ff453a', fontSize: 13 }}>{err}</div>}
      <div><button type="button" className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Sending…' : isFollowup ? 'Request follow-up' : 'Send request'}</button></div>
    </div>
  );
};

const HormoneProgram = ({ sb, userData, onGoTab }) => {
  const profile = (userData && userData.profile) || {};
  const protocol = String(profile.hormone_protocol || '').trim();
  const [openFaq, setOpenFaq] = React.useState(null);
  const sections = HP_SECTIONS.filter(([id]) => id !== 'hp-videos' || HORMONE_PORTAL.videos.length);
  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#2997ff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Hormone Program · TRT / HRT</p>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f7', marginBottom: 8 }}>Your hormone program</h1>
        <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, maxWidth: 640 }}>Your plan, labs, orders and resources in one place. Your protocol is set by a licensed provider through our partner clinic.</p>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 15, background: '#0a0a0a', padding: '10px 0', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {sections.map(([id, label]) => (
          <button key={id} type="button" onClick={() => jump(id)} style={{ flexShrink: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      <section id="hp-overview" style={hpS.card}>
        <h2 style={hpS.h2}>What to expect</h2>
        <p style={hpS.sub}>Typical timeline. Your provider may adjust it based on your labs.</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {HORMONE_PORTAL.timeline.map((t, i) => (
            <div key={t.title} style={{ display: 'grid', gridTemplateColumns: '130px minmax(0,1fr)', gap: 18, padding: '14px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2997ff', paddingTop: 2 }}>{t.when}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="hp-protocol" style={{ ...hpS.card, borderColor: 'rgba(41,151,255,0.3)' }}>
        <h2 style={hpS.h2}>My protocol</h2>
        <p style={hpS.sub}>Set by your provider. Never change your dose without talking to us first.</p>
        {protocol
          ? <div style={{ fontSize: 15.5, color: '#f5f5f7', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'rgba(41,151,255,0.06)', borderRadius: 12, padding: '18px 20px' }}>{protocol}</div>
          : <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>Your protocol will appear here after your provider consultation.</div>}
      </section>

      <section id="hp-labs" style={hpS.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={hpS.h2}>Lab panels explained</h2>
            <p style={hpS.sub}>Common markers in a hormone panel. Your provider decides which ones you need.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => onGoTab && onGoTab('blood')}>Upload bloodwork</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {HORMONE_PORTAL.labs.map(l => (
            <div key={l.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#f5f5f7', marginBottom: 4 }}>{l.name}</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5 }}>{l.what}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="hp-order" style={hpS.card}>
        <h2 style={hpS.h2}>Order medications & supplies</h2>
        <p style={hpS.sub}>Prescription refills are filled only under your current prescription. We'll confirm and invoice you.</p>
        <HormoneOrderRequest sb={sb} userData={userData} kind="order" />
      </section>

      <section id="hp-followup" style={hpS.card}>
        <h2 style={hpS.h2}>Schedule a follow-up</h2>
        <p style={hpS.sub}>Request a check-in with your provider, or call or text us at {HORMONE_PORTAL.phone}.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <a className="btn-ghost" href={'tel:' + HORMONE_PORTAL.phone.replace(/\D/g, '')}>Call</a>
          <a className="btn-ghost" href={'sms:' + HORMONE_PORTAL.phone.replace(/\D/g, '')}>Text</a>
        </div>
        <HormoneOrderRequest sb={sb} userData={userData} kind="followup" />
      </section>

      {HORMONE_PORTAL.videos.length > 0 && (
        <section id="hp-videos" style={hpS.card}>
          <h2 style={hpS.h2}>Injection how-to videos</h2>
          <p style={hpS.sub}>Always follow your provider's instructions.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {HORMONE_PORTAL.videos.map(v => (
              <div key={v.url}>
                <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                  <iframe src={v.url} title={v.title} allowFullScreen frameBorder="0" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"></iframe>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7', marginTop: 8 }}>{v.title}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="hp-faq" style={hpS.card}>
        <h2 style={{ ...hpS.h2, marginBottom: 16 }}>FAQ</h2>
        {HORMONE_PORTAL.faqs.map((f, i) => (
          <div key={f.q} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16, textAlign: 'left',
              background: 'none', border: 'none', color: '#f5f5f7', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 500, padding: '16px 0', cursor: 'pointer' }}>
              <span>{f.q}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i && <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, paddingBottom: 16 }}>{f.a}</p>}
          </div>
        ))}
      </section>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>This page is general information and does not replace advice from your provider. In an emergency, call 911.</p>
    </div>
  );
};

Object.assign(window, { HormoneProgram, HORMONE_PORTAL });
