"""
Sistema Esmeralda — Backend Entry Point
FastAPI server con CORS para el frontend React.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.parcela import router as parcela_router
from routes.financial import router as financial_router
from routes.agent import router as agent_router
from routes.prediction import router as prediction_router
from routes.marketplace import router as marketplace_router
from routes.social import router as social_router

app = FastAPI(
    title="Sistema Esmeralda API",
    description="Plataforma de resiliencia agrícola con datos satelitales Copernicus",
    version="1.0.0",
)

# ── CORS — permitir frontend en dev ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(parcela_router, prefix="/api/v1/parcela", tags=["Parcela"])
app.include_router(financial_router, prefix="/api/v1/financial", tags=["Financiero"])
app.include_router(agent_router, prefix="/api/v1/agent", tags=["Agente IA"])
app.include_router(prediction_router, prefix="/api/v1/predict", tags=["Predicción"])
app.include_router(marketplace_router, prefix="/api/v1/marketplace", tags=["Mercado"])
app.include_router(social_router, prefix="/api/v1/social", tags=["Comunidad"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "system": "Esmeralda",
        "status": "online",
        "tagline": "El campo visto desde el cielo. El futuro construido desde la tierra.",
    }


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
