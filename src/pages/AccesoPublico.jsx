import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'

function AccesoPublico() {
  const [dni, setDni] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])

  useEffect(() => {
    if (!resultado) {
      inputRef.current?.focus()
    }
  }, [resultado])

  useEffect(() => {
    if (resultado) {
      const timer = setTimeout(() => {
        setResultado(null)
        setDni('')
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [resultado])

  async function verificarAcceso(e) {
    e.preventDefault()
    if (!/^\d{7,8}$/.test(dni)) return
    setCargando(true)
    try {
      const respuesta = await api.post('/acceso/verificar', { dni })
      setResultado(respuesta.data)
    } catch (err) {
      setResultado({ acceso: false, mensaje: 'Error al verificar. Intentá de nuevo.' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className={`acceso-container ${visible ? 'visible' : ''}`}>
      <div className="auth-bg">
        <div className="bg-circle c1"></div>
        <div className="bg-circle c2"></div>
        <div className="bg-circle c3"></div>
      </div>

      <div className="acceso-card">
        <div className="auth-logo">
          <span className="logo-text">Gym</span><span className="logo-accent">Wall</span>
        </div>
        <p className="auth-subtitle">Control de acceso</p>

        {!resultado ? (
          <form onSubmit={verificarAcceso}>
            <div className="campo">
              <label>Ingresá tu DNI</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ej: 12345678"
                value={dni}
                maxLength={8}
                autoFocus
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                className="input-dni-grande"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={cargando || dni.length < 7}>
              {cargando ? <span className="spinner"></span> : 'Verificar acceso'}
            </button>
          </form>
        ) : (
          <div className={`resultado-acceso ${resultado.acceso ? 'permitido' : 'denegado'}`}>
            {resultado.foto_url && (
              <img
                src={resultado.foto_url}
                alt={resultado.nombre}
                className="resultado-foto"
              />
            )}
            {!resultado.foto_url && (
              <div className="resultado-avatar">
                {resultado.nombre ? resultado.nombre.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div className="resultado-icono">
              {resultado.acceso ? '✓' : '✗'}
            </div>
            <div className="resultado-nombre">{resultado.nombre || 'DNI no registrado'}</div>
            <div className="resultado-mensaje">{resultado.mensaje}</div>
            {resultado.membresia_vence && (
              <div className="resultado-vence">
                Vence: {new Date(resultado.membresia_vence).toLocaleDateString('es-AR')}
              </div>
            )}
            <div className="resultado-countdown">Reiniciando en 7 segundos...</div>
          </div>
        )}

        <a href="/login" className="link-admin">Acceso administrador</a>
      </div>
    </div>
  )
}

export default AccesoPublico