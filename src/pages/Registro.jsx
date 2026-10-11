import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Registro() {
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmaSenha: '', chave_pix: ''
  })
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [emailDisponivel, setEmailDisponivel] = useState(null)
  const navigate = useNavigate()

  // Verificação de e-mail em tempo real (com debounce)
  useEffect(() => {
    const email = form.email.trim().toLowerCase()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailDisponivel(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.post('/auth/verificar-email', { email })
        setEmailDisponivel(data.disponivel)
      } catch {
        setEmailDisponivel(null)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [form.email])

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')

    if (form.senha !== form.confirmaSenha) {
      setErro('As senhas não coincidem')
      return
    }
    if (form.senha.length < 8 || !/\d/.test(form.senha)) {
      setErro('Senha deve ter 8+ caracteres e ao menos 1 número')
      return
    }

    try {
      await api.post('/auth/registro/loja', {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        chave_pix: form.chave_pix
      })
      setOk(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar')
    }
  }

  if (ok) {
    return (
      <div className="container" style={{ maxWidth: 400, marginTop: 80 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#065f46' }}>✅ Cadastro realizado!</h2>
          <p style={{ marginTop: 10 }}>Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 440, marginTop: 60 }}>
      <div className="card">
        <h2 style={{ marginBottom: 6 }}>Criar conta de Loja</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          Cadastre-se para gerar pagamentos e receber repasses.
        </p>

        <form onSubmit={enviar}>
          <label>Nome da Loja *</label>
          <input
            required minLength={3}
            value={form.nome}
            onChange={e => atualizar('nome', e.target.value)}
          />

          <label>E-mail *</label>
          <input
            required type="email"
            value={form.email}
            onChange={e => atualizar('email', e.target.value)}
            style={{
              borderColor: emailDisponivel === false ? '#ef4444'
                        : emailDisponivel === true ? '#10b981' : undefined
            }}
          />
          {emailDisponivel === false && (
            <small style={{ color: '#ef4444' }}>E-mail já cadastrado</small>
          )}
          {emailDisponivel === true && (
            <small style={{ color: '#10b981' }}>E-mail disponível ✓</small>
          )}

          <label>Senha * (mín. 8 caracteres, 1 número)</label>
          <input
            required type="password" minLength={8}
            value={form.senha}
            onChange={e => atualizar('senha', e.target.value)}
          />

          <label>Confirmar Senha *</label>
          <input
            required type="password"
            value={form.confirmaSenha}
            onChange={e => atualizar('confirmaSenha', e.target.value)}
          />

          <label>Chave Pix (opcional, pode preencher depois)</label>
          <input
            value={form.chave_pix}
            onChange={e => atualizar('chave_pix', e.target.value)}
            placeholder="CPF, e-mail, telefone ou aleatória"
          />

          <button className="primary" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Criar conta
          </button>

          {erro && (
            <p style={{ color: '#ef4444', marginTop: 12, fontSize: 13 }}>{erro}</p>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          Já tem conta? <Link to="/" style={{ color: '#3b82f6' }}>Fazer login</Link>
        </p>
      </div>
    </div>
  )
}