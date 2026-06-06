import { useState, useEffect } from 'react'
import useAppStore from '../store/appStore'

const CATEGORIES = ['Todos', 'Granos', 'Hortalizas', 'Frutas', 'Café', 'Otros']

export default function MercadoAgro() {
  const isMobile = useAppStore((s) => s.isMobile)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  
  // Para registrar nuevo producto
  const [showAddForm, setShowAddForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('Granos')
  const [formPrice, setFormPrice] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formLocation, setFormLocation] = useState('Chinandega, Nicaragua')
  const [formDescription, setFormDescription] = useState('')
  const [formFarmer, setFormFarmer] = useState('Cooperativa Chinandega')
  const [formWhatsapp, setFormWhatsapp] = useState('505')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Para el análisis de precios
  const [priceCrop, setPriceCrop] = useState('maiz')
  const [priceData, setPriceData] = useState(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  // Obtener productos
  const fetchProducts = async (cat) => {
    setLoading(true)
    try {
      const url = cat && cat !== 'Todos' 
        ? `http://${window.location.hostname}:8000/api/v1/marketplace/products?category=${cat}`
        : `http://${window.location.hostname}:8000/api/v1/marketplace/products`
      const res = await fetch(url)
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      setProducts(data)
    } catch {
      // Fallback offline (Hackathon-ready)
      const mockData = [
        {
          id: 1,
          title: "Maíz Amarillo Calidad Premium",
          category: "Granos",
          farmer_name: "Carlos Mendoza (Don Carlos)",
          location: "Chinandega, Nicaragua",
          price_usd_kg: 0.26,
          quantity_kg: 1500,
          description: "Cosecha fresca secada al sol de forma natural. Grano entero, libre de plagas. Ideal para molienda.",
          whatsapp_contact: "50588881234",
          image_url: "/maize_harvest.png"
        },
        {
          id: 2,
          title: "Frijol Rojo de Seda Seleccionado",
          category: "Granos",
          farmer_name: "María Gutiérrez",
          location: "Somotillo, Chinandega",
          price_usd_kg: 1.15,
          quantity_kg: 800,
          description: "Frijol rojo de seda tradicional, alta facilidad de cocción. Empacado en sacos de 100 libras.",
          whatsapp_contact: "50588885678",
          image_url: "/red_beans.png"
        },
        {
          id: 3,
          title: "Tomates Saladette Orgánicos",
          category: "Hortalizas",
          farmer_name: "Cooperativa San Juan",
          location: "El Viejo, Chinandega",
          price_usd_kg: 0.48,
          quantity_kg: 2500,
          description: "Tomates cultivados bajo invernadero, regados con agua limpia. Alta consistencia.",
          whatsapp_contact: "50588889012",
          image_url: "/greenhouse_tomatoes.png"
        },
        {
          id: 4,
          title: "Plátano Pelipita Verde Grande",
          category: "Frutas",
          farmer_name: "Juan Ramón Sevilla",
          location: "Posoltega, Nicaragua",
          price_usd_kg: 0.22,
          quantity_kg: 4000,
          description: "Excelente tamaño y vigor. Cosechados en su punto para transporte a larga distancia.",
          whatsapp_contact: "50588883456",
          image_url: "https://images.unsplash.com/photo-1566393028639-d108a42c46a7?auto=format&fit=crop&q=80&w=400"
        }
      ]
      
      if (cat && cat !== 'Todos') {
        setProducts(mockData.filter(p => p.category.toLowerCase() === cat.toLowerCase()))
      } else {
        setProducts(mockData)
      }
    } finally {
      setLoading(false)
    }
  }

  // Obtener análisis de precios
  const fetchPriceAnalysis = async (crop) => {
    setLoadingPrice(true)
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/marketplace/prices?crop=${crop}`)
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      setPriceData(data)
    } catch {
      // Fallback offline (Hackathon-ready)
      const offlinePrices = {
        maiz: { g: 0.22, c: 0.26, i: 0.16, text: "el maíz" },
        frijol: { g: 1.10, c: 1.25, i: 0.80, text: "el frijol rojo" },
        arroz: { g: 0.35, c: 0.40, i: 0.25, text: "el arroz" },
        tomate: { g: 0.45, c: 0.55, i: 0.30, text: "el tomate" },
        cafe: { g: 2.80, c: 3.20, i: 1.90, text: "el café" },
        yuca: { g: 0.15, c: 0.18, i: 0.09, text: "la yuca" },
        platano: { g: 0.20, c: 0.24, i: 0.13, text: "el plátano" },
        aguacate: { g: 1.50, c: 1.70, i: 1.00, text: "el aguacate" },
        chile: { g: 1.20, c: 1.40, i: 0.75, text: "el chile" }
      }
      
      const prices = offlinePrices[crop] || offlinePrices.maiz
      const coopPremium = round(((prices.c - prices.g) / prices.g) * 100, 1)
      const interLoss = round(((prices.g - prices.i) / prices.g) * 100, 1)
      
      function round(val, dec) { return Number(Math.round(val+'e'+dec)+'e-'+dec); }

      setPriceData({
        crop: crop,
        prices: {
          global_reference_fao_usd_kg: prices.g,
          fair_trade_coop_usd_kg: prices.c,
          local_intermediary_usd_kg: prices.i,
        },
        analysis: {
          coop_premium_pct: coopPremium,
          intermediary_discount_pct: interLoss,
          advice: `Vender a través de la Cooperativa te otorga un premio del ${coopPremium}% sobre el precio internacional de referencia. Evita vender a intermediarios rápidos ya que representa una pérdida del ${interLoss}% de tu valor. ¡Usa tu Score de Resiliencia para negociar mejor!`
        }
      })
    } finally {
      setLoadingPrice(false)
    }
  }

  useEffect(() => {
    fetchProducts(selectedCategory)
  }, [selectedCategory])

  useEffect(() => {
    fetchPriceAnalysis(priceCrop)
  }, [priceCrop])

  // Crear producto
  const handleSubmitProduct = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!formTitle || !formPrice || !formQuantity || !formDescription || !formWhatsapp) {
      setFormError('Por favor completa todos los campos obligatorios.')
      return
    }

    const payload = {
      title: formTitle,
      category: formCategory,
      farmer_name: formFarmer,
      location: formLocation,
      price_usd_kg: parseFloat(formPrice),
      quantity_kg: parseInt(formQuantity),
      description: formDescription,
      whatsapp_contact: formWhatsapp.replace(' ', '').replace('+', '')
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/marketplace/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      
      setFormSuccess('¡Tu cosecha ha sido publicada con éxito!')
      // Limpiar campos
      setFormTitle('')
      setFormPrice('')
      setFormQuantity('')
      setFormDescription('')
      
      // Recargar lista
      setTimeout(() => {
        fetchProducts(selectedCategory)
        setShowAddForm(false)
        setFormSuccess('')
      }, 1500)
    } catch {
      // Offline fallback: agregar localmente a la lista actual
      const localNew = {
        id: Date.now(),
        ...payload,
        image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400"
      }
      setProducts([localNew, ...products])
      setFormSuccess('¡Tu cosecha ha sido publicada con éxito! (Modo Offline)')
      
      setFormTitle('')
      setFormPrice('')
      setFormQuantity('')
      setFormDescription('')
      
      setTimeout(() => {
        setShowAddForm(false)
        setFormSuccess('')
      }, 1500)
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '1.8rem', fontWeight: 800 }}>Mercado Agroecológico</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Venta directa sin intermediarios. Negociación justa basada en tus métricas de resiliencia satelital.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '❌ Cancelar' : '🚜 Publicar mi Cosecha'}
        </button>
      </div>

      {/* Grid General */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Columna Central: Productos o Formulario */}
        <div>
          {showAddForm ? (
            <div className="card animate-in" style={{ padding: '24px', border: '2px solid var(--emerald-400)' }}>
              <h3 style={{ marginBottom: '18px', color: 'var(--emerald-900)' }}>🌾 Registrar Oferta de Cosecha</h3>
              <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Título de la Oferta *</label>
                    <input type="text" className="input" placeholder="Ej: Maíz Blanco Secado al Sol" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Categoría *</label>
                    <select className="input" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                      {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Cantidad Disponible (kg) *</label>
                    <input type="number" className="input" placeholder="Ej: 2000" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Precio Esperado (USD/kg) *</label>
                    <input type="number" step="0.01" className="input" placeholder="Ej: 0.25" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>WhatsApp (con código de país) *</label>
                    <input type="text" className="input" placeholder="Ej: 50588881234" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Productor o Cooperativa *</label>
                    <input type="text" className="input" value={formFarmer} onChange={(e) => setFormFarmer(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Ubicación Física *</label>
                    <input type="text" className="input" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>Descripción de la Cosecha *</label>
                  <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Detalla la calidad, variedad, tipo de secado o empaque..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} required />
                </div>

                {formError && <p style={{ color: 'var(--red)', fontSize: '0.8rem', fontWeight: 700 }}>⚠️ {formError}</p>}
                {formSuccess && <p style={{ color: 'var(--emerald-700)', fontSize: '0.8rem', fontWeight: 700 }}>✅ {formSuccess}</p>}

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start', minWidth: '160px', marginTop: '8px' }}>
                  🚜 Publicar Oferta
                </button>
              </form>
            </div>
          ) : (
            <div>
              {/* Filtros de Categoría */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }} className="scroll-x">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      background: selectedCategory === cat ? 'var(--emerald-600)' : '#ffffff',
                      color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                      border: selectedCategory === cat ? '1.5px solid var(--emerald-600)' : '1.5px solid var(--border-light)',
                      borderRadius: 'var(--r-md)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Productos */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--emerald-500)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Cargando ofertas del mercado...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="card text-center" style={{ padding: '40px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay cosechas publicadas en esta categoría actualmente.</p>
                </div>
              ) : (
                <div className="market-grid">
                  {products.map(p => (
                    <div key={p.id} className="product-card">
                      <div className="product-image-container">
                        <span className="badge badge-ok product-badge">{p.category}</span>
                        <img src={p.image_url} alt={p.title} className="product-image" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400' }} />
                        <span className="product-price">${p.price_usd_kg.toFixed(2)} / kg</span>
                      </div>
                      <div className="product-info">
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>{p.title}</h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '12px', flex: 1 }}>{p.description}</p>
                        
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--r-sm)', padding: '8px', marginBottom: '14px', fontSize: '0.72rem', border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Productor:</span>
                            <span style={{ fontWeight: 700, color: 'var(--emerald-900)' }}>{p.farmer_name}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Lote total:</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.quantity_kg.toLocaleString()} kg</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Ubicación:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>📍 {p.location}</span>
                          </div>
                        </div>

                        <a
                          href={`https://wa.me/${p.whatsapp_contact}?text=Hola%20${encodeURIComponent(p.farmer_name)},%20estoy%20interesado%20en%20tu%20oferta%20de%20${encodeURIComponent(p.title)}%20en%20Sistema%20Esmeralda.`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{ width: '100%', fontSize: '0.78rem', background: '#25D366', boxShadow: 'none' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.006 5.284 5.296.001 11.82.001c3.162.001 6.132 1.233 8.363 3.466 2.231 2.232 3.459 5.201 3.457 8.363-.005 6.537-5.295 11.82-11.82 11.82-1.997 0-3.954-.505-5.69-1.467L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.793 1.457 5.48.004 9.93-4.444 9.934-9.923.002-2.654-1.03-5.15-2.903-7.025-1.874-1.874-4.37-2.902-7.027-2.902-5.485 0-9.938 4.446-9.941 9.926-.002 1.79.48 3.537 1.396 5.1L1.442 21.08l4.205-1.103z"/>
                          </svg>
                          Contactar Productor
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Comparador Analítico de Precios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-emerald" style={{ padding: '20px', border: '2px solid var(--emerald-400)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--emerald-950)' }}>Analizador de Precios</h3>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Compara cotizaciones globales vs locales para que no vendas con pérdidas a intermediarios.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px' }}>Selecciona tu Cultivo</label>
              <select className="input" value={priceCrop} onChange={(e) => setPriceCrop(e.target.value)} style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
                <option value="maiz">🌽 Maíz</option>
                <option value="frijol">🫘 Frijol Rojo</option>
                <option value="arroz">🌾 Arroz</option>
                <option value="tomate">🍅 Tomate</option>
                <option value="cafe">☕ Café</option>
                <option value="yuca">🥔 Yuca</option>
                <option value="platano">🍌 Plátano</option>
                <option value="aguacate">🥑 Aguacate</option>
                <option value="chile">🌶️ Chile</option>
              </select>
            </div>

            {loadingPrice ? (
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--emerald-500)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : priceData && (
              <div className="animate-in">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  
                  {/* Global FAO */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mundial (Referencia FAO)</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>${priceData.prices.global_reference_fao_usd_kg.toFixed(2)} / kg</span>
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.55rem' }}>Referencia</span>
                  </div>

                  {/* Coop Fair Price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '2px solid var(--emerald-400)', borderRadius: 'var(--r-sm)', padding: '10px', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--emerald-800)', fontWeight: 700 }}>Comercio Justo Cooperativa</span>
                      <span style={{ fontWeight: 800, color: 'var(--emerald-700)', fontSize: '0.95rem' }}>${priceData.prices.fair_trade_coop_usd_kg.toFixed(2)} / kg</span>
                    </div>
                    <span className="badge badge-ok" style={{ fontSize: '0.55rem', background: 'var(--emerald-100)', color: 'var(--emerald-800)' }}>+{priceData.analysis.coop_premium_pct}% 🔥</span>
                  </div>

                  {/* Intermediary Exploitative Price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #f87171', borderRadius: 'var(--r-sm)', padding: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 600 }}>Acopiador Local Rápido</span>
                      <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: '0.85rem' }}>${priceData.prices.local_intermediary_usd_kg.toFixed(2)} / kg</span>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.55rem', background: '#fee2e2', color: '#991b1b' }}>-{priceData.analysis.intermediary_discount_pct}%</span>
                  </div>

                </div>

                <div style={{ background: '#ffffff', borderRadius: 'var(--r-md)', padding: '12px', border: '1px solid var(--border-light)', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>💡 Recomendación Técnica:</strong><br />
                  <p style={{ marginTop: '4px' }}>{priceData.analysis.advice}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '16px', background: 'var(--bg-card)' }}>
            <h4 style={{ fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-primary)' }}>🚜 ¿Por qué usar Sistema Esmeralda?</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              En 2021, los acopiadores compraron el maíz a Don Carlos a solo $0.14/kg debido a que no tenía información. Con Esmeralda, puedes justificar la salud óptima de tu cultivo avalada por Sentinel-2 para defender un precio justo.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
