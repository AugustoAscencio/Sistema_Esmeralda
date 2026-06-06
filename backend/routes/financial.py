"""
Rutas financieras — planificador, comparador, simulador de sequía.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class FinancialPlanRequest(BaseModel):
    crop: str
    area_ha: float
    bbox: Optional[str] = None  # lon_min,lat_min,lon_max,lat_max


class CompareRequest(BaseModel):
    area_ha: float
    bbox: Optional[str] = None


class DroughtRequest(BaseModel):
    crop: str
    area_ha: float
    drought_pct: int = 80


async def _get_satellite_params(bbox_str: Optional[str]) -> tuple:
    """Obtiene NDVI y humedad del satélite o usa valores demo."""
    ndvi = 0.42
    moisture = 38.5

    if bbox_str:
        try:
            from utils.geo_utils import parse_bbox_string
            bbox_list = parse_bbox_string(bbox_str)
            from services.sentinel_service import fetch_ndvi_stats
            ndvi_data = await fetch_ndvi_stats(bbox_list)
            ndvi = ndvi_data.get("ndvi_mean", 0.42)

            from services.moisture_service import fetch_moisture_stats
            moisture_data = await fetch_moisture_stats(bbox_list)
            moisture = moisture_data.get("moisture_mean", 38.5)
        except Exception:
            pass

    return ndvi, moisture


@router.post("/plan")
async def financial_plan(req: FinancialPlanRequest):
    """
    P&L completo para un cultivo específico, ajustado por datos satelitales.
    """
    from models.crop_finance import CropFinancialPlan, CROPS_DB
    from services.price_service import get_crop_price

    ndvi, moisture = await _get_satellite_params(req.bbox)
    price = get_crop_price(req.crop)

    plan = CropFinancialPlan(
        crop=req.crop,
        area_ha=req.area_ha,
        ndvi_score=ndvi,
        moisture_pct=moisture,
        market_price_usd=price,
    )

    return plan.calculate()


@router.post("/compare")
async def compare_crops(req: CompareRequest):
    """
    Ranking de todos los cultivos por rentabilidad para una parcela.
    """
    from models.crop_finance import compare_crops as do_compare
    from services.price_service import get_all_prices

    ndvi, moisture = await _get_satellite_params(req.bbox)
    prices = get_all_prices()

    results = do_compare(req.area_ha, ndvi, moisture, prices)
    return {"area_ha": req.area_ha, "ndvi": ndvi, "moisture": moisture, "crops": results}


@router.post("/drought")
async def drought_simulation(req: DroughtRequest):
    """
    Simulación de impacto financiero de sequía progresiva.
    """
    from models.crop_finance import drought_impact_analysis
    return drought_impact_analysis(req.crop, req.area_ha, req.drought_pct)
