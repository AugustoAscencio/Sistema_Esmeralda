/**
 * Paleta Esmeralda v3 — White + Emerald
 */

export const COLORS = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafb',
  bgCard: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  borderLight: '#e5e7eb',
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald200: '#a7f3d0',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald900: '#064e3b',
  red: '#ef4444',
  orange: '#f59e0b',
  blue: '#3b82f6',
  chart1: '#10b981',
  chart2: '#059669',
  chart3: '#3b82f6',
  chart4: '#8b5cf6',
  chart5: '#f59e0b',
}

export const SCORE_COLORS = {
  excellent: '#059669',
  good:      '#10b981',
  moderate:  '#f59e0b',
  high_risk: '#ef4444',
}

export function getScoreColor(score) {
  if (score >= 75) return SCORE_COLORS.excellent
  if (score >= 55) return SCORE_COLORS.good
  if (score >= 35) return SCORE_COLORS.moderate
  return SCORE_COLORS.high_risk
}

export function getScoreLabel(score) {
  if (score >= 75) return 'EXCELENTE'
  if (score >= 55) return 'BUENO'
  if (score >= 35) return 'RIESGO MODERADO'
  return 'RIESGO ALTO'
}

export function getAlertColor(level) {
  switch (level) {
    case 'CRITICO':    return COLORS.red
    case 'ALERTA':     return COLORS.orange
    case 'PRECAUCION': return '#eab308'
    case 'OK':         return COLORS.emerald500
    default:           return COLORS.textMuted
  }
}
