export default function WeatherStrip({ days = [] }) {
  if (!days.length) return null
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
      {days.map((day, i) => {
        const d = new Date(day.date + 'T12:00:00')
        const hot = day.temp_max >= 38
        const rainy = day.precipitation_mm >= 5
        return (
          <div key={i} style={{
            flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
            padding: '12px 16px',
            background: hot ? '#fff7ed' : rainy ? '#eff6ff' : 'var(--bg-elevated)',
            border: `2px solid ${hot ? '#fb923c' : rainy ? '#60a5fa' : 'var(--emerald-200)'}`,
            borderRadius: 'var(--r-md)', minWidth: '75px',
            boxShadow: 'var(--shadow-xs)', transition: 'all 0.3s',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{DAYS[d.getDay()]}</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: hot ? 'var(--orange)' : 'var(--text-primary)' }}>{Math.round(day.temp_max)}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>{Math.round(day.temp_min)}</span>
            </div>
            {day.precipitation_mm > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--blue)', fontWeight: 600 }}>{day.precipitation_mm.toFixed(1)}mm</span>}
          </div>
        )
      })}
    </div>
  )
}
