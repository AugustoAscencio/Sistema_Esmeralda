/**
 * ParcelaMap — MapLibre GL with WORKING bbox drawing
 * Key fix: disables dragPan during drawing, uses refs for state in closures
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function ParcelaMap({ onBboxSelected, bbox: existingBbox }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [mode, setMode] = useState('navigate') // navigate | firstClick | secondClick
  const modeRef = useRef('navigate')
  const firstPointRef = useRef(null)
  const markersRef = useRef([])
  const [hasOverlay, setHasOverlay] = useState(false)
  const [viewMode, setViewMode] = useState('ndvi')
  const bboxRef = useRef(null)

  // Sync refs
  useEffect(() => { modeRef.current = mode }, [mode])

  useEffect(() => {
    if (mapRef.current) return
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OpenStreetMap' } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-87.16, 12.66],
      zoom: 13,
    })
    m.addControl(new maplibregl.NavigationControl(), 'top-left')
    mapRef.current = m

    m.on('click', (e) => {
      const currentMode = modeRef.current
      if (currentMode === 'navigate') return

      const { lng, lat } = e.lngLat

      if (currentMode === 'firstClick') {
        firstPointRef.current = [lng, lat]
        // Add marker
        const el = document.createElement('div')
        el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 0 8px rgba(16,185,129,0.5);'
        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m)
        markersRef.current.push(marker)
        modeRef.current = 'secondClick'
        setMode('secondClick')
      } else if (currentMode === 'secondClick') {
        const sp = firstPointRef.current
        if (!sp) return
        const bbox = [Math.min(sp[0], lng), Math.min(sp[1], lat), Math.max(sp[0], lng), Math.max(sp[1], lat)]

        // Add second marker
        const el = document.createElement('div')
        el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #fff;box-shadow:0 0 8px rgba(16,185,129,0.5);'
        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m)
        markersRef.current.push(marker)

        // Reset mode
        modeRef.current = 'navigate'
        setMode('navigate')
        firstPointRef.current = null
        bboxRef.current = bbox
        m.dragPan.enable()
        m.getCanvas().style.cursor = ''

        drawRect(m, bbox)
        loadOverlay(m, bbox, 'ndvi')
        if (onBboxSelected) onBboxSelected(bbox)
      }
    })

    // Show existing bbox if provided
    if (existingBbox) {
      m.on('load', () => {
        drawRect(m, existingBbox)
        bboxRef.current = existingBbox
      })
    }

    return () => { m.remove(); mapRef.current = null }
  }, [])

  const drawRect = (m, b) => {
    if (m.getSource('bbox-src')) { m.removeLayer('bbox-fill'); m.removeLayer('bbox-line'); m.removeSource('bbox-src') }
    m.addSource('bbox-src', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]],[b[0],b[1]]]] } },
    })
    m.addLayer({ id: 'bbox-fill', type: 'fill', source: 'bbox-src', paint: { 'fill-color': '#10b981', 'fill-opacity': 0.08 } })
    m.addLayer({ id: 'bbox-line', type: 'line', source: 'bbox-src', paint: { 'line-color': '#059669', 'line-width': 2.5, 'line-dasharray': [4, 2] } })
    m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 80, duration: 800 })
  }

  const loadOverlay = async (m, b, type) => {
    try {
      const endpoint = type === 'ndvi' ? 'ndvi-image' : 'true-color'
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/parcela/${endpoint}?bbox=${b.join(',')}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (m.getSource('sat-overlay')) { m.removeLayer('sat-layer'); m.removeSource('sat-overlay') }
      m.addSource('sat-overlay', { type: 'image', url, coordinates: [[b[0],b[3]],[b[2],b[3]],[b[2],b[1]],[b[0],b[1]]] })
      m.addLayer({ id: 'sat-layer', type: 'raster', source: 'sat-overlay', paint: { 'raster-opacity': 0.7 } }, 'bbox-fill')
      setHasOverlay(true)
    } catch {}
  }

  const startDrawing = useCallback(() => {
    const m = mapRef.current
    if (!m) return
    // Clear old markers and layers
    markersRef.current.forEach((mk) => mk.remove())
    markersRef.current = []
    if (m.getSource('bbox-src')) { m.removeLayer('bbox-fill'); m.removeLayer('bbox-line'); m.removeSource('bbox-src') }
    if (m.getSource('sat-overlay')) { m.removeLayer('sat-layer'); m.removeSource('sat-overlay') }

    firstPointRef.current = null
    bboxRef.current = null
    setHasOverlay(false)

    // CRITICAL: disable drag so clicks register as clicks, not pans
    m.dragPan.disable()
    m.getCanvas().style.cursor = 'crosshair'
    modeRef.current = 'firstClick'
    setMode('firstClick')
  }, [])

  const cancelDrawing = useCallback(() => {
    const m = mapRef.current
    if (!m) return
    m.dragPan.enable()
    m.getCanvas().style.cursor = ''
    modeRef.current = 'navigate'
    setMode('navigate')
    firstPointRef.current = null
    markersRef.current.forEach((mk) => mk.remove())
    markersRef.current = []
  }, [])

  const toggleOverlay = () => {
    const next = viewMode === 'ndvi' ? 'truecolor' : 'ndvi'
    setViewMode(next)
    if (bboxRef.current && mapRef.current) loadOverlay(mapRef.current, bboxRef.current, next)
  }

  const btnBase = {
    padding: '8px 16px', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600,
    borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'all 0.15s', border: 'none',
    boxShadow: 'var(--shadow-sm)',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--r-lg)' }} />

      {/* Controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
        {mode === 'navigate' ? (
          <button onClick={startDrawing} style={{ ...btnBase, background: '#fff', color: 'var(--emerald-600)', border: '1.5px solid var(--emerald-500)' }}>
            Seleccionar parcela
          </button>
        ) : (
          <button onClick={cancelDrawing} style={{ ...btnBase, background: 'var(--red)', color: '#fff' }}>
            Cancelar
          </button>
        )}
        {hasOverlay && (
          <button onClick={toggleOverlay} style={{ ...btnBase, background: '#fff', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
            {viewMode === 'ndvi' ? 'Ver Color Real' : 'Ver NDVI'}
          </button>
        )}
      </div>

      {/* Status indicator */}
      {mode !== 'navigate' && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 24px', background: '#fff', border: '1.5px solid var(--emerald-200)',
          borderRadius: 'var(--r-full)', boxShadow: 'var(--shadow-md)',
          fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600,
          color: 'var(--emerald-700)', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          {mode === 'firstClick' ? 'Haz clic en una esquina de tu parcela' : 'Haz clic en la esquina opuesta'}
        </div>
      )}
    </div>
  )
}
