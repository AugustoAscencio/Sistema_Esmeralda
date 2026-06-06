/**
 * Herramientas v4 — Intuitive UI with clear sections, tooltips, high contrast
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/appStore'

const CROP_KC = {
  maiz: { name: 'Maiz', ini: 0.3, mid: 1.2, end: 0.6 },
  frijol: { name: 'Frijol', ini: 0.4, mid: 1.15, end: 0.35 },
  arroz: { name: 'Arroz', ini: 1.05, mid: 1.2, end: 0.9 },
  tomate: { name: 'Tomate', ini: 0.6, mid: 1.15, end: 0.8 },
  cafe: { name: 'Cafe', ini: 0.9, mid: 0.95, end: 0.95 },
  sorgo: { name: 'Sorgo', ini: 0.3, mid: 1.1, end: 0.55 },
}

function Tip({ children, text }) {
  return <div className="tooltip-wrap">{children}<div className="tooltip-content">{text}</div></div>
}

function ResultCard({ label, value, unit, note, status, tip }) {
  const colors = { ok: 'var(--emerald-700)', warning: 'var(--orange)', danger: 'var(--red)', info: 'var(--blue)' }
  const bgs = { ok: 'var(--emerald-50)', warning: '#fff7ed', danger: '#fef2f2', info: '#eff6ff' }
  const borders = { ok: 'var(--emerald-300)', warning: '#fb923c', danger: '#f87171', info: '#60a5fa' }
  const s = status || 'info'
  return (
    <Tip text={tip}>
      <div style={{
        padding: '18px', background: bgs[s], border: `2px solid ${borders[s]}`,
        borderRadius: 'var(--r-md)', cursor: 'help', transition: 'all 0.3s',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: colors[s], lineHeight: 1 }}>
          {value}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>{unit}</span>
        </div>
        {note && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '6px' }}>{note}</div>}
      </div>
    </Tip>
  )
}

export default function Herramientas() {
  const nav = useNavigate()
  const parcelaData = useAppStore((s) => s.parcelaData)
  const analysisReady = useAppStore((s) => s.analysisReady)
  const climate = parcelaData?.climate || {}
  const summary = climate.summary || {}

  const [tempMin, setTempMin] = useState(22)
  const [tempMax, setTempMax] = useState(34)
  const [humidity, setHumidity] = useState(65)
  const [windSpeed, setWindSpeed] = useState(2.5)
  const [sunHours, setSunHours] = useState(7)
  const [areaHa, setAreaHa] = useState(2.5)
  const [crop, setCrop] = useState('maiz')
  const [soilType, setSoilType] = useState('franco')
  const [rainfall, setRainfall] = useState(12)

  useEffect(() => {
    if (parcelaData) {
      if (summary.temp_max) setTempMax(Math.round(summary.temp_max))
      if (climate.days?.length) setTempMin(Math.round(Math.min(...climate.days.map((d) => d.temp_min))))
      if (summary.humidity_pct) setHumidity(Math.round(summary.humidity_pct))
      if (summary.precip_7d_mm) setRainfall(Math.round(summary.precip_7d_mm * 10) / 10)
      if (parcelaData.area_ha) setAreaHa(parcelaData.area_ha)
    }
  }, [parcelaData])

  if (!analysisReady) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <h2>Selecciona tu parcela primero</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px' }}>Los datos se llenan automaticamente desde tu parcela.</p>
        <button className="btn btn-primary" onClick={() => nav('/parcela')}>Ir al Visor Satelital</button>
      </div>
    )
  }

  // Calculations
  const Ra = 15.0
  const tMean = (tempMin + tempMax) / 2
  const et0 = Math.max(0, 0.0023 * Ra * Math.sqrt(Math.max(0, tempMax - tempMin)) * (tMean + 17.8))
  const kc = CROP_KC[crop] || CROP_KC.maiz
  const etc = et0 * kc.mid
  const waterDay = etc * areaHa * 10
  const deficit = Math.max(0, etc * 7 - rainfall * 0.8)
  const parDaily = sunHours * 2.1
  const photoRate = Math.min(100, (parDaily / 25) * 100)
  const heatStress = tempMax > 38 ? 'Alto' : tempMax > 35 ? 'Moderado' : 'Bajo'
  const coldStress = tempMin < 10 ? 'Alto' : tempMin < 15 ? 'Moderado' : 'Bajo'
  const vpdEst = 0.6108 * Math.exp((17.27 * tempMax) / (tempMax + 237.3)) * (1 - humidity / 100)
  const vpdStatus = vpdEst > 3 ? 'Excesivo' : vpdEst > 1.5 ? 'Optimo' : 'Bajo'
  const SOIL_FC = { arenoso: 12, franco: 25, arcilloso: 38 }
  const SOIL_WP = { arenoso: 4, franco: 12, arcilloso: 22 }
  const fc = SOIL_FC[soilType] || 25
  const wp = SOIL_WP[soilType] || 12
  const availableWater = fc - wp
  const daysNoRain = Math.floor(availableWater / Math.max(0.1, etc * 0.1))

  const InputField = ({ label, value, set, tip, ...rest }) => (
    <Tip text={tip}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', cursor: 'help' }}>{label}</label>
        <input className="input" type="number" value={value} onChange={(e) => set(+e.target.value)} {...rest} />
      </div>
    </Tip>
  )

  return (
    <div className="page" style={{ maxWidth: '1000px' }}>
      <h1 style={{ marginBottom: '4px' }}>Herramientas Agricolas</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Calculadoras pre-cargadas con los datos climaticos de tu parcela. <strong>Modifica cualquier valor</strong> para ver como cambian los resultados en tiempo real.
      </p>

      {/* Source info */}
      <div className="card-emerald animate-in" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-500)', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--emerald-800)' }}>
          Datos pre-cargados desde tu parcela de {parcelaData?.area_ha?.toFixed(1)} ha · Temp max: {summary.temp_max}°C · Lluvia 7d: {summary.precip_7d_mm?.toFixed(1)}mm
        </span>
      </div>

      {/* Inputs */}
      <div className="card animate-in d1" style={{ padding: '24px', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '6px' }}>Datos de Entrada</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Estos valores vienen de los satelites y pronosticos. Ajustalos si tienes datos mas precisos de tu finca.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
          <InputField label="Temp. minima (°C)" value={tempMin} set={setTempMin} tip="Temperatura minima esperada. Debajo de 10°C puede haber estres por frio." />
          <InputField label="Temp. maxima (°C)" value={tempMax} set={setTempMax} tip="Temperatura maxima esperada. Arriba de 38°C causa estres termico en la mayoria de cultivos." />
          <InputField label="Humedad (%)" value={humidity} set={setHumidity} tip="Humedad relativa del aire. Valores bajos aumentan la evaporacion y necesidad de riego." />
          <InputField label="Viento (m/s)" value={windSpeed} set={setWindSpeed} tip="Velocidad del viento. Vientos fuertes aumentan la evaporacion del suelo." />
          <InputField label="Horas sol/dia" value={sunHours} set={setSunHours} tip="Horas de sol directo por dia. Mas sol = mas fotosintesis pero tambien mas evaporacion." />
          <InputField label="Lluvia 7 dias (mm)" value={rainfall} set={setRainfall} tip="Precipitacion total acumulada en los proximos 7 dias segun el pronostico." />
          <InputField label="Area (ha)" value={areaHa} set={setAreaHa} tip="Tamano de tu parcela en hectareas. 1 ha = 10,000 m2." />
          <Tip text="Cada cultivo tiene un coeficiente de evapotranspiracion (Kc) diferente que afecta cuanta agua necesita.">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cultivo</label>
              <select className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>
                {Object.entries(CROP_KC).map(([k, v]) => <option key={k} value={k}>{v.name} (Kc={v.mid})</option>)}
              </select>
            </div>
          </Tip>
          <Tip text="El tipo de suelo determina cuanta agua puede retener. Arcilloso retiene mas, arenoso drena rapido.">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tipo de suelo</label>
              <select className="input" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                <option value="arenoso">Arenoso (drena rapido)</option><option value="franco">Franco (equilibrado)</option><option value="arcilloso">Arcilloso (retiene agua)</option>
              </select>
            </div>
          </Tip>
        </div>
      </div>

      {/* Results */}
      <div className="card animate-in d2" style={{ padding: '24px', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '6px' }}>Riego y Evapotranspiracion</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Cuanta agua pierde tu suelo y cuanta necesitas reponer.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
          <ResultCard label="ET0 referencia" value={et0.toFixed(1)} unit="mm/dia" note="Metodo Hargreaves" status="info" tip="Evapotranspiracion de referencia: cuanta agua se evapora de un pasto estandar. Es la base para calcular las necesidades de tu cultivo." />
          <ResultCard label="ETc tu cultivo" value={etc.toFixed(1)} unit="mm/dia" note={`Kc = ${kc.mid}`} status={etc > 6 ? 'warning' : 'ok'} tip={`Evapotranspiracion de tu ${CROP_KC[crop]?.name || 'cultivo'}. Es ET0 multiplicado por el coeficiente del cultivo (Kc=${kc.mid}).`} />
          <ResultCard label="Riego necesario" value={waterDay.toFixed(0)} unit="m³/dia" note={`${(waterDay * 30).toFixed(0)} m³/mes`} status={waterDay > 50 ? 'warning' : 'ok'} tip="Volumen total de agua que necesitas aplicar por dia para compensar la evapotranspiracion." />
          <ResultCard label="Deficit hidrico 7d" value={deficit.toFixed(1)} unit="mm" note={deficit > 10 ? 'Riego urgente' : 'Bajo control'} status={deficit > 15 ? 'danger' : deficit > 5 ? 'warning' : 'ok'} tip="Diferencia entre lo que tu cultivo necesita y lo que la lluvia aporta. Si es alto, necesitas regar urgente." />
        </div>
      </div>

      <div className="card animate-in d3" style={{ padding: '24px', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '6px' }}>Radiacion y Temperatura</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Como afecta el sol y el calor a tu cultivo.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
          <ResultCard label="PAR diaria" value={parDaily.toFixed(1)} unit="MJ/m²" note={`${sunHours}h de sol`} status={photoRate > 70 ? 'ok' : 'warning'} tip="Radiacion Fotosinteticamente Activa. La energia que tus plantas usan para crecer." />
          <ResultCard label="Fotosintesis" value={`${photoRate.toFixed(0)}`} unit="%" note={photoRate > 70 ? 'Optima' : 'Suboptima'} status={photoRate > 70 ? 'ok' : 'warning'} tip="Eficiencia fotosintetica relativa. 100% = condiciones ideales de luz." />
          <ResultCard label="Estres calor" value={heatStress} unit="" note={`Max: ${tempMax}°C`} status={heatStress === 'Alto' ? 'danger' : heatStress === 'Moderado' ? 'warning' : 'ok'} tip="Las plantas sufren cuando la temperatura supera 35°C. Arriba de 38°C se danan las celulas." />
          <ResultCard label="Estres frio" value={coldStress} unit="" note={`Min: ${tempMin}°C`} status={coldStress === 'Alto' ? 'danger' : coldStress === 'Moderado' ? 'warning' : 'ok'} tip="El frio detiene el crecimiento. Bajo 10°C muchos cultivos tropicales sufren dano." />
        </div>
      </div>

      <div className="card animate-in d4" style={{ padding: '24px', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '6px' }}>Humedad y Capacidad del Suelo</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Cuanta agua puede guardar tu suelo.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
          <ResultCard label="VPD estimado" value={vpdEst.toFixed(2)} unit="kPa" note={`Estado: ${vpdStatus}`} status={vpdEst > 3 ? 'danger' : vpdEst > 1.5 ? 'ok' : 'warning'} tip="Deficit de Presion de Vapor. Indica que tan seco esta el aire. Entre 1.5-3 kPa es optimo para fotosintesis." />
          <ResultCard label="Capacidad campo" value={fc} unit="%" note={`Suelo ${soilType}`} status="info" tip="Porcentaje maximo de agua que tu tipo de suelo puede retener despues de drenar por gravedad." />
          <ResultCard label="Agua disponible" value={availableWater} unit="%" note="CC - PMP" status={availableWater > 15 ? 'ok' : 'warning'} tip="Agua que las raices pueden extraer: diferencia entre Capacidad de Campo y Punto de Marchitez Permanente." />
          <ResultCard label="Dias sin riego" value={daysNoRain} unit="dias" note="Antes de marchitez" status={daysNoRain < 3 ? 'danger' : daysNoRain < 7 ? 'warning' : 'ok'} tip="Cuantos dias puede sobrevivir tu cultivo sin agua adicional antes de empezar a marchitarse." />
        </div>
      </div>

      {/* Recommendations */}
      <div className="card-dark animate-in d5" style={{ padding: '24px' }}>
        <h4 style={{ marginBottom: '14px' }}>Recomendaciones para tu parcela</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            deficit > 15 && { type: 'danger', msg: `Deficit hidrico severo (${deficit.toFixed(0)}mm). Aplica riego de emergencia: ${(deficit * areaHa * 10).toFixed(0)} litros en las proximas 48 horas.` },
            heatStress === 'Alto' && { type: 'danger', msg: `Temperatura peligrosa (${tempMax}°C). Cubre los cultivos con malla sombra al mediodia.` },
            vpdEst > 3 && { type: 'warning', msg: `Aire muy seco (VPD: ${vpdEst.toFixed(1)} kPa). Riega con mas frecuencia pero menos volumen.` },
            daysNoRain < 3 && { type: 'warning', msg: `Tu suelo ${soilType} solo guarda agua para ${daysNoRain} dias. Agrega mulch o rastrojo para retener humedad.` },
            coldStress === 'Alto' && { type: 'warning', msg: `Frio severo (${tempMin}°C). Protege plantulas con plastico transparente durante la noche.` },
            deficit <= 15 && heatStress !== 'Alto' && daysNoRain >= 3 && { type: 'ok', msg: 'Condiciones favorables para tu cultivo. Sigue monitoreando semanalmente con los datos satelitales.' },
          ].filter(Boolean).map((r, i) => (
            <div key={i} style={{
              padding: '14px 18px', borderRadius: 'var(--r-md)',
              background: r.type === 'danger' ? 'rgba(220,38,38,0.1)' : r.type === 'warning' ? 'rgba(234,88,12,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1.5px solid ${r.type === 'danger' ? 'rgba(220,38,38,0.3)' : r.type === 'warning' ? 'rgba(234,88,12,0.3)' : 'rgba(16,185,129,0.3)'}`,
              fontSize: '0.85rem', color: r.type === 'danger' ? '#fca5a5' : r.type === 'warning' ? '#fed7aa' : '#a7f3d0', lineHeight: 1.6,
            }}>{r.msg}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
