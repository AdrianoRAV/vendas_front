import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'

export default function Checkout() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const produto = state?.produto

  const [valor, setValor] = useState(produto?.preco || 0)
  const [metodo, setMetodo] = useState('pix')
  const [pagamento, setPagamento] = useState(null)
  const [status, setStatus] = useState('')
  const [erro, setErro] = useState('')

  if (!produto) {
    return (<><Navbar /><div className="container"><div className="card">Produto não selecionado. <button className="primary" onClick={() => navigate('/loja')}>Voltar</button></div></div></>)
  }

  async function gerarPagamento(e) {
    e.preventDefault()
    setErro(''); setPagamento(null); setStatus('')
    try {
      const { data } = await api.post('/pagamento/criar', {
        produto_id: produto.id,
        valor: parseFloat(valor),
        metodo
      })
      setPagamento(data)
      setStatus('pendente')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao gerar pagamento')
    }
  }

  async function simularConfirmacao() {
    if (!pagamento) return
    await api.post(`/pagamento/simular-confirmacao/${pagamento.transacao_uuid}`)
    setStatus('pago')
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="card">
          <button onClick={() => navigate('/loja')} style={{ background: 'transparent', border: 0, color: '#3b82f6', cursor: 'pointer', marginBottom: 10 }}>← Voltar</button>
          <h2>{produto.nome}</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Preço sugerido: R$ {produto.preco.toFixed(2)}</p>

          {!pagamento && (
            <form onSubmit={gerarPagamento}>
              <label>Valor a pagar (R$) — pode ser diferente do sugerido</label>
              <input type="number" step="0.01" min={produto.preco * 0.5} value={valor} onChange={e => setValor(e.target.value)} required />
              <label>Método</label>
              <select value={metodo} onChange={e => setMetodo(e.target.value)}>
                <option value="pix">Pix</option>
                <option value="paypal">PayPal</option>
                <option value="cartao">Cartão</option>
              </select>
              <button className="primary" type="submit" style={{ width: '100%' }}>Gerar QR Code</button>
              {erro && <p style={{ color: 'red', marginTop: 10 }}>{erro}</p>}
            </form>
          )}

          {pagamento && (
            <div style={{ textAlign: 'center' }}>
              <p><b>UUID:</b> {pagamento.transacao_uuid}</p>
              <p><b>Valor:</b> R$ {pagamento.valor_pago.toFixed(2)}</p>
              <p><b>Comissão admin:</b> R$ {pagamento.comissao.toFixed(2)}</p>
              <p><b>Repasse loja:</b> R$ {pagamento.repasse_loja.toFixed(2)}</p>
              <div style={{ margin: '20px 0' }}>
                <img src={`data:image/png;base64,${pagamento.qr_code_base64}`} alt="QR" style={{ width: 220, height: 220 }} />
              </div>
              <p style={{ fontSize: 11, wordBreak: 'break-all', color: '#666', marginBottom: 20 }}>
                {pagamento.payload_pix}
              </p>
              <p>Status: <span className={`badge badge-${status}`}>{status}</span></p>
              {status === 'pendente' && (
                <button className="primary" style={{ marginTop: 15 }} onClick={simularConfirmacao}>
                  ✅ Simular Confirmação (teste)
                </button>
              )}
              {status === 'pago' && (
                <p style={{ color: '#065f46', fontWeight: 600, marginTop: 15 }}>
                  Pagamento confirmado! Repasse creditado à loja.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}