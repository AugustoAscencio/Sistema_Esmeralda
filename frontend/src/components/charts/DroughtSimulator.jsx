import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { COLORS } from '../../styles/theme'

const CROPS = ['maiz','frijol','arroz','tomate','cafe','sorgo','yuca','platano','aguacate','chile']

export default function DroughtSimulator() {
  const [crop, setCrop] = useState('maiz')
  const [area, setArea] = useState(2.5)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/financial/drought`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop, area_ha: area, drought_pct: 80 }) })
      setData((await res.json()).scenarios)
    } catch {
      setData([
        { drought_pct: 0, net_profit_usd: 450, yield_kg: 3800 },
        { drought_pct: 10, net_profit_usd: 380, yield_kg: 3400 },
        { drought_pct: 20, net_profit_usd: 310, yield_kg: 3000 },
        { drought_pct: 30, net_profit_usd: 220, yield_kg: 2600 },
        { drought_pct: 40, net_profit_usd: 120, yield_kg: 2200 },
        { drought_pct: 50, net_profit_usd: 10, yield_kg: 1800 },
        { drought_pct: 60, net_profit_usd: -120, yield_kg: 1400 },
        { drought_pct: 70, net_profit_usd: -280, yield_kg: 1000 },
        { drought_pct: 80, net_profit_usd: -450, yield_kg: 600 },
      ])
    }
    setLoading(false)
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h4 style={{ marginBottom: '16px' }}>Simulador de Sequia</h4>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select className="input" value={crop} onChange={(e) => setCrop(e.target.value)} style={{ flex: 1, minWidth: '120px' }}>
          {CROPS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input className="input" type="number" value={area} onChange={(e) => setArea(parseFloat(e.target.value) || 1)} style={{ flex: '0 0 100px' }} min="0.1" step="0.5" />
        <button className="btn btn-primary" onClick={simulate} disabled={loading}>{loading ? 'Calculando...' : 'Simular'}</button>
      </div>
      {data && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.red} stopOpacity={0.15} /><stop offset="95%" stopColor={COLORS.red} stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="drought_pct" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: '#e5e7eb' }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `$${v}`} axisLine={{ stroke: '#e5e7eb' }} />
            <Tooltip formatter={(v) => [`$${v.toFixed(0)}`, 'Ganancia']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }} />
            <ReferenceLine y={0} stroke={COLORS.orange} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="net_profit_usd" stroke={COLORS.red} fill="url(#dg)" strokeWidth={2} dot={{ fill: COLORS.red, r: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
