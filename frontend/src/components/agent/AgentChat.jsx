import { useState, useRef, useEffect } from 'react'
import useAppStore from '../../store/appStore'

export default function AgentChat() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: '¡Hola! Soy Esmeralda Granjerita 🌾💚 Tu asistente agrícola inteligente. Analizo datos satelitales para ayudarte con decisiones de tu parcela. Preguntame sobre tu NDVI, humedad, riego, o cualquier tema agrícola. ¡Estoy aquí para ti!' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const isMobile = useAppStore((s) => s.isMobile)
  const toggleAgent = useAppStore((s) => s.toggleAgent)
  const currentBbox = useAppStore((s) => s.currentBbox)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim(); setInput(''); setMessages((p) => [...p, { role: 'user', content: msg }]); setLoading(true)
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/agent/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, bbox: currentBbox ? currentBbox.join(',') : null }) })
      const data = await res.json(); setMessages((p) => [...p, { role: 'assistant', content: data.response }])
    } catch { setMessages((p) => [...p, { role: 'assistant', content: 'Error de conexion. Verifica que el servidor backend este activo en localhost:8000.' }]) }
    setLoading(false)
  }

  const panelStyle = isMobile
    ? { position: 'fixed', bottom: '60px', left: 0, right: 0, top: '20%', zIndex: 200 }
    : { position: 'fixed', right: '32px', bottom: '32px', width: '400px', height: '540px', zIndex: 200 }

  return (
    <div style={{
      ...panelStyle, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #022c22, #064e3b)',
      border: '2px solid rgba(16,185,129,0.4)',
      borderRadius: isMobile ? 'var(--r-xl) var(--r-xl) 0 0' : 'var(--r-lg)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(16,185,129,0.15)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 12px rgba(52,211,153,0.6)', animation: 'pulse 3s ease-in-out infinite' }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Esmeralda Granjerita 🌱</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#6ee7b7' }}>Tu asistente agrícola IA</div>
          </div>
        </div>
        <button onClick={toggleAgent} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--r-sm)', transition: 'all 0.2s' }}>&#10005;</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px',
            borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
            background: msg.role === 'user' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${msg.role === 'user' ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
            color: msg.role === 'user' ? '#a7f3d0' : '#d1fae5',
            fontSize: '0.85rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
          }}>{msg.content}</div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '14px 14px 14px 3px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#6ee7b7', animation: 'pulse 1.5s ease-in-out infinite' }}>Procesando consulta...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 18px', borderTop: '1px solid rgba(16,185,129,0.2)', background: 'rgba(0,0,0,0.15)' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Pregunta sobre tu parcela..."
          style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 'var(--r-sm)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', outline: 'none' }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ background: '#10b981', border: 'none', borderRadius: 'var(--r-sm)', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#022c22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}
