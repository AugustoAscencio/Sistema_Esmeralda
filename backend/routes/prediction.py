"""
Rutas de Predicción — Modelo predictivo de rendimiento y precios.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PredictionRequest(BaseModel):
    crop: str = "maiz"
    area_ha: float = 2.5
    bbox: Optional[str] = None  # lon_min,lat_min,lon_max,lat_max


@router.post("/yield")
async def predict_yield_endpoint(req: PredictionRequest):
    """
    Predicción completa de rendimiento, precio óptimo, ventana de cosecha.
    Usa datos satelitales reales si bbox está disponible.
    """
    # Defaults
    ndvi_mean = 0.42
    ndvi_std = 0.08
    moisture_pct = 38.5
    precip_7d_mm = 12.0
    temp_max = 34.0
    temp_min = 22.0

    # Try to get real satellite data
    if req.bbox:
        try:
            from utils.geo_utils import parse_bbox_string, bbox_center
            bbox_list = parse_bbox_string(req.bbox)
            center = bbox_center(bbox_list)

            from services.sentinel_service import fetch_ndvi_stats
            ndvi_data = await fetch_ndvi_stats(bbox_list)
            ndvi_mean = ndvi_data.get("ndvi_mean", ndvi_mean)
            ndvi_std = ndvi_data.get("ndvi_std", ndvi_std)

            from services.moisture_service import fetch_moisture_stats
            moisture_data = await fetch_moisture_stats(bbox_list)
            moisture_pct = moisture_data.get("moisture_mean", moisture_pct)

            from services.climate_service import fetch_forecast
            climate = await fetch_forecast(center[0], center[1])
            summary = climate.get("summary", {})
            precip_7d_mm = summary.get("precip_7d_mm", precip_7d_mm)
            temp_max = summary.get("temp_max", temp_max)
            days = climate.get("days", [])
            if days:
                temp_min = min(d.get("temp_min", 22) for d in days)
        except Exception:
            pass  # Use defaults

    from models.yield_predictor import predict_yield
    result = predict_yield(
        crop=req.crop,
        area_ha=req.area_ha,
        ndvi_mean=ndvi_mean,
        ndvi_std=ndvi_std,
        moisture_pct=moisture_pct,
        precip_7d_mm=precip_7d_mm,
        temp_max=temp_max,
        temp_min=temp_min,
    )
    return result


@router.get("/crops")
async def list_crops():
    """Lista todos los cultivos disponibles con parámetros base."""
    from models.yield_predictor import CROP_PARAMS
    return {
        "crops": [
            {
                "id": key,
                "base_yield_kg_ha": val["base_yield"],
                "cycle_days": val["cycle_days"],
                "optimal_temp": val["optimal_temp"],
                "water_need_mm": val["water_need_mm"],
                "price_usd_kg": val["price_usd_kg"],
            }
            for key, val in CROP_PARAMS.items()
        ]
    }
