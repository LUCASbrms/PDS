import { useState } from 'react';
import { TrendingUp, Clock, BarChart3, Plus, X, CheckCircle2, Pencil, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { mensalidadesApi } from '../api';

const PRECOS_PLANOS = { Mensal: 130, Trimestral: 330, Semestral: 600, Anual: 1200 };

const FORM_VAZIO = {
  alunoId:       '',
  plano:         'Mensal',
  valor:         PRECOS_PLANOS['Mensal'],
  vencimento:    '',
  dataPagamento: '',
  status:        'Pendente',
  observacoes:   '',
};

function inputCls(hasError) {
  return [
    'w-full bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all duration-200',
    hasError
      ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/20'
      : 'border-zinc-200 dark:border-zinc-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
  ].join(' ');
}

const LBL = 'block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
      <AlertCircle size={11} />
      {msg}
    </p>
  );
}

function StatusBadge({ status }) {
  const map = {
    Pago:     'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Pendente: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Atrasado: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.Pendente}`}>
      {status}
    </span>
  );
}

function formatarData(str) {
  if (!str) return '—';
  const [ano, mes, dia] = str.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function Financeiro({ mensalidades, setMensalidades, alunos }) {
  const { addToast } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId]   = useState(null);
  const [salvando, setSalvando]       = useState(false);
  const [form, setForm]               = useState(FORM_VAZIO);
  const [erros, setErros]             = useState({});

  const totalRecebido = mensalidades.filter(m => m.status === 'Pago').reduce((s, m) => s + m.valor, 0);
  const totalPendente = mensalidades.filter(m => m.status !== 'Pago').reduce((s, m) => s + m.valor, 0);
  const totalPrevisto = totalRecebido + totalPendente;

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErros({});
    setModalAberto(true);
  }

  function abrirEdicao(m) {
    setEditandoId(m.id);
    setForm({
      alunoId:       String(m.alunoId),
      plano:         m.plano,
      valor:         m.valor,
      vencimento:    m.vencimento,
      dataPagamento: m.dataPagamento,
      status:        m.status,
      observacoes:   m.observacoes,
    });
    setErros({});
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErros({});
  }

  function setField(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErros(prev => ({ ...prev, [campo]: undefined }));
  }

  function mudarPlano(novoPlano) {
    setForm(prev => ({ ...prev, plano: novoPlano, valor: PRECOS_PLANOS[novoPlano] }));
  }

  function validar() {
    const e = {};
    if (!form.alunoId)    e.alunoId = 'Selecione um aluno.';
    if (!form.vencimento) e.vencimento = 'Vencimento é obrigatório.';
    const v = parseFloat(form.valor);
    if (isNaN(v) || v <= 0) e.valor = 'Informe um valor válido.';
    return e;
  }

  async function salvarPagamento(e) {
    e.preventDefault();
    const errosVal = validar();
    if (Object.keys(errosVal).length > 0) {
      setErros(errosVal);
      addToast('Corrija os campos destacados.', 'error');
      return;
    }
    setSalvando(true);
    try {
      const dados = {
        alunoId:       parseInt(form.alunoId),
        plano:         form.plano,
        valor:         parseFloat(form.valor),
        vencimento:    form.vencimento,
        dataPagamento: form.dataPagamento || null,
        status:        form.status,
        observacoes:   form.observacoes || null,
      };

      if (editandoId !== null) {
        const atualizado = await mensalidadesApi.atualizar(editandoId, dados);
        setMensalidades(prev => prev.map(m => m.id === editandoId ? atualizado : m));
        addToast('Pagamento atualizado com sucesso.', 'success');
      } else {
        const novo = await mensalidadesApi.criar(dados);
        setMensalidades(prev => [...prev, novo]);
        addToast('Pagamento registrado com sucesso.', 'success');
      }
      fecharModal();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function marcarComoPago(m) {
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const atualizado = await mensalidadesApi.atualizar(m.id, {
        alunoId:       m.alunoId,
        plano:         m.plano,
        valor:         m.valor,
        vencimento:    m.vencimento,
        dataPagamento: hoje,
        status:        'Pago',
        observacoes:   m.observacoes,
      });
      setMensalidades(prev => prev.map(x => x.id === m.id ? atualizado : x));
      addToast('Mensalidade baixada como paga.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar.', 'error');
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este registro de pagamento?')) return;
    try {
      await mensalidadesApi.excluir(id);
      setMensalidades(prev => prev.filter(m => m.id !== id));
      addToast('Registro excluído.', 'warning');
    } catch (err) {
      addToast(err.message || 'Erro ao excluir.', 'error');
    }
  }

  const summaryCards = [
    { label: 'Total Recebido',    value: `R$ ${totalRecebido.toFixed(2)}`, icon: <TrendingUp size={18} />, accent: 'border-l-4 border-l-green-500',  iconBg: 'bg-green-500/10 text-green-500'  },
    { label: 'Pendente / Atrasado', value: `R$ ${totalPendente.toFixed(2)}`, icon: <Clock size={18} />,      accent: 'border-l-4 border-l-orange-500', iconBg: 'bg-orange-500/10 text-orange-500' },
    { label: 'Total Previsto',    value: `R$ ${totalPrevisto.toFixed(2)}`, icon: <BarChart3 size={18} />,   accent: 'border-l-4 border-l-blue-500',   iconBg: 'bg-blue-500/10 text-blue-500'    },
  ];

  return (
    <div>
      <header className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Financeiro</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Mensalidades</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {mensalidades.length} registro{mensalidades.length !== 1 ? 's' : ''} no período
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={15} />
          Registrar Pagamento
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {summaryCards.map(card => (
          <div key={card.label} className={`group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 ${card.accent} hover:shadow-md hover:shadow-zinc-200/60 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{card.label}</p>
              <div className={`${card.iconBg} p-2 rounded-lg transition-transform duration-300 group-hover:scale-110`}>{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {mensalidades.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <p className="font-medium">Nenhum pagamento registrado.</p>
            <p className="text-sm mt-1">Clique em "Registrar Pagamento" para começar.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
                {['Aluno', 'Plano', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'Ações'].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${['Status', 'Ações'].includes(h) ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {mensalidades.map(m => (
                <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                  <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">{m.alunoNome}</td>
                  <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{m.plano}</td>
                  <td className="px-5 py-4 font-semibold text-green-600 dark:text-green-400">R$ {m.valor.toFixed(2)}</td>
                  <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{formatarData(m.vencimento)}</td>
                  <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{formatarData(m.dataPagamento)}</td>
                  <td className="px-5 py-4 text-center"><StatusBadge status={m.status} /></td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => abrirEdicao(m)} className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all duration-200" title="Editar">
                        <Pencil size={14} />
                      </button>
                      {m.status !== 'Pago' && (
                        <button onClick={() => marcarComoPago(m)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-200">
                          <CheckCircle2 size={13} />
                          Baixar
                        </button>
                      )}
                      <button onClick={() => excluir(m.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl shadow-black/20 animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {editandoId !== null ? 'Editar Pagamento' : 'Novo Pagamento'}
              </h3>
              <button onClick={fecharModal} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={salvarPagamento} className="p-6 space-y-4">
              {/* Aluno */}
              <div>
                <label className={LBL}>Aluno</label>
                <select value={form.alunoId} onChange={e => setField('alunoId', e.target.value)} className={inputCls(!!erros.alunoId)}>
                  <option value="">Selecione um aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <FieldError msg={erros.alunoId} />
              </div>

              {/* Plano + Valor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>Plano</label>
                  <select value={form.plano} onChange={e => mudarPlano(e.target.value)} className={inputCls(false)}>
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div>
                  <label className={LBL}>Valor (R$)</label>
                  <input type="number" value={form.valor} onChange={e => setField('valor', e.target.value)} className={inputCls(!!erros.valor)} min="0.01" step="0.01" />
                  <FieldError msg={erros.valor} />
                </div>
              </div>

              {/* Vencimento + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>Vencimento</label>
                  <input type="date" value={form.vencimento} onChange={e => setField('vencimento', e.target.value)} className={inputCls(!!erros.vencimento)} />
                  <FieldError msg={erros.vencimento} />
                </div>
                <div>
                  <label className={LBL}>Status</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputCls(false)}>
                    <option>Pendente</option>
                    <option>Pago</option>
                    <option>Atrasado</option>
                  </select>
                </div>
              </div>

              {/* Data pagamento (só se Pago) */}
              {form.status === 'Pago' && (
                <div>
                  <label className={LBL}>Data do Pagamento</label>
                  <input type="date" value={form.dataPagamento} onChange={e => setField('dataPagamento', e.target.value)} className={inputCls(false)} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fecharModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-md shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5">
                  {salvando ? 'Salvando…' : editandoId !== null ? 'Salvar Alterações' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
