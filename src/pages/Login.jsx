import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [tipo, setTipo] = useState('admin')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    try {
      const { data } = await api.post(`/${tipo}/login`, { email, senha })

      localStorage.setItem('token', data.token)
      localStorage.setItem('tipo', tipo)
      localStorage.setItem('nome', data.nome)

      if (tipo === 'admin') {
        localStorage.setItem('precisa_trocar_senha', data.precisa_trocar_senha ? 'true' : 'false')
        if (data.precisa_trocar_senha) {
          navigate('/trocar-senha')
          return
        }
        navigate('/admin')
      } else {
        localStorage.removeItem('precisa_trocar_senha')
        navigate('/loja')
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao entrar')
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
      <div className="card">
        <h2 style={{ marginBottom: 16 }}>Entrar</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={tipo === 'admin' ? 'primary' : ''}
            style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
            onClick={() => setTipo('admin')}
          >Admin</button>
          <button
            type="button"
            className={tipo === 'loja' ? 'primary' : ''}
            style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
            onClick={() => setTipo('loja')}
          >Lojista</button>
        </div>
        <form onSubmit={entrar}>
          <label>E-mail</label>
          <input
            type="email" required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={tipo === 'admin' ? 'admin@seudominio.com' : 'loja@teste.com'}
          />
          <label>Senha</label>
          <input
            type="password" required
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
          <button className="primary" style={{ width: '100%' }} type="submit">Entrar</button>
          {erro && <p style={{ color: 'red', marginTop: 10, fontSize: 13 }}>{erro}</p>}
        </form>
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 16 }}>
        Sem conta? Peça ao administrador para cadastrar você.
      </p>
    </div>
  )
}