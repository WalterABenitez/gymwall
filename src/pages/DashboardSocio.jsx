import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function DashboardSocio() {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('gymwall_usuario'))

  useEffect(() => { cargarPerfil() }, [])

  async function cargarPerfil() {
    try {
      const respuesta = await api.get('/socios/perfil')
      setPerfil(respuesta.data.usuario)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) cerrarSesion()
    } finally {
      setCargando(false)
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('gymwall_token')
    localStorage.removeItem('gymwall_usuario')
    navigate('/login')
  }

  const diasRestantes = perfil?.membresia_vence
    ? Math.ceil((new Date(perfil.membresia_vence) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const porVencer = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 5

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">Gym</span><span className="logo-accent">Wall</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item activo">Membresía</a>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-usuario">{usuario?.nombre}</p>
          <span className="badge-socio">Socio</span>
          <button onClick={cerrarSesion} className="btn-logout">Cerrar sesión</button>
        </div>
      </aside>

      <main className="contenido">
        <div className="topbar">
          <h1>Hola, {usuario?.nombre}</h1>
          <p>Estado de tu membresía en GymWall</p>
        </div>

        {porVencer && (
          <div className="alerta-vencimiento">
            <span className="alerta-icono">⚠</span>
            <span>Tu membresía vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}. Acercate al gimnasio para renovarla.</span>
          </div>
        )}

        {cargando ? (
          <p className="cargando">Cargando tu perfil...</p>
        ) : perfil && (
          <div className="perfil-container">
            <div className={`membresia-card ${perfil.membresia_estado === 'activa' ? 'activa' : 'inactiva'}`}>
              <div className="membresia-estado-label">Estado de membresía</div>
              <div className="membresia-estado-valor">
                {perfil.membresia_estado === 'activa' ? 'Activa' : 'Inactiva'}
              </div>
              {perfil.plan && <div className="membresia-plan">Plan: {perfil.plan}</div>}
              {perfil.membresia_vence && (
                <div className="membresia-vence">
                  Vence el {new Date(perfil.membresia_vence).toLocaleDateString('es-AR')}
                </div>
              )}
              {diasRestantes !== null && diasRestantes > 0 && (
                <div className="dias-restantes">{diasRestantes} días restantes</div>
              )}
              {diasRestantes !== null && diasRestantes <= 0 && (
                <div className="membresia-vencida">Tu membresía ha vencido</div>
              )}
            </div>

            <div className="info-card">
              <h3>Mis datos</h3>
              <div className="info-fila">
                <span className="info-label">Nombre</span>
                <span className="info-valor">{perfil.nombre}</span>
              </div>
              <div className="info-fila">
                <span className="info-label">DNI</span>
                <span className="info-valor">{perfil.dni}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardSocio