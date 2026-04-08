import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function DashboardAdmin() {
  const [socios, setSocios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formDni, setFormDni] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formPlan, setFormPlan] = useState('mes')
  const [formTelefono, setFormTelefono] = useState('')
  const [formError, setFormError] = useState('')
  const [formExito, setFormExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('gymwall_usuario'))

  useEffect(() => { cargarSocios() }, [])

  async function cargarSocios() {
    try {
      const respuesta = await api.get('/socios')
      setSocios(respuesta.data.socios)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) cerrarSesion()
    } finally {
      setCargando(false)
    }
  }

  async function agregarSocio(e) {
    e.preventDefault()
    setFormError('')
    setFormExito('')
    setGuardando(true)
    try {
      const respuesta = await api.post('/auth/crear-socio', {
        dni: formDni, nombre: formNombre, plan: formPlan, telefono: formTelefono
      })
      setFormExito(respuesta.data.mensaje)
      setFormDni('')
      setFormNombre('')
      setFormPlan('mes')
      setFormTelefono('')
      cargarSocios()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear el socio')
    } finally {
      setGuardando(false)
    }
  }

  async function actualizarMembresia(id, plan) {
    const hoy = new Date()
    let vence = new Date()
    if (plan === 'dia') vence.setDate(hoy.getDate() + 1)
    else if (plan === 'quincena') vence.setDate(hoy.getDate() + 15)
    else if (plan === 'mes') vence.setMonth(hoy.getMonth() + 1)
    else if (plan === 'año') vence.setFullYear(hoy.getFullYear() + 1)
    try {
      await api.put(`/socios/${id}/membresia`, {
        estado: 'activa', vence: vence.toISOString().split('T')[0], plan
      })
      cargarSocios()
    } catch (err) { console.error('Error:', err) }
  }

  async function desactivarMembresia(id) {
    try {
      await api.put(`/socios/${id}/membresia`, { estado: 'inactiva', vence: null, plan: null })
      cargarSocios()
    } catch (err) { console.error('Error:', err) }
  }

  async function eliminarSocio(id, nombre) {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/socios/${id}`)
      cargarSocios()
    } catch (err) { console.error('Error:', err) }
  }

  function cerrarSesion() {
    localStorage.removeItem('gymwall_token')
    localStorage.removeItem('gymwall_usuario')
    navigate('/login')
  }

  const hoy = new Date()

  // Filtrado por búsqueda — busca por nombre o DNI
  const sociosFiltrados = socios.filter(s => {
  const nombre = (s.nombre || '').toLowerCase()
  const dni = (s.dni || '')
  const query = busqueda.toLowerCase()
  return nombre.includes(query) || dni.includes(query)
})

  const proximos = socios.filter(s => {
    if (!s.membresia_vence) return false
    const dias = Math.ceil((new Date(s.membresia_vence) - hoy) / (1000 * 60 * 60 * 24))
    return dias >= 0 && dias <= 5
  })

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">Gym</span><span className="logo-accent">Wall</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item activo">Socios</a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setMostrarFormulario(true) }}>
            + Agregar socio
          </a>
          <a href="/acceso" className="nav-item">Control de acceso</a>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-usuario">{usuario?.nombre}</p>
          <span className="badge-admin">Admin</span>
          <button onClick={cerrarSesion} className="btn-logout">Cerrar sesión</button>
        </div>
      </aside>

      <main className="contenido">
        <div className="topbar">
          <h1>Panel de administración</h1>
          <p>Gestioná los socios del gimnasio</p>
        </div>

        {proximos.length > 0 && (
          <div className="alerta-vencimiento">
            <span className="alerta-icono">⚠</span>
            <span>{proximos.length} socio{proximos.length > 1 ? 's' : ''} con membresía por vencer en los próximos 5 días</span>
          </div>
        )}

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-numero">{socios.length}</span>
            <span className="stat-label">Total socios</span>
          </div>
          <div className="stat-card">
            <span className="stat-numero">{socios.filter(s => s.membresia_estado === 'activa').length}</span>
            <span className="stat-label">Membresías activas</span>
          </div>
          <div className="stat-card">
            <span className="stat-numero">{proximos.length}</span>
            <span className="stat-label">Vencen pronto</span>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="formulario-card">
            <div className="formulario-header">
              <h3>Agregar nuevo socio</h3>
              <button onClick={() => { setMostrarFormulario(false); setFormError(''); setFormExito('') }} className="btn-cerrar">✕</button>
            </div>
            <form onSubmit={agregarSocio} className="formulario-grid">
              <div className="campo">
                <label>DNI</label>
                <input type="text" placeholder="12345678" value={formDni} maxLength={8}
                  onChange={(e) => setFormDni(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="campo">
                <label>Nombre completo</label>
                <input type="text" placeholder="Juan Pérez" value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)} />
              </div>
              <div className="campo">
                <label>Teléfono (opcional)</label>
                <input type="text" placeholder="11 1234 5678" value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)} />
              </div>
              <div className="campo">
                <label>Plan</label>
                <select value={formPlan} onChange={(e) => setFormPlan(e.target.value)} className="select-plan">
                  <option value="dia">Por día</option>
                  <option value="quincena">Quincena</option>
                  <option value="mes">Mes</option>
                  <option value="año">Año</option>
                </select>
              </div>
              {formError && <p className="error span-2">{formError}</p>}
              {formExito && <p className="exito span-2">{formExito}</p>}
              <button type="submit" className="btn-primary span-2" disabled={guardando}>
                {guardando ? <span className="spinner"></span> : 'Registrar socio'}
              </button>
            </form>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="busqueda-container">
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
          />
          {busqueda && (
            <span className="busqueda-resultado">
              {sociosFiltrados.length} resultado{sociosFiltrados.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {cargando ? (
          <p className="cargando">Cargando socios...</p>
        ) : (
          <div className="tabla-container">
            <table className="tabla">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Vencimiento</th>
                  <th>Renovar</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sociosFiltrados.map(socio => {
                  const dias = socio.membresia_vence
                    ? Math.ceil((new Date(socio.membresia_vence) - hoy) / (1000 * 60 * 60 * 24))
                    : null
                  const porVencer = dias !== null && dias >= 0 && dias <= 5
                  return (
                    <tr key={socio.id} className={porVencer ? 'fila-alerta' : ''}>
                      <td>{socio.dni}</td>
                      <td>{socio.nombre}</td>
                      <td>{socio.telefono || '—'}</td>
                      <td>{socio.plan || '—'}</td>
                      <td>
                        <span className={`badge ${socio.membresia_estado === 'activa' ? 'badge-activa' : 'badge-inactiva'}`}>
                          {socio.membresia_estado}
                        </span>
                        {porVencer && <span className="badge-alerta">Vence en {dias}d</span>}
                      </td>
                      <td>{socio.membresia_vence ? new Date(socio.membresia_vence).toLocaleDateString('es-AR') : '—'}</td>
                      <td>
                        <select className="select-renovar"
                          onChange={(e) => { if (e.target.value) actualizarMembresia(socio.id, e.target.value) }}
                          defaultValue="">
                          <option value="" disabled>Renovar...</option>
                          <option value="dia">1 día</option>
                          <option value="quincena">Quincena</option>
                          <option value="mes">Mes</option>
                          <option value="año">Año</option>
                        </select>
                      </td>
                      <td className="acciones">
                        <button onClick={() => desactivarMembresia(socio.id)} className="btn-desactivar">
                          Desactivar
                        </button>
                        <button onClick={() => eliminarSocio(socio.id, socio.nombre)} className="btn-eliminar">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {sociosFiltrados.length === 0 && (
              <p className="sin-datos">
                {busqueda ? `No se encontraron socios con "${busqueda}"` : 'No hay socios registrados aún.'}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardAdmin