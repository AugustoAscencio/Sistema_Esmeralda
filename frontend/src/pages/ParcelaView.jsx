/**
 * ParcelaView v4 — High contrast, dark header, green accents
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ParcelaMap from '../components/map/ParcelaMap'
import useAppStore from '../store/appStore'

function Tip({ children, text }) {
  return <div className="tooltip-wrap">{children}<div className="tooltip-content">{text}</div></div>
}

export default function ParcelaView() {
  const nav = useNavigate()
  const fetchAnalysis = useAppStore((s) => s.fetchAnalysis)
  const parcelaData = useAppStore((s) => s.parcelaData)
  const isLoading = useAppStore((s) => s.isLoadingParcela)
  const analysisReady = useAppStore((s) => s.analysisReady)
  const currentBbox = useAppStore((s) => s.currentBbox)
  const isMobile = useAppStore((s) => s.isMobile)

  const handleBboxSelected = async (bbox) => { await fetchAnalysis(bbox) }

  const ndvi = parcelaData?.ndvi || {}
  const moisture = parcelaData?.moisture || {}
  const climate = parcelaData?.climate || {}
  const resilience = parcelaData?.resilience || {}
  const alerts = parcelaData?.alerts || []

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-dark animate-in" style={{ padding: '20px 24px' }}>
        <h1 style={{ marginBottom: '4px', color: '#fff' }}>Visor Satelital</h1>
        <p style={{ color: 'var(--emerald-300)', fontSize: '0.9rem', margin: 0 }}>
          Selecciona tu parcela con 2 clics para analizar la salud del cultivo con datos Sentinel-2.
        </p>
      </div>

      <div style={{ height: isMobile ? '45vh' : '55vh', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '3px solid var(--emerald-400)', boxShadow: 'var(--shadow-emerald)' }}>
        <ParcelaMap onBboxSelected={handleBboxSelected} bbox={currentBbox} />
      </div>

      {isLoading && (
        <div className="card-emerald animate-glow" style={{ textAlign: 'center', padding: '36px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--emerald-500)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emerald-800)' }}>Analizando area seleccionada...</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--emerald-600)', marginTop: '4px' }}>Sentinel-2 + Sentinel-1 + Open-Meteo</div>
        </div>
      )}

      {analysisReady && parcelaData && !isLoading && (
        <>
          {/* Metrics */}
          <div className="grid-4 animate-in d1">
            {[
              { label: 'NDVI Promedio', value: ndvi.ndvi_mean?.toFixed(3) || '--', color: ndvi.ndvi_mean >= 0.4 ? 'var(--emerald-700)' : 'var(--orange)', tip: 'Salud de la vegetacion medida por Sentinel-2. Arriba de 0.5 es saludable.' },
              { label: 'Humedad Suelo', value: `${moisture.moisture_mean?.toFixed(0) || '--'}%`, color: moisture.moisture_critical ? 'var(--red)' : 'var(--blue)', tip: 'Agua en los primeros 10cm del suelo. Medido por radar Sentinel-1.' },
              { label: 'Lluvia 7d', value: `${climate.summary?.precip_7d_mm?.toFixed(1) || '--'} mm`, color: 'var(--blue)', tip: 'Precipitacion total prevista para la proxima semana.' },
              { label: 'Score', value: resilience.score || 0, color: resilience.score >= 55 ? 'var(--emerald-700)' : 'var(--orange)', tip: 'Score de resiliencia de 0 a 100. Determina tu acceso a credito y condiciones.' },
            ].map((m, i) => (
              <Tip key={i} text={m.tip}>
                <div className="card" style={{ textAlign: 'center', padding: '18px', cursor: 'help' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              </Tip>
            ))}
          </div>

          {/* Info row */}
          <div className="grid-3 animate-in d2">
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Coordenadas</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.8 }}>
                <div>Lon: {currentBbox?.[0]?.toFixed(4)} → {currentBbox?.[2]?.toFixed(4)}</div>
                <div>Lat: {currentBbox?.[1]?.toFixed(4)} → {currentBbox?.[3]?.toFixed(4)}</div>
              </div>
            </div>
            <div className="card-emerald" style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--emerald-700)', textTransform: 'uppercase', marginBottom: '10px' }}>Area estimada</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--emerald-800)' }}>{parcelaData.area_ha?.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--emerald-600)' }}>ha</span></div>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Fuente de datos</div>
              <span className={`badge ${parcelaData.source === 'copernicus_live' ? 'badge-ok' : 'badge-info'}`}>
                {parcelaData.source === 'copernicus_live' ? 'Datos en vivo' : 'Datos demo'}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="animate-in d3" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  padding: '14px 18px', borderRadius: 'var(--r-md)',
                  background: a.level === 'CRITICO' ? '#fef2f2' : a.level === 'ALERTA' ? '#fff7ed' : a.level === 'OK' ? 'var(--emerald-50)' : '#fef3c7',
                  border: `2px solid ${a.level === 'CRITICO' ? '#f87171' : a.level === 'ALERTA' ? '#fb923c' : a.level === 'OK' ? 'var(--emerald-300)' : '#fbbf24'}`,
                  borderLeft: `5px solid ${a.level === 'CRITICO' ? 'var(--red)' : a.level === 'ALERTA' ? 'var(--orange)' : 'var(--emerald-500)'}`,
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.level === 'CRITICO' ? 'var(--red)' : a.level === 'ALERTA' ? 'var(--orange)' : 'var(--emerald-500)', boxShadow: `0 0 8px ${a.level === 'OK' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{a.level}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{a.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation CTAs */}
          <div className="animate-in d4" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => nav('/dashboard')} style={{ boxShadow: 'var(--shadow-emerald)' }}>Ver Panel Completo</button>
            <button className="btn btn-outline" onClick={() => nav('/financiero')}>Analisis Financiero</button>
            <button className="btn btn-outline" onClick={() => nav('/herramientas')}>Herramientas</button>
          </div>
        </>
      )}
    </div>
  )
}
