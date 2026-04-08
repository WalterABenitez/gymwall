import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Login() {
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])

  async function manejarLogin(e) {
    e.preventDefault()
    if (!dni) { setError('Ingresá tu DNI'); return }
    if (!/^\d{7,8}$/.test(dni)) { setError('El DNI debe tener 7 u 8 números sin puntos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setCargando(true)
    setError('')

    try {
      const respuesta = await api.post('/auth/login', { dni, password })
      const { token, usuario } = respuesta.data
      localStorage.setItem('gymwall_token', token)
      localStorage.setItem('gymwall_usuario', JSON.stringify(usuario))
      navigate(usuario.rol === 'admin' ? '/admin' : '/socio')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
      setCargando(false)
    }
  }

  return (
    <div className={`auth-container ${visible ? 'visible' : ''}`}>
      <div className="auth-bg">
        <div className="bg-circle c1"></div>
        <div className="bg-circle c2"></div>
        <div className="bg-circle c3"></div>
      </div>
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-text">Gym</span><span className="logo-accent">Wall</span>
        </div>
        <p className="auth-subtitle">Acceso administrador</p>
        <form onSubmit={manejarLogin}>
          <div className="campo">
            <label>DNI</label>
            <input
              type="text"
              placeholder="Ej: 31981683"
              value={dni}
              maxLength={8}
              autoFocus
              onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setError('') }}
            />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? <span className="spinner"></span> : 'Ingresar'}
          </button>
        </form>
        <a href="/acceso" className="link-admin">Volver al control de acceso</a>
      </div>
    </div>
  )
}

export default Login