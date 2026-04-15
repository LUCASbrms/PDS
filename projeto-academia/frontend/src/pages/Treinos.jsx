import { useState } from 'react';
import { Trash2, Timer, ArrowLeft, Plus, X, ClipboardList, Pencil, AlertCircle, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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

const EX_VAZIO = { nome: '', series: '', reps: '', carga: '', descanso: '' };

export default function Treinos({ fichas, setFichas, exercicios, setExercicios }) {
  const { addToast } = useToast();
  const [fichaSelecionada, setFichaSelecionada] = useState(null);

  const [modalAberta, setModalAberta]     = useState(false);
  const [fichaEditando, setFichaEditando] = useState(null);
  const [form, setForm]                   = useState({ nome: '', objetivo: 'Hipertrofia', partes: [] });
  const [errosForm, setErrosForm]         = useState({});
  const [exsLocais, setExsLocais]         = useState([]);
  const [formEx, setFormEx]               = useState(null);
  const [errosEx, setErrosEx]             = useState({});

  function abrirModal(ficha = null) {
    setFichaEditando(ficha);
    setForm(ficha
      ? { nome: ficha.nome, objetivo: ficha.objetivo, partes: ficha.partes ?? [] }
      : { nome: '', objetivo: 'Hipertrofia', partes: [] }
    );
    setExsLocais(ficha
      ? exercicios.filter(ex => ex.fichaId === ficha.id).map(ex => ({ ...ex }))
      : []
    );
    setErrosForm({});
    setFormEx(null);
    setErrosEx({});
    setModalAberta(true);
  }

  function fecharModal() {
    setModalAberta(false);
    setFichaEditando(null);
    setForm({ nome: '', objetivo: 'Hipertrofia', partes: [] });
    setExsLocais([]);
    setErrosForm({});
    setFormEx(null);
    setErrosEx({});
  }

  function toggleParte(id) {
    setForm(prev => ({
      ...prev,
      partes: prev.partes.includes(id) ? prev.partes.filter(p => p !== id) : [...prev.partes, id],
    }));
    setErrosForm(prev => ({ ...prev, partes: undefined }));
  }

  function salvarFicha(e) {
    e.preventDefault();
    const errs = {};
    if (!form.nome.trim()) errs.nome = 'Nome da ficha é obrigatório.';
    if (form.partes.length === 0) errs.partes = 'Selecione ao menos uma parte do corpo.';
    if (Object.keys(errs).length) {
      setErrosForm(errs);
      addToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const dados = { nome: form.nome.trim(), objetivo: form.objetivo, partes: form.partes };

    if (fichaEditando) {
      const fichaAtualizada = { ...fichaEditando, ...dados };
      setFichas(fichas.map(f => f.id === fichaEditando.id ? fichaAtualizada : f));
      setExercicios([
        ...exercicios.filter(ex => ex.fichaId !== fichaEditando.id),
        ...exsLocais.map(ex => ({ ...ex, fichaId: fichaEditando.id })),
      ]);
      if (fichaSelecionada?.id === fichaEditando.id) setFichaSelecionada(fichaAtualizada);
      addToast('Ficha atualizada com sucesso!', 'success');
    } else {
      const novaId = Date.now();
      setFichas([...fichas, { id: novaId, ...dados }]);
      setExercicios([...exercicios, ...exsLocais.map(ex => ({ ...ex, fichaId: novaId }))]);
      addToast(`Ficha "${dados.nome}" criada com sucesso!`, 'success');
    }
    fecharModal();
  }

  function excluirFicha(id) {
    if (!confirm('Excluir esta ficha apagará todos os exercícios dela. Tem certeza?')) return;
    setFichas(fichas.filter(f => f.id !== id));
    setExercicios(exercicios.filter(ex => ex.fichaId !== id));
    if (fichaSelecionada?.id === id) setFichaSelecionada(null);
    addToast('Ficha excluída.', 'warning');
  }

  function salvarExLocal(e) {
    e.preventDefault();
    const errs = {};
    if (!formEx?.nome?.trim())     errs.nome     = 'Nome obrigatório.';
    if (!formEx?.series?.trim())   errs.series   = 'Séries obrigatórias.';
    if (!formEx?.reps?.trim())     errs.reps     = 'Repetições obrigatórias.';
    if (!formEx?.descanso?.trim()) errs.descanso = 'Descanso obrigatório.';
    if (Object.keys(errs).length) { setErrosEx(errs); return; }

    if (formEx.id) {
      setExsLocais(prev => prev.map(ex => ex.id === formEx.id ? { ...formEx } : ex));
    } else {
      setExsLocais(prev => [...prev, { ...formEx, id: Date.now() }]);
    }
    setFormEx(null);
    setErrosEx({});
  }

  function editarExLocal(ex) {
    setFormEx({ ...ex });
    setErrosEx({});
  }

  function removerExLocal(id) {
    if (formEx?.id === id) { setFormEx(null); setErrosEx({}); }
    setExsLocais(prev => prev.filter(ex => ex.id !== id));
  }

  function usarSugestao(nome) {
    if (formEx !== null && !formEx.id) {
      setFormEx(prev => ({ ...prev, nome }));
    } else {
      setFormEx({ ...EX_VAZIO, nome });
    }
    setErrosEx({});
  }

  const sugestoesUnicas = [...new Set(form.partes.flatMap(p => CATALOGO[p] ?? []))];
  const nomesAdicionados = new Set(exsLocais.map(ex => ex.nome));
  const exerciciosDestaFicha = fichaSelecionada
    ? exercicios.filter(ex => ex.fichaId === fichaSelecionada.id)
    : [];

  const fichaModal = modalAberta && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl shadow-black/20 animate-scale-in flex flex-col max-h-[90vh]">

        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {fichaEditando ? 'Editar Ficha' : 'Nova Ficha de Treino'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {fichaEditando ? 'Altere as informações, grupos musculares e exercícios.' : 'Configure nome, grupos musculares e monte os exercícios.'}
            </p>
          </div>
          <button onClick={fecharModal} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={salvarFicha} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={LBL}>Nome da Ficha</label>
                <input
                  type="text" maxLength={60} value={form.nome}
                  onChange={e => { setForm(p => ({ ...p, nome: e.target.value })); setErrosForm(p => ({ ...p, nome: undefined })); }}
                  className={inputCls(!!errosForm.nome)} placeholder="Ex: Treino A — Peito"
                  autoFocus
                />
                <FieldError msg={errosForm.nome} />
              </div>
              <div>
                <label className={LBL}>Objetivo Principal</label>
                <select value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))} className={inputCls(false)}>
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Emagrecimento">Emagrecimento</option>
                  <option value="Resistência">Resistência</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={LBL + ' mb-0'}>Grupos Musculares</label>
                {form.partes.length > 0 && (
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {form.partes.length} selecionado{form.partes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PARTES_CORPO.map(parte => {
                  const sel = form.partes.includes(parte.id);
                  return (
                    <button
                      key={parte.id}
                      type="button"
                      onClick={() => toggleParte(parte.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                        sel
                          ? 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/25 scale-105'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-500 hover:text-green-600 dark:hover:text-green-400'
                      }`}
                    >
                      {sel && <Check size={10} strokeWidth={3} />}
                      {parte.label}
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errosForm.partes} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={LBL + ' mb-0'}>
                  Exercícios
                  {exsLocais.length > 0 && (
                    <span className="ml-2 font-normal text-zinc-400 normal-case tracking-normal">{exsLocais.length} adicionado{exsLocais.length !== 1 ? 's' : ''}</span>
                  )}
                </label>
              </div>

              {exsLocais.length > 0 && (
                <div className="space-y-2 mb-4">
                  {exsLocais.map((ex, i) => (
                    <div
                      key={ex.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                        formEx?.id === ex.id
                          ? 'border-blue-400 dark:border-blue-500 bg-blue-500/5'
                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60'
                      }`}
                    >
                      <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{ex.nome}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="text-green-600 dark:text-green-400 font-bold">{ex.series}</span> séries × {ex.reps}
                          </span>
                          {ex.carga && <span className="text-xs font-semibold text-orange-500">{ex.carga}</span>}
                          <span className="flex items-center gap-0.5 text-xs text-zinc-400">
                            <Timer size={10} />{ex.descanso}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => editarExLocal(ex)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removerExLocal(ex.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sugestoesUnicas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2">
                    Sugestões para os grupos selecionados — clique para pré-preencher:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sugestoesUnicas.map(s => {
                      const adicionado = nomesAdicionados.has(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => !adicionado && usarSugestao(s)}
                          disabled={adicionado}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all duration-200 ${
                            adicionado
                              ? 'opacity-40 cursor-default bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 line-through'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-green-500 hover:text-white hover:border-green-500 cursor-pointer'
                          }`}
                        >
                          {adicionado ? <Check size={9} strokeWidth={3} /> : <Plus size={9} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formEx !== null ? (
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 bg-white dark:bg-zinc-900 space-y-3 animate-fade-up">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {formEx.id ? 'Editando exercício' : 'Novo exercício'}
                  </p>
                  <div>
                    <label className={LBL}>Nome do Exercício</label>
                    <input
                      type="text" maxLength={60} value={formEx.nome}
                      onChange={e => { setFormEx(p => ({ ...p, nome: e.target.value })); setErrosEx(p => ({ ...p, nome: undefined })); }}
                      className={inputCls(!!errosEx.nome)} placeholder="Ex: Supino Reto"
                      autoFocus
                    />
                    <FieldError msg={errosEx.nome} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LBL}>Séries</label>
                      <input
                        type="text" maxLength={5} value={formEx.series}
                        onChange={e => { setFormEx(p => ({ ...p, series: e.target.value })); setErrosEx(p => ({ ...p, series: undefined })); }}
                        className={inputCls(!!errosEx.series)} placeholder="Ex: 4"
                      />
                      <FieldError msg={errosEx.series} />
                    </div>
                    <div>
                      <label className={LBL}>Repetições</label>
                      <input
                        type="text" maxLength={20} value={formEx.reps}
                        onChange={e => { setFormEx(p => ({ ...p, reps: e.target.value })); setErrosEx(p => ({ ...p, reps: undefined })); }}
                        className={inputCls(!!errosEx.reps)} placeholder="Ex: 10 a 12"
                      />
                      <FieldError msg={errosEx.reps} />
                    </div>
                    <div>
                      <label className={LBL}>Carga (opcional)</label>
                      <input
                        type="text" maxLength={10} value={formEx.carga}
                        onChange={e => setFormEx(p => ({ ...p, carga: e.target.value }))}
                        className={inputCls(false)} placeholder="Ex: 25kg"
                      />
                    </div>
                    <div>
                      <label className={LBL}>Descanso</label>
                      <input
                        type="text" maxLength={10} value={formEx.descanso}
                        onChange={e => { setFormEx(p => ({ ...p, descanso: e.target.value })); setErrosEx(p => ({ ...p, descanso: undefined })); }}
                        className={inputCls(!!errosEx.descanso)} placeholder="Ex: 60s"
                      />
                      <FieldError msg={errosEx.descanso} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setFormEx(null); setErrosEx({}); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={salvarExLocal}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-500 hover:bg-green-400 text-white shadow-sm shadow-green-500/25 transition-all duration-200"
                    >
                      {formEx.id ? 'Salvar Alterações' : 'Adicionar à Ficha'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setFormEx({ ...EX_VAZIO }); setErrosEx({}); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-green-400 dark:hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-500/5 transition-all duration-200"
                >
                  <Plus size={14} />
                  Adicionar Exercício Manualmente
                </button>
              )}
            </div>

          </div>

          <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={fecharModal}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {fichaEditando ? 'Salvar Alterações' : 'Criar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">{fichaSelecionada.nome}</h2>
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
          <button
            onClick={() => abrirModal(fichaSelecionada)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
          >
            <Pencil size={14} />
            Editar Ficha
          </button>
        </header>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
                {['Exercício', 'Séries', 'Repetições', 'Carga', 'Descanso'].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${h !== 'Exercício' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {exerciciosDestaFicha.length > 0 ? exerciciosDestaFicha.map(ex => (
                <tr key={ex.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                  <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">{ex.nome}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 font-bold text-sm">{ex.series}</span>
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

        {fichaModal}
      </div>
    );
  }

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
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={15} />
          Nova Ficha
        </button>
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
            const qtd    = exercicios.filter(ex => ex.fichaId === ficha.id).length;
            const partes = ficha.partes ?? [];
            return (
              <div key={ficha.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-green-500/40 hover:shadow-md hover:shadow-zinc-200/60 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${OBJETIVO_COLORS[ficha.objetivo] ?? OBJETIVO_COLORS.Hipertrofia}`}>
                    {ficha.objetivo}
                  </span>
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
                </div>

                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 leading-snug">{ficha.nome}</h3>

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
