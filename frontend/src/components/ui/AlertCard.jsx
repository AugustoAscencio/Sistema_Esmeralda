import { getAlertColor } from '../../styles/theme'

const LABELS = { CRITICO: 'Critico', ALERTA: 'Alerta', PRECAUCION: 'Precaucion', OK: 'Normal' }
const BG = { CRITICO: '#fee2e2', ALERTA: '#fff7ed', PRECAUCION: '#fef3c7', OK: 'var(--emerald-50)' }
const BORDER = { CRITICO: '#f87171', ALERTA: '#fb923c', PRECAUCION: '#fbbf24', OK: 'var(--emerald-300)' }
const TEXT = { CRITICO: '#991b1b', ALERTA: '#9a3412', PRECAUCION: '#92400e', OK: 'var(--emerald-800)' }

export default function AlertCard({ alert }) {
  const color = getAlertColor(alert.level)
  return (
    <div style={{
      background: BG[alert.level] || 'var(--bg-secondary)',
      border: `2px solid ${BORDER[alert.level] || 'var(--border-light)'}`,
      borderLeft: `5px solid ${color}`,
      borderRadius: 'var(--r-md)', padding: '14px 18px',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}40` }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: TEXT[alert.level], letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {LABELS[alert.level] || alert.level}
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{alert.message}</p>
    </div>
  )
}
