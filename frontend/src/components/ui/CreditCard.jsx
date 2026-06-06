export default function CreditCard({ credit = {} }) {
  const ok = credit.recommendation === 'APROBADO' || credit.recommendation === 'CONDICIONAL'
  return (
    <div className={ok ? 'card-emerald' : 'card'} style={{ border: ok ? '2px solid var(--emerald-400)' : '2px solid #f87171' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Microcredito Parametrico</h4>
        <span className={`badge ${ok ? 'badge-ok' : 'badge-danger'}`}>{credit.recommendation || 'N/A'}</span>
      </div>
      <div className="credit-grid">
        {[
          { label: 'Monto maximo', value: `$${credit.max_amount_usd || 0}`, sub: 'USD', color: ok ? 'var(--emerald-700)' : 'var(--text-muted)' },
          { label: 'Tasa', value: `${credit.interest_rate_pct || 0}%`, sub: 'anual', color: 'var(--text-primary)' },
          { label: 'Activado por', value: 'Satelite', sub: 'NDVI + Humedad', color: 'var(--blue)' },
        ].map((m, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>{m.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>
      {ok && <button className="btn btn-primary w-full" style={{ marginTop: '20px' }}>Solicitar Microcredito</button>}
    </div>
  )
}
