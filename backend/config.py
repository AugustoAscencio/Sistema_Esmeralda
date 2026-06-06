"""
Configuración central de Sistema Esmeralda.
Carga credenciales desde .env
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Copernicus CDSE ──
CDSE_CLIENT_ID     = os.getenv("CDSE_CLIENT_ID", "")
CDSE_CLIENT_SECRET = os.getenv("CDSE_CLIENT_SECRET", "")
TOKEN_URL          = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
PROCESS_URL        = "https://sh.dataspace.copernicus.eu/api/v1/process"

# ── LLM ──
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434")
LLM_MODEL    = os.getenv("LLM_MODEL", "gemma3:4b")
LLM_API_KEY  = os.getenv("LLM_API_KEY", "")

# ── Base de datos ──
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./esmeralda.db")

# ── Open-Meteo ──
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
