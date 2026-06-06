"""
Ruta del agente IA — chat con contexto satelital.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    farmer_name: Optional[str] = "Agricultor"
    bbox: Optional[str] = None  # lon_min,lat_min,lon_max,lat_max


@router.post("/chat")
async def agent_chat(req: ChatRequest):
    """
    Chat con el agente Esmeralda.
    Inyecta contexto satelital de la parcela actual en el system prompt.
    """
    # Obtener datos de la parcela para contexto
    analysis_data = {}
    if req.bbox:
        try:
            from utils.geo_utils import parse_bbox_string, bbox_center
            bbox_list = parse_bbox_string(req.bbox)
            center = bbox_center(bbox_list)

            from services.sentinel_service import fetch_ndvi_stats
            ndvi_data = await fetch_ndvi_stats(bbox_list)

            from services.moisture_service import fetch_moisture_stats
            moisture_data = await fetch_moisture_stats(bbox_list)

            from services.climate_service import fetch_forecast
            climate_data = await fetch_forecast(center[0], center[1])

            from models.resilience_score import calculate_resilience_score
            climate_summary = climate_data.get("summary", {})
            resilience = calculate_resilience_score(
                ndvi_mean=ndvi_data.get("ndvi_mean", 0.4),
                ndvi_std=ndvi_data.get("ndvi_std", 0.1),
                moisture_pct=moisture_data.get("moisture_mean", 40),
                precip_7d_mm=climate_summary.get("precip_7d_mm", 12),
                temp_max=climate_summary.get("temp_max", 34),
            )

            analysis_data = {
                "ndvi": ndvi_data,
                "moisture": moisture_data,
                "climate": climate_data,
                "resilience": resilience,
                "alerts": [],
            }
        except Exception:
            pass

    # Si no hay datos satelitales, usar demo
    if not analysis_data:
        from utils.demo_data import DEMO_PARCELA_CHINANDEGA as demo
        analysis_data = {
            "ndvi": demo["ndvi"],
            "moisture": demo["moisture"],
            "climate": demo["climate"],
            "resilience": demo["resilience"],
            "alerts": demo["alerts"],
        }

    # Construir prompt y enviar al LLM
    from agent.context_builder import build_system_prompt
    system_prompt = build_system_prompt(analysis_data)

    # Personalizar con nombre del agricultor
    user_msg = f"[{req.farmer_name}]: {req.message}"

    from agent.llm_adapter import chat
    response = await chat(system_prompt, user_msg)

    return {
        "response": response,
        "context_used": {
            "ndvi_mean": analysis_data.get("ndvi", {}).get("ndvi_mean"),
            "score": analysis_data.get("resilience", {}).get("score"),
            "source": "live" if req.bbox else "demo",
        }
    }
