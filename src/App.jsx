import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import RutaProtegida from './components/RutaProtegida'
import AccesoPublico from './pages/AccesoPublico'
import DashboardAdmin from './pages/DashboardAdmin'
import DashboardSocio from './pages/DashboardSocio'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pantalla pública del molinete — solo DNI */}
        <Route path="/acceso" element={<AccesoPublico />} />
        {/* Login del admin con contraseña */}
        <Route path="/login" element={<Login />} />
        {/* Dashboard del admin */}
        <Route path="/admin" element={
          <RutaProtegida rolRequerido="admin">
            <DashboardAdmin />
          </RutaProtegida>
        } />
        {/* Dashboard del socio */}
        <Route path="/socio" element={
          <RutaProtegida rolRequerido="socio">
            <DashboardSocio />
          </RutaProtegida>
        } />
        {/* Por defecto va a la pantalla pública */}
        <Route path="*" element={<Navigate to="/acceso" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App