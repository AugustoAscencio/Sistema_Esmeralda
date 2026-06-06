"""
Datos demo offline para presentación sin internet.
Incluye parcela completa de Chinandega, Nicaragua.
"""

DEMO_PARCELA_CHINANDEGA = {
    "bbox": [-87.18, 12.64, -87.14, 12.68],
    "lugar": "Chinandega, Nicaragua",
    "ndvi": {
        "ndvi_mean": 0.42,
        "ndvi_min": 0.15,
        "ndvi_max": 0.78,
        "ndvi_std": 0.12,
        "coverage_pct": 87.3,
    },
    "moisture": {
        "moisture_mean": 38.5,
        "moisture_low_pct": 42.1,
        "moisture_critical": False,
    },
    "climate": {
        "days": [
            {"date": "2024-05-01", "temp_max": 33.5, "temp_min": 22.1, "precipitation_mm": 2.3},
            {"date": "2024-05-02", "temp_max": 34.2, "temp_min": 23.0, "precipitation_mm": 0.0},
            {"date": "2024-05-03", "temp_max": 32.8, "temp_min": 22.5, "precipitation_mm": 5.1},
            {"date": "2024-05-04", "temp_max": 31.0, "temp_min": 21.8, "precipitation_mm": 3.2},
            {"date": "2024-05-05", "temp_max": 33.0, "temp_min": 22.9, "precipitation_mm": 0.5},
            {"date": "2024-05-06", "temp_max": 34.5, "temp_min": 23.2, "precipitation_mm": 0.0},
            {"date": "2024-05-07", "temp_max": 35.1, "temp_min": 23.8, "precipitation_mm": 1.4},
        ],
        "summary": {
            "precip_7d_mm": 12.5,
            "temp_max": 35.1,
            "humidity_pct": 68.0,
        }
    },
    "resilience": {
        "score": 68,
        "category": "BUENO",
        "components": {"crop_health": 28, "stability": 20, "water": 14, "climate": 6},
        "credit": {
            "recommendation": "CONDICIONAL",
            "max_amount_usd": 816,
            "interest_rate_pct": 8.0,
        }
    },
    "alerts": [{
        "level": "ALERTA",
        "type": "TENDENCIA_SECA",
        "message": "NDVI 15% bajo el promedio histórico. Riesgo de estrés hídrico en borde norte.",
    }],
    "ndvi_history": [
        {"date": "2024-04-01", "ndvi": 0.55},
        {"date": "2024-04-04", "ndvi": 0.53},
        {"date": "2024-04-07", "ndvi": 0.52},
        {"date": "2024-04-10", "ndvi": 0.51},
        {"date": "2024-04-13", "ndvi": 0.49},
        {"date": "2024-04-16", "ndvi": 0.48},
        {"date": "2024-04-19", "ndvi": 0.47},
        {"date": "2024-04-22", "ndvi": 0.46},
        {"date": "2024-04-25", "ndvi": 0.45},
        {"date": "2024-04-28", "ndvi": 0.43},
        {"date": "2024-05-01", "ndvi": 0.42},
    ],
    "elevation": {
        "elevation_mean": 120.0,
        "elevation_min": 95.0,
        "elevation_max": 145.0,
        "elevation_range": 50.0,
    },
    "risk": {
        "risk_level": 1,
        "risk_label": "MODERADO",
        "probabilities": {"bajo": 0.35, "moderado": 0.45, "alto": 0.20},
    }
}


def get_demo_analysis():
    """Retorna análisis completo con datos demo."""
    d = DEMO_PARCELA_CHINANDEGA
    return {
        "bbox": d["bbox"],
        "lugar": d["lugar"],
        "ndvi": d["ndvi"],
        "moisture": d["moisture"],
        "climate": d["climate"],
        "resilience": d["resilience"],
        "alerts": d["alerts"],
        "ndvi_history": d["ndvi_history"],
        "elevation": d["elevation"],
        "risk": d["risk"],
        "source": "demo_offline",
    }
