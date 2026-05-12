import { useState, useMemo, useEffect } from 'react';
import {
  Trash2, Timer, ArrowLeft, Plus, X, ClipboardList, Pencil,
  AlertCircle, Check, Search, ChevronUp, ChevronDown,
  ArrowRight, Dumbbell, ChevronLeft,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fichasApi } from '../api';

const LBL = 'block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5';

function inputCls(hasError) {
  return [
    'w-full bg-zinc-50 dark:bg-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm',
    'text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    'outline-none focus:ring-2 transition-all duration-200',
    hasError
      ? 'border border-red-400 dark:border-red-500 focus:ring-red-400/20 focus:border-red-400'
      : 'border border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500',
  ].join(' ');
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle size={11} strokeWidth={2.5} />
      {msg}
    </p>
  );
}

const PARTES_CORPO = [
  { id: 'peito',       label: 'Peito' },
  { id: 'costas',      label: 'Costas' },
  { id: 'ombros',      label: 'Ombros' },
  { id: 'biceps',      label: 'Bíceps' },
  { id: 'triceps',     label: 'Tríceps' },
  { id: 'quadriceps',  label: 'Quadríceps' },
  { id: 'posterior',   label: 'Posterior' },
  { id: 'gluteos',     label: 'Glúteos' },
  { id: 'panturrilha', label: 'Panturrilha' },
  { id: 'abdomen',     label: 'Abdômen' },
  { id: 'antebraco',   label: 'Antebraço' },
];

const CATALOGO = {
  peito:       ['Supino Reto', 'Supino Inclinado', 'Crucifixo', 'Peck Deck', 'Crossover', 'Flexão de Braço'],
  costas:      ['Puxada Frontal', 'Remada Baixa', 'Remada Curvada', 'Barra Fixa', 'Remada Serrote'],
  ombros:      ['Desenvolvimento', 'Elevação Lateral', 'Elevação Frontal', 'Face Pull', 'Arnold Press'],
  biceps:      ['Rosca Direta', 'Rosca Alternada', 'Rosca Martelo', 'Rosca Scott', 'Rosca 21'],
  triceps:     ['Tríceps Pulley', 'Tríceps Corda', 'Tríceps Testa', 'Mergulho', 'Extensão Overhead'],
  quadriceps:  ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Hack Squat', 'Afundo'],
  posterior:   ['Stiff', 'Cadeira Flexora', 'Mesa Flexora', 'Levantamento Terra'],
  gluteos:     ['Hip Thrust', 'Agachamento Sumô', 'Abdução no Cabo', 'Glúteo no Cabo'],
  panturrilha: ['Panturrilha em Pé', 'Panturrilha Sentado', 'Panturrilha no Leg Press'],
  abdomen:     ['Abdominal Crunch', 'Prancha', 'Oblíquo', 'Elevação de Pernas', 'Abdominal Infra'],
  antebraco:   ['Rosca de Punho', 'Flexão de Pulso Reversa', 'Farmer Walk'],
};

const OBJETIVO_COLORS = {
  Hipertrofia:   'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Emagrecimento: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Resistência:   'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

const EX_DEFAULTS = { series: '3', reps: '10 a 12', carga: '', descanso: '60s' };

export default function Treinos({ fichas, setFichas, somenteLeitura = false }) {
  const { addToast } = useToast();
  const [fichaSelecionada, setFichaSelecionada] = useState(null);

  // Aluno: abre automaticamente se tiver apenas uma ficha vinculada
  useEffect(() => {
    if (somenteLeitura && fichas.length === 1 && !fichaSelecionada) {
      setFichaSelecionada(fichas[0]);
    }
  }, [somenteLeitura, fichas]);

  /* ── Modal base ── */
  const [modalAberta, setModalAberta]     = useState(false);
  const [fichaEditando, setFichaEditando] = useState(null);
  const [form, setForm]                   = useState({ nome: '', objetivo: 'Hipertrofia', partes: [] });
  const [errosForm, setErrosForm]         = useState({});
  const [exsLocais, setExsLocais]         = useState([]);

  /* ── Wizard ── */
  const [etapa, setEtapa] = useState(1);

  /* ── Catálogo ── */
  const [buscaEx, setBuscaEx]     = useState('');
  const [filtroTab, setFiltroTab] = useState('todos');

  /* ── Edição inline de exercício ── */
  const [exExpandido, setExExpandido]   = useState(null);
  const [exInlineForm, setExInlineForm] = useState({});
  const [errosInline, setErrosInline]   = useState({});

  /* ── Exercício personalizado ── */
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(false);
  const [nomePersonalizado, setNomePersonalizado]       = useState('');
  const [erroPersonalizado, setErroPersonalizado]       = useState('');

  /* ── Destaque temporário de item recém-adicionado ── */
  const [exRecenteId, setExRecenteId] = useState(null);

  /* ────────────────────────────── helpers de reset ── */
  function resetModal() {
    setEtapa(1);
    setBuscaEx('');
    setFiltroTab('todos');
    setExExpandido(null);
    setExInlineForm({});
    setErrosInline({});
    setMostrarPersonalizado(false);
    setNomePersonalizado('');
    setErroPersonalizado('');
    setExRecenteId(null);
  }

  /* ────────────────────────────── abrir / fechar ── */
  function abrirModal(ficha = null) {
    setFichaEditando(ficha);
    setForm(ficha
      ? { nome: ficha.nome, objetivo: ficha.objetivo, partes: ficha.partes ?? [] }
      : { nome: '', objetivo: 'Hipertrofia', partes: [] }
    );
    setExsLocais(ficha
      ? (ficha.exercicios ?? []).map(ex => ({ ...ex }))
      : []
    );
    setErrosForm({});
    resetModal();
    setModalAberta(true);
  }

  function fecharModal() {
    setModalAberta(false);
    setFichaEditando(null);
    setForm({ nome: '', objetivo: 'Hipertrofia', partes: [] });
    setExsLocais([]);
    setErrosForm({});
    resetModal();
  }

  /* ────────────────────────────── step 1 ── */
  function toggleParte(id) {
    setForm(prev => ({
      ...prev,
      partes: prev.partes.includes(id)
        ? prev.partes.filter(p => p !== id)
        : [...prev.partes, id],
    }));
    setErrosForm(prev => ({ ...prev, partes: undefined }));
  }

  function irParaStep2() {
    const errs = {};
    if (!form.nome.trim())         errs.nome   = 'Nome da ficha é obrigatório.';
    if (form.partes.length === 0)  errs.partes = 'Selecione ao menos uma parte do corpo.';
    if (Object.keys(errs).length) {
      setErrosForm(errs);
      addToast('Preencha os campos obrigatórios.', 'error');
      return;
    }
    setFiltroTab('todos');
    setBuscaEx('');
    setEtapa(2);
  }

  /* ────────────────────────────── salvar ficha ── */
  async function salvarFicha() {
    const payload = {
      nome:       form.nome.trim(),
      objetivo:   form.objetivo,
      partes:     form.partes,
      exercicios: exsLocais,
    };

    try {
      if (fichaEditando) {
        const fichaAtualizada = await fichasApi.atualizar(fichaEditando.id, payload);
        setFichas(fichas.map(f => f.id === fichaEditando.id ? fichaAtualizada : f));
        if (fichaSelecionada?.id === fichaEditando.id) setFichaSelecionada(fichaAtualizada);
        addToast('Ficha atualizada com sucesso!', 'success');
      } else {
        const novaFicha = await fichasApi.criar(payload);
        setFichas(prev => [...prev, novaFicha]);
        addToast(`Ficha "${novaFicha.nome}" criada com sucesso!`, 'success');
      }
      fecharModal();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar ficha.', 'error');
    }
  }

  async function excluirFicha(id) {
    if (!confirm('Excluir esta ficha apagará todos os exercícios dela. Tem certeza?')) return;
    try {
      await fichasApi.excluir(id);
      setFichas(fichas.filter(f => f.id !== id));
      if (fichaSelecionada?.id === id) setFichaSelecionada(null);
      addToast('Ficha excluída.', 'warning');
    } catch (err) {
      addToast(err.message || 'Erro ao excluir ficha.', 'error');
    }
  }

  /* ────────────────────────────── exercícios ── */
  function adicionarDoCatalogo(nome) {
    if (exsLocais.some(ex => ex.nome === nome)) return;
    const novoEx = { id: Date.now(), nome, ...EX_DEFAULTS };
    setExsLocais(prev => [...prev, novoEx]);
    highlight(novoEx.id);
    addToast(`"${nome}" adicionado à ficha.`, 'success');
  }

  function adicionarPersonalizado() {
    const nome = nomePersonalizado.trim();
    if (!nome) { setErroPersonalizado('Nome obrigatório.'); return; }
    if (exsLocais.some(ex => ex.nome === nome)) {
      setErroPersonalizado('Exercício já adicionado.');
      return;
    }
    const novoEx = { id: Date.now(), nome, ...EX_DEFAULTS };
    setExsLocais(prev => [...prev, novoEx]);
    highlight(novoEx.id);
    setNomePersonalizado('');
    setErroPersonalizado('');
    setMostrarPersonalizado(false);
    addToast(`"${nome}" adicionado à ficha.`, 'success');
  }

  function removerExLocal(id) {
    const ex = exsLocais.find(e => e.id === id);
    if (exExpandido === id) { setExExpandido(null); setErrosInline({}); }
    setExsLocais(prev => prev.filter(e => e.id !== id));
    if (ex) addToast(`"${ex.nome}" removido da ficha.`, 'warning');
  }

  function toggleExpandirEx(ex) {
    if (exExpandido === ex.id) {
      setExExpandido(null);
      setErrosInline({});
    } else {
      setExExpandido(ex.id);
      setExInlineForm({ series: ex.series, reps: ex.reps, carga: ex.carga, descanso: ex.descanso });
      setErrosInline({});
    }
  }

  function salvarInline(exId) {
    const errs = {};
    if (!exInlineForm.series?.trim())   errs.series   = 'Obrigatório.';
    if (!exInlineForm.reps?.trim())     errs.reps     = 'Obrigatório.';
    if (!exInlineForm.descanso?.trim()) errs.descanso = 'Obrigatório.';
    if (Object.keys(errs).length) { setErrosInline(errs); return; }
    setExsLocais(prev => prev.map(ex => ex.id === exId ? { ...ex, ...exInlineForm } : ex));
    setExExpandido(null);
    setErrosInline({});
  }

  function moverEx(id, delta) {
    setExsLocais(prev => {
      const idx = prev.findIndex(ex => ex.id === id);
      if (idx < 0) return prev;
      const novoIdx = idx + delta;
      if (novoIdx < 0 || novoIdx >= prev.length) return prev;
      const nova = [...prev];
      [nova[idx], nova[novoIdx]] = [nova[novoIdx], nova[idx]];
      return nova;
    });
  }

  function highlight(id) {
    setExRecenteId(id);
    setTimeout(() => setExRecenteId(null), 1800);
  }

  /* ────────────────────────────── computed ── */
  const nomesAdicionados = useMemo(
    () => new Set(exsLocais.map(ex => ex.nome)),
    [exsLocais]
  );

  const tabsDisponiveis = useMemo(() => {
    const base = form.partes.length > 0
      ? PARTES_CORPO.filter(p => form.partes.includes(p.id))
      : PARTES_CORPO;
    return [{ id: 'todos', label: 'Todos' }, ...base];
  }, [form.partes]);

  const exerciciosCatalogo = useMemo(() => {
    let lista = [];
    if (filtroTab === 'todos') {
      const partes = form.partes.length > 0 ? form.partes : Object.keys(CATALOGO);
      lista = [...new Set(partes.flatMap(p => CATALOGO[p] ?? []))];
    } else {
      lista = CATALOGO[filtroTab] ?? [];
    }
    if (buscaEx.trim()) {
      const q = buscaEx.toLowerCase();
      lista = lista.filter(n => n.toLowerCase().includes(q));
    }
    return lista;
  }, [filtroTab, buscaEx, form.partes]);

  const exerciciosDestaFicha = fichaSelecionada?.exercicios ?? [];

  /* ════════════════════════════════════════════════════
     MODAL
  ════════════════════════════════════════════════════ */
  const fichaModal = modalAberta && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl shadow-black/20 animate-scale-in flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {fichaEditando ? 'Editar Ficha' : 'Nova Ficha de Treino'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {etapa === 1
                ? 'Passo 1 de 2 — Informações básicas e grupos musculares'
                : 'Passo 2 de 2 — Monte os exercícios da ficha'}
            </p>
          </div>
          <button
            onClick={fecharModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step indicators ── */}
        <div className="shrink-0 flex items-center px-6 py-3 gap-3 border-b border-zinc-100 dark:border-zinc-800">
          {[1, 2].map((n, idx) => (
            <div key={n} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  etapa > n
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                    : etapa === n
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {etapa > n ? <Check size={12} strokeWidth={3} /> : n}
                </div>
                <span className={`text-xs font-semibold transition-colors duration-200 ${
                  etapa === n ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
                }`}>
                  {n === 1 ? 'Informações' : 'Exercícios'}
                  {n === 2 && exsLocais.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold">
                      {exsLocais.length}
                    </span>
                  )}
                </span>
              </div>
              {idx === 0 && <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />}
            </div>
          ))}
        </div>

        {/* ══════════════ STEP 1 — Informações ══════════════ */}
        {etapa === 1 && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 animate-fade-up">

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={LBL}>Nome da Ficha</label>
                <input
                  type="text" maxLength={60} value={form.nome} autoFocus
                  onChange={e => {
                    setForm(p => ({ ...p, nome: e.target.value }));
                    setErrosForm(p => ({ ...p, nome: undefined }));
                  }}
                  className={inputCls(!!errosForm.nome)}
                  placeholder="Ex: Treino A — Peito e Tríceps"
                />
                <FieldError msg={errosForm.nome} />
              </div>
              <div>
                <label className={LBL}>Objetivo Principal</label>
                <select
                  value={form.objetivo}
                  onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
                  className={inputCls(false)}
                >
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Emagrecimento">Emagrecimento</option>
                  <option value="Resistência">Resistência</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={LBL + ' mb-0'}>Grupos Musculares</label>
                <span className={`text-xs font-semibold transition-colors duration-200 ${
                  form.partes.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'
                }`}>
                  {form.partes.length > 0
                    ? `${form.partes.length} selecionado${form.partes.length !== 1 ? 's' : ''}`
                    : 'Nenhum selecionado'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PARTES_CORPO.map(parte => {
                  const sel = form.partes.includes(parte.id);
                  return (
                    <button
                      key={parte.id}
                      type="button"
                      onClick={() => toggleParte(parte.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 text-left ${
                        sel
                          ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20 scale-[1.02]'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-green-400/60 hover:bg-green-500/5 hover:text-green-700 dark:hover:text-green-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
                        sel ? 'bg-white/25' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}>
                        {sel
                          ? <Check size={11} strokeWidth={3} className="text-white" />
                          : <Dumbbell size={10} className="text-zinc-400" />
                        }
                      </div>
                      {parte.label}
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errosForm.partes} />
            </div>
          </div>
        )}

        {/* ══════════════ STEP 2 — Exercícios ══════════════ */}
        {etapa === 2 && (
          <div className="flex-1 overflow-hidden flex animate-fade-up">

            {/* ─── Painel esquerdo: Catálogo ─── */}
            <div className="w-[44%] shrink-0 border-r border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden">

              {/* Cabeçalho do catálogo */}
              <div className="px-4 pt-4 pb-3 space-y-2.5">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Catálogo de Exercícios
                </p>

                {/* Busca */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={buscaEx}
                    onChange={e => setBuscaEx(e.target.value)}
                    placeholder="Buscar exercício..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-7 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                  {buscaEx && (
                    <button
                      onClick={() => setBuscaEx('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Tabs por grupo muscular */}
                {!buscaEx && (
                  <div className="flex gap-1 flex-wrap">
                    {tabsDisponiveis.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFiltroTab(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
                          filtroTab === tab.id
                            ? 'bg-green-500 text-white shadow-sm shadow-green-500/25'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de exercícios do catálogo */}
              <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
                {exerciciosCatalogo.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic text-center py-8">
                    {buscaEx ? 'Nenhum resultado encontrado.' : 'Sem exercícios nesta categoria.'}
                  </p>
                ) : exerciciosCatalogo.map(nome => {
                  const adicionado = nomesAdicionados.has(nome);
                  return (
                    <div
                      key={nome}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                        adicionado
                          ? 'opacity-45'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <span className={`text-xs font-medium leading-tight ${
                        adicionado
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {nome}
                      </span>
                      {adicionado ? (
                        <Check size={13} className="shrink-0 text-green-500" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => adicionarDoCatalogo(nome)}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500 text-green-600 dark:text-green-400 hover:text-white transition-all duration-150"
                          title="Adicionar à ficha"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Exercício personalizado */}
              <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-800">
                {mostrarPersonalizado ? (
                  <div className="space-y-2 animate-fade-up">
                    <input
                      type="text"
                      value={nomePersonalizado}
                      onChange={e => { setNomePersonalizado(e.target.value); setErroPersonalizado(''); }}
                      onKeyDown={e => e.key === 'Enter' && adicionarPersonalizado()}
                      placeholder="Nome do exercício..."
                      autoFocus
                      className={`w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs border outline-none focus:ring-2 transition-all duration-200 text-zinc-900 dark:text-white placeholder:text-zinc-400 ${
                        erroPersonalizado
                          ? 'border-red-400 focus:ring-red-400/20'
                          : 'border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500'
                      }`}
                    />
                    {erroPersonalizado && (
                      <p className="flex items-center gap-1 text-[11px] text-red-500">
                        <AlertCircle size={10} strokeWidth={2.5} />{erroPersonalizado}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setMostrarPersonalizado(false); setNomePersonalizado(''); setErroPersonalizado(''); }}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all duration-150"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={adicionarPersonalizado}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-green-500 hover:bg-green-400 text-white shadow-sm shadow-green-500/25 transition-all duration-150"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMostrarPersonalizado(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-zinc-400 hover:text-green-600 dark:hover:text-green-400 border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-500/5 transition-all duration-200"
                  >
                    <Plus size={11} />
                    Exercício personalizado
                  </button>
                )}
              </div>
            </div>

            {/* ─── Painel direito: Exercícios da ficha ─── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Ficha
                  {exsLocais.length > 0 && (
                    <span className="ml-2 normal-case font-normal text-zinc-400">
                      {exsLocais.length} exercício{exsLocais.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {exsLocais.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                      <ClipboardList size={20} className="text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nenhum exercício ainda</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adicione pelo catálogo ao lado</p>
                  </div>
                ) : exsLocais.map((ex, i) => (
                  <div
                    key={ex.id}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                      exRecenteId === ex.id
                        ? 'border-green-400 dark:border-green-500 bg-green-500/5 shadow-sm shadow-green-500/10'
                        : exExpandido === ex.id
                        ? 'border-blue-400 dark:border-blue-500 bg-blue-500/5'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60'
                    }`}
                  >
                    {/* Linha do exercício */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="w-5 h-5 shrink-0 flex items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 leading-none">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                          {ex.nome}
                        </p>
                        {exExpandido !== ex.id && (
                          <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              <span className="text-green-600 dark:text-green-400 font-bold">{ex.series}</span>
                              {' '}×{' '}{ex.reps}
                            </span>
                            {ex.carga && (
                              <span className="text-[10px] font-semibold text-orange-500">{ex.carga}</span>
                            )}
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-400">
                              <Timer size={9} />{ex.descanso}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Reordenar */}
                        <div className="flex flex-col mr-0.5">
                          <button
                            type="button"
                            onClick={() => moverEx(ex.id, -1)}
                            disabled={i === 0}
                            className="p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-20 transition-colors duration-150"
                            title="Mover para cima"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverEx(ex.id, 1)}
                            disabled={i === exsLocais.length - 1}
                            className="p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-20 transition-colors duration-150"
                            title="Mover para baixo"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => toggleExpandirEx(ex)}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            exExpandido === ex.id
                              ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
                              : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                          }`}
                          title="Editar detalhes"
                        >
                          <Pencil size={11} />
                        </button>
                        {/* Remover */}
                        <button
                          type="button"
                          onClick={() => removerExLocal(ex.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                          title="Remover"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Formulário inline accordion */}
                    {exExpandido === ex.id && (
                      <div className="px-3 pb-3 pt-2.5 border-t border-blue-100 dark:border-blue-500/20 space-y-2.5 animate-fade-up">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'series',   label: 'Séries',       ph: '4',       req: true  },
                            { key: 'reps',     label: 'Repetições',   ph: '10 a 12', req: true  },
                            { key: 'carga',    label: 'Carga (opc.)', ph: '25kg',    req: false },
                            { key: 'descanso', label: 'Descanso',     ph: '60s',     req: true  },
                          ].map(({ key, label, ph, req }) => (
                            <div key={key}>
                              <label className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                {label}
                              </label>
                              <input
                                type="text"
                                maxLength={key === 'reps' ? 20 : 10}
                                value={exInlineForm[key] ?? ''}
                                autoFocus={key === 'series'}
                                onChange={e => {
                                  setExInlineForm(p => ({ ...p, [key]: e.target.value }));
                                  if (req) setErrosInline(p => ({ ...p, [key]: undefined }));
                                }}
                                placeholder={`Ex: ${ph}`}
                                className={`w-full bg-white dark:bg-zinc-900 rounded-lg px-2.5 py-1.5 text-xs border outline-none focus:ring-2 transition-all duration-200 text-zinc-900 dark:text-white placeholder:text-zinc-400 ${
                                  errosInline[key]
                                    ? 'border-red-400 focus:ring-red-400/20'
                                    : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-400'
                                }`}
                              />
                              {errosInline[key] && (
                                <p className="flex items-center gap-0.5 text-[10px] text-red-500 mt-0.5">
                                  <AlertCircle size={9} strokeWidth={2.5} />{errosInline[key]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => { setExExpandido(null); setErrosInline({}); }}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all duration-150"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => salvarInline(ex.id)}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-500 hover:bg-blue-400 text-white shadow-sm shadow-blue-500/25 transition-all duration-150"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer / Navegação ── */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
          {etapa === 1 ? (
            <>
              <button
                type="button"
                onClick={fecharModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={irParaStep2}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Próximo
                <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
              >
                <ChevronLeft size={15} />
                Voltar
              </button>
              <button
                type="button"
                onClick={fecharModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarFicha}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {fichaEditando ? 'Salvar Alterações' : 'Criar Ficha'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════
     DETALHE DA FICHA
  ════════════════════════════════════════════════════ */
  if (fichaSelecionada) {
    const partes = fichaSelecionada.partes ?? [];
    return (
      <div className="animate-fade-up">
        <button
          onClick={() => setFichaSelecionada(null)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors duration-200 group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          Voltar para Fichas
        </button>

        <header className="flex items-start justify-between mb-6 pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${OBJETIVO_COLORS[fichaSelecionada.objetivo] ?? OBJETIVO_COLORS.Hipertrofia}`}>
                {fichaSelecionada.objetivo}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
              {fichaSelecionada.nome}
            </h2>
            {partes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {partes.map(pId => {
                  const parte = PARTES_CORPO.find(p => p.id === pId);
                  return parte ? (
                    <span key={pId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {parte.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
          {!somenteLeitura && (
            <button
              onClick={() => abrirModal(fichaSelecionada)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
            >
              <Pencil size={14} />
              Editar Ficha
            </button>
          )}
        </header>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
                {['Exercício', 'Séries', 'Repetições', 'Carga', 'Descanso'].map(h => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${h !== 'Exercício' ? 'text-center' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {exerciciosDestaFicha.length > 0 ? exerciciosDestaFicha.map(ex => (
                <tr key={ex.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                  <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">{ex.nome}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-sm">
                      {ex.series}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center text-zinc-600 dark:text-zinc-300 font-medium">{ex.reps}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-orange-500 font-semibold">{ex.carga || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs">
                      <Timer size={13} />{ex.descanso}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                    <p className="text-sm text-zinc-400 italic">Nenhum exercício cadastrado nesta ficha.</p>
                    <button
                      onClick={() => abrirModal(fichaSelecionada)}
                      className="mt-3 text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
                    >
                      Clique em Editar Ficha para adicionar exercícios
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {fichaModal}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     LISTA DE FICHAS
  ════════════════════════════════════════════════════ */
  return (
    <div>
      <header className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Programas</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Fichas de Treino</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {fichas.length} ficha{fichas.length !== 1 ? 's' : ''} cadastrada{fichas.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!somenteLeitura && (
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={15} />
            Nova Ficha
          </button>
        )}
      </header>

      {fichas.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4">
            <ClipboardList size={24} className="text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nenhuma ficha cadastrada ainda.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Clique em "Nova Ficha" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fichas.map(ficha => {
            const qtd    = (ficha.exercicios ?? []).length;
            const partes = ficha.partes ?? [];
            return (
              <div
                key={ficha.id}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-green-500/40 hover:shadow-md hover:shadow-zinc-200/60 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${OBJETIVO_COLORS[ficha.objetivo] ?? OBJETIVO_COLORS.Hipertrofia}`}>
                    {ficha.objetivo}
                  </span>
                  {!somenteLeitura && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => abrirModal(ficha)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
                        title="Editar Ficha"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => excluirFicha(ficha.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                        title="Excluir Ficha"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
                  {ficha.nome}
                </h3>

                {partes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {partes.slice(0, 4).map(pId => {
                      const parte = PARTES_CORPO.find(p => p.id === pId);
                      return parte ? (
                        <span key={pId} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {parte.label}
                        </span>
                      ) : null;
                    })}
                    {partes.length > 4 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        +{partes.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-zinc-400 mb-5">
                  {qtd} exercício{qtd !== 1 ? 's' : ''} cadastrado{qtd !== 1 ? 's' : ''}
                </p>

                <button
                  onClick={() => setFichaSelecionada(ficha)}
                  className="mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-green-600 dark:text-green-400 bg-green-500/8 dark:bg-green-500/10 hover:bg-green-500 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-200"
                >
                  Ver Exercícios
                </button>
              </div>
            );
          })}
        </div>
      )}

      {fichaModal}
    </div>
  );
}
