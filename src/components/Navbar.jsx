import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const nome = localStorage.getItem('nome')

  function sair() {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="navbar">
      <h1>Sistema de Pagamentos</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14 }}>{nome}</span>
        <button onClick={sair}>Sair</button>
      </div>
    </div>
  )
}