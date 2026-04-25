import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import api from '../utils/api'

const PINK = {
  bg: '#FFF5F8', bgLight: '#FFF0F5', bgAccent: '#FCE4EC',
  primary: '#C2185B', primaryDark: '#880E4F', primaryMid: '#AD1457',
  accent: '#F8BBD0', border: '#F48FB1',
  text: '#880E4F', textMid: '#AD1457', textSub: '#AD5070',
  darkGrad: 'linear-gradient(135deg, #1A0010 0%, #2D0A1E 60%, #0D001A 100%)',
  gradText: '#F8BBD0',
  btnBg: '#FFB6C1', btnHover: '#F48FB1',
}
const SILVER = {
  bg: '#F5F7F8', bgLight: '#ECEFF1', bgAccent: '#CFD8DC',
  primary: '#455A64', primaryDark: '#263238', primaryMid: '#546E7A',
  accent: '#B0BEC5', border: '#90A4AE',
  text: '#263238', textMid: '#37474F', textSub: '#546E7A',
  darkGrad: 'linear-gradient(135deg, #1B2631 0%, #212F3C 60%, #0D1117 100%)',
  gradText: '#B0BEC5',
  btnBg: '#546E7A', btnHover: '#37474F',
}

const STEPS = [
  {
    n: '01',
    title: 'Submit Your Request',
    desc: 'Fill in the details of your jewellery piece — metal type, weight, and upload clear photos. We accept gold, silver, and platinum pieces purchased from us or elsewhere.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  },
  {
    n: '02',
    title: 'Free Expert Evaluation',
    desc: 'Our certified gemologist evaluates your piece based on current live market rates for gold, silver, or platinum. No hidden deductions — transparent pricing at all times.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  },
  {
    n: '03',
    title: 'Get 75% of Market Value',
    desc: 'You receive 75% of the current market value of your jewellery — credited directly to your bank account or as store credit (store credit gives you an extra 5% bonus).',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    n: '04',
    title: 'Quick Payment',
    desc: 'Bank transfer within 2–3 business days after you drop off your jewellery at our store or send it via our insured courier pickup service — available pan-India.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
]

const FAQS = [
  { q: 'Which jewellery pieces are eligible for buyback?', a: 'We accept all gold (18K, 22K, 24K), silver (925 sterling), and platinum jewellery. Pieces must be genuine metal — we verify authenticity via hallmarking or XRF testing. Studded jewellery is evaluated excluding stone value.' },
  { q: 'How is the 75% value calculated?', a: 'We calculate 75% of the current live market rate of the metal. For example, if gold is ₹8,500/g and your ring weighs 5g, the value is ₹8,500 × 5 × 75% = ₹31,875. Live rates are updated every 2 hours from LME.' },
  { q: 'Do I get extra if I choose store credit?', a: 'Yes! Choosing store credit instead of bank transfer gives you an additional 5% bonus — so you effectively get 80% of market value to spend on new jewellery at ADORE.' },
  { q: 'What about studded jewellery (diamonds, gems)?', a: 'Stones are evaluated separately by our IGI-certified gemologist. The metal and stones are valued independently, and you receive the combined buyback offer.' },
  { q: 'Is there a minimum or maximum value?', a: 'Minimum buyback value is ₹500. There is no upper limit — we process buybacks of any size, including large estate jewellery collections.' },
  { q: 'How do I send my jewellery safely?', a: 'We offer a free insured courier pickup for buyback requests above ₹5,000. For smaller amounts, you can visit any of our stores. All insured shipments are covered up to ₹5,00,000.' },
]

export default function Buyback() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { theme } = useTheme()
  const C = theme === 'silver' ? SILVER : PINK
  const isSilver = theme === 'silver'

  const [openFaq, setOpenFaq] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', metalType: 'Gold', purity: '22K', weightGrams: '', description: '', preferredPayment: 'bank', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!form.name || !form.phone || !form.metalType || !form.weightGrams) {
      showToast('Please fill in all required fields'); return
    }
    setSubmitting(true)
    try {
      // Submit as a custom request with buyback tag
      await api.post('/custom', {
        type: 'Buyback',
        description: `BUYBACK REQUEST\nMetal: ${form.metalType} ${form.purity}\nWeight: ${form.weightGrams}g\nPayment: ${form.preferredPayment === 'store' ? 'Store Credit (+5% bonus)' : 'Bank Transfer'}\nDescription: ${form.description}\nMessage: ${form.message}`,
        name: form.name,
        phone: form.phone,
        email: form.email || user?.email || '',
        budget: 'Buyback',
      })
      setSubmitted(true)
      showToast('Buyback request submitted! We\'ll contact you within 24 hours.')
    } catch {
      showToast('Failed to submit. Please try again or call us directly.')
    }
    setSubmitting(false)
  }

  const BtnPrimary = ({ children, onClick, type = 'button', style = {}, disabled = false }) => (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#ddd' : C.btnBg, color: isSilver ? '#fff' : '#880E4F', border: 'none', padding: '14px 32px', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 6, fontFamily: "'Jost',sans-serif", transition: 'all .2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...style }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = C.btnHover; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = C.btnBg; e.currentTarget.style.transform = 'translateY(0)' } }}
    >{children}</button>
  )

  const inputStyle = { width: '100%', padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 14, fontFamily: "'Jost',sans-serif", color: '#1C1C1E', background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ background: C.darkGrad, padding: 'clamp(56px,8vw,96px) 5%', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: `radial-gradient(circle, ${C.gradText} 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.06)', border: `1px solid ${C.gradText}30`, borderRadius: 20, padding: '5px 16px', marginBottom: 20 }}>
            <span style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: C.gradText, fontWeight: 700 }}>✦ Jewellery Buyback Programme ✦</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(36px,6vw,72px)', fontWeight: 600, fontStyle: 'italic', color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
            Sell Back Your<br />
            <span style={{ color: C.gradText }}>Old Jewellery</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Get up to <strong style={{ color: C.gradText }}>75% of current market value</strong> for your old gold, silver or platinum jewellery — evaluated by certified experts, paid within 3 days.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <BtnPrimary onClick={() => document.getElementById('buyback-form').scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 36px', fontSize: 13, borderRadius: 6 }}>
              Start Buyback Request →
            </BtnPrimary>
            <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', color: C.gradText, border: `1.5px solid ${C.gradText}50`, padding: '13px 28px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: "'Jost',sans-serif", transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.gradText}12`; e.currentTarget.style.borderColor = `${C.gradText}99` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${C.gradText}50` }}
            >How It Works</button>
          </div>
        </div>
      </section>

      {/* ── VALUE BADGES ── */}
      <section style={{ background: '#fff', padding: '0', borderBottom: `1px solid ${C.border}40` }}>
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { val: '75%', lbl: 'of Market Value', icon: '💰' },
            { val: '+5%', lbl: 'Store Credit Bonus', icon: '🎁' },
            { val: '2–3', lbl: 'Day Payment', icon: '⚡' },
            { val: '100%', lbl: 'Transparent Pricing', icon: '🔍' },
            { val: 'Free', lbl: 'Expert Evaluation', icon: '✅' },
            { val: 'Pan-India', lbl: 'Insured Courier', icon: '🚚' },
          ].map((b, i, arr) => (
            <div key={b.lbl} style={{ flex: '1 0 150px', padding: '18px 16px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}40` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 20 }}>{b.icon}</span>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: C.primary, lineHeight: 1.1 }}>{b.val}</div>
              <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>{b.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: 'clamp(48px,6vw,80px) 5%', background: C.bgLight }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, marginBottom: 10 }}>✦ Simple 4-Step Process ✦</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 600, fontStyle: 'italic', color: '#1C1C1E', margin: 0 }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ background: '#fff', borderRadius: 12, padding: '28px 24px', border: `1.5px solid ${C.border}`, position: 'relative', overflow: 'hidden', transition: 'transform .2s, box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${C.primary}20` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ position: 'absolute', top: 12, right: 16, fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 700, color: `${C.primary}10`, lineHeight: 1 }}>{step.n}</div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.bgAccent, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, marginBottom: 16 }}>{step.icon}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: '#1C1C1E', marginBottom: 10, lineHeight: 1.2 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: '#777', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM ── */}
      <section id="buyback-form" style={{ padding: 'clamp(48px,6vw,80px) 5%', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, marginBottom: 10 }}>✦ Get Started ✦</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 600, fontStyle: 'italic', color: '#1C1C1E', margin: 0 }}>Submit Your Buyback Request</h2>
            <p style={{ fontSize: 13, color: '#888', marginTop: 10 }}>Fill in the details below. Our team will contact you within 24 hours.</p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: C.bgAccent, borderRadius: 12, border: `2px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💍</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: C.primaryDark, marginBottom: 12 }}>Request Submitted!</h3>
              <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 24px' }}>Our certified evaluator will review your jewellery details and contact you at <strong>{form.phone}</strong> within 24 hours with a transparent quote.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <BtnPrimary onClick={() => navigate('/shop')}>Continue Shopping</BtnPrimary>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', email: '', metalType: 'Gold', purity: '22K', weightGrams: '', description: '', preferredPayment: 'bank', message: '' }) }}
                  style={{ background: 'transparent', color: C.primary, border: `1.5px solid ${C.border}`, padding: '13px 24px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: "'Jost',sans-serif" }}
                >Submit Another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Personal Info */}
              <div style={{ background: C.bgLight, borderRadius: 10, padding: '24px', border: `1px solid ${C.border}40` }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, marginBottom: 16 }}>Contact Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" style={inputStyle} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Phone Number *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" style={inputStyle} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com (optional)" style={inputStyle} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                </div>
              </div>

              {/* Jewellery Details */}
              <div style={{ background: C.bgLight, borderRadius: 10, padding: '24px', border: `1px solid ${C.border}40` }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, marginBottom: 16 }}>Jewellery Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Metal Type *</label>
                    <select name="metalType" value={form.metalType} onChange={e => { handleChange(e); setForm(f => ({ ...f, purity: e.target.value === 'Gold' ? '22K' : e.target.value === 'Silver' ? '925' : '950' })) }} style={{ ...inputStyle }}>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Diamond">Diamond Studded</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Purity / Hallmark</label>
                    <select name="purity" value={form.purity} onChange={handleChange} style={{ ...inputStyle }}>
                      {form.metalType === 'Gold' && <><option value="24K">24K (999)</option><option value="22K">22K (916)</option><option value="18K">18K (750)</option><option value="14K">14K (585)</option></>}
                      {form.metalType === 'Silver' && <><option value="999">999 Fine Silver</option><option value="925">925 Sterling Silver</option><option value="800">800 Silver</option></>}
                      {form.metalType === 'Platinum' && <><option value="950">950 Platinum</option><option value="900">900 Platinum</option></>}
                      {form.metalType === 'Diamond' && <><option value="18K">18K Gold with Diamond</option><option value="22K">22K Gold with Diamond</option><option value="Platinum">Platinum with Diamond</option></>}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Approximate Weight (grams) *</label>
                    <input name="weightGrams" value={form.weightGrams} onChange={handleChange} required type="number" min="0.1" step="0.1" placeholder="e.g. 5.5" style={inputStyle} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Piece Description</label>
                    <input name="description" value={form.description} onChange={handleChange} placeholder="e.g. Ring, Necklace, Bangle..." style={inputStyle} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                </div>

                {/* Live Estimate */}
                {form.weightGrams > 0 && form.metalType !== 'Diamond' && (
                  <div style={{ marginTop: 16, background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18 }}>💡</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.primaryDark }}>Estimated Buyback Value</div>
                      <div style={{ fontSize: 11, color: C.textSub }}>
                        Based on approx. market rates · {form.metalType === 'Gold' ? '₹8,800/g (22K)' : form.metalType === 'Silver' ? '₹95/g' : '₹3,100/g'} × {form.weightGrams}g × 75% =&nbsp;
                        <strong style={{ color: C.primary, fontSize: 13 }}>
                          ₹{(
                            parseFloat(form.weightGrams) *
                            (form.metalType === 'Gold' ? 8800 : form.metalType === 'Silver' ? 95 : 3100) *
                            0.75
                          ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </strong>
                        &nbsp;(approx.)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Preference */}
              <div style={{ background: C.bgLight, borderRadius: 10, padding: '24px', border: `1px solid ${C.border}40` }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, marginBottom: 16 }}>Payment Preference</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { val: 'bank', label: 'Bank Transfer', sub: '75% of value · 2–3 business days', emoji: '🏦' },
                    { val: 'store', label: 'Store Credit', sub: '80% of value (+5% bonus) · Instant', emoji: '🎁' },
                  ].map(opt => (
                    <div key={opt.val} onClick={() => setForm(f => ({ ...f, preferredPayment: opt.val }))}
                      style={{ flex: '1 0 200px', padding: '16px', border: `2px solid ${form.preferredPayment === opt.val ? C.primary : C.border}`, borderRadius: 8, cursor: 'pointer', background: form.preferredPayment === opt.val ? C.bgAccent : '#fff', transition: 'all .2s' }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: form.preferredPayment === opt.val ? C.primary : '#1C1C1E', marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>Additional Notes</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="Any other details, condition of the piece, or questions for us..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              {!user && (
                <div style={{ background: '#fff8e1', border: '1px solid #ffd54f', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#795548', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚠️</span> Please <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>sign in</button> to submit your buyback request.
                </div>
              )}

              <BtnPrimary type="submit" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '15px 40px', fontSize: 13 }}>
                {submitting ? 'Submitting…' : 'Submit Buyback Request →'}
              </BtnPrimary>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) 5%', background: C.bgLight }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, marginBottom: 10 }}>✦ Questions & Answers ✦</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 600, fontStyle: 'italic', color: '#1C1C1E', margin: 0 }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: openFaq === i ? C.bgAccent : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .2s', gap: 12 }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: openFaq === i ? C.primary : '#1C1C1E', lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{ color: C.primary, flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform .25s', fontSize: 18 }}>▾</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 18px', background: C.bgAccent }}>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section style={{ background: C.darkGrad, padding: 'clamp(36px,5vw,56px) 5%', textAlign: 'center' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 600, fontStyle: 'italic', color: '#fff', marginBottom: 12 }}>
          Still have questions? We're here.
        </h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', marginBottom: 28, lineHeight: 1.7 }}>
          Call us at <a href="tel:+919999999999" style={{ color: C.gradText, textDecoration: 'none', fontWeight: 700 }}>+91 99999 99999</a> or visit any ADORE store for a walk-in evaluation — no appointment needed.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <BtnPrimary onClick={() => document.getElementById('buyback-form').scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 36px', fontSize: 13 }}>Submit Request →</BtnPrimary>
          <button onClick={() => navigate('/help')}
            style={{ background: 'transparent', color: C.gradText, border: `1.5px solid ${C.gradText}50`, padding: '13px 28px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: "'Jost',sans-serif" }}
          >Contact Us</button>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          #buyback-form .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
