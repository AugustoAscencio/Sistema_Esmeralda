"""
Score de Resiliencia Satelital — 0 a 100 puntos.
Combina salud del cultivo, estabilidad, agua disponible y riesgo climático.
"""


def calculate_resilience_score(
    ndvi_mean: float,       # 0–1 (del satélite)
    ndvi_std: float,        # desviación estándar NDVI
    moisture_pct: float,    # 0–100 (del satélite)
    precip_7d_mm: float,    # precipitación próximos 7 días
    temp_max: float,        # temperatura máxima prevista
) -> dict:

    # Componente 1: Salud del cultivo (NDVI) — máx 40 puntos
    crop_health = min(40, ndvi_mean * 50)

    # Componente 2: Estabilidad (baja varianza NDVI es buena señal) — máx 25 puntos
    stability = max(0, 25 - ndvi_std * 150)

    # Componente 3: Disponibilidad hídrica — máx 20 puntos
    water_score = min(20, moisture_pct * 0.2)
    if precip_7d_mm > 50:
        water_score = min(20, water_score + 5)
    elif precip_7d_mm < 5:
        water_score = max(0, water_score - 5)

    # Componente 4: Riesgo climático — máx 15 puntos
    climate_risk = 15
    if temp_max > 38:
        climate_risk -= 8
    if temp_max > 42:
        climate_risk -= 7

    total = round(crop_health + stability + water_score + climate_risk)
    total = max(0, min(100, total))

    # Categoría y recomendación de crédito
    if total >= 75:
        category = "EXCELENTE"
        credit = "APROBADO"
        max_usd = round(total * 18)
        interest = 4.5
    elif total >= 55:
        category = "BUENO"
        credit = "CONDICIONAL"
        max_usd = round(total * 12)
        interest = 8.0
    elif total >= 35:
        category = "RIESGO_MODERADO"
        credit = "CON_GARANTIA"
        max_usd = round(total * 7)
        interest = 13.0
    else:
        category = "RIESGO_ALTO"
        credit = "RECHAZADO"
        max_usd = 0
        interest = 0.0

    return {
        "score": total,
        "category": category,
        "components": {
            "crop_health": round(crop_health),
            "stability": round(stability),
            "water": round(water_score),
            "climate": round(climate_risk),
        },
        "credit": {
            "recommendation": credit,
            "max_amount_usd": max_usd,
            "interest_rate_pct": interest,
        }
    }
