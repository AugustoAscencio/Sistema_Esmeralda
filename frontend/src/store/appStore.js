/**
 * Zustand store — estado global con demo dinámica y flujo correlacionado
 */

import { create } from 'zustand'

/**
 * Genera datos demo dinámicos basados en las coordenadas seleccionadas.
 * Usa un seed determinista para que la misma ubicación genere los mismos datos.
 */
function generateDemoData(bbox) {
  const seed = Math.abs(bbox[0] * 1000 + bbox[1] * 100 + bbox[2] * 10 + bbox[3])
  const seeded = (n) => ((seed * 9301 + 49297 + n * 233) % 233280) / 233280

  const lat = (bbox[1] + bbox[3]) / 2
  const lon = (bbox[0] + bbox[2]) / 2

  // NDVI varía según latitud (trópico = más verde)
  const tropicalBonus = Math.max(0, 1 - Math.abs(lat - 10) / 30) * 0.15
  const ndviMean = Math.min(0.85, 0.30 + tropicalBonus + seeded(1) * 0.25)
  const ndviStd = 0.05 + seeded(2) * 0.12
  const ndviMin = Math.max(0.05, ndviMean - 0.2 - seeded(3) * 0.1)
  const ndviMax = Math.min(0.95, ndviMean + 0.15 + seeded(4) * 0.15)

  // Humedad
  const moistureMean = 25 + seeded(5) * 50
  const moistureCritical = moistureMean < 25

  // Área en hectáreas (aprox)
  const dLon = Math.abs(bbox[2] - bbox[0])
  const dLat = Math.abs(bbox[3] - bbox[1])
  const areaHa = Math.round(dLon * 111 * dLat * 111 * Math.cos(lat * Math.PI / 180) * 100) / 100

  // Clima — 7 días
  const baseTemp = 20 + Math.max(0, 15 - Math.abs(lat - 15)) + seeded(6) * 5
  const days = []
  const now = new Date()
  let totalPrecip = 0
  let maxTemp = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const tMax = Math.round((baseTemp + seeded(10 + i) * 6) * 10) / 10
    const tMin = Math.round((tMax - 8 - seeded(20 + i) * 5) * 10) / 10
    const precip = Math.round(seeded(30 + i) > 0.55 ? seeded(40 + i) * 15 : 0, 1)
    totalPrecip += precip
    if (tMax > maxTemp) maxTemp = tMax
    days.push({
      date: d.toISOString().slice(0, 10),
      temp_max: tMax,
      temp_min: tMin,
      precipitation_mm: Math.round(precip * 10) / 10,
    })
  }

  const climateSummary = {
    precip_7d_mm: Math.round(totalPrecip * 10) / 10,
    temp_max: maxTemp,
    humidity_pct: Math.round((50 + seeded(50) * 35) * 10) / 10,
  }

  // Score de resiliencia (misma fórmula que el backend)
  const cropHealth = Math.min(40, ndviMean * 50)
  const stability = Math.max(0, 25 - ndviStd * 150)
  let waterScore = Math.min(20, moistureMean * 0.2)
  if (totalPrecip > 50) waterScore = Math.min(20, waterScore + 5)
  else if (totalPrecip < 5) waterScore = Math.max(0, waterScore - 5)
  let climateRisk = 15
  if (maxTemp > 38) climateRisk -= 8
  if (maxTemp > 42) climateRisk -= 7
  const score = Math.max(0, Math.min(100, Math.round(cropHealth + stability + waterScore + climateRisk)))

  let category, creditRec, maxUsd, interest
  if (score >= 75) { category = 'EXCELENTE'; creditRec = 'APROBADO'; maxUsd = score * 18; interest = 4.5 }
  else if (score >= 55) { category = 'BUENO'; creditRec = 'CONDICIONAL'; maxUsd = score * 12; interest = 8.0 }
  else if (score >= 35) { category = 'RIESGO_MODERADO'; creditRec = 'CON_GARANTIA'; maxUsd = score * 7; interest = 13.0 }
  else { category = 'RIESGO_ALTO'; creditRec = 'RECHAZADO'; maxUsd = 0; interest = 0 }

  // Alertas dinámicas
  const alerts = []
  if (ndviMean < 0.2) alerts.push({ level: 'CRITICO', type: 'NDVI_CRITICO', message: `NDVI muy bajo (${ndviMean.toFixed(2)}). Vegetacion en estado critico. Considerar solicitar microcredito de emergencia.` })
  else if (ndviMean < 0.35) alerts.push({ level: 'ALERTA', type: 'TENDENCIA_SECA', message: `NDVI bajo el promedio (${ndviMean.toFixed(2)}). Riesgo de estres hidrico. Monitorear de cerca.` })
  if (moistureMean < 25) alerts.push({ level: 'ALERTA', type: 'HUMEDAD_BAJA', message: `Humedad del suelo baja (${moistureMean.toFixed(0)}%). Considerar riego adicional.` })
  if (totalPrecip < 5 && maxTemp > 35) alerts.push({ level: 'PRECAUCION', type: 'SEQUIA_INMINENTE', message: `Poca lluvia prevista (${totalPrecip.toFixed(1)}mm) con temperatura alta (${maxTemp}C). Riesgo de sequia.` })
  if (maxTemp > 40) alerts.push({ level: 'ALERTA', type: 'CALOR_EXTREMO', message: `Temperatura extrema prevista (${maxTemp}C). Proteger cultivos sensibles.` })
  if (!alerts.length) alerts.push({ level: 'OK', type: 'SIN_ALERTAS', message: 'Condiciones dentro del rango normal. Tu campo se ve bien.' })

  // NDVI history
  const ndviHistory = []
  for (let i = 10; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 3)
    ndviHistory.push({
      date: d.toISOString().slice(0, 10),
      ndvi: Math.round((ndviMean + 0.008 * i + (i % 3 === 0 ? 0.02 : -0.01)) * 1000) / 1000,
    })
  }

  // Elevation
  const elevMean = 50 + Math.abs(lat) * 8 + seeded(60) * 200

  // Risk
  const riskLevel = score >= 55 ? 0 : score >= 35 ? 1 : 2
  const riskLabels = ['BAJO', 'MODERADO', 'ALTO']

  return {
    bbox,
    center: { lat, lon },
    area_ha: areaHa,
    ndvi: { ndvi_mean: Math.round(ndviMean * 1000) / 1000, ndvi_min: Math.round(ndviMin * 1000) / 1000, ndvi_max: Math.round(ndviMax * 1000) / 1000, ndvi_std: Math.round(ndviStd * 1000) / 1000, coverage_pct: 85 + seeded(70) * 14 },
    moisture: { moisture_mean: Math.round(moistureMean * 10) / 10, moisture_low_pct: Math.round(seeded(71) * 50 * 10) / 10, moisture_critical: moistureCritical },
    climate: { days, summary: climateSummary },
    elevation: { elevation_mean: Math.round(elevMean), elevation_min: Math.round(elevMean - 20 - seeded(72) * 30), elevation_max: Math.round(elevMean + 20 + seeded(73) * 40), elevation_range: Math.round(40 + seeded(74) * 50) },
    resilience: {
      score,
      category,
      components: { crop_health: Math.round(cropHealth), stability: Math.round(stability), water: Math.round(waterScore), climate: Math.round(climateRisk) },
      credit: { recommendation: creditRec, max_amount_usd: Math.round(maxUsd), interest_rate_pct: interest },
    },
    risk: { risk_level: riskLevel, risk_label: riskLabels[riskLevel], probabilities: { bajo: riskLevel === 0 ? 0.7 : 0.2, moderado: riskLevel === 1 ? 0.5 : 0.3, alto: riskLevel === 2 ? 0.6 : 0.1 } },
    alerts,
    ndvi_history: ndviHistory,
    source: 'demo_offline',
  }
}

const useAppStore = create((set, get) => ({
  // Parcela activa
  currentBbox: null,
  parcelaData: null,
  isLoadingParcela: false,
  analysisReady: false,

  // UI
  showAgent: false,
  isMobile: window.innerWidth < 768,

  // Acciones
  toggleAgent: () => set((s) => ({ showAgent: !s.showAgent })),
  setMobile: (val) => set({ isMobile: val }),

  // Fetch parcela analysis — with smart demo fallback
  fetchAnalysis: async (bbox) => {
    set({ isLoadingParcela: true, currentBbox: bbox })
    try {
      const bboxStr = bbox.join(',')
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/parcela/analysis?bbox=${bboxStr}`, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error('Backend error')
      const data = await res.json()
      set({ parcelaData: data, isLoadingParcela: false, analysisReady: true })
      return data
    } catch {
      // Generate dynamic demo data based on coordinates
      const data = generateDemoData(bbox)
      set({ parcelaData: data, isLoadingParcela: false, analysisReady: true })
      return data
    }
  },

  clearAnalysis: () => set({ parcelaData: null, currentBbox: null, analysisReady: false }),
}))

export default useAppStore
