import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Register() {
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])

  async function manejarRegister(e) {
    e.preventDefault()
    if (!dni) { setError('Ingresá tu DNI'); return }
    if (!/^\d{7,8}$/.test(dni)) { setError('El DNI debe tener 7 u 8 números sin puntos'); return }
    if (!nombre) { setError('El nombre no puede estar vacío'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setCargando(true)
    setError('')

    try {
      await api.post('/auth/register', { dni, nombre, password })
      setExito('Cuenta creada. Redirigiendo...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
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
        <p className="auth-subtitle">Crear cuenta</p>
        <form onSubmit={manejarRegister}>
          <div className="campo">
            <label>DNI</label>
            <input
              type="text"
              placeholder="Ej: 12345678"
              value={dni}
              maxLength={8}
              onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setError('') }}
            />
          </div>
          <div className="campo">
            <label>Nombre completo</label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError('') }}
            />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
            />
          </div>
          {error && <p className="error">{error}</p>}
          {exito && <p className="exito">{exito}</p>}
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? <span className="spinner"></span> : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default Register