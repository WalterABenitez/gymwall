import { Navigate } from "react-router-dom"

function RutaProtegida({ children, rolRequerido }) {
  const token = localStorage.getItem("gymwall_token")
  const usuario = JSON.parse(localStorage.getItem("gymwall_usuario"))

  // 🔒 Si no hay token → afuera
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // 🔒 Si no hay usuario → afuera
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // 🔒 Si el rol no coincide → afuera
  if (rolRequerido && usuario.rol !== rolRequerido) {
    return <Navigate to="/login" replace />
  }

  // ✅ Todo OK → entra
  return children
}

export default RutaProtegida