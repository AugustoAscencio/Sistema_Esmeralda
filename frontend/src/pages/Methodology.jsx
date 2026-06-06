export default function Methodology() {
  return (
    <div className="page" style={{ maxWidth: '940px' }}>
      <div className="card-dark animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '6px', color: '#fff' }}>Metodologia Tecnica</h1>
        <p style={{ color: 'var(--emerald-300)', fontSize: '0.9rem', margin: 0 }}>Documentacion tecnica del algoritmo y fuentes de datos de Sistema Esmeralda.</p>
      </div>

      {[
        { title: '1. Indice de Vegetacion (NDVI)', content: (
          <>
            <div style={{ padding: '18px', background: 'var(--bg-dark)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#34d399', marginBottom: '16px', border: '1.5px solid rgba(16,185,129,0.3)', textAlign: 'center', letterSpacing: '0.05em', boxShadow: 'var(--shadow-md)' }}>NDVI = (B08 - B04) / (B08 + B04)</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>Donde B08 es la banda infrarroja cercana y B04 es la banda roja de Sentinel-2 Level-2A. Valores de -1 a +1. Vegetacion saludable: 0.4 a 0.9.</p>
          </>
        )},
        { title: '2. Algoritmo de Resiliencia', content: (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <thead><tr style={{ borderBottom: '3px solid var(--emerald-400)' }}>
                <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--emerald-700)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Componente</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--emerald-700)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Max</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--emerald-700)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Calculo</th>
              </tr></thead>
              <tbody>
                {[['Salud (NDVI)', '40', 'min(40, ndvi_mean * 50)'], ['Estabilidad', '25', 'max(0, 25 - ndvi_std * 150)'], ['Agua', '20', 'min(20, moisture% * 0.2)'], ['Clima', '15', '15 - penalizaciones']].map(([c, m, f], i) => (
                  <tr key={i} style={{ borderBottom: '1.5px solid var(--emerald-100)', background: i % 2 === 0 ? 'var(--bg-secondary)' : '#fff' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>{c}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--emerald-700)', fontWeight: 700, fontSize: '1rem' }}>{m}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )},
        { title: '3. Integraciones', content: (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <thead><tr style={{ borderBottom: '3px solid var(--emerald-400)' }}>
                <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--emerald-700)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Proveedor</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--emerald-700)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Datos</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--emerald-700)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Costo</th>
              </tr></thead>
              <tbody>
                {[['Copernicus CDSE', 'Sentinel-2 L2A (NDVI, RGB)', 'Gratuito'], ['Copernicus CDSE', 'Sentinel-1 GRD (Humedad)', 'Gratuito'], ['Open-Meteo', 'Pronostico 7 dias', 'Gratuito'], ['Ollama', 'Agente IA Local', 'Local']].map(([s, d, c], i) => (
                  <tr key={i} style={{ borderBottom: '1.5px solid var(--emerald-100)', background: i % 2 === 0 ? 'var(--bg-secondary)' : '#fff' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--emerald-700)', fontWeight: 600 }}>{s}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{d}</td>
                    <td style={{ padding: '12px 10px' }}><span className="badge badge-ok">{c}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )},
        { title: '4. Stack Tecnologico', content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {['Python', 'FastAPI', 'React 18', 'Vite', 'MapLibre GL', 'Three.js', 'Recharts', 'Zustand', 'Sentinel Hub', 'scikit-learn'].map((t) => (
              <span key={t} className="badge badge-ok" style={{ padding: '8px 18px', fontSize: '0.75rem' }}>{t}</span>
            ))}
          </div>
        )},
      ].map((s, i) => (
        <div key={i} className={`card animate-in d${i + 1}`} style={{ padding: '26px', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '18px', color: 'var(--emerald-700)' }}>{s.title}</h3>
          {s.content}
        </div>
      ))}
    </div>
  )
}
