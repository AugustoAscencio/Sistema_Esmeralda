import ScoreSphere from '../three/ScoreSphere'
import { getScoreLabel } from '../../styles/theme'

export default function ResilienceScore({ score = 0, credit = {}, size = 200 }) {
  const label = getScoreLabel(score)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <ScoreSphere score={score} size={size} />
      <span className={`badge ${score >= 55 ? 'badge-ok' : score >= 35 ? 'badge-warning' : 'badge-danger'}`}>{label}</span>
      {credit.recommendation && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {credit.recommendation} · Hasta ${credit.max_amount_usd || 0} USD
        </span>
      )}
    </div>
  )
}
