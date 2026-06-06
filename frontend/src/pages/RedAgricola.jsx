import { useState, useEffect } from 'react'
import useAppStore from '../store/appStore'

const TAGS = ['Todos', 'Plaga', 'Clima', 'Consejo', 'Cosecha']
const TAG_COLORS = {
  Plaga: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
  Clima: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
  Consejo: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  Cosecha: { bg: '#d1fae5', text: '#065f46', border: '#34d399' }
}

export default function RedAgricola() {
  const isMobile = useAppStore((s) => s.isMobile)
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState('Todos')
  
  // Para registrar nuevo post
  const [showAddForm, setShowAddForm] = useState(false)
  const [formAuthor, setFormAuthor] = useState('')
  const [formRole, setFormRole] = useState('Agricultor')
  const [formLocation, setFormLocation] = useState('Chinandega Centro, Nicaragua')
  const [formTag, setFormTag] = useState('Plaga')
  const [formContent, setFormContent] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Para agregar comentario a un post
  const [commentInputs, setCommentInputs] = useState({}) // { post_id: 'text' }
  const [commentNames, setCommentNames] = useState({}) // { post_id: 'name' }

  // Obtener feed
  const fetchFeed = async (tag) => {
    setLoading(true)
    try {
      const url = tag && tag !== 'Todos'
        ? `http://${window.location.hostname}:8000/api/v1/social/feed?tag=${tag}`
        : `http://${window.location.hostname}:8000/api/v1/social/feed`
      const res = await fetch(url)
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      setFeed(data)
    } catch {
      // Fallback offline (Hackathon-ready)
      const mockFeed = [
        {
          id: 1,
          author: "Don Carlos Mendoza",
          role: "Agricultor",
          location: "Chinandega Centro",
          tag: "Plaga",
          content: "⚠️ ATENCIÓN VECINOS: He detectado los primeros brotes de pulgón verde en el sector noreste de mi parcela de maíz. El satélite ya marcaba estrés leve y hoy lo confirmé en campo. Recomiendo revisar sus hojas inferiores y aplicar el extracto orgánico de nim que nos enseñó el INTA.",
          likes: 12,
          liked_by: [],
          comments: [
            { author: "Ing. Ernesto Silva", role: "Agrónomo INTA", text: "Excelente reporte Carlos. La humedad alta de esta semana favorece al pulgón. Mañana haré una visita técnica en esa zona.", date: "2026-05-19" },
            { author: "María Gutiérrez", role: "Agricultora", text: "Gracias por el aviso Don Carlos, voy a inspeccionar mi frijolar de inmediato.", date: "2026-05-19" }
          ],
          date_posted: "2026-05-19T14:32:00"
        },
        {
          id: 2,
          author: "Ing. Ernesto Silva",
          role: "Agrónomo INTA",
          location: "Chinandega Regional",
          tag: "Consejo",
          content: "🌱 RECOMENDACIÓN DE SIEMBRA: Con el pronóstico de precipitaciones de 45mm para la próxima semana en el mapa de Esmeralda, las condiciones de humedad de suelo Sentinel-1 están en un punto óptimo del 42%. Es la ventana perfecta para la siembra de maíz.",
          likes: 24,
          liked_by: [],
          comments: [
            { author: "Juan Ramón Sevilla", role: "Agricultor", text: "Entendido Ingeniero, ya tenemos la semilla lista para aprovechar el agua.", date: "2026-05-20" }
          ],
          date_posted: "2026-05-20T08:15:00"
        },
        {
          id: 3,
          author: "Cooperativa San Juan",
          role: "Organización",
          location: "El Viejo, Chinandega",
          tag: "Clima",
          content: "🌧️ ALERTA CLIMÁTICA: El modelo de predicción climática de Sistema Esmeralda nos reporta anomalías térmicas mayores a 38°C con ráfagas de viento fuertes para el próximo viernes. Sugerimos revisar las mallas de sombra.",
          likes: 18,
          liked_by: [],
          comments: [],
          date_posted: "2026-05-20T10:45:00"
        }
      ]
      
      if (tag && tag !== 'Todos') {
        setFeed(mockFeed.filter(p => p.tag.toLowerCase() === tag.toLowerCase()))
      } else {
        setFeed(mockFeed)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed(selectedTag)
  }, [selectedTag])

  // Publicar post
  const handleSubmitPost = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!formAuthor || !formContent || !formLocation) {
      setFormError('Por favor completa todos los campos.')
      return
    }

    const payload = {
      author: formAuthor,
      role: formRole,
      location: formLocation,
      tag: formTag,
      content: formContent
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/social/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('API Error')
      
      setFormSuccess('¡Publicación enviada con éxito!')
      setFormContent('')
      setFormAuthor('')
      
      setTimeout(() => {
        fetchFeed(selectedTag)
        setShowAddForm(false)
        setFormSuccess('')
      }, 1500)
    } catch {
      // Fallback offline
      const localNew = {
        id: Date.now(),
        ...payload,
        likes: 0,
        liked_by: [],
        comments: [],
        date_posted: new Date().toISOString()
      }
      setFeed([localNew, ...feed])
      setFormSuccess('¡Publicación enviada! (Modo Offline)')
      setFormContent('')
      setFormAuthor('')
      
      setTimeout(() => {
        setShowAddForm(false)
        setFormSuccess('')
      }, 1500)
    }
  }

  // Dar like
  const handleLike = async (postId) => {
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/social/posts/${postId}/like?user_name=ProductorEsmeralda`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      
      setFeed(feed.map(p => {
        if (p.id === postId) {
          return { ...p, likes: data.likes }
        }
        return p
      }))
    } catch {
      // Fallback offline
      setFeed(feed.map(p => {
        if (p.id === postId) {
          const liked = p.liked_by.includes('ProductorEsmeralda')
          const liked_by = liked 
            ? p.liked_by.filter(u => u !== 'ProductorEsmeralda') 
            : [...p.liked_by, 'ProductorEsmeralda']
          const likes = liked ? p.likes - 1 : p.likes + 1
          return { ...p, likes, liked_by }
        }
        return p
      }))
    }
  }

  // Comentar
  const handleComment = async (e, postId) => {
    e.preventDefault()
    const text = commentInputs[postId]
    const author = commentNames[postId] || 'Vecino Anónimo'
    
    if (!text) return

    const payload = {
      author,
      role: 'Agricultor',
      text
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/v1/social/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      
      setFeed(feed.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, data.comment] }
        }
        return p
      }))
      
      setCommentInputs({ ...commentInputs, [postId]: '' })
    } catch {
      // Fallback offline
      const newComment = {
        author,
        role: 'Agricultor',
        text,
        date: new Date().toISOString().slice(0, 10)
      }
      setFeed(feed.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] }
        }
        return p
      }))
      setCommentInputs({ ...commentInputs, [postId]: '' })
    }
  }

  return (
    <div className="page" style={{ maxWidth: '800px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '1.8rem', fontWeight: 800 }}>🤝 Red Comunitaria del Campo</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Alertas tempranas de plagas en Chinandega, reportes climáticos y consejos prácticos compartidos por agricultores.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '❌ Cancelar' : '📢 Publicar Mensaje'}
        </button>
      </div>

      {/* Formulario de Publicación */}
      {showAddForm && (
        <div className="card animate-in mb-2" style={{ border: '2px solid var(--emerald-400)', padding: '20px' }}>
          <h3 style={{ marginBottom: '14px', color: 'var(--emerald-950)' }}>📢 Escribir una Publicación Comunitaria</h3>
          <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Tu Nombre *</label>
                <input type="text" className="input" placeholder="Ej: Don Carlos Mendoza" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Rol en el Campo</label>
                <select className="input" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="Agricultor">🧑‍🌾 Agricultor / Productor</option>
                  <option value="Agrónomo">🧑‍🔬 Agrónomo / Extensionista</option>
                  <option value="Organización">🏢 Cooperativa / Organización</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Tipo de Alerta *</label>
                <select className="input" value={formTag} onChange={(e) => setFormTag(e.target.value)}>
                  <option value="Plaga">🐛 Alerta de Plaga</option>
                  <option value="Clima">🌧️ Reporte Climático</option>
                  <option value="Consejo">🌱 Consejo Agronómico</option>
                  <option value="Cosecha">🎉 Reporte de Cosecha</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Ubicación en Chinandega *</label>
              <input type="text" className="input" placeholder="Ej: El Viejo, Chinandega" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Contenido de tu Mensaje *</label>
              <textarea className="input" style={{ minHeight: '90px', resize: 'vertical' }} placeholder="Escribe aquí tu mensaje de forma clara para que los demás agricultores puedan tomar acción..." value={formContent} onChange={(e) => setFormContent(e.target.value)} required />
            </div>

            {formError && <p style={{ color: 'var(--red)', fontSize: '0.78rem', fontWeight: 700 }}>⚠️ {formError}</p>}
            {formSuccess && <p style={{ color: 'var(--emerald-700)', fontSize: '0.78rem', fontWeight: 700 }}>✅ {formSuccess}</p>}

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start', minWidth: '150px' }}>
              📢 Enviar Publicación
            </button>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }} className="scroll-x">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            style={{
              padding: '8px 16px',
              background: selectedTag === tag ? 'var(--emerald-600)' : '#ffffff',
              color: selectedTag === tag ? '#ffffff' : 'var(--text-secondary)',
              border: selectedTag === tag ? '1.5px solid var(--emerald-600)' : '1.5px solid var(--border-light)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tag === 'Todos' ? '🌐 Ver Todos' : tag === 'Plaga' ? '🐛 Plagas' : tag === 'Clima' ? '🌧️ Clima' : tag === 'Consejo' ? '🌱 Consejos' : '🎉 Cosecha'}
          </button>
        ))}
      </div>

      {/* Feed de Publicaciones */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--emerald-500)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '0.85rem' }}>Cargando tablón comunitario...</p>
        </div>
      ) : feed.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay avisos registrados bajo esta etiqueta actualmente.</p>
        </div>
      ) : (
        <div className="social-feed">
          {feed.map(post => {
            const colors = TAG_COLORS[post.tag] || { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)', border: 'var(--border-light)' }
            const userLiked = post.liked_by?.includes('ProductorEsmeralda')
            
            return (
              <div key={post.id} className="post-card animate-in" style={{ borderLeft: `5px solid ${post.tag === 'Plaga' ? 'var(--red)' : post.tag === 'Clima' ? 'var(--blue)' : 'var(--emerald-500)'}` }}>
                {/* Header */}
                <div className="post-header">
                  <div className="post-avatar">
                    {post.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="post-meta">
                    <span className="post-author">{post.author}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      📍 {post.location} · <span style={{ fontWeight: 600, color: 'var(--emerald-700)' }}>{post.role}</span>
                    </span>
                  </div>
                  <span className="badge post-tag" style={{ background: colors.bg, color: colors.text, border: `1.5px solid ${colors.border}`, fontSize: '0.6rem' }}>
                    {post.tag}
                  </span>
                </div>

                {/* Content */}
                <p className="post-content">{post.content}</p>

                {/* Actions */}
                <div className="post-actions">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`post-action-btn ${userLiked ? 'active' : ''}`}
                    style={{ color: userLiked ? 'var(--emerald-600)' : 'var(--text-muted)' }}
                  >
                    ❤️ {post.likes} Likes
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                    💬 {post.comments.length} Comentarios
                  </span>
                </div>

                {/* Comments Section */}
                <div className="post-comments">
                  {post.comments.map((comment, cidx) => (
                    <div key={cidx} className="comment-item" style={{ borderBottom: cidx < post.comments.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', paddingBottom: '6px', paddingTop: '4px' }}>
                      <span className="comment-author">{comment.author}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.5rem', padding: '1px 5px', marginLeft: '6px' }}>{comment.role}</span>
                      <p style={{ marginTop: '2px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{comment.text}</p>
                    </div>
                  ))}

                  {/* Add Comment Form */}
                  <form onSubmit={(e) => handleComment(e, post.id)} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input 
                      type="text" 
                      className="input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1, minHeight: '32px' }} 
                      placeholder="Escribe un comentario..." 
                      value={commentInputs[post.id] || ''} 
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      required
                    />
                    <input 
                      type="text" 
                      className="input" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem', width: '120px', minHeight: '32px' }} 
                      placeholder="Tu nombre" 
                      value={commentNames[post.id] || ''} 
                      onChange={(e) => setCommentNames({ ...commentNames, [post.id]: e.target.value })}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ minHeight: '32px', padding: '0 12px', fontSize: '0.7rem' }}>
                      Comentar
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
