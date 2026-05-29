# ❇️ Sistema Esmeralda

> **El campo visto desde el cielo. El futuro construido desde la tierra.**

**Sistema Esmeralda** es una plataforma de agricultura de precisión y resiliencia climática desarrollada para el **Copernicus LAC Hackathon 2024 (Reto 1: Resiliencia del Pequeño Agricultor)**. 

Transformamos datos satelitales complejos en herramientas financieras y agronómicas accesibles para pequeños agricultores en América Latina, permitiéndoles anticipar sequías, optimizar recursos y acceder a microcréditos paramétricos justos.

---

## 🎯 El Problema

Los pequeños agricultores en Latinoamérica enfrentan una tormenta perfecta:
1. **Cambio Climático:** Sequías más frecuentes e impredecibles.
2. **Exclusión Financiera:** Los bancos tradicionales los consideran "de alto riesgo" por la falta de garantías convencionales.
3. **Brecha Tecnológica:** Existen datos satelitales avanzados (como Copernicus), pero son inaccesibles y complejos para el agricultor promedio.

## 💡 La Solución: Sistema Esmeralda

Esmeralda actúa como un puente entre la órbita terrestre y la parcela del agricultor.

### Características Principales:

* **🛰️ Mapeo Satelital Simplificado:** Selecciona una parcela con dos clics y obtén análisis de NDVI (salud) y humedad del suelo al instante usando datos de **Sentinel-2** y **Sentinel-1**.
* **📊 Score de Resiliencia (0-100):** Un algoritmo propietario que evalúa la salud del cultivo, la estabilidad histórica, la disponibilidad de agua y el riesgo climático. Este score funciona como un "historial crediticio satelital".
* **💳 Microcréditos Paramétricos:** Integración con modelos financieros que sugieren créditos automáticamente basados en el Score de Resiliencia y umbrales de sequía. ¡El satélite es la garantía!
* **🏜️ Simulador de Sequía:** Evalúa el impacto financiero de futuras sequías en 10 tipos de cultivos diferentes (Maíz, Frijol, Café, etc.).
* **🤖 Agente IA Especializado:** Un asistente conversacional impulsado por IA que entiende el contexto satelital de la parcela para dar consejos agronómicos en lenguaje natural.
* **🔧 Herramientas Agrícolas Profesionales:** Calculadoras de Evapotranspiración (ET₀), estrés térmico y balance hídrico.

---

## 🏗️ Arquitectura Técnica

Esmeralda está construida con un stack moderno, rápido y altamente modular:

### Frontend (React + Vite)
* **Diseño UI/UX:** Colores puros (Negro, Blanco, Esmeralda), diseño simétrico, cero distracciones.
* **Visualización Geográfica:** `MapLibre GL` para mapas interactivos y dibujo de parcelas.
* **Gráficos 3D y 2D:** `Three.js (@react-three/fiber)` para el globo terráqueo y la esfera de score interactiva; `Recharts` para analítica financiera.
* **Manejo de Estado:** `Zustand` para un estado global ultraligero.

### Backend (Python + FastAPI)
* **API Core:** `FastAPI` proporciona endpoints asíncronos ultrarrápidos.
* **Integración Satelital:** Conexión directa a la **Copernicus CDSE API** (OAuth2) procesando mosaicos `leastCC` para NDVI y NDWI.
* **Clima:** Integración con `Open-Meteo` para pronósticos a 7 días.
* **IA:** Arquitectura agnóstica de LLM soportando proveedores locales (`Ollama`) y en la nube (OpenAI, Gemini).

---

## 🚀 Cómo Empezar (Desarrollo Local)

### Prerrequisitos
* Node.js (v18+)
* Python 3.10+
* Cuenta gratuita en Copernicus Data Space Ecosystem (CDSE)

### 1. Configurar Backend
\`\`\`bash
cd backend
python -m venv venv
# Activar entorno virtual
# Windows: venv\\Scripts\\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Añade tus credenciales de CDSE en el archivo .env

# Iniciar servidor
uvicorn main:app --reload --port 8000
\`\`\`

### 2. Configurar Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

La aplicación estará disponible en \`http://localhost:5173\`.

---

## 🧬 Metodología Científica

Nuestros cálculos no son aleatorios; están respaldados por ciencia agronómica:

* **Índice NDVI:** Calculado usando las bandas Infrarroja Cercana (B08) y Roja (B04) de Sentinel-2 L2A. `NDVI = (B08 - B04) / (B08 + B04)`
* **Estimación de Humedad:** Utiliza retrodispersión de radar de apertura sintética (SAR) de Sentinel-1 GRD, capaz de medir humedad a través de las nubes.
* **Evapotranspiración (ET₀):** Calculada mediante el método modificado de Hargreaves, optimizado para regiones tropicales de LATAM.

---

## 🏆 Por qué Esmeralda gana el Reto 1

1. **Es Realista:** No requerimos hardware IoT costoso en la parcela. Solo conexión a internet y datos abiertos de Copernicus.
2. **Diseño Impecable:** Demostramos que las herramientas para pequeños agricultores no tienen que ser feas o anticuadas. Esmeralda compite en UI/UX con las mejores startups Fintech.
3. **Resuelve el Problema Raíz:** El problema no es solo la sequía, es el **impacto económico** de la sequía. Al unir el monitoreo satelital con los microcréditos paramétricos, ofrecemos una red de seguridad real.

---
*Hecho con 💚 para el campo latinoamericano.*
