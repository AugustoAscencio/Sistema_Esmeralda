/**
 * Landing v6 — Full-width, planet visible, premium CTA, responsive
 */
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import GlobeHero from '../components/three/GlobeHero'

function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); let id
    let mouse = { x: -1000, y: -1000 }
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY })

    const N = 90
    const P = Array.from({ length: N }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 4 + 1.5,
      pulse: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of P) {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02
        if (p.x < -10) p.x = c.width + 10; if (p.x > c.width + 10) p.x = -10
        if (p.y < -10) p.y = c.height + 10; if (p.y > c.height + 10) p.y = -10
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 180) { p.x += (dx / dist) * 1.2; p.y += (dy / dist) * 1.2 }
        const alpha = 0.35 + Math.sin(p.pulse) * 0.15
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        grad.addColorStop(0, `rgba(16, 185, 129, ${alpha})`)
        grad.addColorStop(0.5, `rgba(16, 185, 129, ${alpha * 0.3})`)
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)')
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = grad; ctx.fill()
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha + 0.2})`; ctx.fill()
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 160) {
            ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y)
            ctx.strokeStyle = `rgba(5, 150, 105, ${0.15 * (1 - dist / 160)})`; ctx.lineWidth = 1; ctx.stroke()
          }
        }
      }
      for (const p of P) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.25 * (1 - dist / 200)})`; ctx.lineWidth = 1.2; ctx.stroke()
        }
      }
      id = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

export default function Landing() {
  const nav = useNavigate()
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 40%, #f0fdf4 100%)', position: 'relative' }}>
      <ParticleCanvas />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: mobile ? '16px 12px' : '24px', position: 'relative', zIndex: 1, width: '100%',
      }}>

        {/* System label */}
        <div style={{ marginBottom: '6px', animation: 'fadeIn 0.5s ease forwards' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--emerald-700)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Sistema
          </span>
        </div>

        {/* ESMERALDA */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: mobile ? 'clamp(2.2rem, 12vw, 3.5rem)' : 'clamp(3rem, 9vw, 6rem)',
          fontWeight: 700, color: 'var(--emerald-950)', textAlign: 'center',
          lineHeight: 1, marginBottom: '0', letterSpacing: '-0.04em',
          textTransform: 'uppercase',
          animation: 'fadeIn 0.6s ease 0.1s forwards', opacity: 0,
        }}>
          ESMERALDA
        </h1>

        {/* Globe — circular container */}
        <div style={{
          width: mobile ? '300px' : '440px',
          height: mobile ? '300px' : '440px',
          margin: '8px auto', position: 'relative',
          borderRadius: '50%', overflow: 'hidden',
          filter: 'drop-shadow(0 0 60px rgba(16,185,129,0.4))',
          animation: 'fadeIn 0.7s ease 0.2s forwards, float 4s ease-in-out 1s infinite',
          opacity: 0,
        }}>
          <GlobeHero />
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: mobile ? 'clamp(0.8rem, 3.5vw, 0.95rem)' : 'clamp(0.9rem, 2.2vw, 1.15rem)',
          fontWeight: 400, color: 'var(--emerald-800)', textAlign: 'center',
          maxWidth: '460px', lineHeight: 1.6, marginBottom: mobile ? '24px' : '32px',
          animation: 'fadeIn 0.6s ease 0.3s forwards', opacity: 0,
        }}>
          El campo visto desde el cielo.<br />El futuro construido desde la tierra.
        </p>

        {/* CTA Button — ALWAYS VISIBLE */}
        <button onClick={() => nav('/parcela')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: mobile ? '16px 36px' : '18px 52px',
            fontSize: mobile ? '0.92rem' : '1rem', fontWeight: 700,
            fontFamily: 'var(--font-sans)', color: '#fff',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
            border: '2px solid rgba(110,231,183,0.4)',
            borderRadius: 'var(--r-full)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 20px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.1), 0 4px 20px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.6s ease 0.4s forwards, ctaPulse 3s ease-in-out 1s infinite',
            opacity: 0,
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'translateY(-3px) scale(1.03)'
            e.target.style.boxShadow = '0 0 30px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2), 0 8px 30px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'translateY(0) scale(1)'
            e.target.style.boxShadow = '0 0 20px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.1), 0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          Comenzar Analisis
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        {/* Feature tags */}
        <div style={{
          display: 'flex', gap: mobile ? '10px' : '28px', marginTop: mobile ? '28px' : '44px',
          flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeIn 0.6s ease 0.5s forwards', opacity: 0,
        }}>
          {['Copernicus Sentinel', 'IA Agronoma', 'Modelo Predictivo'].map((t) => (
            <span key={t} style={{
              fontFamily: 'var(--font-mono)', fontSize: mobile ? '0.58rem' : '0.65rem', color: 'var(--emerald-700)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: mobile ? '5px 10px' : '6px 14px',
              background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--r-full)',
              border: '1px solid var(--emerald-200)', backdropFilter: 'blur(8px)',
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: mobile ? '14px 12px' : '18px 24px', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--emerald-700)',
        borderTop: '1px solid var(--emerald-200)', position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)',
      }}>
        Copernicus LAC Hackathon  ·  Reto 1: Resiliencia del Pequeno Agricultor  ·{' '}
        <span onClick={() => nav('/metodologia')} style={{ cursor: 'pointer', color: 'var(--emerald-600)', fontWeight: 600 }}>Metodologia</span>
      </div>
    </div>
  )
}
