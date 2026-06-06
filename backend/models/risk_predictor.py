"""
Modelo de predicción de riesgo usando Random Forest.
Entrenado con datos sintéticos basados en parámetros agronómicos reales.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Modelo pre-entrenado en memoria
_model = None


def _generate_training_data(n_samples=500):
    """Genera datos sintéticos de entrenamiento basados en rangos agronómicos reales."""
    np.random.seed(42)
    X = np.column_stack([
        np.random.uniform(0.0, 1.0, n_samples),    # ndvi_mean
        np.random.uniform(0.0, 0.3, n_samples),     # ndvi_std
        np.random.uniform(0, 100, n_samples),        # moisture_pct
        np.random.uniform(0, 100, n_samples),        # precip_7d_mm
        np.random.uniform(20, 48, n_samples),         # temp_max
    ])

    # Etiquetas basadas en reglas agronómicas
    # 0 = bajo riesgo, 1 = riesgo moderado, 2 = alto riesgo
    y = []
    for i in range(n_samples):
        ndvi, std, moist, precip, temp = X[i]
        risk = 0
        if ndvi < 0.3:
            risk += 1
        if ndvi < 0.15:
            risk += 1
        if std > 0.2:
            risk += 1
        if moist < 25:
            risk += 1
        if precip < 5:
            risk += 1
        if temp > 40:
            risk += 1

        y.append(min(2, risk))

    return X, np.array(y)


def _get_model():
    """Obtiene el modelo entrenado (lazy init)."""
    global _model
    if _model is None:
        X, y = _generate_training_data()
        _model = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
        _model.fit(X, y)
    return _model


def predict_risk(ndvi_mean: float, ndvi_std: float, moisture_pct: float,
                 precip_7d_mm: float, temp_max: float) -> dict:
    """
    Predice nivel de riesgo agrícola.
    Retorna: nivel (0-2), probabilidades, label.
    """
    model = _get_model()
    X = np.array([[ndvi_mean, ndvi_std, moisture_pct, precip_7d_mm, temp_max]])
    prediction = int(model.predict(X)[0])
    probabilities = model.predict_proba(X)[0].tolist()

    labels = {0: "BAJO", 1: "MODERADO", 2: "ALTO"}

    return {
        "risk_level": prediction,
        "risk_label": labels[prediction],
        "probabilities": {
            "bajo": round(probabilities[0], 3) if len(probabilities) > 0 else 0,
            "moderado": round(probabilities[1], 3) if len(probabilities) > 1 else 0,
            "alto": round(probabilities[2], 3) if len(probabilities) > 2 else 0,
        },
    }
