import { useEffect, useState } from 'react'
import api from '../api'
import Navbar from '../components/Navbar'

export default function AdminDashboard() {
  const [aba, setAba] = useState('dashboard')
  const [dash, setDash] = useState({})
  const [produtos, setProdutos] = useState([])
  const [lojas, setLojas] = useState([])
  const [trans, setTrans] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [msg, setMsg] = useState('')

  // formulários
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', comissao_percentual: 10, estoque: 0, descricao: '' })
  const [novaLoja, setNovaLoja] = useState({ nome: '', email: '', senha: '', chave_pix: '' })

  // gerar pagamento
  const [lojaSel, setLojaSel] = useState('')
  const [produtosDaLoja, setProdutosDaLoja] = useState([])
  const [pagForm, setPagForm] = useState({ produto_id: '', valor: '' })
  const [pagGerado, setPagGerado] = useState(null)

  // liberar produtos
  const [lojaLiberar, setLojaLiberar] = useState('')
  const [produtosLiberados, setProdutosLiberados] = useState([])

  useEffect(() => { carregarTudo() }, [])

  async function carregarTudo() {
    try {
      const [d, p, l, t, s] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/produtos'),
        api.get('/admin/lojas'),
        api.get('/admin/transacoes'),
        api.get('/admin/solicitacoes')
      ])
      setDash(d.data); setProdutos(p.data); setLojas(l.data)
      setTrans(t.data); setSolicitacoes(s.data)
    } catch (err) { setMsg('Erro ao carregar: ' + err.message) }
  }

  async function criarProduto(e) {
    e.preventDefault()
    try {
      await api.post('/admin/produtos', novoProd)
      setMsg('Produto criado!')
      setNovoProd({ nome: '', preco: '', comissao_percentual: 10, estoque: 0, descricao: '' })
      carregarTudo()
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  async function deletarProduto(id) {
    if (!confirm('Excluir produto?')) return
    await api.delete(`/admin/produtos/${id}`)
    carregarTudo()
  }

  async function criarLoja(e) {
    e.preventDefault()
    try {
      await api.post('/admin/lojas', novaLoja)
      setMsg('Lojista cadastrado!')
      setNovaLoja({ nome: '', email: '', senha: '', chave_pix: '' })
      carregarTudo()
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  async function deletarLoja(id) {
    if (!confirm('Excluir este lojista?')) return
    await api.delete(`/admin/lojas/${id}`)
    carregarTudo()
  }

  // ---------- GERAR PAGAMENTO ----------
  async function selecionarLojaParaPagamento(id) {
    setLojaSel(id)
    setPagGerado(null)
    setPagForm({ produto_id: '', valor: '' })
    if (!id) { setProdutosDaLoja([]); return }
    const { data } = await api.get(`/admin/lojas/${id}/produtos`)
    setProdutosDaLoja(data)
  }

  async function gerarPagamento(e) {
    e.preventDefault()
    if (!lojaSel || !pagForm.produto_id) { setMsg('Selecione loja e produto'); return }
    try {
      const { data } = await api.post(`/admin/lojas/${lojaSel}/gerar-pagamento`, {
        produto_id: parseInt(pagForm.produto_id),
        valor: pagForm.valor ? parseFloat(pagForm.valor) : undefined
      })
      setPagGerado(data)
      setMsg('Pagamento gerado!')
      carregarTudo()
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  async function confirmarPagamento(uuid) {
    if (!confirm('Confirmar que o Pix foi recebido?')) return
    await api.post(`/admin/transacoes/${uuid}/confirmar`)
    setMsg('Pagamento confirmado!')
    setPagGerado(null)
    carregarTudo()
  }

  // ---------- LIBERAR PRODUTOS ----------
  async function selecionarLojaParaLiberar(id) {
    setLojaLiberar(id)
    if (!id) { setProdutosLiberados([]); return }
    const { data } = await api.get(`/admin/lojas/${id}/produtos`)
    setProdutosLiberados(data)
  }

  async function alternarProduto(produtoId, liberado) {
    try {
      if (liberado) {
        await api.delete(`/admin/lojas/${lojaLiberar}/produtos/${produtoId}`)
      } else {
        await api.post(`/admin/lojas/${lojaLiberar}/produtos`, { produto_id: produtoId })
      }
      await selecionarLojaParaLiberar(lojaLiberar)
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  // ---------- SOLICITAÇÕES ----------
  async function responderSolicitacao(id, status) {
    try {
      await api.put(`/admin/solicitacoes/${id}`, { status })
      setMsg(`Solicitação ${status}`)
      carregarTudo()
    } catch (err) { setMsg('Erro: ' + (err.response?.data?.erro || err.message)) }
  }

  const abas = [
    ['dashboard', 'Dashboard'],
    ['produtos', 'Produtos'],
    ['lojistas', 'Lojistas'],
    ['liberar', 'Liberar Produtos'],
    ['solicitacoes', `Solicitações${dash.total_solicitacoes_pendentes ? ` (${dash.total_solicitacoes_pendentes})` : ''}`],
    ['pagamento', 'Gerar Pagamento'],
    ['transacoes', 'Transações'],
  ]

  return (
    <>
      <Navbar />
      <div className="container">
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

        {/* DASHBOARD */}
        {aba === 'dashboard' && (
          <div className="grid">
            <div className="card"><div className="metric">R$ {dash.total_vendas?.toFixed(2) || '0.00'}</div><div className="metric-label">Vendas totais</div></div>
            <div className="card"><div className="metric">R$ {dash.total_comissao?.toFixed(2) || '0.00'}</div><div className="metric-label">Minhas comissões</div></div>
            <div className="card"><div className="metric">R$ {dash.total_repasse?.toFixed(2) || '0.00'}</div><div className="metric-label">Repasse aos lojistas</div></div>
            <div className="card"><div className="metric">{dash.total_produtos || 0}</div><div className="metric-label">Produtos</div></div>
            <div className="card"><div className="metric">{dash.total_lojas || 0}</div><div className="metric-label">Lojistas</div></div>
            <div className="card"><div className="metric">{dash.total_solicitacoes_pendentes || 0}</div><div className="metric-label">Solicitações pendentes</div></div>
          </div>
        )}

        {/* PRODUTOS */}
        {aba === 'produtos' && (
          <>
            <div className="card">
              <h3>Novo Produto</h3>
              <form onSubmit={criarProduto}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
                  <div><label>Nome</label><input required value={novoProd.nome} onChange={e => setNovoProd({...novoProd, nome: e.target.value})} /></div>
                  <div><label>Preço (R$)</label><input required type="number" step="0.01" value={novoProd.preco} onChange={e => setNovoProd({...novoProd, preco: e.target.value})} /></div>
                  <div><label>Comissão %</label><input type="number" step="0.1" value={novoProd.comissao_percentual} onChange={e => setNovoProd({...novoProd, comissao_percentual: e.target.value})} /></div>
                  <div><label>Estoque</label><input type="number" value={novoProd.estoque} onChange={e => setNovoProd({...novoProd, estoque: e.target.value})} /></div>
                </div>
                <label>Descrição</label>
                <input value={novoProd.descricao} onChange={e => setNovoProd({...novoProd, descricao: e.target.value})} />
                <button className="primary" type="submit">Criar Produto</button>
              </form>
            </div>
            <div className="card">
              <h3>Produtos cadastrados ({produtos.length})</h3>
              <table>
                <thead><tr><th>ID</th><th>Nome</th><th>Preço</th><th>Comissão</th><th>Estoque</th><th></th></tr></thead>
                <tbody>
                  {produtos.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td><td>{p.nome}</td>
                      <td>R$ {p.preco.toFixed(2)}</td>
                      <td>{p.comissao_percentual}%</td>
                      <td>{p.estoque}</td>
                      <td><button onClick={() => deletarProduto(p.id)} style={{ background: '#ef4444', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Excluir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LOJISTAS */}
        {aba === 'lojistas' && (
          <>
            <div className="card">
              <h3>Cadastrar Lojista</h3>
              <form onSubmit={criarLoja}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label>Nome</label><input required value={novaLoja.nome} onChange={e => setNovaLoja({...novaLoja, nome: e.target.value})} /></div>
                  <div><label>E-mail</label><input required type="email" value={novaLoja.email} onChange={e => setNovaLoja({...novaLoja, email: e.target.value})} /></div>
                  <div><label>Senha (mín. 6)</label><input required type="password" value={novaLoja.senha} onChange={e => setNovaLoja({...novaLoja, senha: e.target.value})} /></div>
                  <div><label>Chave Pix</label><input value={novaLoja.chave_pix} onChange={e => setNovaLoja({...novaLoja, chave_pix: e.target.value})} /></div>
                </div>
                <button className="primary" type="submit">Cadastrar</button>
              </form>
            </div>
            <div className="card">
              <h3>Lojistas ({lojas.length})</h3>
              <table>
                <thead><tr><th>ID</th><th>Nome</th><th>E-mail</th><th>Chave Pix</th><th>Saldo a pagar</th><th></th></tr></thead>
                <tbody>
                  {lojas.map(l => (
                    <tr key={l.id}>
                      <td>{l.id}</td><td>{l.nome}</td><td>{l.email}</td>
                      <td>{l.chave_pix || '—'}</td>
                      <td><b>R$ {l.saldo_a_receber.toFixed(2)}</b></td>
                      <td><button onClick={() => deletarLoja(l.id)} style={{ background: '#ef4444', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Excluir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LIBERAR PRODUTOS */}
        {aba === 'liberar' && (
          <div className="card">
            <h3>Liberar produtos para um lojista</h3>
            <label>Lojista</label>
            <select value={lojaLiberar} onChange={e => selecionarLojaParaLiberar(e.target.value)}>
              <option value="">-- Selecione --</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>

            {lojaLiberar && (
              <table style={{ marginTop: 16 }}>
                <thead><tr><th>Produto</th><th>Preço</th><th>Status</th><th>Ação</th></tr></thead>
                <tbody>
                  {produtos.map(p => {
                    const liberado = produtosLiberados.some(pl => pl.id === p.id)
                    return (
                      <tr key={p.id}>
                        <td>{p.nome}</td>
                        <td>R$ {p.preco.toFixed(2)}</td>
                        <td>{liberado ? '✅ Liberado' : '—'}</td>
                        <td>
                          <button
                            className="primary"
                            onClick={() => alternarProduto(p.id, liberado)}
                            style={{ background: liberado ? '#ef4444' : undefined }}
                          >
                            {liberado ? 'Revogar' : 'Liberar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SOLICITAÇÕES */}
        {aba === 'solicitacoes' && (
          <div className="card">
            <h3>Solicitações dos lojistas ({solicitacoes.length})</h3>
            <table>
              <thead><tr><th>ID</th><th>Lojista</th><th>Produto</th><th>Qtd</th><th>Obs</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>
                {solicitacoes.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.loja_nome}</td>
                    <td>{s.produto_nome}</td>
                    <td>{s.quantidade}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{s.observacao || '—'}</td>
                    <td><span className={`badge badge-${s.status === 'pendente' ? 'pendente' : s.status === 'aprovada' ? 'pago' : 'pendente'}`}>{s.status}</span></td>
                    <td>
                      {s.status === 'pendente' && (
                        <>
                          <button className="primary" style={{ marginRight: 6 }} onClick={() => responderSolicitacao(s.id, 'aprovada')}>Aprovar</button>
                          <button onClick={() => responderSolicitacao(s.id, 'recusada')} style={{ background: '#ef4444', color: '#fff', border: 0, padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Recusar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GERAR PAGAMENTO */}
        {aba === 'pagamento' && (
          <>
            <div className="card">
              <h3>Gerar QR Code Pix para um lojista</h3>
              <form onSubmit={gerarPagamento}>
                <label>Lojista</label>
                <select value={lojaSel} onChange={e => selecionarLojaParaPagamento(e.target.value)} required>
                  <option value="">-- Selecione --</option>
                  {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>

                {lojaSel && (
                  <>
                    <label>Produto (liberado para esse lojista)</label>
                    <select value={pagForm.produto_id} onChange={e => setPagForm({...pagForm, produto_id: e.target.value})} required>
                      <option value="">-- Selecione --</option>
                      {produtosDaLoja.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco.toFixed(2)}</option>)}
                    </select>

                    <label>Valor a cobrar (opcional, sobrescreve o preço do produto)</label>
                    <input type="number" step="0.01" placeholder="Deixe em branco para usar o preço padrão" value={pagForm.valor} onChange={e => setPagForm({...pagForm, valor: e.target.value})} />

                    <button className="primary" type="submit" disabled={!produtosDaLoja.length}>
                      {produtosDaLoja.length ? 'Gerar QR Code Pix' : 'Nenhum produto liberado para este lojista'}
                    </button>
                  </>
                )}
              </form>
            </div>

            {pagGerado && (
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>QR Code gerado</h3>
                <p><b>Lojista:</b> {pagGerado.loja_nome}</p>
                <p><b>Produto:</b> {pagGerado.produto_nome}</p>
                <p><b>Valor:</b> R$ {pagGerado.valor_pago.toFixed(2)}</p>
                <p><b>Minha comissão:</b> R$ {pagGerado.comissao.toFixed(2)}</p>
                <p><b>Repasse ao lojista:</b> R$ {pagGerado.repasse_loja.toFixed(2)}</p>
                <img src={`data:image/png;base64,${pagGerado.qr_code_base64}`} alt="QR" style={{ width: 220, height: 220, margin: '16px 0' }} />
                <p style={{ fontSize: 11, wordBreak: 'break-all', color: '#666' }}>{pagGerado.payload_pix}</p>
                <p>Status: <span className="badge badge-pendente">{pagGerado.status}</span></p>
                <button className="primary" style={{ marginTop: 12 }} onClick={() => confirmarPagamento(pagGerado.transacao_uuid)}>
                  ✅ Confirmar pagamento recebido (teste)
                </button>
              </div>
            )}
          </>
        )}

        {/* TRANSAÇÕES */}
        {aba === 'transacoes' && (
          <div className="card">
            <h3>Transações ({trans.length})</h3>
            <table>
              <thead><tr><th>UUID</th><th>Produto</th><th>Lojista</th><th>Valor</th><th>Comissão</th><th>Repasse</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {trans.map(t => (
                  <tr key={t.id}>
                    <td><code>{t.uuid}</code></td>
                    <td>{t.produto_nome}</td>
                    <td>{t.loja_nome}</td>
                    <td>R$ {t.valor_pago.toFixed(2)}</td>
                    <td>R$ {t.comissao.toFixed(2)}</td>
                    <td>R$ {t.repasse_loja.toFixed(2)}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    <td>
                      {t.status === 'pendente' && (
                        <button className="primary" onClick={() => confirmarPagamento(t.uuid)}>Confirmar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}