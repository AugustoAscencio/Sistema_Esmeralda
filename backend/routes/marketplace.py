"""
Rutas del Mercado Agroecológico de Chinandega — Sistema Esmeralda
=================================================================
Permite a pequeños agricultores vender directamente y comparar precios.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# Base de datos en memoria para demostraciones en vivo (Hackathon)
PRODUCTS_DB = [
    {
        "id": 1,
        "title": "Maíz Amarillo Calidad Premium",
        "category": "Granos",
        "farmer_name": "Carlos Mendoza (Don Carlos)",
        "location": "Chinandega, Nicaragua",
        "price_usd_kg": 0.26,
        "quantity_kg": 1500,
        "description": "Cosecha fresca secada al sol de forma natural. Grano entero, libre de plagas. Ideal para molienda y consumo general.",
        "whatsapp_contact": "50588881234",
        "image_url": "/maize_harvest.png",
        "date_posted": "2026-05-18",
    },
    {
        "id": 2,
        "title": "Frijol Rojo de Seda Seleccionado",
        "category": "Granos",
        "farmer_name": "María Gutiérrez",
        "location": "Somotillo, Chinandega",
        "price_usd_kg": 1.15,
        "quantity_kg": 800,
        "description": "Frijol rojo de seda tradicional, alta facilidad de cocción y excelente sabor. Empacado en sacos de 100 libras.",
        "whatsapp_contact": "50588885678",
        "image_url": "/red_beans.png",
        "date_posted": "2026-05-19",
    },
    {
        "id": 3,
        "title": "Tomates Saladette Orgánicos de Invernadero",
        "category": "Hortalizas",
        "farmer_name": "Cooperativa San Juan",
        "location": "El Viejo, Chinandega",
        "price_usd_kg": 0.48,
        "quantity_kg": 2500,
        "description": "Tomates cultivados bajo ambiente protegido, regados con agua limpia. Alta consistencia y coloración uniforme.",
        "whatsapp_contact": "50588889012",
        "image_url": "/greenhouse_tomatoes.png",
        "date_posted": "2026-05-20",
    },
    {
        "id": 4,
        "title": "Plátano Pelipita Verde Grande",
        "category": "Frutas",
        "farmer_name": "Juan Ramón Sevilla",
        "location": "Posoltega, Nicaragua",
        "price_usd_kg": 0.22,
        "quantity_kg": 4000,
        "description": "Excelente tamaño y vigor. Cosechados en su punto para transporte a larga distancia. Descuento especial por compras de todo el lote.",
        "whatsapp_contact": "50588883456",
        "image_url": "https://images.unsplash.com/photo-1566393028639-d108a42c46a7?auto=format&fit=crop&q=80&w=400",
        "date_posted": "2026-05-17",
    },
    {
        "id": 5,
        "title": "Café Orgánico Lavado de Altura (Oro)",
        "category": "Café",
        "farmer_name": "Hacienda El Paraíso (Alianzas)",
        "location": "Estelí/Chinandega (Zona Norte)",
        "price_usd_kg": 2.95,
        "quantity_kg": 1200,
        "description": "Café de variedad Bourbon y Caturra, secado en camas africanas. Nota de cata: Chocolate, cítricos dulces y cuerpo balanceado.",
        "whatsapp_contact": "50588887890",
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
        "date_posted": "2026-05-20",
    }
]

class ProductCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=60)
    category: str = Field(..., description="Granos, Hortalizas, Frutas, Café, Otros")
    farmer_name: str = Field(..., min_length=3, max_length=50)
    location: str = Field(..., min_length=5, max_length=60)
    price_usd_kg: float = Field(..., gt=0)
    quantity_kg: int = Field(..., gt=0)
    description: str = Field(..., min_length=10, max_length=300)
    whatsapp_contact: str = Field(..., description="Prefijo de país + número, sin espacios")
    image_url: Optional[str] = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400"

@router.get("/products")
async def get_products(category: Optional[str] = None):
    """Obtiene la lista de productos agroecológicos, opcionalmente filtrados por categoría."""
    if category and category != "Todos":
        filtered = [p for p in PRODUCTS_DB if p["category"].lower() == category.lower()]
        return filtered
    return PRODUCTS_DB

@router.post("/products")
async def create_product(product: ProductCreate):
    """Registra una nueva oferta de cosecha en el mercado en memoria."""
    new_id = len(PRODUCTS_DB) + 1 if PRODUCTS_DB else 1
    new_p = {
        "id": new_id,
        "title": product.product_title if hasattr(product, "product_title") else product.title,
        "category": product.category,
        "farmer_name": product.farmer_name,
        "location": product.location,
        "price_usd_kg": product.price_usd_kg,
        "quantity_kg": product.quantity_kg,
        "description": product.description,
        "whatsapp_contact": product.whatsapp_contact.replace(" ", "").replace("+", ""),
        "image_url": product.image_url,
        "date_posted": datetime.now().strftime("%Y-%m-%d"),
    }
    PRODUCTS_DB.insert(0, new_p) # Insertar al inicio para que aparezca primero
    return {"message": "¡Oferta registrada con éxito!", "product": new_p}

@router.get("/prices")
async def get_price_comparison(crop: str = "maiz"):
    """
    Simula una comparación precisa de precios para educar al agricultor.
    Compara el precio internacional de referencia (FAO), precio justo cooperativa,
    y precio promedio del intermediario (el que explota por necesidad).
    """
    # Precios base en USD por kg
    prices_map = {
        "maiz": {"global": 0.22, "coop": 0.26, "intermediary": 0.16},
        "frijol": {"global": 1.10, "coop": 1.25, "intermediary": 0.80},
        "arroz": {"global": 0.35, "coop": 0.40, "intermediary": 0.25},
        "tomate": {"global": 0.45, "coop": 0.55, "intermediary": 0.30},
        "cafe": {"global": 2.80, "coop": 3.20, "intermediary": 1.90},
        "sorgo": {"global": 0.18, "coop": 0.21, "intermediary": 0.12},
        "yuca": {"global": 0.15, "coop": 0.18, "intermediary": 0.09},
        "platano": {"global": 0.20, "coop": 0.24, "intermediary": 0.13},
        "aguacate": {"global": 1.50, "coop": 1.70, "intermediary": 1.00},
        "chile": {"global": 1.20, "coop": 1.40, "intermediary": 0.75},
    }
    
    crop_key = crop.lower()
    if crop_key not in prices_map:
        crop_key = "maiz"
        
    prices = prices_map[crop_key]
    coop_premium_pct = round(((prices["coop"] - prices["global"]) / prices["global"]) * 100, 1)
    loss_intermediary_pct = round(((prices["global"] - prices["intermediary"]) / prices["global"]) * 100, 1)
    
    return {
        "crop": crop_key,
        "prices": {
            "global_reference_fao_usd_kg": prices["global"],
            "fair_trade_coop_usd_kg": prices["coop"],
            "local_intermediary_usd_kg": prices["intermediary"],
        },
        "analysis": {
            "coop_premium_pct": coop_premium_pct,
            "intermediary_discount_pct": loss_intermediary_pct,
            "advice": (
                f"Vender a través de la Cooperativa te otorga un premio del {coop_premium_pct}% "
                f"sobre el precio internacional de referencia. Evita vender a intermediarios rápidos, "
                f"ya que representa una pérdida del {loss_intermediary_pct}% de tu valor real. "
                f"Usa tu Score de Resiliencia de Esmeralda para demostrar la calidad constante de tu lote y "
                f"negociar un mejor precio de venta."
            )
        }
    }
