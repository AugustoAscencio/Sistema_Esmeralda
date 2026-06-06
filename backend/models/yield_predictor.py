"""
Modelo de Predicción de Rendimiento Agrícola — ESMERALDA
========================================================

Modelo predictivo que combina datos satelitales (NDVI, humedad),
climáticos (precipitación, temperatura) y agronómicos (cultivo, suelo)
para predecir:
  1. Rendimiento esperado (kg/ha) — próxima cosecha
  2. Precio óptimo de venta basado en tendencias
  3. Ventana de cosecha recomendada
  4. Score de confianza del modelo

Usa un ensemble de Gradient Boosting + reglas agronómicas calibradas
con datos sintéticos basados en tablas FAO y CIAT.
"""

import numpy as np
from datetime import datetime, timedelta

try:
    from sklearn.ensemble import GradientBoostingRegressor
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

# Datos agronómicos calibrados (FAO + CIAT references)
CROP_PARAMS = {
    "maiz":     {"base_yield": 3500,  "cycle_days": 120, "optimal_temp": (22, 32), "water_need_mm": 550,  "kc": 1.2,  "price_usd_kg": 0.22},
    "frijol":   {"base_yield": 1200,  "cycle_days": 90,  "optimal_temp": (18, 28), "water_need_mm": 350,  "kc": 1.15, "price_usd_kg": 1.10},
    "arroz":    {"base_yield": 4500,  "cycle_days": 130, "optimal_temp": (24, 35), "water_need_mm": 1200, "kc": 1.2,  "price_usd_kg": 0.35},
    "tomate":   {"base_yield": 40000, "cycle_days": 90,  "optimal_temp": (20, 30), "water_need_mm": 600,  "kc": 1.15, "price_usd_kg": 0.45},
    "cafe":     {"base_yield": 1500,  "cycle_days": 365, "optimal_temp": (18, 25), "water_need_mm": 1500, "kc": 0.95, "price_usd_kg": 2.80},
    "sorgo":    {"base_yield": 3000,  "cycle_days": 100, "optimal_temp": (25, 35), "water_need_mm": 400,  "kc": 1.1,  "price_usd_kg": 0.18},
    "yuca":     {"base_yield": 18000, "cycle_days": 270, "optimal_temp": (22, 32), "water_need_mm": 800,  "kc": 0.8,  "price_usd_kg": 0.15},
    "platano":  {"base_yield": 20000, "cycle_days": 365, "optimal_temp": (24, 32), "water_need_mm": 1200, "kc": 1.0,  "price_usd_kg": 0.20},
    "aguacate": {"base_yield": 8000,  "cycle_days": 365, "optimal_temp": (20, 28), "water_need_mm": 1000, "kc": 0.85, "price_usd_kg": 1.50},
    "chile":    {"base_yield": 8000,  "cycle_days": 90,  "optimal_temp": (20, 30), "water_need_mm": 500,  "kc": 1.1,  "price_usd_kg": 1.20},
}

# Seasonal price trends (month-to-month % variation, typical for Latin America)
SEASONAL_PRICE_TRENDS = {
    "maiz":     [0, -3, -5, -2, 2, 5, 8, 6, 3, -2, -4, -3],
    "frijol":   [5, 3, -2, -5, -3, 0, 2, 8, 12, 8, 3, 0],
    "arroz":    [0, 0, -2, -3, -1, 2, 3, 4, 2, 0, -2, -1],
    "tomate":   [8, 5, -5, -10, -8, -3, 0, 5, 10, 12, 8, 3],
    "cafe":     [2, 0, -3, -5, -2, 3, 5, 4, 2, 0, -2, 0],
    "sorgo":    [0, -2, -3, -1, 1, 3, 5, 4, 2, 0, -2, -1],
    "yuca":     [3, 2, 0, -2, -3, -1, 2, 4, 5, 3, 1, 0],
    "platano":  [2, 0, -2, -3, -1, 2, 3, 5, 4, 2, 0, -1],
    "aguacate": [5, 8, 10, 8, 3, -2, -5, -8, -5, 0, 3, 5],
    "chile":    [5, 3, -3, -8, -5, 0, 3, 8, 10, 8, 3, 0],
}

_yield_model = None


def _generate_yield_training_data(n_samples=800):
    """Generate synthetic training data based on real agronomic relationships."""
    np.random.seed(42)

    X = np.column_stack([
        np.random.uniform(0.1, 0.85, n_samples),   # ndvi_mean
        np.random.uniform(0.02, 0.25, n_samples),   # ndvi_std
        np.random.uniform(10, 90, n_samples),        # moisture_pct
        np.random.uniform(0, 120, n_samples),        # precip_7d_mm
        np.random.uniform(22, 45, n_samples),         # temp_max
        np.random.uniform(12, 28, n_samples),         # temp_min
        np.random.uniform(0.5, 10, n_samples),        # area_ha
    ])

    # Target: yield factor (0.0 to 1.5x of base yield)
    y = []
    for i in range(n_samples):
        ndvi, std, moist, precip, tmax, tmin, area = X[i]

        # NDVI is the strongest predictor
        ndvi_factor = 0.3 + ndvi * 1.1

        # Moisture contribution (inverted U-shape: too dry or too wet is bad)
        moist_factor = 1.0
        if moist < 20:
            moist_factor = 0.5 + moist / 40
        elif moist > 80:
            moist_factor = 1.0 - (moist - 80) / 40

        # Temperature stress
        temp_factor = 1.0
        if tmax > 38:
            temp_factor -= (tmax - 38) * 0.08
        if tmin < 12:
            temp_factor -= (12 - tmin) * 0.05

        # Precipitation contribution
        precip_factor = 1.0
        if precip < 5:
            precip_factor = 0.7
        elif precip > 80:
            precip_factor = 0.85  # flooding risk

        # Stability bonus
        stability_bonus = max(0, 1.0 - std * 2)

        yield_factor = ndvi_factor * moist_factor * temp_factor * precip_factor * stability_bonus
        yield_factor = max(0.05, min(1.5, yield_factor))

        # Add realistic noise
        yield_factor += np.random.normal(0, 0.05)
        yield_factor = max(0.05, min(1.5, yield_factor))

        y.append(yield_factor)

    return X, np.array(y)


def _get_yield_model():
    """Get or train the yield prediction model."""
    global _yield_model
    if _yield_model is None and HAS_SKLEARN:
        X, y = _generate_yield_training_data()
        _yield_model = GradientBoostingRegressor(
            n_estimators=100, max_depth=6, learning_rate=0.1,
            random_state=42, subsample=0.8
        )
        _yield_model.fit(X, y)
    return _yield_model


def _rule_based_prediction(ndvi_mean, ndvi_std, moisture_pct, precip_7d_mm, temp_max, temp_min):
    """Fallback rule-based prediction when sklearn is not available."""
    ndvi_factor = 0.3 + ndvi_mean * 1.1
    moist_factor = 1.0
    if moisture_pct < 20:
        moist_factor = 0.5 + moisture_pct / 40
    elif moisture_pct > 80:
        moist_factor = 1.0 - (moisture_pct - 80) / 40
    temp_factor = 1.0
    if temp_max > 38:
        temp_factor -= (temp_max - 38) * 0.08
    if temp_min < 12:
        temp_factor -= (12 - temp_min) * 0.05
    precip_factor = 1.0
    if precip_7d_mm < 5:
        precip_factor = 0.7
    elif precip_7d_mm > 80:
        precip_factor = 0.85
    stability = max(0, 1.0 - ndvi_std * 2)
    return max(0.05, min(1.5, ndvi_factor * moist_factor * temp_factor * precip_factor * stability))


def predict_yield(
    crop: str,
    area_ha: float,
    ndvi_mean: float,
    ndvi_std: float,
    moisture_pct: float,
    precip_7d_mm: float,
    temp_max: float,
    temp_min: float = 20.0,
) -> dict:
    """
    Predict yield, optimal price, harvest window, and confidence score.
    Returns a comprehensive prediction dictionary.
    """
    params = CROP_PARAMS.get(crop.lower(), CROP_PARAMS["maiz"])
    now = datetime.utcnow()

    # --- Yield Prediction ---
    model = _get_yield_model()
    if model is not None:
        X = np.array([[ndvi_mean, ndvi_std, moisture_pct, precip_7d_mm, temp_max, temp_min, area_ha]])
        yield_factor = float(model.predict(X)[0])
        model_type = "gradient_boosting"
    else:
        yield_factor = _rule_based_prediction(ndvi_mean, ndvi_std, moisture_pct, precip_7d_mm, temp_max, temp_min)
        model_type = "rule_based"

    yield_factor = max(0.05, min(1.5, yield_factor))
    predicted_yield_per_ha = round(params["base_yield"] * yield_factor)
    predicted_total_yield = round(predicted_yield_per_ha * area_ha)

    # --- Confidence Score ---
    conf = 0.5
    if ndvi_mean > 0.3:
        conf += 0.15
    if ndvi_std < 0.15:
        conf += 0.1
    if 25 < moisture_pct < 70:
        conf += 0.1
    if 5 < precip_7d_mm < 60:
        conf += 0.05
    if params["optimal_temp"][0] <= temp_max <= params["optimal_temp"][1]:
        conf += 0.1
    confidence = min(0.95, round(conf, 2))

    # --- Price Prediction ---
    current_month = now.month - 1
    seasonal = SEASONAL_PRICE_TRENDS.get(crop.lower(), [0] * 12)
    base_price = params["price_usd_kg"]

    # Current adjusted price
    current_price = base_price * (1 + seasonal[current_month] / 100)

    # Next 6 months price forecast
    price_forecast = []
    best_month_idx = current_month
    best_price = current_price
    for i in range(6):
        m = (current_month + i) % 12
        future_date = now + timedelta(days=i * 30)
        p = base_price * (1 + seasonal[m] / 100)
        price_forecast.append({
            "month": future_date.strftime("%b %Y"),
            "month_num": m + 1,
            "price_usd_kg": round(p, 4),
            "trend_pct": seasonal[m],
        })
        if p > best_price:
            best_price = p
            best_month_idx = i

    # --- Harvest Window ---
    days_remaining = max(0, params["cycle_days"] - 30)  # assume 1 month into cycle
    harvest_start = now + timedelta(days=max(0, days_remaining - 14))
    harvest_end = now + timedelta(days=days_remaining + 14)

    # Optimal sell date (when price is highest within harvest window)
    optimal_sell_date = now + timedelta(days=best_month_idx * 30)

    # --- Revenue Projections ---
    revenue_current = round(predicted_total_yield * current_price, 2)
    revenue_optimal = round(predicted_total_yield * best_price, 2)
    revenue_gain_pct = round((best_price / current_price - 1) * 100, 1) if current_price > 0 else 0

    # --- Risk Assessment ---
    risk_factors = []
    if ndvi_mean < 0.3:
        risk_factors.append({"factor": "NDVI bajo", "impact": "alto", "desc": "Vegetación débil, rendimiento comprometido"})
    if moisture_pct < 20:
        risk_factors.append({"factor": "Sequía", "impact": "alto", "desc": "Humedad insuficiente para el cultivo"})
    if moisture_pct > 80:
        risk_factors.append({"factor": "Exceso agua", "impact": "medio", "desc": "Riesgo de pudrición de raíces"})
    if temp_max > 38:
        risk_factors.append({"factor": "Calor extremo", "impact": "alto", "desc": f"Temperatura {temp_max}°C supera umbral del cultivo"})
    if precip_7d_mm < 5:
        risk_factors.append({"factor": "Sin lluvia", "impact": "medio", "desc": "Sin precipitación prevista, necesita riego"})
    if ndvi_std > 0.2:
        risk_factors.append({"factor": "Heterogeneidad", "impact": "medio", "desc": "Parcela con salud desigual"})

    overall_risk = "ALTO" if any(r["impact"] == "alto" for r in risk_factors) else "MEDIO" if risk_factors else "BAJO"

    # --- Feature Importances (for model transparency) ---
    feature_importance = {
        "ndvi_mean": 0.35,
        "moisture_pct": 0.20,
        "temp_max": 0.15,
        "precip_7d_mm": 0.12,
        "ndvi_std": 0.10,
        "temp_min": 0.05,
        "area_ha": 0.03,
    }
    if model is not None and HAS_SKLEARN:
        importances = model.feature_importances_
        features = ["ndvi_mean", "ndvi_std", "moisture_pct", "precip_7d_mm", "temp_max", "temp_min", "area_ha"]
        feature_importance = {f: round(float(importances[i]), 3) for i, f in enumerate(features)}

    return {
        "crop": crop,
        "area_ha": area_ha,
        "model_type": model_type,
        "prediction": {
            "yield_per_ha_kg": predicted_yield_per_ha,
            "total_yield_kg": predicted_total_yield,
            "yield_factor": round(yield_factor, 3),
            "yield_vs_baseline_pct": round((yield_factor - 1) * 100, 1),
        },
        "confidence": {
            "score": confidence,
            "label": "ALTA" if confidence >= 0.75 else "MEDIA" if confidence >= 0.55 else "BAJA",
        },
        "price_analysis": {
            "current_price_usd_kg": round(current_price, 4),
            "best_price_usd_kg": round(best_price, 4),
            "optimal_sell_month": optimal_sell_date.strftime("%B %Y"),
            "price_gain_pct": revenue_gain_pct,
            "forecast": price_forecast,
        },
        "revenue": {
            "if_sold_now_usd": revenue_current,
            "if_sold_optimal_usd": revenue_optimal,
            "potential_extra_usd": round(revenue_optimal - revenue_current, 2),
        },
        "harvest_window": {
            "estimated_start": harvest_start.strftime("%Y-%m-%d"),
            "estimated_end": harvest_end.strftime("%Y-%m-%d"),
            "days_remaining": days_remaining,
        },
        "risk": {
            "overall": overall_risk,
            "factors": risk_factors,
        },
        "feature_importance": feature_importance,
        "satellite_inputs": {
            "ndvi_mean": ndvi_mean,
            "ndvi_std": ndvi_std,
            "moisture_pct": moisture_pct,
            "precip_7d_mm": precip_7d_mm,
            "temp_max": temp_max,
            "temp_min": temp_min,
        },
        "generated_at": now.isoformat(),
    }
