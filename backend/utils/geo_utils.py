"""
Utilidades geográficas: validación de bbox, cálculo de área, centro.
"""
import math


def validate_bbox(bbox: list) -> bool:
    """Valida que un bbox tenga formato [lon_min, lat_min, lon_max, lat_max]."""
    if len(bbox) != 4:
        return False
    lon_min, lat_min, lon_max, lat_max = bbox
    if lon_min >= lon_max or lat_min >= lat_max:
        return False
    if not (-180 <= lon_min <= 180 and -180 <= lon_max <= 180):
        return False
    if not (-90 <= lat_min <= 90 and -90 <= lat_max <= 90):
        return False
    return True


def bbox_center(bbox: list) -> tuple:
    """Retorna el centro (lat, lon) de un bbox."""
    lon_min, lat_min, lon_max, lat_max = bbox
    return ((lat_min + lat_max) / 2, (lon_min + lon_max) / 2)


def bbox_area_ha(bbox: list) -> float:
    """Calcula el área aproximada en hectáreas de un bbox."""
    lon_min, lat_min, lon_max, lat_max = bbox
    # Aproximación usando la fórmula del rectángulo esférico
    lat_mid = math.radians((lat_min + lat_max) / 2)
    dx = (lon_max - lon_min) * math.cos(lat_mid) * 111320  # metros
    dy = (lat_max - lat_min) * 110540  # metros
    area_m2 = dx * dy
    return round(area_m2 / 10000, 2)  # hectáreas


def parse_bbox_string(bbox_str: str) -> list:
    """Parsea un string 'lon_min,lat_min,lon_max,lat_max' a lista de floats."""
    parts = [float(x.strip()) for x in bbox_str.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox debe tener 4 valores: lon_min,lat_min,lon_max,lat_max")
    return parts
