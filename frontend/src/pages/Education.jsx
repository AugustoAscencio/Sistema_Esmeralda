import { useState } from 'react'

const MODULES = [
  { id: 'ndvi', title: 'Que es el NDVI?', summary: 'Mide la salud de tus cultivos desde el espacio', content: `El NDVI (Indice de Vegetacion de Diferencia Normalizada) es como un "termometro" de la salud de tu cultivo, medido desde el espacio.\n\nLos satelites Sentinel-2 capturan luz infrarroja. Las plantas sanas reflejan MUCHA luz infrarroja. Las enfermas reflejan poca.\n\nComo leer tu NDVI:\n0.6 - 1.0: Excelente. Cultivo fuerte y saludable.\n0.4 - 0.6: Bueno. Condiciones aceptables.\n0.2 - 0.4: Alerta. Estres hidrico o nutricional.\n0.0 - 0.2: Critico. Suelo desnudo o vegetacion danada.`,
    quiz: [{ q: 'Un NDVI de 0.7 significa que tu cultivo esta...?', opts: ['Enfermo', 'Muerto', 'Saludable'], answer: 2 }, { q: 'Que satelite mide el NDVI?', opts: ['GPS', 'Sentinel-2', 'WhatsApp'], answer: 1 }] },
  { id: 'moisture', title: 'Que es la humedad del suelo?', summary: 'El radar ve el agua bajo la superficie', content: `La humedad del suelo indica cuanta agua tiene disponible tu cultivo. Se mide con radar desde Sentinel-1.\n\nA diferencia de Sentinel-2, Sentinel-1 usa radar (SAR) que atraviesa nubes y funciona de noche.\n\nNiveles:\n60-100%: Humedo. Buen nivel.\n30-60%: Moderado. Aceptable.\n10-30%: Seco. Considerar riego.\n0-10%: Critico. Riesgo de perdida.`,
    quiz: [{ q: 'Que satelite mide la humedad?', opts: ['Sentinel-1', 'Sentinel-2', 'Hubble'], answer: 0 }, { q: 'Funciona con nubes?', opts: ['No', 'Si', 'Solo de dia'], answer: 1 }] },
  { id: 'drought', title: 'Como protegerse de la sequia?', summary: 'Prepararse antes con datos satelitales', content: `La sequia es la amenaza mas grande. Con datos satelitales puedes prepararte ANTES.\n\nSenales tempranas:\n- NDVI bajando semana a semana\n- Humedad cayendo bajo 30%\n- Sin lluvia por mas de 7 dias\n- Temperatura sobre 38C constante\n\nAcciones concretas:\n1. Riego de emergencia\n2. Mulching para retener humedad\n3. Reducir area sembrada\n4. Solicitar microcredito de emergencia\n5. Considerar cultivos resistentes (sorgo, yuca)`,
    quiz: [{ q: 'Senal temprana de sequia?', opts: ['NDVI subiendo', 'NDVI bajando', 'Mucha lluvia'], answer: 1 }, { q: 'El mulching sirve para...?', opts: ['Decorar', 'Retener humedad', 'Espantar pajaros'], answer: 1 }] },
  { id: 'credit', title: 'Que es el microcredito parametrico?', summary: 'Credito automatico basado en datos', content: `Un microcredito parametrico se activa automaticamente cuando datos medibles indican que lo necesitas.\n\nEn Esmeralda los parametros son satelitales:\n- Si tu NDVI cae: se activa credito\n- Si la humedad es critica: el monto aumenta\n- Tu Score determina la tasa de interes\n\nVentajas:\n- No necesitas ir al banco\n- Sin papeleo complicado\n- El satelite es tu "garantia"\n- Decision rapida\n- Tasas justas basadas en datos objetivos`,
    quiz: [{ q: 'Quien decide si recibes credito?', opts: ['Un funcionario', 'El algoritmo', 'La suerte'], answer: 1 }, { q: 'Que sirve como garantia?', opts: ['Tu casa', 'Datos satelitales', 'Nada'], answer: 1 }] },
  { id: 'score', title: 'Como usar el Score de Resiliencia?', summary: 'Tu calificacion del 0 al 100', content: `Tu Score va de 0 a 100.\n\nComponentes:\n- Salud del cultivo (NDVI): hasta 40 pts\n- Estabilidad: hasta 25 pts\n- Agua disponible: hasta 20 pts\n- Riesgo climatico: hasta 15 pts\n\nCon el banco:\n75-100: Excelente. Mejores tasas.\n55-74: Bueno. Tasas moderadas.\n35-54: Moderado. Garantia adicional.\n0-34: Alto riesgo. Buscar asistencia.`,
    quiz: [{ q: 'Cuantos componentes tiene?', opts: ['2', '4', '10'], answer: 1 }, { q: 'Score de 80 significa...?', opts: ['Peligro', 'Excelente', 'Regular'], answer: 1 }] },
]

function Quiz({ quiz }) {
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const score = done ? Object.keys(answers).filter((qi) => answers[qi] === quiz[parseInt(qi)].answer).length : 0
  return (
    <div style={{ marginTop: '20px', padding: '22px', background: 'linear-gradient(135deg, var(--emerald-50), var(--bg-elevated))', borderRadius: 'var(--r-md)', border: '2px solid var(--emerald-300)' }}>
      <h5 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--emerald-800)' }}>Evaluacion rapida</h5>
      {quiz.map((q, qi) => (
        <div key={qi} style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600 }}>{q.q}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {q.opts.map((opt, oi) => {
              const sel = answers[qi] === oi
              const correct = done && oi === q.answer
              const wrong = done && sel && oi !== q.answer
              return (
                <button key={oi} onClick={() => !done && setAnswers({ ...answers, [qi]: oi })} style={{
                  padding: '8px 18px', fontSize: '0.82rem', borderRadius: 'var(--r-md)', cursor: done ? 'default' : 'pointer',
                  background: correct ? 'var(--emerald-200)' : wrong ? '#fee2e2' : sel ? 'var(--emerald-100)' : '#fff',
                  border: `2px solid ${correct ? 'var(--emerald-500)' : wrong ? 'var(--red)' : sel ? 'var(--emerald-400)' : 'var(--emerald-200)'}`,
                  color: correct ? 'var(--emerald-800)' : wrong ? '#991b1b' : sel ? 'var(--emerald-700)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, transition: 'all 0.25s',
                  boxShadow: sel ? 'var(--shadow-sm)' : 'none',
                }}>{opt}</button>
              )
            })}
          </div>
        </div>
      ))}
      {!done ? (
        <button className="btn btn-primary btn-sm" onClick={() => setDone(true)} style={{ marginTop: '4px' }}>Verificar respuestas</button>
      ) : (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--r-sm)', marginTop: '8px',
          background: score === quiz.length ? 'var(--emerald-100)' : '#fff7ed',
          border: `2px solid ${score === quiz.length ? 'var(--emerald-400)' : '#fb923c'}`,
          fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700,
          color: score === quiz.length ? 'var(--emerald-800)' : '#9a3412',
        }}>
          {score === quiz.length ? 'Perfecto. Dominas este tema.' : `${score}/${quiz.length} correctas. Intenta de nuevo.`}
        </div>
      )}
    </div>
  )
}

export default function Education() {
  const [open, setOpen] = useState(null)
  return (
    <div className="page" style={{ maxWidth: '860px' }}>
      <div className="card-dark animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '6px', color: '#fff' }}>Educacion Agricola</h1>
        <p style={{ color: 'var(--emerald-300)', fontSize: '0.9rem', margin: 0 }}>Aprende a interpretar datos satelitales para tomar mejores decisiones en tu finca.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {MODULES.map((mod, idx) => (
          <div key={mod.id} className={`card animate-in d${Math.min(idx + 1, 5)}`}
            style={{ cursor: 'pointer', padding: '20px', borderLeft: open === mod.id ? '5px solid var(--emerald-500)' : '5px solid var(--emerald-200)' }}
            onClick={() => setOpen(open === mod.id ? null : mod.id)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: open === mod.id ? 'var(--emerald-600)' : 'var(--emerald-100)',
                  border: `2px solid ${open === mod.id ? 'var(--emerald-600)' : 'var(--emerald-300)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                  color: open === mod.id ? '#fff' : 'var(--emerald-700)',
                  fontWeight: 700, transition: 'all 0.3s',
                }}>0{idx + 1}</div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{mod.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{mod.summary}</p>
                </div>
              </div>
              <span style={{ color: 'var(--emerald-500)', fontSize: '16px', transition: 'transform 0.3s', transform: open === mod.id ? 'rotate(180deg)' : 'none' }}>&#9660;</span>
            </div>
            {open === mod.id && (
              <div className="animate-slide" onClick={(e) => e.stopPropagation()} style={{ marginTop: '20px', paddingTop: '18px', borderTop: '2px solid var(--emerald-200)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{mod.content}</div>
                <Quiz quiz={mod.quiz} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
