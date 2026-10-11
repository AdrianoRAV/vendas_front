import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import LojaDashboard from './pages/LojaDashboard'
import TrocarSenha from './pages/TrocarSenha'

function RotaProtegida({ children, tipo }) {
  const token = localStorage.getItem('token')
  const userTipo = localStorage.getItem('tipo')
  if (!token) return <Navigate to="/" />
  if (tipo && userTipo !== tipo) return <Navigate to="/" />

  // Se admin precisa trocar senha, força a tela de troca
  const precisaTrocar = localStorage.getItem('precisa_trocar_senha') === 'true'
  if (precisaTrocar && window.location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/trocar-senha" element={
        <RotaProtegida tipo="admin"><TrocarSenha /></RotaProtegida>
      } />
      <Route path="/admin" element={
        <RotaProtegida tipo="admin"><AdminDashboard /></RotaProtegida>
      } />
      <Route path="/loja" element={
        <RotaProtegida tipo="loja"><LojaDashboard /></RotaProtegida>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}