"""
Servicio principal de consulta a Copernicus CDSE via Sentinel Hub Process API.
Retorna imágenes NDVI, true color y datos numéricos.
"""

import os
import struct
import time
import httpx
import numpy as np
from datetime import datetime, timedelta

TOKEN_URL    = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
PROCESS_URL  = "https://sh.dataspace.copernicus.eu/api/v1/process"
CLIENT_ID    = os.getenv("CDSE_CLIENT_ID", "sh-b97f586e-7273-4e99-b6b5-f08fa43bde66")
CLIENT_SECRET = os.getenv("CDSE_CLIENT_SECRET", "Vb2VXkMZMgAgDNhuWzN8PgURAYV41arK")

# ── Cache simple en memoria (TTL 1 hora) ──
_token_cache = {"token": None, "expires": 0}
_data_cache = {}
CACHE_TTL = 3600  # 1 hora


async def _get_token() -> str:
    """Obtiene token OAuth2 de CDSE, con cache."""
    now = time.time()
    if _token_cache["token"] and _token_cache["expires"] > now:
        return _token_cache["token"]

    async with httpx.AsyncClient() as c:
        r = await c.post(TOKEN_URL, data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        })
        r.raise_for_status()

    data = r.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires"] = now + data.get("expires_in", 3600) - 60
    return _token_cache["token"]


def _make_payload(bbox: list, evalscript: str, width=512, height=512,
                  data_type="sentinel-2-l2a", output_format="image/png",
                  days_back=30, max_cloud=30) -> dict:
    """Construye el payload para la Process API."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    past = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")

    data_filter = {
        "timeRange": {"from": f"{past}T00:00:00Z", "to": f"{today}T23:59:59Z"},
    }
    if "sentinel-2" in data_type:
        data_filter["maxCloudCoverage"] = max_cloud
        data_filter["mosaickingOrder"] = "leastCC"

    return {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{"type": data_type, "dataFilter": data_filter}]
        },
        "output": {
            "width": width, "height": height,
            "responses": [{"identifier": "default", "format": {"type": output_format}}]
        },
        "evalscript": evalscript
    }


async def _process_request(payload: dict, timeout: int = 45) -> bytes:
    """Envía solicitud a la Process API y retorna bytes con reintentos."""
    token = await _get_token()
    last_err = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=timeout) as c:
                r = await c.post(PROCESS_URL, json=payload,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json"})
                r.raise_for_status()
            return r.content
        except Exception as e:
            last_err = e
            if attempt < 2:
                import asyncio
                await asyncio.sleep(1 * (attempt + 1))
    raise last_err


# ═══════════════════════════════════════════════════════
# NDVI Image — imagen coloreada para overlay en mapa
# ═══════════════════════════════════════════════════════

EVALSCRIPT_NDVI_COLOR = """
//VERSION=3
function setup() {
  return { input: ["B04", "B08", "dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  let n = (s.B08 - s.B04) / (s.B08 + s.B04);
  if (n < 0)   return [0.5, 0.5, 0.5, s.dataMask];
  if (n < 0.2) return [0.8, 0.1, 0.1, s.dataMask];
  if (n < 0.4) return [0.8, 0.6, 0.1, s.dataMask];
  if (n < 0.6) return [0.4, 0.8, 0.1, s.dataMask];
  return [0.05, 0.5, 0.05, s.dataMask];
}
"""


async def fetch_ndvi_image(bbox: list, width=512, height=512) -> bytes:
    """Retorna imagen PNG del NDVI coloreado para el bbox dado."""
    cache_key = f"ndvi_img_{'_'.join(map(str, bbox))}_{width}_{height}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]

    payload = _make_payload(bbox, EVALSCRIPT_NDVI_COLOR, width, height)
    result = await _process_request(payload)
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result


# ═══════════════════════════════════════════════════════
# True Color Image — imagen real de la parcela
# ═══════════════════════════════════════════════════════

EVALSCRIPT_TRUE_COLOR = """
//VERSION=3
function setup() {
  return { input: ["B04", "B03", "B02"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  return [2.5 * s.B04, 2.5 * s.B03, 2.5 * s.B02];
}
"""


async def fetch_true_color_image(bbox: list, width=512, height=512) -> bytes:
    """Retorna imagen PNG true color de la parcela."""
    cache_key = f"tc_img_{'_'.join(map(str, bbox))}_{width}_{height}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]

    payload = _make_payload(bbox, EVALSCRIPT_TRUE_COLOR, width, height)
    result = await _process_request(payload)
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result


# ═══════════════════════════════════════════════════════
# NDVI Stats — valores numéricos para el score
# ═══════════════════════════════════════════════════════

EVALSCRIPT_NDVI_RAW = """
//VERSION=3
function setup() {
  return { input: ["B04", "B08", "dataMask"], output: { bands: 2, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  let n = (s.B08 - s.B04) / (s.B08 + s.B04);
  return [n, s.dataMask];
}
"""


# ═══════════════════════════════════════════════════════
# SWIR False Color — estrés hídrico y estructura vegetal
# ═══════════════════════════════════════════════════════

EVALSCRIPT_SWIR = """
//VERSION=3
function setup() {
  return { input: ["B12", "B8A", "B04", "dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  return [2.5*s.B12, 2.5*s.B8A, 2.5*s.B04, s.dataMask];
}
"""


# ═══════════════════════════════════════════════════════
# MNDWI — Modified Normalized Difference Water Index
# Detecta cuerpos de agua y humedales
# ═══════════════════════════════════════════════════════

EVALSCRIPT_MNDWI = """
//VERSION=3
function setup() {
  return { input: ["B03", "B11", "dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  let mndwi = (s.B03 - s.B11) / (s.B03 + s.B11 + 0.0001);
  if (mndwi > 0.3)  return [0.0, 0.2, 0.8, s.dataMask];
  if (mndwi > 0.1)  return [0.0, 0.5, 0.9, s.dataMask];
  if (mndwi > 0.0)  return [0.3, 0.7, 0.6, s.dataMask];
  if (mndwi > -0.2) return [0.5, 0.8, 0.3, s.dataMask];
  return [0.7, 0.6, 0.3, s.dataMask];
}
"""


# ═══════════════════════════════════════════════════════
# EVI — Enhanced Vegetation Index
# Mejor que NDVI en áreas de vegetación densa
# ═══════════════════════════════════════════════════════

EVALSCRIPT_EVI = """
//VERSION=3
function setup() {
  return { input: ["B02", "B04", "B08", "dataMask"], output: { bands: 4 } };
}
function evaluatePixel(s) {
  let evi = 2.5 * (s.B08 - s.B04) / (s.B08 + 6.0*s.B04 - 7.5*s.B02 + 1.0);
  evi = Math.max(-1, Math.min(1, evi));
  if (evi < 0)   return [0.6, 0.4, 0.2, s.dataMask];
  if (evi < 0.2) return [0.8, 0.6, 0.2, s.dataMask];
  if (evi < 0.4) return [0.6, 0.8, 0.2, s.dataMask];
  if (evi < 0.6) return [0.2, 0.7, 0.1, s.dataMask];
  return [0.0, 0.5, 0.0, s.dataMask];
}
"""


# ═══════════════════════════════════════════════════════
# Geological raw analysis — multi-index numeric output
# ═══════════════════════════════════════════════════════

EVALSCRIPT_GEO_RAW = """
//VERSION=3
function setup() {
  return {
    input: ["B02","B03","B04","B08","B11","B12","dataMask"],
    output: { bands: 4, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.0001);
  let mndwi = (s.B03 - s.B11) / (s.B03 + s.B11 + 0.0001);
  let bsi = ((s.B11 + s.B04) - (s.B08 + s.B02)) / ((s.B11 + s.B04) + (s.B08 + s.B02) + 0.0001);
  return [ndvi, mndwi, bsi, s.dataMask];
}
"""


async def fetch_ndvi_stats(bbox: list) -> dict:
    """Retorna estadísticas numéricas del NDVI (media, min, max, std)."""
    cache_key = f"ndvi_stats_{'_'.join(map(str, bbox))}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]

    payload = _make_payload(bbox, EVALSCRIPT_NDVI_RAW, width=64, height=64,
                            output_format="application/octet-stream")
    raw = await _process_request(payload)

    n_pixels = len(raw) // 8  # 2 bands x float32 = 8 bytes per pixel
    if n_pixels == 0:
        return {"ndvi_mean": 0.0, "ndvi_min": 0.0, "ndvi_max": 0.0,
                "ndvi_std": 0.0, "coverage_pct": 0.0}

    data = struct.unpack(f"{n_pixels * 2}f", raw)
    ndvi_vals = [data[i * 2] for i in range(n_pixels) if data[i * 2 + 1] > 0]

    if not ndvi_vals:
        return {"ndvi_mean": 0.0, "ndvi_min": 0.0, "ndvi_max": 0.0,
                "ndvi_std": 0.0, "coverage_pct": 0.0}

    arr = np.array(ndvi_vals)
    result = {
        "ndvi_mean": round(float(np.mean(arr)), 3),
        "ndvi_min": round(float(np.min(arr)), 3),
        "ndvi_max": round(float(np.max(arr)), 3),
        "ndvi_std": round(float(np.std(arr)), 3),
        "coverage_pct": round(len(ndvi_vals) / n_pixels * 100, 1)
    }
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result


async def fetch_swir_image(bbox: list, width=512, height=512) -> bytes:
    """Retorna imagen PNG SWIR false color."""
    cache_key = f"swir_img_{'_'.join(map(str, bbox))}_{width}_{height}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]
    payload = _make_payload(bbox, EVALSCRIPT_SWIR, width, height)
    result = await _process_request(payload)
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result


async def fetch_mndwi_image(bbox: list, width=512, height=512) -> bytes:
    """Retorna imagen PNG MNDWI (detección de humedales)."""
    cache_key = f"mndwi_img_{'_'.join(map(str, bbox))}_{width}_{height}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]
    payload = _make_payload(bbox, EVALSCRIPT_MNDWI, width, height)
    result = await _process_request(payload)
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result


async def fetch_evi_image(bbox: list, width=512, height=512) -> bytes:
    """Retorna imagen PNG EVI (Enhanced Vegetation Index)."""
    cache_key = f"evi_img_{'_'.join(map(str, bbox))}_{width}_{height}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]
    payload = _make_payload(bbox, EVALSCRIPT_EVI, width, height)
    result = await _process_request(payload)
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result


async def fetch_geological_analysis(bbox: list) -> dict:
    """Análisis geológico multi-índice: NDVI, MNDWI, BSI."""
    cache_key = f"geo_{'_'.join(map(str, bbox))}"
    if cache_key in _data_cache and time.time() - _data_cache[cache_key]["t"] < CACHE_TTL:
        return _data_cache[cache_key]["data"]

    payload = _make_payload(bbox, EVALSCRIPT_GEO_RAW, width=64, height=64,
                            output_format="application/octet-stream")
    raw = await _process_request(payload)

    n_pixels = len(raw) // 16  # 4 bands x float32
    if n_pixels == 0:
        return {"ndvi_mean": 0, "mndwi_mean": 0, "bsi_mean": 0,
                "wetland_pct": 0, "bare_soil_pct": 0, "vegetation_pct": 0,
                "water_risk": "BAJO", "drought_risk": "BAJO"}

    data = struct.unpack(f"{n_pixels * 4}f", raw)
    ndvi_v, mndwi_v, bsi_v = [], [], []
    for i in range(n_pixels):
        mask = data[i * 4 + 3]
        if mask > 0:
            ndvi_v.append(data[i * 4])
            mndwi_v.append(data[i * 4 + 1])
            bsi_v.append(data[i * 4 + 2])

    if not ndvi_v:
        return {"ndvi_mean": 0, "mndwi_mean": 0, "bsi_mean": 0,
                "wetland_pct": 0, "bare_soil_pct": 0, "vegetation_pct": 0,
                "water_risk": "BAJO", "drought_risk": "BAJO"}

    ndvi_a = np.array(ndvi_v)
    mndwi_a = np.array(mndwi_v)
    bsi_a = np.array(bsi_v)
    total = len(ndvi_v)

    wetland_pct = round(float(np.sum(mndwi_a > 0.1) / total * 100), 1)
    bare_soil_pct = round(float(np.sum(bsi_a > 0.1) / total * 100), 1)
    vegetation_pct = round(float(np.sum(ndvi_a > 0.3) / total * 100), 1)

    mndwi_mean = round(float(np.mean(mndwi_a)), 3)
    water_risk = "ALTO" if wetland_pct > 30 else "MEDIO" if wetland_pct > 10 else "BAJO"
    drought_risk = "ALTO" if float(np.mean(ndvi_a)) < 0.2 else "MEDIO" if float(np.mean(ndvi_a)) < 0.35 else "BAJO"

    result = {
        "ndvi_mean": round(float(np.mean(ndvi_a)), 3),
        "mndwi_mean": mndwi_mean,
        "bsi_mean": round(float(np.mean(bsi_a)), 3),
        "wetland_pct": wetland_pct,
        "bare_soil_pct": bare_soil_pct,
        "vegetation_pct": vegetation_pct,
        "water_risk": water_risk,
        "drought_risk": drought_risk,
    }
    _data_cache[cache_key] = {"data": result, "t": time.time()}
    return result
