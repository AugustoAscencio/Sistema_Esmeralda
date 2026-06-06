# ❇️ Sistema Esmeralda

> **El campo visto desde el cielo. El futuro construido desde la tierra.**

**Sistema Esmeralda** es una plataforma integral de agricultura de precisión y resiliencia climática desarrollada para el **Copernicus LAC Hackathon 2024 (Reto 1: Resiliencia del Pequeño Agricultor)**.

Transformamos datos satelitales complejos en herramientas financieras y agronómicas accesibles para pequeños agricultores en América Latina, permitiéndoles anticipar sequías, optimizar recursos y acceder a microcréditos paramétricos justos.

---

## 🎯 El Problema

Los pequeños agricultores en Latinoamérica enfrentan una tormenta perfecta:
1. **Cambio Climático:** Sequías más frecuentes e impredecibles.
2. **Exclusión Financiera:** Los bancos tradicionales los consideran "de alto riesgo" por la falta de garantías convencionales.
3. **Brecha Tecnológica:** Existen datos satelitales avanzados (como Copernicus), pero son inaccesibles y complejos para el agricultor promedio.

---

## 💡 La Solución: Sistema Esmeralda

Esmeralda actúa como un puente entre la órbita terrestre y la parcela del agricultor. Ofrecemos un ecosistema completo de módulos integrados:

### 📊 Dashboard Central
Panel de control con indicadores satelitales en tiempo real: NDVI, humedad del suelo, pronóstico meteorológico, score de resiliencia y alertas automáticas. **Diseño 100% responsivo** — se adapta perfectamente desde escritorio a celular.

### 🛰️ Visor Satelital (Parcela)
Selecciona una parcela con dos clics y obtén análisis instantáneo de NDVI (salud vegetal) y humedad del suelo usando datos de **Sentinel-2** y **Sentinel-1** de Copernicus. Incluye galería de imágenes satelitales con capas NDVI, NDWI, Infrarrojo y Color Real.

### 📊 Score de Resiliencia (0-100)
Un algoritmo propietario que evalúa cuatro dimensiones:
- **Salud del cultivo** (NDVI Sentinel-2): hasta 40 puntos
- **Estabilidad histórica** (desviación temporal): hasta 25 puntos
- **Humedad disponible** (SAR Sentinel-1 + lluvia): hasta 20 puntos
- **Resiliencia térmica** (estrés calórico): hasta 15 puntos

Este score funciona como un "historial crediticio satelital".

### 💳 Microcréditos Paramétricos
Créditos automáticamente calculados por el satélite. Sin papeleo bancario — el NDVI y la humedad son la garantía. Categorías: APROBADO, CONDICIONAL, CON_GARANTIA o RECHAZADO según el Score de Resiliencia.

### 💰 Finanzas Predictivas
Panel financiero con costos por cultivo, ingresos estimados, ROI proyectado y simulador de sequía para 10 tipos de cultivos (Maíz, Frijol, Café, Arroz, Sorgo, Ajonjolí, Caña de Azúcar, Cacao, Plátano, Maní). Incluye análisis de punto de equilibrio y tablas de sensibilidad.

### 🛒 Mercado Agroecológico
Marketplace digital para venta directa de cosechas sin intermediarios. Los productores publican sus productos con precio, ubicación y certificaciones. Comparación de precios en tiempo real.

### 🤝 Red Comunitaria de Agricultores
Red social agrícola donde los productores de Chinandega comparten alertas de plagas, consejos prácticos, publicaciones técnicas y se apoyan mutuamente. Feed estilo social con likes, comentarios y etiquetas por tipo de alerta.

### 🧠 Capacitación Rural (E-Learning)
Lecciones interactivas sobre conservación de agua, salud del suelo, manejo integrado de plagas y técnicas de agricultura sostenible. Diseñado para el agricultor que nunca usó una computadora.

### 🛠️ Herramientas Técnicas
- **Calculadora de Evapotranspiración (ET₀):** Método modificado de Hargreaves, optimizado para el trópico.
- **Calculadora de Dosificación de Nutrientes:** Formulación exacta de NPK por tipo de cultivo y superficie.

### 🤖 Esmeralda Granjerita — Asistente IA
Chatbot de inteligencia artificial especializado en agronomía. Entiende el contexto satelital de tu parcela y te da recomendaciones personalizadas de riego, fertilización y manejo en lenguaje natural. Accesible desde cualquier pantalla del sistema.

---

## 📱 Diseño Responsivo

Sistema Esmeralda está diseñado para funcionar perfectamente en cualquier dispositivo:

| Pantalla | Experiencia |
|---|---|
| **Escritorio** (≥1024px) | Dashboard 2 columnas, navbar horizontal superior |
| **Tablet** (768–1024px) | Dashboard 1 columna amplia, grillas adaptativas |
| **Móvil** (< 768px) | Bottom nav con todos los módulos, tarjetas apiladas, esfera de score reducida, tooltips reposicionados |

### Breakpoints del sistema
- `1024px` — Dashboard cambia a layout de 2 columnas
- `768px` — Grillas de métricas pasan a 3 columnas, navbar cambia a bottom nav
- `480px` — Métricas pasan a 2 columnas, crédito pasa a 2 columnas
- `400px` — Módulos del ecosistema a 1 columna, padding mínimo

### Bottom Nav Móvil
En celular, la navegación inferior incluye **todos los módulos**: Panel, Parcela, Finanzas, Mercado, Comunidad, Herramientas, Aprender y el botón de Esmeralda Granjerita (IA).

---

## 🏗️ Arquitectura Técnica

Esmeralda está construida con un stack moderno, rápido y altamente modular:

### Frontend (React + Vite)
* **Framework:** React 18 con Vite para desarrollo ultrarrápido con HMR.
* **Diseño UI/UX:** Design system propio con colores Esmeralda, tipografía premium (Space Grotesk + Inter + JetBrains Mono), animaciones suaves y glassmorphism.
* **Visualización Geográfica:** `MapLibre GL` para mapas interactivos y dibujo de parcelas.
* **Gráficos 3D y 2D:** `Three.js (@react-three/fiber)` para la esfera de score interactiva; `Recharts` para analítica financiera y tendencias NDVI.
* **Manejo de Estado:** `Zustand` para un estado global ultraligero con datos demo inteligentes.
* **Responsividad:** CSS vanilla con media queries progresivos (mobile-first). Bottom nav adaptativo en móvil.

### Backend (Python + FastAPI)
* **API Core:** `FastAPI` proporciona endpoints asíncronos ultrarrápidos.
* **Integración Satelital:** Conexión directa a la **Copernicus CDSE API** (OAuth2) procesando mosaicos `leastCC` para NDVI y NDWI.
* **Clima:** Integración con `Open-Meteo` para pronósticos a 7 días.
* **IA:** Arquitectura agnóstica de LLM soportando proveedores locales (`Ollama`) y en la nube (OpenAI, Gemini). El chatbot se llama **Esmeralda Granjerita**.

---

## 🚀 Cómo Empezar

### Inicio Rápido (Windows)

La forma más fácil de iniciar todo el sistema:

```bash
# Doble clic en start.bat o ejecutar:
start.bat
```

Esto inicia automáticamente:
1. **Backend** (FastAPI en `http://localhost:8000`)
2. **Frontend** (Vite en `http://localhost:5173`)
3. Abre el navegador en la aplicación

### Prerrequisitos
* **Node.js** (v18+)
* **Python** 3.10+
* **pip** con las dependencias del backend
* Cuenta gratuita en [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/) (CDSE) — *opcional, hay modo demo offline*

### Configuración Manual

#### 1. Backend
```bash
cd backend
python -m venv venv

# Activar entorno virtual
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Añade tus credenciales de CDSE en el archivo .env (opcional)

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

> **💡 Modo Demo:** Si no tienes credenciales de Copernicus, el sistema genera automáticamente datos satelitales demo realistas basados en las coordenadas que selecciones. Perfecto para probar todas las funciones.

---

## 🧬 Metodología Científica

Nuestros cálculos están respaldados por ciencia agronómica:

* **Índice NDVI:** Calculado usando las bandas Infrarroja Cercana (B08) y Roja (B04) de Sentinel-2 L2A. `NDVI = (B08 - B04) / (B08 + B04)`
* **Estimación de Humedad:** Utiliza retrodispersión de radar de apertura sintética (SAR) de Sentinel-1 GRD, capaz de medir humedad a través de las nubes.
* **Evapotranspiración (ET₀):** Calculada mediante el método modificado de Hargreaves, optimizado para regiones tropicales de LATAM.
* **Score de Resiliencia:** Modelo multiparamétrico ponderado: Salud del cultivo (40%), Estabilidad temporal (25%), Disponibilidad hídrica (20%), Resiliencia térmica (15%).

---

## 📂 Estructura del Proyecto

```
Sistema Esmeralda/
├── start.bat                 # Lanzador automático (Windows)
├── .env.example              # Variables de entorno de ejemplo
├── README.md                 # Este archivo
├── backend/
│   ├── main.py               # FastAPI — punto de entrada
│   ├── config.py             # Configuración y variables de entorno
│   ├── requirements.txt      # Dependencias Python
│   ├── routes/               # Endpoints API (parcela, agent, etc.)
│   ├── services/             # Lógica de negocio (Copernicus, clima)
│   ├── models/               # Modelos Pydantic
│   ├── agent/                # Motor del chatbot IA
│   ├── database/             # Capa de datos
│   └── utils/                # Utilidades
└── frontend/
    ├── index.html            # HTML principal
    ├── vite.config.js        # Configuración Vite
    ├── package.json          # Dependencias Node.js
    └── src/
        ├── App.jsx           # Router principal
        ├── main.jsx          # Punto de entrada React
        ├── store/
        │   └── appStore.js   # Estado global (Zustand)
        ├── styles/
        │   ├── globals.css   # Design system completo
        │   └── theme.js      # Tokens de tema
        ├── pages/
        │   ├── Dashboard.jsx       # Panel central
        │   ├── ParcelaView.jsx     # Visor satelital
        │   ├── FinancialPanel.jsx  # Finanzas predictivas
        │   ├── MercadoAgro.jsx     # Marketplace
        │   ├── RedAgricola.jsx     # Red comunitaria
        │   ├── Education.jsx       # E-Learning
        │   ├── Herramientas.jsx    # Calculadoras técnicas
        │   ├── Methodology.jsx     # Documentación científica
        │   └── Landing.jsx         # Página de bienvenida
        └── components/
            ├── ui/                 # Componentes UI reutilizables
            │   ├── Navbar.jsx      # Navegación (top + bottom nav)
            │   ├── ResilienceScore.jsx
            │   ├── CreditCard.jsx
            │   ├── AlertCard.jsx
            │   ├── WeatherStrip.jsx
            │   └── SatelliteCarousel.jsx
            ├── charts/             # Gráficos (NDVI, lluvia)
            ├── map/                # Componentes de mapa
            ├── three/              # Visualizaciones 3D
            └── agent/
                └── AgentChat.jsx   # Esmeralda Granjerita (chatbot IA)
```

---

## 🏆 Por qué Esmeralda gana el Reto 1

1. **Es Realista:** No requerimos hardware IoT costoso en la parcela. Solo conexión a internet y datos abiertos de Copernicus.
2. **Diseño Impecable:** Demostramos que las herramientas para pequeños agricultores no tienen que ser feas o anticuadas. Esmeralda compite en UI/UX con las mejores startups Fintech.
3. **Mobile-First:** Todo funciona en el celular del agricultor. La bottom nav, las tarjetas adaptativas y la IA están optimizadas para pantallas de 5 pulgadas.
4. **Resuelve el Problema Raíz:** El problema no es solo la sequía, es el **impacto económico** de la sequía. Al unir el monitoreo satelital con los microcréditos paramétricos, ofrecemos una red de seguridad real.
5. **Ecosistema Completo:** No es solo un visor — es un marketplace, una red comunitaria, un sistema de e-learning y una herramienta financiera. Todo conectado por datos satelitales.

---

*Hecho con 💚 para el campo latinoamericano.*
