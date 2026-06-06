"""
Rutas de parcela — análisis satelital, imágenes NDVI, true color.
"""

from fastapi import APIRouter, Query
from fastapi.responses import Response, JSONResponse

router = APIRouter()


def _generate_alerts(ndvi_data: dict, moisture_data: dict, climate_summary: dict) -> list:
    """Genera alertas basadas en los datos satelitales."""
    alerts = []
    ndvi_mean = ndvi_data.get("ndvi_mean", 0)
    moisture = moisture_data.get("moisture_mean", 50)
    precip = climate_summary.get("precip_7d_mm", 20)
    temp_max = climate_summary.get("temp_max", 30)

    if ndvi_mean < 0.2:
        alerts.append({
            "level": "CRITICO",
            "type": "NDVI_CRITICO",
            "message": f"NDVI muy bajo ({ndvi_mean}). Vegetación en estado crítico. Considerar solicitar microcrédito de emergencia.",
        })
    elif ndvi_mean < 0.35:
        alerts.append({
            "level": "ALERTA",
            "type": "TENDENCIA_SECA",
            "message": f"NDVI bajo el promedio ({ndvi_mean}). Riesgo de estrés hídrico. Monitorear de cerca.",
        })

    if moisture < 25:
        alerts.append({
            "level": "ALERTA",
            "type": "HUMEDAD_BAJA",
            "message": f"Humedad del suelo baja ({moisture}%). Considerar riego adicional.",
        })

    if precip < 5 and temp_max > 35:
        alerts.append({
            "level": "PRECAUCION",
            "type": "SEQUIA_INMINENTE",
            "message": f"Poca lluvia prevista ({precip}mm) con temperatura alta ({temp_max}°C). Riesgo de sequía.",
        })

    if temp_max > 40:
        alerts.append({
            "level": "ALERTA",
            "type": "CALOR_EXTREMO",
            "message": f"Temperatura extrema prevista ({temp_max}°C). Proteger cultivos sensibles.",
        })

    if not alerts:
        alerts.append({
            "level": "OK",
            "type": "SIN_ALERTAS",
            "message": "Condiciones dentro del rango normal. Tu campo se ve bien.",
        })

    return alerts


@router.get("/analysis")
async def parcela_analysis(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """
    Análisis completo de una parcela: NDVI + humedad + clima + score + alertas.
    Usa datos demo como fallback si los servicios satelitales no responden.
    """
    from utils.geo_utils import parse_bbox_string, bbox_center, bbox_area_ha

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    center = bbox_center(bbox_list)
    area = bbox_area_ha(bbox_list)

    # Intentar obtener datos reales
    try:
        from services.sentinel_service import fetch_ndvi_stats
        ndvi_data = await fetch_ndvi_stats(bbox_list)
        source = "copernicus_live"
    except Exception:
        ndvi_data = None
        source = "demo_offline"

    try:
        from services.moisture_service import fetch_moisture_stats
        moisture_data = await fetch_moisture_stats(bbox_list)
    except Exception:
        moisture_data = None

    try:
        from services.climate_service import fetch_forecast
        climate_data = await fetch_forecast(center[0], center[1])
    except Exception:
        climate_data = None

    try:
        from services.dem_service import fetch_elevation
        elevation_data = await fetch_elevation(bbox_list)
    except Exception:
        elevation_data = None

    # Fallback a datos demo si algo falló
    if not ndvi_data or ndvi_data.get("coverage_pct", 0) == 0:
        from utils.demo_data import DEMO_PARCELA_CHINANDEGA as demo
        ndvi_data = demo["ndvi"]
        source = "demo_offline"

    if not moisture_data:
        from utils.demo_data import DEMO_PARCELA_CHINANDEGA as demo
        moisture_data = demo["moisture"]

    if not climate_data:
        from utils.demo_data import DEMO_PARCELA_CHINANDEGA as demo
        climate_data = demo["climate"]

    if not elevation_data:
        from utils.demo_data import DEMO_PARCELA_CHINANDEGA as demo
        elevation_data = demo["elevation"]

    climate_summary = climate_data.get("summary", {})

    # Calcular score de resiliencia
    from models.resilience_score import calculate_resilience_score
    resilience = calculate_resilience_score(
        ndvi_mean=ndvi_data.get("ndvi_mean", 0.4),
        ndvi_std=ndvi_data.get("ndvi_std", 0.1),
        moisture_pct=moisture_data.get("moisture_mean", 40),
        precip_7d_mm=climate_summary.get("precip_7d_mm", 12),
        temp_max=climate_summary.get("temp_max", 34),
    )

    # Predicción de riesgo ML
    try:
        from models.risk_predictor import predict_risk
        risk = predict_risk(
            ndvi_mean=ndvi_data.get("ndvi_mean", 0.4),
            ndvi_std=ndvi_data.get("ndvi_std", 0.1),
            moisture_pct=moisture_data.get("moisture_mean", 40),
            precip_7d_mm=climate_summary.get("precip_7d_mm", 12),
            temp_max=climate_summary.get("temp_max", 34),
        )
    except Exception:
        risk = {"risk_level": 1, "risk_label": "MODERADO",
                "probabilities": {"bajo": 0.35, "moderado": 0.45, "alto": 0.20}}

    # Generar alertas
    alerts = _generate_alerts(ndvi_data, moisture_data, climate_summary)

    # Historial NDVI simulado (tendencia descendente basada en el valor actual)
    from datetime import datetime, timedelta
    ndvi_mean = ndvi_data.get("ndvi_mean", 0.42)
    ndvi_history = []
    for i in range(10, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i * 3)).strftime("%Y-%m-%d")
        val = round(ndvi_mean + 0.01 * i + (0.02 if i % 3 == 0 else -0.01), 3)
        ndvi_history.append({"date": date, "ndvi": val})

    return {
        "bbox": bbox_list,
        "center": {"lat": center[0], "lon": center[1]},
        "area_ha": area,
        "ndvi": ndvi_data,
        "moisture": moisture_data,
        "climate": climate_data,
        "elevation": elevation_data,
        "resilience": resilience,
        "risk": risk,
        "alerts": alerts,
        "ndvi_history": ndvi_history,
        "source": source,
    }


@router.get("/ndvi-image")
async def ndvi_image(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """Retorna imagen PNG del NDVI coloreado para superponer en el mapa."""
    from utils.geo_utils import parse_bbox_string

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        from services.sentinel_service import fetch_ndvi_image
        png_bytes = await fetch_ndvi_image(bbox_list)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse(status_code=503,
                            content={"error": f"No se pudo obtener imagen NDVI: {str(e)[:200]}"})


@router.get("/true-color")
async def true_color_image(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """Retorna imagen PNG true color de la parcela."""
    from utils.geo_utils import parse_bbox_string

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        from services.sentinel_service import fetch_true_color_image
        png_bytes = await fetch_true_color_image(bbox_list)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse(status_code=503,
                            content={"error": f"No se pudo obtener imagen: {str(e)[:200]}"})


@router.get("/swir-image")
async def swir_image(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """Retorna imagen PNG SWIR false color (estrés hídrico)."""
    from utils.geo_utils import parse_bbox_string

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        from services.sentinel_service import fetch_swir_image
        png_bytes = await fetch_swir_image(bbox_list)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse(status_code=503,
                            content={"error": f"No se pudo obtener imagen SWIR: {str(e)[:200]}"})


@router.get("/mndwi-image")
async def mndwi_image(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """Retorna imagen PNG MNDWI (detección de humedales)."""
    from utils.geo_utils import parse_bbox_string

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        from services.sentinel_service import fetch_mndwi_image
        png_bytes = await fetch_mndwi_image(bbox_list)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse(status_code=503,
                            content={"error": f"No se pudo obtener imagen MNDWI: {str(e)[:200]}"})


@router.get("/evi-image")
async def evi_image(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """Retorna imagen PNG EVI (Enhanced Vegetation Index)."""
    from utils.geo_utils import parse_bbox_string

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        from services.sentinel_service import fetch_evi_image
        png_bytes = await fetch_evi_image(bbox_list)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse(status_code=503,
                            content={"error": f"No se pudo obtener imagen EVI: {str(e)[:200]}"})


@router.get("/geological-analysis")
async def geological_analysis(bbox: str = Query(..., description="lon_min,lat_min,lon_max,lat_max")):
    """Análisis geológico multi-índice: NDVI, MNDWI, BSI."""
    from utils.geo_utils import parse_bbox_string

    try:
        bbox_list = parse_bbox_string(bbox)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    try:
        from services.sentinel_service import fetch_geological_analysis
        result = await fetch_geological_analysis(bbox_list)
        return result
    except Exception as e:
        return JSONResponse(status_code=503,
                            content={"error": f"No se pudo realizar análisis geológico: {str(e)[:200]}"})
