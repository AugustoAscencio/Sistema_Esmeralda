import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { COLORS } from '../../styles/theme'

export default function CropComparator() {
  const [area, setArea] = useState(2.5)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const compare = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/financial/compare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ area_ha: area }) })
      setData((await res.json()).crops?.slice(0, 8) || [])
    } catch {
      setData([
        { crop: 'tomate', net_profit_usd: 3200, risk: 'MEDIO' },
        { crop: 'chile', net_profit_usd: 2800, risk: 'MEDIO' },
        { crop: 'aguacate', net_profit_usd: 2400, risk: 'BAJO' },
        { crop: 'cafe', net_profit_usd: 1800, risk: 'BAJO' },
        { crop: 'platano', net_profit_usd: 1200, risk: 'BAJO' },
        { crop: 'frijol', net_profit_usd: 400, risk: 'MEDIO' },
        { crop: 'maiz', net_profit_usd: 180, risk: 'ALTO' },
        { crop: 'arroz', net_profit_usd: 120, risk: 'ALTO' },
      ])
    }
    setLoading(false)
  }

  const getColor = (r) => r === 'BAJO' ? COLORS.emerald500 : r === 'MEDIO' ? COLORS.orange : COLORS.red

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h4 style={{ marginBottom: '16px' }}>Comparador de Cultivos</h4>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input className="input" type="number" value={area} onChange={(e) => setArea(parseFloat(e.target.value) || 1)} style={{ flex: '0 0 120px' }} min="0.1" step="0.5" />
        <button className="btn btn-primary" onClick={compare} disabled={loading}>{loading ? 'Comparando...' : 'Comparar'}</button>
      </div>
      {data && (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 55, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `$${v}`} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis type="category" dataKey="crop" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} width={55} />
              <Tooltip formatter={(v) => [`$${v.toFixed(0)} USD`, 'Ganancia']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }} />
              <Bar dataKey="net_profit_usd" radius={[0, 3, 3, 0]}>
                {data.map((e, i) => <Cell key={i} fill={getColor(e.risk)} opacity={0.75} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            <span><span style={{ color: COLORS.emerald500 }}>●</span> Riesgo Bajo</span>
            <span><span style={{ color: COLORS.orange }}>●</span> Riesgo Medio</span>
            <span><span style={{ color: COLORS.red }}>●</span> Riesgo Alto</span>
          </div>
        </>
      )}
    </div>
  )
}
