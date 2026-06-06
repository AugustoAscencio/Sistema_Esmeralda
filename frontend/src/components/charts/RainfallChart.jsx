import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function RainfallChart({ days = [] }) {
  if (!days.length) return null
  const data = days.map((d) => ({ date: d.date.slice(5), precipitation: d.precipitation_mm }))
  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '0.9rem', marginBottom: '14px' }}>Precipitacion 7 dias</h4>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#a7f3d0' }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#a7f3d0' }} />
          <Tooltip formatter={(v) => [`${v.toFixed(1)} mm`, 'Precipitacion']} contentStyle={{ background: '#022c22', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: '10px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} labelStyle={{ color: '#6ee7b7' }} />
          <Bar dataKey="precipitation" fill="#2563eb" radius={[4, 4, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
