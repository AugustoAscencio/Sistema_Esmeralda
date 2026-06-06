"""
Construye el contexto satelital para inyectar en el system prompt del agente.
"""


def build_satellite_context(analysis_data: dict) -> str:
    """
    Convierte los datos de análisis en un contexto legible para el LLM.
    """
    ndvi = analysis_data.get("ndvi", {})
    moisture = analysis_data.get("moisture", {})
    climate = analysis_data.get("climate", {})
    summary = climate.get("summary", {})
    resilience = analysis_data.get("resilience", {})
    credit = resilience.get("credit", {})
    alerts = analysis_data.get("alerts", [])

    context_parts = [
        f"📊 NDVI actual: {ndvi.get('ndvi_mean', 'N/A')} (min: {ndvi.get('ndvi_min', 'N/A')}, max: {ndvi.get('ndvi_max', 'N/A')})",
        f"💧 Humedad del suelo: {moisture.get('moisture_mean', 'N/A')}%",
        f"🌧️ Lluvia prevista (7 días): {summary.get('precip_7d_mm', 'N/A')} mm",
        f"🌡️ Temperatura máxima: {summary.get('temp_max', 'N/A')}°C",
        f"📈 Score de Resiliencia: {resilience.get('score', 'N/A')}/100 — {resilience.get('category', 'N/A')}",
        f"💳 Crédito: {credit.get('recommendation', 'N/A')} — hasta ${credit.get('max_amount_usd', 0)} USD",
    ]

    if alerts:
        context_parts.append("\n⚠️ ALERTAS ACTIVAS:")
        for alert in alerts:
            context_parts.append(f"  [{alert.get('level', '')}] {alert.get('message', '')}")

    return "\n".join(context_parts)


SYSTEM_PROMPT_TEMPLATE = """Eres Esmeralda, una asistente agrónoma y financiera que ayuda a pequeños agricultores
de América Latina. Tienes acceso en tiempo real a datos de satélites Copernicus.

TONO: Habla en español claro, cálido y directo. No uses tecnicismos sin explicar.
Trátalo como a un colega del campo, no como a un cliente.

REGLAS:
- Antes de dar un consejo, valida con los datos satelitales actuales.
- Si el NDVI está bajo 0.3, menciona el riesgo de pérdida y el microcrédito.
- Si hay sequía prevista, da consejos prácticos de conservación de agua.
- Si el score es alto, refuerza la confianza del agricultor.
- Sé breve: máximo 3 párrafos por respuesta.
- Siempre cierra con una acción concreta que el agricultor pueda hacer HOY.

DATOS SATELITALES DE LA PARCELA ACTUAL:
{satellite_context}
"""


def build_system_prompt(analysis_data: dict) -> str:
    """Construye el system prompt completo con contexto satelital."""
    context = build_satellite_context(analysis_data)
    return SYSTEM_PROMPT_TEMPLATE.format(satellite_context=context)
