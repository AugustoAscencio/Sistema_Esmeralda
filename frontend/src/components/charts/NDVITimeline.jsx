import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={{ background: '#022c22', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <div style={{ color: '#6ee7b7', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: v >= 0.5 ? '#34d399' : v >= 0.3 ? '#fbbf24' : '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>NDVI: {v.toFixed(3)}</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', marginTop: '2px' }}>
        {v >= 0.6 ? 'Vegetacion saludable' : v >= 0.4 ? 'Aceptable' : v >= 0.2 ? 'Estres detectado' : 'Vegetacion danada'}
      </div>
    </div>
  )
}

export default function NDVITimeline({ data = [] }) {
  if (!data.length) return null
  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '0.9rem', marginBottom: '14px' }}>NDVI Historico</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="ndviG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => v.slice(5)} axisLine={{ stroke: '#a7f3d0' }} />
          <YAxis domain={[0, 1]} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#a7f3d0' }} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={0.3} stroke="#dc2626" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Critico', fill: '#dc2626', fontSize: 10 }} />
          <ReferenceLine y={0.6} stroke="#059669" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Optimo', fill: '#059669', fontSize: 10 }} />
          <Area type="monotone" dataKey="ndvi" stroke="#059669" fill="url(#ndviG2)" strokeWidth={3} dot={{ fill: '#059669', r: 3.5, strokeWidth: 2, stroke: '#d1fae5' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
