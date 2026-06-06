"""
Servicio de precios de cultivos.
Usa datos estáticos de referencia (FAO/World Bank) como base.
"""

# Precios de referencia USD/kg para cultivos latinoamericanos
# Fuente: FAO FAOSTAT + World Bank Commodity Prices (promedios recientes)
REFERENCE_PRICES = {
    "maiz":     0.22,
    "frijol":   1.10,
    "arroz":    0.35,
    "tomate":   0.45,
    "cafe":     2.80,
    "sorgo":    0.18,
    "yuca":     0.15,
    "platano":  0.20,
    "aguacate": 1.50,
    "chile":    1.20,
}


def get_crop_price(crop: str) -> float:
    """Retorna el precio de referencia para un cultivo."""
    return REFERENCE_PRICES.get(crop.lower(), 0.25)


def get_all_prices() -> dict:
    """Retorna todos los precios de referencia."""
    return REFERENCE_PRICES.copy()
