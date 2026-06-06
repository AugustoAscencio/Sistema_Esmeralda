/**
 * Navbar v5 — Green gradient header, high contrast, mobile bottom nav with SVG icons
 */
import { useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '../../store/appStore'

const NAV = [
  { path: '/dashboard', label: 'Panel', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )},
  { path: '/parcela', label: 'Parcela', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )},
  { path: '/financiero', label: 'Finanzas', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )},
  { path: '/mercado', label: 'Mercado', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )},
  { path: '/comunidad', label: 'Comunidad', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )},
  { path: '/herramientas', label: 'Herramientas', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )},
  { path: '/educacion', label: 'Aprender', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )},
]

export default function Navbar() {
  const loc = useLocation()
  const nav = useNavigate()
  const toggleAgent = useAppStore((s) => s.toggleAgent)
  const showAgent = useAppStore((s) => s.showAgent)
  const isMobile = useAppStore((s) => s.isMobile)
  const analysisReady = useAppStore((s) => s.analysisReady)

  return (
    <>
      {!isMobile && (
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', height: '56px',
          background: 'linear-gradient(135deg, #022c22, #064e3b)',
          borderBottom: '2px solid rgba(16,185,129,0.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div onClick={() => nav('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(16,185,129,0.4)' }}>
              <span style={{ fontSize: '13px', color: '#022c22', fontWeight: 800 }}>E</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Esmeralda</span>
          </div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {NAV.map((item) => {
              const active = loc.pathname === item.path
              return (
                <button key={item.path} onClick={() => nav(item.path)} style={{
                  padding: '7px 12px', background: active ? 'rgba(16,185,129,0.2)' : 'transparent',
                  border: active ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                  borderRadius: 'var(--r-sm)',
                  color: active ? '#34d399' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: active ? 600 : 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {item.label}
                </button>
              )
            })}
            <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)', margin: '0 10px' }} />
            {analysisReady && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', marginRight: '6px', boxShadow: '0 0 10px rgba(52,211,153,0.6)' }} />}
            <button onClick={toggleAgent} style={{
              padding: '7px 16px', borderRadius: 'var(--r-sm)',
              background: showAgent ? '#10b981' : 'rgba(255,255,255,0.08)',
              border: `1.5px solid ${showAgent ? '#10b981' : 'rgba(16,185,129,0.4)'}`,
              color: showAgent ? '#022c22' : '#6ee7b7',
              fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              Agente IA
            </button>
          </div>
        </nav>
      )}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {NAV.map((item) => {
            const active = loc.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                className={`mobile-nav-item${active ? ' active' : ''}`}
              >
                <div style={{
                  opacity: active ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                  transform: active ? 'scale(1.15)' : 'scale(1)',
                }}>
                  {item.icon}
                </div>
                <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                {active && (
                  <div style={{
                    width: '4px', height: '4px', borderRadius: '50%', background: '#34d399',
                    boxShadow: '0 0 8px rgba(52,211,153,0.6)', marginTop: '1px',
                  }} />
                )}
              </button>
            )
          })}
          <button
            onClick={toggleAgent}
            className={`mobile-nav-item${showAgent ? ' active' : ''}`}
            style={{ flexShrink: 0 }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: showAgent ? '#10b981' : 'rgba(16,185,129,0.15)',
              border: '2px solid rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: showAgent ? '0 0 16px rgba(16,185,129,0.4)' : 'none',
            }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: showAgent ? '#022c22' : '#34d399' }}>IA</span>
            </div>
            <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>Agente</span>
          </button>
        </nav>
      )}
    </>
  )
}

