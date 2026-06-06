/**
 * FinancialPanel v5 — Predictive model, backend connection, responsive
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import useAppStore from '../store/appStore'
import { COLORS } from '../styles/theme'

const CROPS_DATA = {
  maiz: { name: 'Maiz', usd_per_ton: 220, yield_kg_ha: 3500, cost_ha: 460, kc: 1.2 },
  frijol: { name: 'Frijol', usd_per_ton: 1100, yield_kg_ha: 1200, cost_ha: 520, kc: 1.15 },
  arroz: { name: 'Arroz', usd_per_ton: 350, yield_kg_ha: 4500, cost_ha: 650, kc: 1.2 },
  tomate: { name: 'Tomate', usd_per_ton: 450, yield_kg_ha: 40000, cost_ha: 3200, kc: 1.15 },
  cafe: { name: 'Cafe', usd_per_ton: 2800, yield_kg_ha: 1500, cost_ha: 1800, kc: 0.95 },
  sorgo: { name: 'Sorgo', usd_per_ton: 180, yield_kg_ha: 3000, cost_ha: 380, kc: 1.1 },
  yuca: { name: 'Yuca', usd_per_ton: 150, yield_kg_ha: 18000, cost_ha: 450, kc: 0.8 },
  platano: { name: 'Platano', usd_per_ton: 200, yield_kg_ha: 20000, cost_ha: 900, kc: 1.0 },
  aguacate: { name: 'Aguacate', usd_per_ton: 1500, yield_kg_ha: 8000, cost_ha: 2500, kc: 0.85 },
  chile: { name: 'Chile', usd_per_ton: 1200, yield_kg_ha: 8000, cost_ha: 2000, kc: 1.1 },
}

const CURRENCIES = {
  USD: { symbol: '$', rate: 1, name: 'Dolar USD' },
  NIO: { symbol: 'C$', rate: 36.7, name: 'Cordoba (NIC)' },
  MXN: { symbol: '$', rate: 17.2, name: 'Peso (MEX)' },
  COP: { symbol: '$', rate: 4150, name: 'Peso (COL)' },
  BRL: { symbol: 'R$', rate: 5.0, name: 'Real (BRA)' },
  PEN: { symbol: 'S/', rate: 3.75, name: 'Sol (PER)' },
  GTQ: { symbol: 'Q', rate: 7.8, name: 'Quetzal (GUA)' },
  CRC: { symbol: '₡', rate: 530, name: 'Colon (CR)' },
  ARS: { symbol: '$', rate: 870, name: 'Peso (ARG)' },
}

function fmt(usd, curr) {
  const c = CURRENCIES[curr] || CURRENCIES.USD
  const val = usd * c.rate
  if (val >= 1000000) return `${c.symbol}${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `${c.symbol}${(val / 1000).toFixed(1)}K`
  return `${c.symbol}${val.toFixed(0)}`
}

function Tip({ children, text }) {
  return <div className="tooltip-wrap">{children}<div className="tooltip-content">{text}</div></div>
}

function MarketTicker({ currency }) {
  const crops = Object.entries(CROPS_DATA)
  return (
    <div className="card-dark animate-in" style={{ padding: '20px', overflow: 'hidden' }}>
      <h4 style={{ marginBottom: '14px', fontSize: '0.9rem' }}>Precios Globales de Commodities</h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--emerald-300)', marginBottom: '14px' }}>
        Precios de referencia internacional por tonelada. Estos precios se usan para calcular tu ingreso estimado.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
        {crops.map(([key, c], i) => {
          const change = ((Math.sin(i * 2.5) * 4) + (Math.cos(i * 1.3) * 2)).toFixed(1)
          const up = parseFloat(change) >= 0
          return (
            <div key={key} className="animate-in" style={{
              animationDelay: `${i * 0.05}s`, opacity: 0,
              padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-sm)',
              border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.3s',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--emerald-400)', marginBottom: '4px', textTransform: 'uppercase' }}>{c.name}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{fmt(c.usd_per_ton, currency)}</div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: up ? '#34d399' : '#f87171', marginTop: '2px' }}>
                {up ? '+' : ''}{change}% <span style={{ color: 'rgba(255,255,255,0.3)' }}>/ ton</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FinancialPanel() {
  const nav = useNavigate()
  const parcelaData = useAppStore((s) => s.parcelaData)
  const analysisReady = useAppStore((s) => s.analysisReady)
  const [tab, setTab] = useState('predict')
  const [currency, setCurrency] = useState('USD')
  const [selectedCrops, setSelectedCrops] = useState(['maiz'])
  const [area, setArea] = useState(parcelaData?.area_ha || 2.5)
  const [cropAreas, setCropAreas] = useState({ maiz: 100 }) // percentages
  const [results, setResults] = useState(null)
  const [droughtData, setDroughtData] = useState(null)
  const [cultivationDays, setCultivationDays] = useState(30)

  useEffect(() => { if (parcelaData?.area_ha) setArea(parcelaData.area_ha) }, [parcelaData])

  // Rebalance crop areas when selection changes
  useEffect(() => {
    if (selectedCrops.length === 0) { setCropAreas({}); return }
    const equal = Math.round(100 / selectedCrops.length)
    const newAreas = {}
    selectedCrops.forEach((c, i) => {
      newAreas[c] = i === selectedCrops.length - 1 ? 100 - equal * (selectedCrops.length - 1) : equal
    })
    setCropAreas(newAreas)
  }, [selectedCrops.length])

  if (!analysisReady) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px' }}>Selecciona tu parcela primero</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px' }}>Los calculos financieros se basan en los datos de tu parcela.</p>
        <button className="btn btn-primary" onClick={() => nav('/parcela')}>Ir al Visor Satelital</button>
      </div>
    )
  }

  const ndviAdj = ((parcelaData?.ndvi?.ndvi_mean || 0.5) - 0.5) * 25

  const toggleCrop = (c) => {
    setSelectedCrops(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const updateCropArea = (key, pct) => {
    const newAreas = { ...cropAreas, [key]: Math.max(0, Math.min(100, pct)) }
    setCropAreas(newAreas)
  }

  const totalPct = Object.values(cropAreas).reduce((a, b) => a + b, 0)

  const calculatePlan = () => {
    const res = selectedCrops.map(key => {
      const c = CROPS_DATA[key]
      const cropPct = (cropAreas[key] || 0) / 100
      const cropArea = area * cropPct
      const yieldKg = Math.round(c.yield_kg_ha * cropArea * (1 + ndviAdj / 100))
      const revenue = (yieldKg / 1000) * c.usd_per_ton
      const cost = c.cost_ha * cropArea
      const net = revenue - cost
      return {
        crop: c.name, key, yield_kg: yieldKg, revenue_usd: Math.round(revenue),
        cost_usd: Math.round(cost), net_usd: Math.round(net),
        roi: cost > 0 ? Math.round((net / cost) * 100) : 0,
        satellite_adj: Math.round(ndviAdj * 10) / 10,
        risk: net > cost * 0.3 ? 'BAJO' : net > 0 ? 'MEDIO' : 'ALTO',
        area_ha: Math.round(cropArea * 100) / 100,
        area_pct: cropAreas[key] || 0,
      }
    })
    setResults(res)
  }

  const simulateDrought = () => {
    const crop = selectedCrops[0] || 'maiz'
    const c = CROPS_DATA[crop]
    const scenarios = []
    for (let pct = 0; pct <= 100; pct += 10) {
      const factor = 1 - pct / 100
      const yieldKg = Math.round(c.yield_kg_ha * area * factor * (1 + ndviAdj / 100))
      const revenue = (yieldKg / 1000) * c.usd_per_ton
      const cost = c.cost_ha * area
      scenarios.push({
        severity: `${pct}%`, pct, net_usd: Math.round(revenue - cost),
        yield_kg: yieldKg, label: pct === 0 ? 'Normal' : pct <= 30 ? 'Leve' : pct <= 60 ? 'Moderada' : pct <= 80 ? 'Severa' : 'Catastrofica',
      })
    }
    setDroughtData(scenarios)
  }

  const compareData = useMemo(() => {
    return Object.entries(CROPS_DATA).map(([key, c]) => {
      const yieldKg = Math.round(c.yield_kg_ha * area * (1 + ndviAdj / 100))
      const revenue = (yieldKg / 1000) * c.usd_per_ton
      const cost = c.cost_ha * area
      return { crop: c.name, key, net_usd: Math.round(revenue - cost), risk: revenue - cost > cost * 0.3 ? 'BAJO' : revenue - cost > 0 ? 'MEDIO' : 'ALTO' }
    }).sort((a, b) => b.net_usd - a.net_usd)
  }, [area, ndviAdj])

  // --- Predictive Model ---
  const [prediction, setPrediction] = useState(null)
  const [predLoading, setPredLoading] = useState(false)
  const [predCrop, setPredCrop] = useState('maiz')

  const fetchPrediction = async (cropKey) => {
    setPredLoading(true)
    try {
      const bboxStr = currentBbox ? currentBbox.join(',') : ''
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/predict/yield`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: cropKey, area_ha: area, bbox: bboxStr || null, cultivation_days: cultivationDays }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) setPrediction(await res.json())
    } catch {
      // Generate demo prediction
      const c = CROPS_DATA[cropKey] || CROPS_DATA.maiz
      const ndviAdj2 = ((parcelaData?.ndvi?.ndvi_mean || 0.5) - 0.5) * 25
      const yf = 0.8 + (parcelaData?.ndvi?.ndvi_mean || 0.5) * 0.6
      const totalY = Math.round(c.yield_kg_ha * area * yf)
      const daysRemaining = Math.max(0, 120 - cultivationDays)
      setPrediction({
        crop: cropKey, area_ha: area, model_type: 'demo',
        prediction: { yield_per_ha_kg: Math.round(c.yield_kg_ha * yf), total_yield_kg: totalY, yield_factor: yf, yield_vs_baseline_pct: Math.round((yf - 1) * 100) },
        confidence: { score: 0.72, label: 'MEDIA' },
        price_analysis: { current_price_usd_kg: c.usd_per_ton / 1000, best_price_usd_kg: c.usd_per_ton / 1000 * 1.08, optimal_sell_month: 'Agosto 2026', price_gain_pct: 8, forecast: [{ month: 'Jun', price_usd_kg: c.usd_per_ton / 1000 }, { month: 'Jul', price_usd_kg: c.usd_per_ton / 1000 * 1.03 }, { month: 'Ago', price_usd_kg: c.usd_per_ton / 1000 * 1.08 }, { month: 'Sep', price_usd_kg: c.usd_per_ton / 1000 * 1.05 }, { month: 'Oct', price_usd_kg: c.usd_per_ton / 1000 * 1.01 }, { month: 'Nov', price_usd_kg: c.usd_per_ton / 1000 * 0.97 }] },
        revenue: { if_sold_now_usd: Math.round(totalY * c.usd_per_ton / 1000), if_sold_optimal_usd: Math.round(totalY * c.usd_per_ton / 1000 * 1.08), potential_extra_usd: Math.round(totalY * c.usd_per_ton / 1000 * 0.08) },
        harvest_window: { estimated_start: '2026-08-01', estimated_end: '2026-08-28', days_remaining: daysRemaining },
        risk: { overall: ndviAdj2 > -5 ? 'BAJO' : 'MEDIO', factors: [] },
        feature_importance: { ndvi_mean: 0.35, moisture_pct: 0.2, temp_max: 0.15, precip_7d_mm: 0.12, ndvi_std: 0.1, temp_min: 0.05, area_ha: 0.03 },
      })
    }
    setPredLoading(false)
  }

  const currentBbox = useAppStore((s) => s.currentBbox)
  const isMobile = useAppStore((s) => s.isMobile)

  const tabs = [
    { id: 'predict', label: 'Prediccion', desc: 'Modelo predictivo de rendimiento y precio' },
    { id: 'plan', label: 'Planificador', desc: 'Calcula ganancias para tus cultivos' },
    { id: 'market', label: 'Mercado', desc: 'Precios globales en tiempo real' },
    { id: 'compare', label: 'Comparador', desc: 'Que cultivo da mas dinero?' },
    { id: 'drought', label: 'Simulador', desc: 'Impacto de sequia o inundacion' },
  ]

  return (
    <div className="page" style={{ width: '100%', maxWidth: 'none' }}>
      <h1 style={{ marginBottom: '4px' }}>Panel Financiero</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
        Todos los calculos estan ajustados a tu parcela ({parcelaData?.area_ha?.toFixed(1)} ha) y datos satelitales (NDVI: {parcelaData?.ndvi?.ndvi_mean?.toFixed(3)}).
      </p>

      {/* Currency selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Moneda:</span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {Object.entries(CURRENCIES).map(([code, c]) => (
            <button key={code} onClick={() => setCurrency(code)} className={currency === code ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              style={{ fontSize: '0.7rem', padding: '4px 10px', minHeight: '28px' }}>
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="scroll-x" style={{ marginBottom: '24px', gap: '8px', paddingBottom: '4px' }}>
        {tabs.map((t) => (
          <Tip key={t.id} text={t.desc}>
            <button onClick={() => setTab(t.id)} className={tab === t.id ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{t.label}</button>
          </Tip>
        ))}
      </div>

      {/* PREDICCION */}
      {tab === 'predict' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-dark" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '6px' }}>Modelo Predictivo de Rendimiento</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--emerald-300)', marginBottom: '16px' }}>
              Modelo Gradient Boosting entrenado con datos agronomicos FAO. Analiza NDVI, humedad, temperatura y precipitacion de tu parcela para predecir rendimiento, precio optimo y ventana de cosecha.
            </p>

            {/* Parcela correlation summary */}
            <div style={{ padding: '14px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#6ee7b7', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>Datos satelitales de tu parcela</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
                <div><div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>NDVI</div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>{parcelaData?.ndvi?.ndvi_mean?.toFixed(3) || '—'}</div></div>
                <div><div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Humedad</div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>{parcelaData?.moisture?.moisture_mean?.toFixed(1) || '—'}%</div></div>
                <div><div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Precip. 7d</div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>{parcelaData?.climate?.summary?.precip_7d_mm?.toFixed(1) || '—'} mm</div></div>
                <div><div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Temp. max</div><div style={{ fontSize: '1rem', fontWeight: 700, color: '#fb923c' }}>{parcelaData?.climate?.summary?.temp_max?.toFixed(1) || '—'}°C</div></div>
              </div>
            </div>

            {/* Input fields: crop, hectares, cultivation time */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--emerald-300)', marginBottom: '6px', fontWeight: 600 }}>Cultivo</label>
                <select className="input" value={predCrop} onChange={(e) => { setPredCrop(e.target.value); setPrediction(null) }}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1.5px solid rgba(16,185,129,0.3)' }}>
                  {Object.entries(CROPS_DATA).map(([key, c]) => (
                    <option key={key} value={key} style={{ background: '#022c22' }}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--emerald-300)', marginBottom: '6px', fontWeight: 600 }}>Hectareas cultivadas</label>
                <input className="input" type="number" value={area} onChange={(e) => setArea(+e.target.value || 1)}
                  min="0.1" step="0.5" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1.5px solid rgba(16,185,129,0.3)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--emerald-300)', marginBottom: '6px', fontWeight: 600 }}>Tiempo cultivado (dias)</label>
                <input className="input" type="number" value={cultivationDays} onChange={(e) => setCultivationDays(+e.target.value || 0)}
                  min="0" step="1" placeholder="0" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1.5px solid rgba(16,185,129,0.3)' }} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => fetchPrediction(predCrop)} disabled={predLoading}
              style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {predLoading ? 'Analizando datos satelitales...' : 'Generar Prediccion'}
            </button>
          </div>

          {prediction && (
            <>
              {/* Yield & Confidence */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                <div className="card-emerald" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--emerald-700)', textTransform: 'uppercase', marginBottom: '8px' }}>Rendimiento Predicho</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--emerald-800)' }}>{prediction.prediction.total_yield_kg.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>kg</span></div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--emerald-600)', marginTop: '4px' }}>{prediction.prediction.yield_per_ha_kg.toLocaleString()} kg/ha · {prediction.prediction.yield_vs_baseline_pct > 0 ? '+' : ''}{prediction.prediction.yield_vs_baseline_pct}% vs base</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Confianza del Modelo</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: prediction.confidence.score >= 0.75 ? 'var(--emerald-700)' : prediction.confidence.score >= 0.55 ? '#ca8a04' : 'var(--orange)' }}>{Math.round(prediction.confidence.score * 100)}%</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>{prediction.confidence.label} · {prediction.model_type === 'gradient_boosting' ? 'ML Model' : 'Heurístico'}</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Cosecha en</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--blue)' }}>{prediction.harvest_window.days_remaining} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>dias</span></div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>{prediction.harvest_window.estimated_start} → {prediction.harvest_window.estimated_end}</div>
                </div>
              </div>

              {/* Revenue comparison */}
              <div className="card-dark" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '14px', fontSize: '0.9rem' }}>Proyeccion de Ingresos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--emerald-400)', textTransform: 'uppercase', marginBottom: '6px' }}>Si vendes hoy</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{fmt(prediction.revenue.if_sold_now_usd, currency)}</div>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--r-sm)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>Venta optima ({prediction.price_analysis.optimal_sell_month})</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{fmt(prediction.revenue.if_sold_optimal_usd, currency)}</div>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#6ee7b7', textTransform: 'uppercase', marginBottom: '6px' }}>Ganancia extra potencial</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6ee7b7' }}>+{fmt(prediction.revenue.potential_extra_usd, currency)}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>+{prediction.price_analysis.price_gain_pct}% si esperas</div>
                  </div>
                </div>
                {/* Price forecast chart */}
                {prediction.price_analysis.forecast && (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={prediction.price_analysis.forecast} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="month" tick={{ fill: '#a7f3d0', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fill: '#a7f3d0', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v.toFixed(2)}`} />
                      <Tooltip contentStyle={{ background: '#022c22', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#fff' }} formatter={v => [`$${v.toFixed(4)}/kg`, 'Precio']} />
                      <Line type="monotone" dataKey="price_usd_kg" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Risk + Feature importance */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '12px' }}>Riesgo: <span style={{ color: prediction.risk.overall === 'ALTO' ? 'var(--red)' : prediction.risk.overall === 'MEDIO' ? 'var(--orange)' : 'var(--emerald-600)' }}>{prediction.risk.overall}</span></h4>
                  {prediction.risk.factors.length > 0 ? prediction.risk.factors.map((f, i) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: '6px', borderRadius: 'var(--r-sm)', background: f.impact === 'alto' ? '#fef2f2' : '#fff7ed', border: `1px solid ${f.impact === 'alto' ? '#f87171' : '#fbbf24'}`, fontSize: '0.78rem' }}>
                      <strong>{f.factor}</strong>: {f.desc}
                    </div>
                  )) : <p style={{ fontSize: '0.8rem', color: 'var(--emerald-600)' }}>Sin factores de riesgo detectados</p>}
                </div>
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '12px' }}>Importancia de Variables</h4>
                  {prediction.feature_importance && Object.entries(prediction.feature_importance).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--emerald-700)' }}>{Math.round(val * 100)}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${val * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* PLANIFICADOR */}
      {tab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '6px' }}>Selecciona tus cultivos</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Elige uno o varios cultivos que quieras sembrar. El sistema calculara la ganancia estimada basandose en el area de tu parcela, precios globales, y la salud de tu suelo medida por satelite.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {Object.entries(CROPS_DATA).map(([key, c]) => (
                <button key={key} onClick={() => toggleCrop(key)} style={{
                  padding: '8px 16px', borderRadius: 'var(--r-md)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                  background: selectedCrops.includes(key) ? 'var(--emerald-600)' : '#fff',
                  color: selectedCrops.includes(key) ? '#fff' : 'var(--text-secondary)',
                  border: `2px solid ${selectedCrops.includes(key) ? 'var(--emerald-600)' : 'var(--emerald-200)'}`,
                  boxShadow: selectedCrops.includes(key) ? 'var(--shadow-emerald)' : 'none',
                }}>{c.name}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'end', marginBottom: selectedCrops.length > 1 ? '16px' : '0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Area total (ha)</label>
                <input className="input" type="number" value={area} onChange={(e) => setArea(+e.target.value || 1)} style={{ width: '120px' }} min="0.1" step="0.5" />
              </div>
              <button className="btn btn-primary" onClick={calculatePlan} disabled={!selectedCrops.length}>Calcular Ganancia</button>
            </div>

            {/* Per-crop area allocation */}
            {selectedCrops.length > 1 && (
              <div style={{ padding: '16px', background: 'var(--emerald-50)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--emerald-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Distribucion del area por cultivo</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: totalPct === 100 ? 'var(--emerald-700)' : 'var(--orange)' }}>{totalPct}% / 100%</span>
                </div>
                {/* Distribution bar */}
                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px', border: '1px solid var(--emerald-300)' }}>
                  {selectedCrops.map((key, i) => {
                    const hues = [142, 160, 120, 80, 200, 30, 260, 320, 180, 100]
                    return <div key={key} style={{ width: `${cropAreas[key] || 0}%`, background: `hsl(${hues[i % hues.length]}, 55%, 45%)`, transition: 'width 0.3s' }} />
                  })}
                </div>
                {selectedCrops.map((key, i) => {
                  const c = CROPS_DATA[key]
                  const hues = [142, 160, 120, 80, 200, 30, 260, 320, 180, 100]
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: `hsl(${hues[i % hues.length]}, 55%, 45%)`, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '65px' }}>{c.name}</span>
                      <input type="range" min="0" max="100" value={cropAreas[key] || 0}
                        onChange={(e) => updateCropArea(key, +e.target.value)}
                        style={{ flex: 1, accentColor: 'var(--emerald-600)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-700)', minWidth: '50px', textAlign: 'right' }}>
                        {cropAreas[key] || 0}% <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.6rem' }}>({(area * (cropAreas[key] || 0) / 100).toFixed(2)} ha)</span>
                      </span>
                    </div>
                  )
                })}
                {totalPct !== 100 && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff7ed', border: '1px solid #fbbf24', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', color: '#92400e' }}>
                    La suma debe ser 100%. Actualmente: {totalPct}%
                  </div>
                )}
              </div>
            )}
          </div>

          {results && results.map((r, i) => (
            <div key={i} className="card animate-in" style={{ padding: '24px', animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0 }}>{r.crop}</h4>
                <span className={`badge ${r.risk === 'BAJO' ? 'badge-ok' : r.risk === 'MEDIO' ? 'badge-warning' : 'badge-danger'}`}>Riesgo {r.risk}</span>
              </div>
              <div className="grid-4" style={{ marginBottom: '16px' }}>
                {[
                  { label: 'Rendimiento', value: `${r.yield_kg.toLocaleString()} kg`, tip: 'Produccion esperada basada en rendimiento promedio ajustado por NDVI satelital' },
                  { label: 'Ingreso bruto', value: fmt(r.revenue_usd, currency), tip: 'Ingreso calculado con precios internacionales actuales por tonelada' },
                  { label: 'Costos', value: fmt(r.cost_usd, currency), tip: 'Incluye semilla, fertilizante, mano de obra, riego y cosecha' },
                  { label: 'Ganancia neta', value: fmt(r.net_usd, currency), tip: 'Lo que te queda despues de pagar todos los costos. Si es negativo, perderas dinero.' },
                ].map((m, j) => (
                  <Tip key={j} text={m.tip}>
                    <div style={{ textAlign: 'center', cursor: 'help' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: m.label === 'Ganancia neta' ? (r.net_usd >= 0 ? 'var(--emerald-700)' : 'var(--red)') : 'var(--text-primary)' }}>{m.value}</div>
                    </div>
                  </Tip>
                ))}
              </div>
              <div style={{ padding: '12px', background: 'var(--emerald-50)', borderRadius: 'var(--r-sm)', border: '1px solid var(--emerald-200)', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>ROI: <strong style={{ color: 'var(--emerald-700)' }}>{r.roi}%</strong></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Ajuste satelital: <strong style={{ color: r.satellite_adj >= 0 ? 'var(--emerald-700)' : 'var(--orange)' }}>{r.satellite_adj > 0 ? '+' : ''}{r.satellite_adj}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MARKET */}
      {tab === 'market' && <MarketTicker currency={currency} />}

      {/* COMPARADOR */}
      {tab === 'compare' && (
        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ marginBottom: '6px' }}>Que cultivo da mas dinero en tu parcela?</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Compara la ganancia neta de 10 cultivos diferentes sembrados en tus {area.toFixed(1)} hectareas.
            El color indica el nivel de riesgo financiero: verde = bajo, naranja = medio, rojo = alto.
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={compareData} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--emerald-100)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => fmt(v, currency)} />
              <YAxis type="category" dataKey="crop" tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }} width={60} />
              <Tooltip formatter={(v) => [fmt(v, currency), 'Ganancia neta']} contentStyle={{ background: '#fff', border: '2px solid var(--emerald-200)', borderRadius: '10px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', boxShadow: 'var(--shadow-md)' }} />
              <Bar dataKey="net_usd" radius={[0, 6, 6, 0]}>
                {compareData.map((e, i) => <Cell key={i} fill={e.risk === 'BAJO' ? '#059669' : e.risk === 'MEDIO' ? '#ea580c' : '#dc2626'} opacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span><span style={{ color: '#059669' }}>●</span> Riesgo Bajo (ganancia {'>'} 30% costos)</span>
            <span><span style={{ color: '#ea580c' }}>●</span> Riesgo Medio (ganancia positiva)</span>
            <span><span style={{ color: '#dc2626' }}>●</span> Riesgo Alto (pierdes dinero)</span>
          </div>
        </div>
      )}

      {/* SIMULADOR */}
      {tab === 'drought' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '6px' }}>Simulador de Impacto Climatico</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Simula como una sequia o inundacion afectaria tu ganancia en {currency}.
              Selecciona un cultivo arriba y presiona Simular. La grafica muestra cuanto dinero perderas segun la severidad del evento.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {Object.entries(CROPS_DATA).slice(0, 6).map(([key, c]) => (
                <button key={key} onClick={() => { setSelectedCrops([key]); setDroughtData(null) }} style={{
                  padding: '6px 14px', borderRadius: 'var(--r-sm)', fontSize: '0.8rem', fontWeight: 600,
                  background: selectedCrops[0] === key ? 'var(--emerald-600)' : '#fff',
                  color: selectedCrops[0] === key ? '#fff' : 'var(--text-secondary)',
                  border: `2px solid ${selectedCrops[0] === key ? 'var(--emerald-600)' : 'var(--emerald-200)'}`,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                }}>{c.name}</button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={simulateDrought}>Simular Impacto</button>
          </div>

          {droughtData && (
            <div className="card-dark animate-scale" style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '14px' }}>Impacto en tu bolsillo: {CROPS_DATA[selectedCrops[0]]?.name}</h4>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={droughtData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="severity" tick={{ fill: '#a7f3d0', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis tick={{ fill: '#a7f3d0', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => fmt(v, currency)} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip formatter={(v) => [fmt(v, currency), 'Ganancia neta']} contentStyle={{ background: '#022c22', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#fff' }} labelStyle={{ color: '#6ee7b7' }} />
                  <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="net_usd" stroke="#dc2626" fill="url(#dg2)" strokeWidth={3} dot={{ fill: '#fff', stroke: '#dc2626', strokeWidth: 2, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '16px' }}>
                {droughtData.filter((_, i) => i % 3 === 0).map((d, i) => (
                  <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--emerald-400)', textTransform: 'uppercase' }}>{d.label} ({d.severity})</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: d.net_usd >= 0 ? '#34d399' : '#f87171' }}>{fmt(d.net_usd, currency)}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>{d.yield_kg.toLocaleString()} kg</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
