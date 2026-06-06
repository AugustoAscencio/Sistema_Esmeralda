"""
Adaptador universal de LLM.
Para cambiar de proveedor, solo edita .env — sin tocar ningún otro archivo.

LLM_PROVIDER = ollama | lmstudio | groq | gemini | openai | anthropic
"""

import os
import httpx

PROVIDER  = os.getenv("LLM_PROVIDER", "ollama")
BASE_URL  = os.getenv("LLM_BASE_URL", "http://localhost:11434")
MODEL     = os.getenv("LLM_MODEL", "gemma3:4b")
API_KEY   = os.getenv("LLM_API_KEY", "")


def _get_config():
    """Construye la configuración del proveedor actual."""
    configs = {
        "ollama": {
            "endpoint": f"{BASE_URL}/api/chat",
            "format": "ollama",
            "headers": {"Content-Type": "application/json"},
        },
        "lmstudio": {
            "endpoint": f"{BASE_URL}/v1/chat/completions",
            "format": "openai",
            "headers": {"Content-Type": "application/json"},
        },
        "openai": {
            "endpoint": "https://api.openai.com/v1/chat/completions",
            "format": "openai",
            "headers": {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
        },
        "anthropic": {
            "endpoint": "https://api.anthropic.com/v1/messages",
            "format": "anthropic",
            "headers": {"Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01"},
        },
        "gemini": {
            "endpoint": f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}",
            "format": "gemini",
            "headers": {"Content-Type": "application/json"},
        },
        "groq": {
            "endpoint": "https://api.groq.com/openai/v1/chat/completions",
            "format": "openai",
            "headers": {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
        },
    }
    return configs.get(PROVIDER, configs["ollama"])


async def chat(system_prompt: str, user_message: str, max_tokens: int = 800) -> str:
    """
    Envía un mensaje al LLM configurado y retorna la respuesta.
    Funciona con cualquier proveedor sin cambios en el código.
    """
    cfg = _get_config()
    fmt = cfg["format"]

    if fmt == "ollama":
        payload = {
            "model": MODEL, "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ]
        }
    elif fmt == "openai":
        payload = {
            "model": MODEL, "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ]
        }
    elif fmt == "anthropic":
        payload = {
            "model": MODEL, "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }
    elif fmt == "gemini":
        payload = {
            "contents": [{"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_message}"}]}],
            "generationConfig": {"maxOutputTokens": max_tokens},
        }
    else:
        payload = {"model": MODEL, "messages": [{"role": "user", "content": user_message}]}

    try:
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(cfg["endpoint"], json=payload, headers=cfg["headers"])
            r.raise_for_status()

        data = r.json()
        if fmt == "ollama":
            return data["message"]["content"]
        if fmt == "openai":
            return data["choices"][0]["message"]["content"]
        if fmt == "anthropic":
            return data["content"][0]["text"]
        if fmt == "gemini":
            return data["candidates"][0]["content"]["parts"][0]["text"]
        return str(data)
    except Exception as e:
        return (
            f"⚠️ No pude conectarme al modelo de IA ({PROVIDER}). "
            f"Verifica que el servidor esté corriendo en {BASE_URL}. "
            f"Error: {str(e)[:100]}"
        )
