import { useEffect, useState } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'

export default function LojaDashboard() {
  const [aba, setAba] = useState('meus-produtos')
  const [catalogo, setCatalogo] = useState([])
  const [disponiveis, setDisponiveis] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [trans, setTrans] = useState([])
  const [perfil, setPerfil] = useState({})
  const [chavePix, setChavePix] = useState('')
  const [msg, setMsg] = useState('')
  const [qrAberto, setQrAberto] = useState(null)

  // form solicitação
  const [novaSolic, setNovaSolic] = useState({ produto_id: '', quantidade: 1, observacao: '' })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    try {
      const [c, d, s, t, p] = await Promise.all([
        api.get('/loja/catalogo'),
        api.get('/loja/produtos-disponiveis'),
        api.get('/loja/solicitacoes'),
        api.get('/loja/minhas-transacoes'),
        api.get('/loja/perfil')
      ])
      setCatalogo(c.data); setDisponiveis(d.data)
      setSolicitacoes(s.data); setTrans(t.data)
      setPerfil(p.data); setChavePix(p.data.chave_pix || '')
    } catch (err) { setMsg('Erro ao carregar: ' + err.message) }
  }

  async function salvarPix() {
    try {
      await api.put('/loja/perfil/chave-pix', { chave_pix: chavePix })
      setMsg('Chave Pix salva!')
      carregar()
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  async function solicitar(e) {
    e.preventDefault()
    try {
      await api.post('/loja/solicitacoes', novaSolic)
      setMsg('Solicitação enviada ao admin!')
      setNovaSolic({ produto_id: '', quantidade: 1, observacao: '' })
      carregar()
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  const abas = [
    ['meus-produtos', 'Meus Produtos'],
    ['solicitar', 'Solicitar Produto'],
    ['minhas-solicitacoes', 'Minhas Solicitações'],
    ['meus-pagamentos', 'Meus Pagamentos'],
    ['perfil', 'Meu Perfil'],
  ]

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="grid" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="metric">R$ {perfil.saldo_a_receber?.toFixed(2) || '0.00'}</div>
            <div className="metric-label">Saldo a receber</div>
          </div>
          <div className="card">
            <div className="metric">{catalogo.length}</div>
            <div className="metric-label">Produtos liberados</div>
          </div>
          <div className="card">
            <div className="metric">{trans.length}</div>
            <div className="metric-label">Pagamentos recebidos</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {abas.map(([k, label]) => (
            <button key={k}
              className={aba === k ? 'primary' : ''}
              style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
              onClick={() => setAba(k)}
            >{label}</button>
          ))}
        </div>

        {msg && <div className="card" style={{ background: '#eff6ff', color: '#1e40af' }}>{msg}</div>}

        {/* MEUS PRODUTOS */}
        {aba === 'meus-produtos' && (
          <div className="card">
            <h3>Produtos liberados para você</h3>
            {catalogo.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Nenhum produto liberado ainda. Use a aba "Solicitar Produto".</p>
            ) : (
              <div className="grid">
                {catalogo.map(p => (
                  <div key={p.id} className="card" style={{ marginBottom: 0 }}>
                    <h4>{p.nome}</h4>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{p.descricao || 'Sem descrição'}</p>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>R$ {p.preco.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOLICITAR PRODUTO */}
        {aba === 'solicitar' && (
          <div className="card">
            <h3>Solicitar produto ao admin</h3>
            {disponiveis.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Você já tem todos os produtos disponíveis liberados.</p>
            ) : (
              <form onSubmit={solicitar}>
                <label>Produto</label>
                <select required value={novaSolic.produto_id} onChange={e => setNovaSolic({...novaSolic, produto_id: e.target.value})}>
                  <option value="">-- Selecione --</option>
                  {disponiveis.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco.toFixed(2)}</option>)}
                </select>
                <label>Quantidade</label>
                <input type="number" min="1" value={novaSolic.quantidade} onChange={e => setNovaSolic({...novaSolic, quantidade: e.target.value})} />
                <label>Observação (opcional)</label>
                <input value={novaSolic.observacao} onChange={e => setNovaSolic({...novaSolic, observacao: e.target.value})} />
                <button className="primary" type="submit">Enviar solicitação</button>
              </form>
            )}
          </div>
        )}

        {/* MINHAS SOLICITAÇÕES */}
        {aba === 'minhas-solicitacoes' && (
          <div className="card">
            <h3>Minhas solicitações ({solicitacoes.length})</h3>
            <table>
              <thead><tr><th>ID</th><th>Produto</th><th>Qtd</th><th>Obs</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {solicitacoes.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.produto_nome}</td>
                    <td>{s.quantidade}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{s.observacao || '—'}</td>
                    <td><span className={`badge badge-${s.status === 'pendente' ? 'pendente' : s.status === 'aprovada' ? 'pago' : 'pendente'}`}>{s.status}</span></td>
                    <td>{new Date(s.criado_em).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MEUS PAGAMENTOS */}
        {aba === 'meus-pagamentos' && (
          <>
            <div className="card">
              <h3>Pagamentos gerados pelo admin para você</h3>
              <table>
                <thead><tr><th>UUID</th><th>Produto</th><th>Valor</th><th>Meu repasse</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {trans.map(t => (
                    <tr key={t.id}>
                      <td><code>{t.uuid}</code></td>
                      <td>{t.produto_nome}</td>
                      <td>R$ {t.valor_pago.toFixed(2)}</td>
                      <td><b>R$ {t.repasse_loja.toFixed(2)}</b></td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>
                        {t.status === 'pendente' && t.qr_code_base64 && (
                          <button className="primary" onClick={() => setQrAberto(t)}>Ver QR</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {qrAberto && (
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>Pix a pagar</h3>
                <p><b>Valor:</b> R$ {qrAberto.valor_pago.toFixed(2)}</p>
                <p><b>Seu repasse após confirmação:</b> R$ {qrAberto.repasse_loja.toFixed(2)}</p>
                <img src={`data:image/png;base64,${qrAberto.qr_code_base64}`} alt="QR" style={{ width: 220, height: 220, margin: '16px 0' }} />
                <button onClick={() => setQrAberto(null)} style={{ background: '#6b7280', color: '#fff', border: 0, padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Fechar</button>
              </div>
            )}
          </>
        )}

        {/* PERFIL */}
        {aba === 'perfil' && (
          <div className="card">
            <h3>Meu perfil</h3>
            <p><b>Nome:</b> {perfil.nome}</p>
            <p><b>E-mail:</b> {perfil.email}</p>
            <p><b>Saldo a receber:</b> R$ {perfil.saldo_a_receber?.toFixed(2)}</p>
            <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />
            <label>Minha chave Pix (para o admin me pagar)</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={chavePix} onChange={e => setChavePix(e.target.value)} placeholder="CPF, e-mail, telefone ou aleatória" />
              <button className="primary" onClick={salvarPix}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}