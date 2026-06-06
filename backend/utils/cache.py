"""
Cache simple con TTL para respuestas de API.
"""

import time
from typing import Any, Optional

_store = {}


def get(key: str) -> Optional[Any]:
    """Obtiene un valor del cache si existe y no ha expirado."""
    if key in _store:
        entry = _store[key]
        if time.time() - entry["t"] < entry["ttl"]:
            return entry["data"]
        else:
            del _store[key]
    return None


def set(key: str, data: Any, ttl: int = 3600):
    """Guarda un valor en cache con TTL en segundos."""
    _store[key] = {"data": data, "t": time.time(), "ttl": ttl}


def clear():
    """Limpia todo el cache."""
    _store.clear()
