import { Component } from 'react'

// ErrorBoundary atrapa errores de JavaScript en cualquier componente hijo
// En lugar de pantalla negra muestra un mensaje útil
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: false }
  }

  static getDerivedStateFromError() {
    return { error: true }
  }

  componentDidCatch(error, info) {
    console.error('Error en componente:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#080c14',
          color: '#ffffff',
          gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⚠</div>
          <h2 style={{ color: '#0099ff' }}>Algo salió mal</h2>
          <p style={{ color: '#4a7fa5' }}>Recargá la página para continuar</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0066ff, #0099ff)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary