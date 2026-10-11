import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function TrocarSenha() {
  const [emailAtual, setEmailAtual] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/me').then(({ data }) => {
      setEmailAtual(data.email)
      setNovoEmail(data.email)
    })
  }, [])

  async function salvar(e) {
    e.preventDefault()
    setErro('')

    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem')
      return
    }
    if (novaSenha.length < 8) {
      setErro('Nova senha deve ter no mínimo 8 caracteres')
      return
    }
    if (!/\d/.test(novaSenha) || !/[A-Za-z]/.test(novaSenha)) {
      setErro('Nova senha deve conter letras e números')
      return
    }

    try {
      await api.post('/admin/trocar-senha', {
        senha_atual: senhaAtual,
        novo_email: novoEmail,
        nova_senha: novaSenha,
        confirmar
      })
      localStorage.setItem('precisa_trocar_senha', 'false')
      setOk(true)
      setTimeout(() => navigate('/admin'), 1500)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar')
    }
  }

  function sair() {
    localStorage.clear()
    navigate('/')
  }

  if (ok) {
    return (
      <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#065f46' }}>✅ Dados atualizados!</h2>
          <p style={{ marginTop: 10 }}>Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 60 }}>
      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Primeiro acesso</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          Defina seu e-mail e senha definitivos. A senha atual é a que você usou para entrar.
        </p>

        <form onSubmit={salvar}>
          <label>E-mail de acesso *</label>
          <input
            required type="email"
            value={novoEmail}
            onChange={e => setNovoEmail(e.target.value)}
          />
          {novoEmail !== emailAtual && novoEmail && (
            <small style={{ color: '#3b82f6' }}>
              Você está alterando o e-mail de {emailAtual} para {novoEmail}
            </small>
          )}

          <label style={{ marginTop: 10 }}>Senha atual (a do .env) *</label>
          <input
            required type="password"
            value={senhaAtual}
            onChange={e => setSenhaAtual(e.target.value)}
          />

          <label>Nova senha * (mín. 8 caracteres, com letras e números)</label>
          <input
            required type="password" minLength={8}
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
          />

          <label>Confirmar nova senha *</label>
          <input
            required type="password"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
          />

          <button className="primary" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Salvar
          </button>

          {erro && (
            <p style={{ color: '#ef4444', marginTop: 12, fontSize: 13 }}>{erro}</p>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <span onClick={sair} style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>
            Sair
          </span>
        </p>
      </div>
    </div>
  )
}