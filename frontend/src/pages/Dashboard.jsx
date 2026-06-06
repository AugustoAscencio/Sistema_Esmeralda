/**
 * Dashboard v5 — SatelliteCarousel integration, auto-load images,
 * geological analysis, hover tooltips, high contrast
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/appStore'
import ResilienceScore from '../components/ui/ResilienceScore'
import AlertCard from '../components/ui/AlertCard'
import WeatherStrip from '../components/ui/WeatherStrip'
import CreditCard from '../components/ui/CreditCard'
import NDVITimeline from '../components/charts/NDVITimeline'
import RainfallChart from '../components/charts/RainfallChart'
import SatelliteCarousel from '../components/ui/SatelliteCarousel'

function Tip({ children, text }) {
  return (
    <div className="tooltip-wrap">
      {children}
      <div className="tooltip-content">{text}</div>
    </div>
  )
}

export default function Dashboard() {
  const nav = useNavigate()
  const parcelaData = useAppStore((s) => s.parcelaData)
  const analysisReady = useAppStore((s) => s.analysisReady)
  const isLoading = useAppStore((s) => s.isLoadingParcela)
  const currentBbox = useAppStore((s) => s.currentBbox)
  const isMobile = useAppStore((s) => s.isMobile)

  if (!analysisReady && !isLoading) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center' }}>
        <div className="animate-float" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--emerald-100), var(--emerald-200))', border: '3px solid var(--emerald-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: 'var(--shadow-emerald)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-600)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <h2 style={{ marginBottom: '8px' }}>Selecciona tu parcela</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '28px', fontSize: '0.95rem' }}>
          Para ver el analisis completo, primero selecciona un area en el visor satelital. Todos los datos se calcularan automaticamente.
        </p>
        <button className="btn btn-primary" onClick={() => nav('/parcela')}>Ir al Visor Satelital</button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card-emerald animate-glow" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid var(--emerald-500)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald-800)' }}>Consultando satelites</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--emerald-600)', marginTop: '4px' }}>Sentinel-2 + Sentinel-1 + Open-Meteo</div>
        </div>
      </div>
    )
  }

  const ndvi = parcelaData?.ndvi || {}
  const moisture = parcelaData?.moisture || {}
  const climate = parcelaData?.climate || {}
  const resilience = parcelaData?.resilience || {}
  const alerts = parcelaData?.alerts || []
  const ndviHistory = parcelaData?.ndvi_history || []
  const source = parcelaData?.source || ''

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="dashboard-header-info">
          <h1>Mi Campo: Sistema Esmeralda</h1>
          <div className="dashboard-header-badges">
            <span className={`badge ${source === 'copernicus_live' ? 'badge-ok' : 'badge-info'}`}>
              {source === 'copernicus_live' ? '🛰️ En Vivo' : '⚡ Simulación'}
            </span>
            <span className="badge badge-neutral" style={{ fontWeight: 700 }}>{parcelaData?.area_ha?.toFixed(1)} Ha</span>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => nav('/parcela')}>🛰️ Cambiar Parcela</button>
      </div>

      <div className="dashboard-grid">
        {/* Columna Izquierda: Score y Crédito */}
        <div className="resilience-col">
          <div className="card-emerald animate-in" style={{ display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
            <ResilienceScore score={resilience.score || 0} credit={resilience.credit || {}} size={isMobile ? 160 : 220} />
          </div>
          <div className="card animate-in d1" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Componentes del Score
            </h4>
            {[
              { label: 'Salud del cultivo', value: resilience.components?.crop_health || 0, max: 40, tip: 'Medido por NDVI de Sentinel-2. Refleja el verdor y densidad foliar activa.' },
              { label: 'Estabilidad histórica', value: resilience.components?.stability || 0, max: 25, tip: 'Desviación estándar del NDVI a lo largo del tiempo. A menor varianza, menor riesgo.' },
              { label: 'Humedad disponible', value: resilience.components?.water || 0, max: 20, tip: 'Humedad actual del suelo (radar SAR Sentinel-1) + precipitación acumulada.' },
              { label: 'Resiliencia térmica', value: resilience.components?.climate || 0, max: 15, tip: 'Adaptabilidad a estrés calórico. Temperaturas extremas disminuyen este score.' },
            ].map((c, i) => (
              <Tip key={i} text={c.tip}>
                <div style={{ marginBottom: '14px', cursor: 'help' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{c.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-800)' }}>{c.value}/{c.max}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${(c.value / c.max) * 100}%` }} /></div>
                </div>
              </Tip>
            ))}
          </div>
          <div className="animate-in d2"><CreditCard credit={resilience.credit || {}} /></div>
        </div>

        {/* Columna Derecha: Indicadores, Módulos del Ecosistema y Gráficos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%' }}>
          {/* Tarjetas de Métricas Clave */}
          <div className="dashboard-metrics-grid animate-in">
            {[
              { label: 'NDVI (Sentinel-2)', value: ndvi.ndvi_mean?.toFixed(3) || '--', sub: `Rango: ${ndvi.ndvi_min?.toFixed(2) || '--'} a ${ndvi.ndvi_max?.toFixed(2) || '--'}`, color: ndvi.ndvi_mean >= 0.4 ? 'var(--emerald-700)' : 'var(--orange)', tip: 'Índice de Vegetación de Diferencia Normalizada. Mide vigor clorofílico. Óptimo > 0.5; estrés severo < 0.3.' },
              { label: 'Humedad (Sentinel-1)', value: `${moisture.moisture_mean?.toFixed(0) || '--'}%`, sub: moisture.moisture_critical ? '🚨 Sequedad crítica' : '💧 Nivel adecuado', color: moisture.moisture_critical ? 'var(--red)' : 'var(--blue)', tip: 'Humedad superficial del suelo medida por retrodispersión de radar (SAR), capaz de penetrar nubosidad total.' },
              { label: 'Previsión de Lluvia', value: `${climate.summary?.precip_7d_mm?.toFixed(0) || '--'} mm`, sub: `Temperatura Máx: ${climate.summary?.temp_max || '--'}°C`, color: 'var(--blue)', tip: 'Pronóstico de precipitación acumulada para los próximos 7 días basado en Open-Meteo.' },
            ].map((m, i) => (
              <Tip key={i} text={m.tip}>
                <div className="card" style={{ padding: '18px', cursor: 'help', textAlign: 'center', transition: 'all 0.3s' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: m.color, lineHeight: 1.1, marginBottom: '6px' }}>{m.value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.sub}</div>
                </div>
              </Tip>
            ))}
          </div>

          {/* Ecosistema Esmeralda (The "Google-like" Hub Grid) */}
          <div className="card animate-in d1" style={{ padding: '22px', border: '2px solid var(--emerald-300)', background: 'linear-gradient(to bottom right, #ffffff, var(--emerald-50))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.3rem' }}>💎</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald-950)' }}>Ecosistema Esmeralda</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Navega libremente por los módulos integrados diseñados para la resiliencia climática y financiera del pequeño productor.
            </p>
            <div className="ecosystem-grid">
              {[
                {
                  title: '🛰️ Visor Satelital',
                  desc: 'Analiza tu lote con índices NDVI, EVI, humedad y radar SAR bajo nubes.',
                  link: '/parcela',
                  status: 'Activo',
                  color: 'var(--emerald-600)',
                  bg: '#ffffff'
                },
                {
                  title: '💰 Finanzas Predictivas',
                  desc: 'Costos, ingresos estimados, ROI y microcréditos ajustados por observación terrestre.',
                  link: '/financiero',
                  status: 'Calibrado',
                  color: 'var(--emerald-600)',
                  bg: '#ffffff'
                },
                {
                  title: '🛒 Mercado Agroecológico',
                  desc: 'Vende tu cosecha de forma directa y compara precios en tiempo real sin intermediarios.',
                  link: '/mercado',
                  status: 'Nuevo',
                  color: 'var(--blue)',
                  bg: 'var(--emerald-50)'
                },
                {
                  title: '🤝 Red Comunitaria',
                  desc: 'Envía alertas de plagas en Chinandega, lee consejos prácticos e infórmate con tus vecinos.',
                  link: '/comunidad',
                  status: 'Nuevo',
                  color: 'var(--blue)',
                  bg: 'var(--emerald-50)'
                },
                {
                  title: '🧠 Capacitación Rural',
                  desc: 'Lecciones simples e interactivas sobre conservación de agua y salud del suelo.',
                  link: '/educacion',
                  status: 'E-Learning',
                  color: 'var(--emerald-600)',
                  bg: '#ffffff'
                },
                {
                  title: '🛠️ Herramientas Técnicas',
                  desc: 'Calculadora de evapotranspiración ETo y dosificación exacta de nutrientes.',
                  link: '/herramientas',
                  status: '2 Calculadoras',
                  color: 'var(--emerald-600)',
                  bg: '#ffffff'
                }
              ].map((m, idx) => (
                <div 
                  key={idx} 
                  className="card animate-in d2" 
                  style={{ 
                    padding: '14px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer', 
                    background: m.bg, 
                    border: m.status === 'Nuevo' ? '1.5px solid var(--blue)' : '1.5px solid var(--border-light)',
                    minHeight: '145px'
                  }} 
                  onClick={() => nav(m.link)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</h4>
                      <span className="badge" style={{ 
                        fontSize: '0.52rem', 
                        padding: '2px 6px',
                        background: m.status === 'Nuevo' ? 'var(--blue-bg)' : 'var(--emerald-50)', 
                        color: m.status === 'Nuevo' ? 'var(--blue)' : 'var(--emerald-800)',
                        border: `1px solid ${m.status === 'Nuevo' ? 'var(--blue)' : 'var(--emerald-300)'}`
                      }}>{m.status}</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.35', marginBottom: '10px' }}>{m.desc}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: m.color, display: 'flex', alignItems: 'center', gap: '3px', marginTop: 'auto' }}>
                    Ir al módulo →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas Activas */}
          {alerts.length > 0 && (
            <div className="animate-in d1" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map((a, i) => <AlertCard key={i} alert={a} />)}
            </div>
          )}

          {/* Galería de Satélites */}
          {currentBbox && (
            <div className="animate-in d2">
              <SatelliteCarousel bbox={currentBbox} autoLoad={true} />
            </div>
          )}

          {/* Pronóstico y Gráficos */}
          <div className="animate-in d3">
            <div className="card" style={{ padding: '18px' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                Pronóstico del Tiempo (Open-Meteo)
              </h4>
              <WeatherStrip days={climate.days || []} />
            </div>
          </div>

          <div className="animate-in d4"><NDVITimeline data={ndviHistory} /></div>
          <div className="animate-in d5"><RainfallChart days={climate.days || []} /></div>
        </div>
      </div>
    </div>
  )
}

