import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function DashboardAdmin() {
  const [socios, setSocios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [pestana, setPestana] = useState('socios')
  const [historial, setHistorial] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [socioDetalle, setSocioDetalle] = useState(null)
  const [asistencias, setAsistencias] = useState([])
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

  async function cargarHistorial() {
    setCargandoHistorial(true)
    try {
      const respuesta = await api.get('/acceso/historial')
      setHistorial(respuesta.data.accesos)
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setCargandoHistorial(false)
    }
  }

  async function verAsistencias(socio) {
    setSocioDetalle(socio)
    try {
      const respuesta = await api.get(`/socios/${socio.id}/asistencias`)
      setAsistencias(respuesta.data.asistencias)
    } catch (err) {
      console.error('Error cargando asistencias:', err)
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

  async function subirFoto(id, archivo) {
    if (!archivo) return
    const formData = new FormData()
    formData.append('foto', archivo)
    try {
      await api.post(`/socios/${id}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      cargarSocios()
    } catch (err) { console.error('Error subiendo foto:', err) }
  }

  function cerrarSesion() {
    localStorage.removeItem('gymwall_token')
    localStorage.removeItem('gymwall_usuario')
    navigate('/login')
  }

  function cambiarPestana(nueva) {
    setPestana(nueva)
    setSocioDetalle(null)
    if (nueva === 'historial') cargarHistorial()
  }

  const hoy = new Date()

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

  const vencidos = socios.filter(s => {
    if (!s.membresia_vence) return false
    return new Date(s.membresia_vence) < hoy
  })

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">Gym</span><span className="logo-accent">Wall</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${pestana === 'socios' ? 'activo' : ''}`}
            onClick={(e) => { e.preventDefault(); cambiarPestana('socios') }}>
            Socios
          </a>
          <a href="#" className={`nav-item ${pestana === 'vencidos' ? 'activo' : ''}`}
            onClick={(e) => { e.preventDefault(); cambiarPestana('vencidos') }}>
            Cuotas vencidas
            {vencidos.length > 0 && <span className="badge-contador">{vencidos.length}</span>}
          </a>
          <a href="#" className={`nav-item ${pestana === 'historial' ? 'activo' : ''}`}
            onClick={(e) => { e.preventDefault(); cambiarPestana('historial') }}>
            Historial de accesos
          </a>
          <a href="#" className="nav-item"
            onClick={(e) => { e.preventDefault(); setMostrarFormulario(true); cambiarPestana('socios') }}>
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

        {/* PESTAÑA SOCIOS */}
        {pestana === 'socios' && (
          <>
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
                <span className="stat-numero">{socios.filter(s => s.membresia_estado === 'activa' && new Date(s.membresia_vence) >= hoy).length}</span>
                <span className="stat-label">Membresías activas</span>
              </div>
              <div className="stat-card">
                <span className="stat-numero">{vencidos.length}</span>
                <span className="stat-label">Cuotas vencidas</span>
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

            {cargando ? <p className="cargando">Cargando socios...</p> : (
              <div className="tabla-container">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>DNI</th>
                      <th>Nombre</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <th>Vencimiento</th>
                      <th>Asistencias</th>
                      <th>Última visita</th>
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
                      const vencida = dias !== null && dias < 0
                      return (
                        <tr key={socio.id} className={porVencer ? 'fila-alerta' : vencida ? 'fila-vencida' : ''}>
                          <td>
                            <div className="celda-foto">
                              {socio.foto_url
                                ? <img src={socio.foto_url} alt={socio.nombre} className="foto-miniatura" />
                                : <div className="avatar-mini">{(socio.nombre || '?').charAt(0).toUpperCase()}</div>
                              }
                              <label className="btn-foto" title="Subir foto">
                                📷
                                <input type="file" accept="image/*" style={{ display: 'none' }}
                                  onChange={(e) => subirFoto(socio.id, e.target.files[0])} />
                              </label>
                            </div>
                          </td>
                          <td>{socio.dni}</td>
                          <td>{socio.nombre}</td>
                          <td>{socio.plan || '—'}</td>
                          <td>
                            <span className={`badge ${!vencida && socio.membresia_estado === 'activa' ? 'badge-activa' : 'badge-inactiva'}`}>
                              {vencida ? 'vencida' : socio.membresia_estado}
                            </span>
                            {porVencer && <span className="badge-alerta">Vence en {dias}d</span>}
                            {vencida && <span className="badge-vencida">Hace {Math.abs(dias)}d</span>}
                          </td>
                          <td>{socio.membresia_vence ? new Date(socio.membresia_vence).toLocaleDateString('es-AR') : '—'}</td>
                          <td>
                            <button onClick={() => verAsistencias(socio)} className="btn-asistencias">
                              {socio.total_asistencias || 0} veces
                            </button>
                          </td>
                          <td>{socio.ultima_asistencia ? new Date(socio.ultima_asistencia).toLocaleDateString('es-AR') : '—'}</td>
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
                            <button onClick={() => desactivarMembresia(socio.id)} className="btn-desactivar">Desactivar</button>
                            <button onClick={() => eliminarSocio(socio.id, socio.nombre)} className="btn-eliminar">Eliminar</button>
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

            {/* Modal de asistencias */}
            {socioDetalle && (
              <div className="modal-overlay" onClick={() => setSocioDetalle(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div className="modal-titulo">
                      {socioDetalle.foto_url
                        ? <img src={socioDetalle.foto_url} alt="" className="modal-foto" />
                        : <div className="avatar-mini grande">{(socioDetalle.nombre || '?').charAt(0).toUpperCase()}</div>
                      }
                      <div>
                        <h3>{socioDetalle.nombre}</h3>
                        <p>DNI: {socioDetalle.dni} — {socioDetalle.total_asistencias || 0} asistencias totales</p>
                      </div>
                    </div>
                    <button onClick={() => setSocioDetalle(null)} className="btn-cerrar">✕</button>
                  </div>
                  <div className="modal-body">
                    {asistencias.length === 0
                      ? <p className="sin-datos">Sin registros de asistencia aún.</p>
                      : asistencias.map((a, i) => (
                        <div key={i} className="asistencia-fila">
                          <span className="asistencia-fecha">
                            {new Date(a.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className="asistencia-hora">
                            {new Date(a.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* PESTAÑA CUOTAS VENCIDAS */}
        {pestana === 'vencidos' && (
          <>
            <div className="topbar">
              <h1>Cuotas vencidas</h1>
              <p>Socios con membresía vencida que pueden querer renovar</p>
            </div>
            <div className="tabla-container">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>DNI</th>
                    <th>Nombre</th>
                    <th>Venció el</th>
                    <th>Hace cuánto</th>
                    <th>Última visita</th>
                    <th>Renovar</th>
                  </tr>
                </thead>
                <tbody>
                  {vencidos.map(socio => {
                    const diasVencida = Math.abs(Math.ceil((new Date(socio.membresia_vence) - hoy) / (1000 * 60 * 60 * 24)))
                    return (
                      <tr key={socio.id} className="fila-vencida">
                        <td>
                          {socio.foto_url
                            ? <img src={socio.foto_url} alt="" className="foto-miniatura" />
                            : <div className="avatar-mini">{(socio.nombre || '?').charAt(0).toUpperCase()}</div>
                          }
                        </td>
                        <td>{socio.dni}</td>
                        <td>{socio.nombre}</td>
                        <td>{new Date(socio.membresia_vence).toLocaleDateString('es-AR')}</td>
                        <td><span className="badge-vencida">{diasVencida} día{diasVencida !== 1 ? 's' : ''}</span></td>
                        <td>{socio.ultima_asistencia ? new Date(socio.ultima_asistencia).toLocaleDateString('es-AR') : '—'}</td>
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
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {vencidos.length === 0 && <p className="sin-datos">No hay cuotas vencidas.</p>}
            </div>
          </>
        )}

        {/* PESTAÑA HISTORIAL */}
        {pestana === 'historial' && (
          <>
            <div className="topbar">
              <h1>Historial de accesos</h1>
              <p>Últimos 100 intentos de acceso al gimnasio</p>
            </div>
            {cargandoHistorial ? <p className="cargando">Cargando historial...</p> : (
              <div className="tabla-container">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>DNI</th>
                      <th>Nombre</th>
                      <th>Resultado</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(h => (
                      <tr key={h.id}>
                        <td>{new Date(h.fecha).toLocaleString('es-AR')}</td>
                        <td>{h.dni}</td>
                        <td>{h.nombre || 'Desconocido'}</td>
                        <td>
                          <span className={`badge ${h.resultado === 'permitido' ? 'badge-activa' : 'badge-inactiva'}`}>
                            {h.resultado}
                          </span>
                        </td>
                        <td>{h.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {historial.length === 0 && <p className="sin-datos">No hay registros de acceso aún.</p>}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default DashboardAdmin