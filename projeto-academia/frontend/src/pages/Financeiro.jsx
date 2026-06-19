import { useState, useEffect, useMemo, useRef } from 'react';
import Paginacao from '../components/Paginacao';
import {
  TrendingUp, Clock, BarChart3, Plus, X, CheckCircle2, Pencil,
  AlertCircle, Trash2, FileDown, ChevronDown, FileText, FileSpreadsheet,
  Search,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { mensalidadesApi } from '../api';
import { exportarCSV, imprimirRelatorio, MESES } from '../utils/relatorios';

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

function nomePeriodo(yyyyMM) {
  const [ano, mes] = yyyyMM.split('-');
  return `${MESES[parseInt(mes, 10) - 1]} ${ano}`;
}

// Chips de filtro de status
const STATUS_FILTROS = [
  { valor: '',         label: 'Todos',    cls: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' },
  { valor: 'Pago',     label: 'Pago',     cls: 'bg-green-500 text-white' },
  { valor: 'Pendente', label: 'Pendente', cls: 'bg-orange-500 text-white' },
  { valor: 'Atrasado', label: 'Atrasado', cls: 'bg-red-500 text-white' },
];

export default function Financeiro({ mensalidades, setMensalidades, alunos }) {
  const { addToast } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId]   = useState(null);
  const [salvando, setSalvando]       = useState(false);
  const [form, setForm]               = useState(FORM_VAZIO);
  const [erros, setErros]             = useState({});
  const [pagina, setPagina]           = useState(1);
  const [menuExportar, setMenuExportar] = useState(false);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filtroStatus,  setFiltroStatus]  = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [busca,         setBusca]         = useState('');

  const menuRef = useRef(null);
  const POR_PAGINA = 10;

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function fechar(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuExportar(false);
    }
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  // Reseta página ao mudar filtros
  useEffect(() => { setPagina(1); }, [filtroStatus, filtroPeriodo, busca]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalRecebido = mensalidades.filter(m => m.status === 'Pago').reduce((s, m) => s + m.valor, 0);
  const totalPendente = mensalidades.filter(m => m.status !== 'Pago').reduce((s, m) => s + m.valor, 0);
  const totalPrevisto = totalRecebido + totalPendente;

  // ── Períodos disponíveis para filtro ──────────────────────────────────────
  const periodos = useMemo(() => {
    const set = new Set();
    mensalidades.forEach(m => { if (m.vencimento) set.add(m.vencimento.slice(0, 7)); });
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [mensalidades]);

  // ── Mensalidades filtradas ─────────────────────────────────────────────────
  const mensalidadesFiltradas = useMemo(() => {
    const buscaLower = busca.toLowerCase().trim();
    return mensalidades.filter(m => {
      if (filtroStatus  && m.status !== filtroStatus)                     return false;
      if (filtroPeriodo && !m.vencimento?.startsWith(filtroPeriodo))      return false;
      if (buscaLower    && !m.alunoNome?.toLowerCase().includes(buscaLower)) return false;
      return true;
    });
  }, [mensalidades, filtroStatus, filtroPeriodo, busca]);

  const mensalidadesPaginadas = mensalidadesFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // ── Dados para relatórios ──────────────────────────────────────────────────
  const inadimplentes = useMemo(() =>
    mensalidades
      .filter(m => m.status !== 'Pago')
      .map(m => {
        const dias = m.status === 'Atrasado'
          ? Math.max(0, Math.floor((Date.now() - new Date(m.vencimento + 'T00:00:00')) / 86_400_000))
          : null;
        return { ...m, diasAtraso: dias };
      })
      .sort((a, b) => (b.diasAtraso ?? -1) - (a.diasAtraso ?? -1)),
    [mensalidades]
  );

  const receitaMensal = useMemo(() => {
    const mapa = {};
    mensalidades.forEach(m => {
      if (!m.vencimento) return;
      const [ano, mesIdx] = m.vencimento.split('-');
      const chave = `${ano}-${mesIdx}`;
      if (!mapa[chave]) mapa[chave] = { chave, ano, mes: parseInt(mesIdx, 10), pago: 0, pendente: 0, atrasado: 0 };
      if (m.status === 'Pago')     mapa[chave].pago     += m.valor;
      if (m.status === 'Pendente') mapa[chave].pendente += m.valor;
      if (m.status === 'Atrasado') mapa[chave].atrasado += m.valor;
    });
    return Object.values(mapa).sort((a, b) => b.chave.localeCompare(a.chave));
  }, [mensalidades]);

  // ── Exportações ────────────────────────────────────────────────────────────
  function exportarInadimplentes(formato) {
    setMenuExportar(false);
    const cab = ['Aluno', 'Plano', 'Valor (R$)', 'Vencimento', 'Status', 'Dias em Atraso'];
    const lin = inadimplentes.map(m => [
      m.alunoNome, m.plano, Number(m.valor).toFixed(2),
      formatarData(m.vencimento), m.status,
      m.diasAtraso !== null ? m.diasAtraso : '—',
    ]);
    const nome = `inadimplentes_${new Date().toISOString().slice(0, 10)}`;
    if (formato === 'csv') exportarCSV(`${nome}.csv`, cab, lin);
    else imprimirRelatorio('Relatório de Inadimplentes', cab, lin);
  }

  function exportarReceita(formato) {
    setMenuExportar(false);
    const cab = ['Mês / Ano', 'Pago (R$)', 'Pendente (R$)', 'Atrasado (R$)', 'Total (R$)'];
    const lin = receitaMensal.map(r => [
      `${MESES[r.mes - 1]} ${r.ano}`,
      r.pago.toFixed(2), r.pendente.toFixed(2), r.atrasado.toFixed(2),
      (r.pago + r.pendente + r.atrasado).toFixed(2),
    ]);
    const nome = `receita_mensal_${new Date().toISOString().slice(0, 7)}`;
    if (formato === 'csv') exportarCSV(`${nome}.csv`, cab, lin);
    else imprimirRelatorio('Relatório de Receita Mensal', cab, lin);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  function abrirNovo() {
    setEditandoId(null); setForm(FORM_VAZIO); setErros({}); setModalAberto(true);
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
    setErros({}); setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false); setEditandoId(null); setForm(FORM_VAZIO); setErros({});
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
    if (!form.alunoId)    e.alunoId    = 'Selecione um aluno.';
    if (!form.vencimento) e.vencimento = 'Vencimento é obrigatório.';
    const v = parseFloat(form.valor);
    if (isNaN(v) || v <= 0) e.valor = 'Informe um valor válido.';
    return e;
  }

  async function salvarPagamento(e) {
    e.preventDefault();
    const errosVal = validar();
    if (Object.keys(errosVal).length > 0) { setErros(errosVal); addToast('Corrija os campos destacados.', 'error'); return; }
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
        await mensalidadesApi.atualizar(editandoId, dados);
        addToast('Pagamento atualizado com sucesso.', 'success');
      } else {
        await mensalidadesApi.criar(dados);
        addToast('Pagamento registrado com sucesso.', 'success');
      }
      fecharModal();
      await recarregar();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function recarregar() {
    try {
      const lista = await mensalidadesApi.listar();
      setMensalidades(lista);
    } catch { /* silencioso */ }
  }

  async function marcarComoPago(m) {
    try {
      await mensalidadesApi.atualizar(m.id, {
        alunoId: m.alunoId, plano: m.plano, valor: m.valor, vencimento: m.vencimento,
        dataPagamento: new Date().toISOString().slice(0, 10), status: 'Pago', observacoes: m.observacoes,
      });
      addToast('Mensalidade baixada como paga.', 'success');
      await recarregar(); // recarrega para pegar a próxima mensalidade auto-criada
    } catch (err) { addToast(err.message || 'Erro ao atualizar.', 'error'); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este registro de pagamento?')) return;
    try {
      await mensalidadesApi.excluir(id);
      addToast('Registro excluído.', 'warning');
      await recarregar();
    } catch (err) {
      // Se não existe mais no banco, remove do estado local e segue
      if (err.message?.includes('não encontrada')) {
        setMensalidades(prev => prev.filter(m => m.id !== id));
        addToast('Registro removido.', 'warning');
      } else {
        addToast(err.message || 'Erro ao excluir.', 'error');
      }
    }
  }

  const summaryCards = [
    { label: 'Total Recebido',      value: `R$ ${totalRecebido.toFixed(2)}`, icon: <TrendingUp size={18} />, accent: 'border-l-4 border-l-green-500',  iconBg: 'bg-green-500/10 text-green-500'  },
    { label: 'Pendente / Atrasado', value: `R$ ${totalPendente.toFixed(2)}`, icon: <Clock size={18} />,      accent: 'border-l-4 border-l-orange-500', iconBg: 'bg-orange-500/10 text-orange-500' },
    { label: 'Total Previsto',      value: `R$ ${totalPrevisto.toFixed(2)}`, icon: <BarChart3 size={18} />,  accent: 'border-l-4 border-l-blue-500',   iconBg: 'bg-blue-500/10 text-blue-500'    },
  ];

  const temFiltro = filtroStatus || filtroPeriodo || busca;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between mb-7 gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Financeiro</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Mensalidades</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {mensalidadesFiltradas.length !== mensalidades.length
              ? <>{mensalidadesFiltradas.length} de {mensalidades.length} registros</>
              : <>{mensalidades.length} registro{mensalidades.length !== 1 ? 's' : ''} no período</>
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Exportar dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuExportar(v => !v)}
              className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${menuExportar ? 'rotate-180' : ''}`} />
            </button>

            {menuExportar && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg shadow-black/10 z-20 overflow-hidden animate-fade-up">
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Inadimplentes</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{inadimplentes.length} registro{inadimplentes.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => exportarInadimplentes('csv')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150">
                  <FileSpreadsheet size={15} className="text-green-500" /> Baixar CSV
                </button>
                <button onClick={() => exportarInadimplentes('pdf')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150">
                  <FileText size={15} className="text-red-500" /> Imprimir / PDF
                </button>
                <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1" />
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Receita Mensal</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{receitaMensal.length} mês/meses</p>
                </div>
                <button onClick={() => exportarReceita('csv')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-150">
                  <FileSpreadsheet size={15} className="text-green-500" /> Baixar CSV
                </button>
                <button onClick={() => exportarReceita('pdf')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 mb-1 transition-colors duration-150">
                  <FileText size={15} className="text-red-500" /> Imprimir / PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Registrar Pagamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </header>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Chips de status */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_FILTROS.map(({ valor, label, cls }) => (
            <button
              key={valor}
              onClick={() => setFiltroStatus(valor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filtroStatus === valor
                  ? cls
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro de período */}
        <select
          value={filtroPeriodo}
          onChange={e => setFiltroPeriodo(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200"
        >
          <option value="">Todos os períodos</option>
          {periodos.map(p => <option key={p} value={p}>{nomePeriodo(p)}</option>)}
        </select>

        {/* Busca por nome */}
        <div className="relative flex-1 min-w-[160px] max-w-[260px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 border-0 outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
          />
        </div>

        {/* Limpar filtros */}
        {temFiltro && (
          <button
            onClick={() => { setFiltroStatus(''); setFiltroPeriodo(''); setBusca(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 transition-all duration-200"
          >
            <X size={11} />
            Limpar
          </button>
        )}
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {mensalidadesFiltradas.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              {temFiltro ? (
                <>
                  <p className="font-medium">Nenhum resultado para os filtros aplicados.</p>
                  <button onClick={() => { setFiltroStatus(''); setFiltroPeriodo(''); setBusca(''); }} className="text-sm mt-2 text-green-600 dark:text-green-400 hover:underline">
                    Limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium">Nenhum pagamento registrado.</p>
                  <p className="text-sm mt-1">Clique em "Registrar Pagamento" para começar.</p>
                </>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Aluno</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Plano</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Valor</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Vencimento</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">Pagamento</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {mensalidadesPaginadas.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm">{m.alunoNome}</p>
                      {/* Vencimento visível só no mobile */}
                      <p className="text-xs text-zinc-400 mt-0.5 sm:hidden">{formatarData(m.vencimento)}</p>
                    </td>
                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{m.plano}</td>
                    <td className="px-5 py-4 font-semibold text-green-600 dark:text-green-400">R$ {m.valor.toFixed(2)}</td>
                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{formatarData(m.vencimento)}</td>
                    <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{formatarData(m.dataPagamento)}</td>
                    <td className="px-5 py-4 text-center"><StatusBadge status={m.status} /></td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => abrirEdicao(m)} className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all duration-200" title="Editar">
                          <Pencil size={14} />
                        </button>
                        {m.status !== 'Pago' && (
                          <button onClick={() => marcarComoPago(m)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-200">
                            <CheckCircle2 size={13} />
                            Baixar
                          </button>
                        )}
                        {m.status !== 'Pago' && (
                          <button onClick={() => marcarComoPago(m)} className="sm:hidden p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all duration-200" title="Marcar como pago">
                            <CheckCircle2 size={14} />
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
      </div>

      <Paginacao
        pagina={pagina}
        totalItens={mensalidadesFiltradas.length}
        porPagina={POR_PAGINA}
        onChange={setPagina}
      />

      {/* ── Receita mensal ──────────────────────────────────────────────────── */}
      {receitaMensal.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">Relatório</p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Receita Mensal</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportarReceita('csv')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200">
                <FileSpreadsheet size={13} className="text-green-500" /> CSV
              </button>
              <button onClick={() => exportarReceita('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200">
                <FileText size={13} className="text-red-500" /> PDF
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
                    {['Mês / Ano', 'Pago', 'Pendente', 'Atrasado', 'Total'].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${i > 0 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {receitaMensal.map(r => {
                    const total = r.pago + r.pendente + r.atrasado;
                    return (
                      <tr key={r.chave} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                        <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-white capitalize">{MESES[r.mes - 1]} {r.ano}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-green-600 dark:text-green-400">R$ {r.pago.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right text-orange-600 dark:text-orange-400">R$ {r.pendente.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right text-red-600 dark:text-red-400">R$ {r.atrasado.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-zinc-900 dark:text-white">R$ {total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-green-500/5 dark:bg-green-500/10 border-t-2 border-green-500/20">
                    <td className="px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Geral</td>
                    <td className="px-5 py-3.5 text-right font-black text-green-600 dark:text-green-400">R$ {receitaMensal.reduce((s, r) => s + r.pago, 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-black text-orange-600 dark:text-orange-400">R$ {receitaMensal.reduce((s, r) => s + r.pendente, 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-black text-red-600 dark:text-red-400">R$ {receitaMensal.reduce((s, r) => s + r.atrasado, 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-black text-zinc-900 dark:text-white">R$ {receitaMensal.reduce((s, r) => s + r.pago + r.pendente + r.atrasado, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
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
              <div>
                <label className={LBL}>Aluno</label>
                <select value={form.alunoId} onChange={e => setField('alunoId', e.target.value)} className={inputCls(!!erros.alunoId)}>
                  <option value="">Selecione um aluno...</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <FieldError msg={erros.alunoId} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>Plano</label>
                  <select value={form.plano} onChange={e => mudarPlano(e.target.value)} className={inputCls(false)}>
                    <option>Mensal</option><option>Trimestral</option><option>Semestral</option><option>Anual</option>
                  </select>
                </div>
                <div>
                  <label className={LBL}>Valor (R$)</label>
                  <input type="number" value={form.valor} onChange={e => setField('valor', e.target.value)} className={inputCls(!!erros.valor)} min="0.01" step="0.01" />
                  <FieldError msg={erros.valor} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>Vencimento</label>
                  <input type="date" value={form.vencimento} onChange={e => setField('vencimento', e.target.value)} className={inputCls(!!erros.vencimento)} />
                  <FieldError msg={erros.vencimento} />
                </div>
                <div>
                  <label className={LBL}>Status</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputCls(false)}>
                    <option>Pendente</option><option>Pago</option><option>Atrasado</option>
                  </select>
                </div>
              </div>

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
