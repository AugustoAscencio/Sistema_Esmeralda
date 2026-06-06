"""
Rutas de la Red Comunitaria Agrícola — Sistema Esmeralda
========================================================
Permite a pequeños agricultores compartir alertas de plagas, clima,
consejos de campo y colaborar comunitariamente.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# Base de datos en memoria para demostración interactiva
POSTS_DB = [
    {
        "id": 1,
        "author": "Don Carlos Mendoza",
        "role": "Agricultor",
        "location": "Chinandega Centro",
        "tag": "Plaga",  # Plaga, Clima, Cosecha, Consejo
        "content": (
            "⚠️ ATENCIÓN VECINOS: He detectado los primeros brotes de pulgón verde en el sector noreste de mi parcela de maíz. "
            "El satélite ya marcaba estrés leve y hoy lo confirmé en campo. Recomiendo revisar sus hojas inferiores y "
            "aplicar el extracto orgánico de nim que nos enseñó el INTA antes de que se extienda."
        ),
        "likes": 12,
        "liked_by": [],
        "comments": [
            {"author": "Ing. Ernesto Silva", "role": "Agrónomo INTA", "text": "Excelente reporte Carlos. La humedad alta de esta semana favorece al pulgón. Mañana haré una visita técnica en esa zona.", "date": "2026-05-19"},
            {"author": "María Gutiérrez", "role": "Agricultora", "text": "Gracias por el aviso Don Carlos, voy a inspeccionar mi frijolar de inmediato.", "date": "2026-05-19"}
        ],
        "date_posted": "2026-05-19T14:32:00",
    },
    {
        "id": 2,
        "author": "Ing. Ernesto Silva",
        "role": "Agrónomo INTA",
        "location": "Chinandega Regional",
        "tag": "Consejo",
        "content": (
            "🌱 RECOMENDACIÓN DE SIEMBRA: Con el pronóstico de precipitaciones de 45mm para la próxima semana en el mapa de "
            "Esmeralda, las condiciones de humedad de suelo Sentinel-1 están en un punto óptimo del 42%. Es la ventana "
            "perfecta para la siembra de maíz de secano en Chinandega. Aseguren una profundidad de siembra de 5cm para optimizar germinación."
        ),
        "likes": 24,
        "liked_by": [],
        "comments": [
            {"author": "Juan Ramón Sevilla", "role": "Agricultor", "text": "Entendido Ingeniero, ya tenemos la semilla lista para aprovechar el agua.", "date": "2026-05-20"}
        ],
        "date_posted": "2026-05-20T08:15:00",
    },
    {
        "id": 3,
        "author": "Cooperativa San Juan",
        "role": "Organización",
        "location": "El Viejo, Chinandega",
        "tag": "Clima",
        "content": (
            "🌧️ ALERTA CLIMÁTICA: El modelo de predicción climática de Sistema Esmeralda nos reporta anomalías térmicas "
            "mayores a 38°C acompañadas de ráfagas de viento fuertes para el próximo viernes por la tarde. Sugerimos revisar "
            "las mallas de sombra de los invernaderos de hortalizas y asegurar los sistemas de riego por goteo."
        ),
        "likes": 18,
        "liked_by": [],
        "comments": [],
        "date_posted": "2026-05-20T10:45:00",
    },
    {
        "id": 4,
        "author": "María Gutiérrez",
        "role": "Agricultora",
        "location": "Somotillo, Chinandega",
        "tag": "Cosecha",
        "content": (
            "🎉 ¡COSECHA LOGRADA! Hoy iniciamos la recolección de frijol rojo. Gracias a las alertas tempranas hídricas de "
            "Sistema Esmeralda pudimos coordinar la mano de obra justo 3 días antes de las lluvias fuertes. "
            "Toda la producción se salvó sin hongos y está lista para el Mercado Agroecológico de la plataforma."
        ),
        "likes": 32,
        "liked_by": [],
        "comments": [
            {"author": "Don Carlos Mendoza", "role": "Agricultor", "text": "¡Felicidades María! Un gran logro. Estaremos comprando semilla de tu lote en la cooperativa.", "date": "2026-05-20"}
        ],
        "date_posted": "2026-05-20T12:00:00",
    }
]

class PostCreate(BaseModel):
    author: str = Field(..., min_length=3, max_length=50)
    role: str = Field(..., description="Agricultor, Agrónomo, Organización")
    location: str = Field(..., min_length=4, max_length=60)
    tag: str = Field(..., description="Plaga, Clima, Cosecha, Consejo")
    content: str = Field(..., min_length=10, max_length=500)

class CommentCreate(BaseModel):
    author: str = Field(..., min_length=3, max_length=50)
    role: str = Field(..., description="Agricultor, Agrónomo, Organización")
    text: str = Field(..., min_length=2, max_length=200)

@router.get("/feed")
async def get_feed(tag: Optional[str] = None):
    """Obtiene el feed de publicaciones de la comunidad agrícola."""
    if tag and tag != "Todos":
        filtered = [p for p in POSTS_DB if p["tag"].lower() == tag.lower()]
        return filtered
    return POSTS_DB

@router.post("/posts")
async def create_post(post: PostCreate):
    """Crea una nueva publicación en el feed de la comunidad."""
    new_id = len(POSTS_DB) + 1 if POSTS_DB else 1
    new_p = {
        "id": new_id,
        "author": post.author,
        "role": post.role,
        "location": post.location,
        "tag": post.tag,
        "content": post.content,
        "likes": 0,
        "liked_by": [],
        "comments": [],
        "date_posted": datetime.now().isoformat(),
    }
    POSTS_DB.insert(0, new_p) # Insertar al inicio para que aparezca primero
    return {"message": "¡Publicación enviada con éxito!", "post": new_p}

@router.post("/posts/{post_id}/like")
async def like_post(post_id: int, user_name: str = "Usuario"):
    """Da like o remueve like de una publicación comunitaria."""
    for post in POSTS_DB:
        if post["id"] == post_id:
            if user_name in post["liked_by"]:
                post["liked_by"].remove(user_name)
                post["likes"] = max(0, post["likes"] - 1)
                return {"message": "Like removido", "likes": post["likes"], "liked": False}
            else:
                post["liked_by"].append(user_name)
                post["likes"] += 1
                return {"message": "Like añadido", "likes": post["likes"], "liked": True}
    raise HTTPException(status_code=404, detail="Publicación no encontrada")

@router.post("/posts/{post_id}/comment")
async def comment_post(post_id: int, comment: CommentCreate):
    """Agrega un comentario a una publicación comunitaria."""
    for post in POSTS_DB:
        if post["id"] == post_id:
            new_comment = {
                "author": comment.author,
                "role": comment.role,
                "text": comment.text,
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            post["comments"].append(new_comment)
            return {"message": "Comentario añadido con éxito", "comment": new_comment}
    raise HTTPException(status_code=404, detail="Publicación no encontrada")
