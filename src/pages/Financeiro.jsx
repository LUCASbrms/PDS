import { useState } from 'react';
import { TrendingUp, Clock, BarChart3, Plus, X, CheckCircle2, Pencil, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const PRECOS_PLANOS = { Mensal: 130, Trimestral: 330, Semestral: 600, Anual: 1200 };

const FORM_VAZIO = { aluno: '', plano: 'Mensal', valor: PRECOS_PLANOS['Mensal'], data: '', status: 'Pago' };

function inputCls(hasError) {
  return [
    'w-full bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    'outline-none transition-all duration-200',
    hasError
      ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/20'
      : 'border-zinc-200 dark:border-zinc-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
  ].join(' ');
}

const LABEL_CLASS = 'block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5';

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

export default function Financeiro({ mensalidades, setMensalidades }) {
  const { addToast } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});

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
    setForm({ aluno: m.aluno, plano: m.plano, valor: m.valor, data: m.data, status: m.status });
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
    setErros(prev => ({ ...prev, plano: undefined }));
  }

  function validar() {
    const e = {};
    if (!form.aluno.trim()) e.aluno = 'Nome do aluno é obrigatório.';
    if (!form.data) e.data = 'Data de vencimento é obrigatória.';
    const v = parseFloat(form.valor);
    if (isNaN(v) || v <= 0) e.valor = 'Informe um valor válido maior que zero.';
    return e;
  }

  function salvarPagamento(e) {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length > 0) {
      setErros(e2);
      addToast('Corrija os campos destacados antes de salvar.', 'error');
      return;
    }

    const dados = { aluno: form.aluno.trim(), plano: form.plano, valor: parseFloat(form.valor), data: form.data, status: form.status };

    if (editandoId !== null) {
      setMensalidades(mensalidades.map(m => m.id === editandoId ? { ...m, ...dados } : m));
      addToast('Pagamento atualizado com sucesso.', 'success');
    } else {
      setMensalidades([...mensalidades, { id: Date.now(), ...dados }]);
      addToast('Pagamento registrado com sucesso.', 'success');
    }

    fecharModal();
  }

  function marcarComoPago(id) {
    setMensalidades(mensalidades.map(m => m.id === id ? { ...m, status: 'Pago' } : m));
    addToast('Mensalidade baixada como paga.', 'success');
  }

  const summaryCards = [
    {
      label: 'Total Recebido',
      value: `R$ ${totalRecebido.toFixed(2)}`,
      icon: <TrendingUp size={18} />,
      accent: 'border-l-4 border-l-green-500',
      iconBg: 'bg-green-500/10 text-green-500',
    },
    {
      label: 'Pendente / Atrasado',
      value: `R$ ${totalPendente.toFixed(2)}`,
      icon: <Clock size={18} />,
      accent: 'border-l-4 border-l-orange-500',
      iconBg: 'bg-orange-500/10 text-orange-500',
    },
    {
      label: 'Total Previsto',
      value: `R$ ${totalPrevisto.toFixed(2)}`,
      icon: <BarChart3 size={18} />,
      accent: 'border-l-4 border-l-blue-500',
      iconBg: 'bg-blue-500/10 text-blue-500',
    },
  ];

  return (
    <div>
      <header className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Financeiro</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Mensalidades</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{mensalidades.length} registro{mensalidades.length !== 1 ? 's' : ''} no período</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={15} />
          Registrar Pagamento
        </button>
      </header>

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

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
              {['Aluno', 'Plano', 'Valor', 'Vencimento', 'Status', 'Ação'].map(h => (
                <th key={h} className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${h === 'Status' || h === 'Ação' ? 'text-center' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {mensalidades.map(m => (
              <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">{m.aluno}</td>
                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{m.plano}</td>
                <td className="px-5 py-4 font-semibold text-green-600 dark:text-green-400">R$ {m.valor.toFixed(2)}</td>
                <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400">{m.data}</td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => abrirEdicao(m)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all duration-200"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    {m.status !== 'Pago' && (
                      <button
                        onClick={() => marcarComoPago(m.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-200"
                      >
                        <CheckCircle2 size={13} />
                        Baixar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
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
              <div>
                <label className={LABEL_CLASS}>Nome do Aluno</label>
                <input
                  type="text"
                  value={form.aluno}
                  onChange={e => setField('aluno', e.target.value)}
                  className={inputCls(!!erros.aluno)}
                  placeholder="Nome completo"
                  maxLength={80}
                />
                <FieldError msg={erros.aluno} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Plano</label>
                  <select value={form.plano} onChange={e => mudarPlano(e.target.value)} className={inputCls(false)}>
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Valor (R$)</label>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => setField('valor', e.target.value)}
                    className={inputCls(!!erros.valor)}
                    min="0.01"
                    step="0.01"
                  />
                  <FieldError msg={erros.valor} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Vencimento</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setField('data', e.target.value)}
                    className={inputCls(!!erros.data)}
                  />
                  <FieldError msg={erros.data} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Status</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputCls(false)}>
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fecharModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5">
                  {editandoId !== null ? 'Salvar Alterações' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
