import { useState } from 'react';
import { ArrowLeft, Dumbbell, Plus, X, Check, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DIAS_SEMANA = [
  { key: 'segunda', label: 'Segunda-feira', abrev: 'SEG' },
  { key: 'terca',   label: 'Terça-feira',   abrev: 'TER' },
  { key: 'quarta',  label: 'Quarta-feira',  abrev: 'QUA' },
  { key: 'quinta',  label: 'Quinta-feira',  abrev: 'QUI' },
  { key: 'sexta',   label: 'Sexta-feira',   abrev: 'SEX' },
];

function getInitials(nome) {
  return nome.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

const STATUS_MAP = {
  Ativo:    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Pendente: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Inativo:  'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_MAP[status] ?? STATUS_MAP.Inativo}`}>
      {status}
    </span>
  );
}

const selectCls =
  'w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 ' +
  'rounded-xl px-2.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none ' +
  'focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-200 cursor-pointer';

function DiaCard({ dia, fichaId, fichas, onAlterar, onRemover, animDelay }) {
  const [adicionando, setAdicionando] = useState(false);
  const [novaFichaId, setNovaFichaId] = useState('');

  const ficha = fichas.find(f => String(f.id) === String(fichaId));
  const temTreino = !!fichaId && fichaId !== '';

  function confirmar() {
    if (!novaFichaId) return;
    onAlterar(novaFichaId);
    setAdicionando(false);
    setNovaFichaId('');
  }

  function cancelar() {
    setAdicionando(false);
    setNovaFichaId('');
  }

  const cardBase = {
    animationDelay: `${animDelay}ms`,
    animationFillMode: 'both',
  };

  /* ── Vazio: nenhum treino neste dia ── */
  if (!temTreino && !adicionando) {
    return (
      <button
        onClick={() => setAdicionando(true)}
        style={cardBase}
        className="animate-fade-up w-full flex flex-col items-center justify-center gap-3 bg-zinc-50/80 dark:bg-zinc-900/40
          border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 min-h-[196px]
          hover:border-green-400 dark:hover:border-green-500/50 hover:bg-green-500/5
          active:scale-[0.98] transition-all duration-200 group cursor-pointer"
      >
        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest group-hover:text-green-500 transition-colors duration-200">
          {dia.abrev}
        </span>
        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-green-500/15 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110">
          <Plus size={18} className="text-zinc-400 group-hover:text-green-500 transition-colors duration-200" />
        </div>
        <span className="text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-200 text-center leading-relaxed">
          Adicionar<br />treino
        </span>
      </button>
    );
  }

  /* ── Adicionando: selecionando treino ── */
  if (!temTreino && adicionando) {
    return (
      <div
        style={cardBase}
        className="animate-scale-in flex flex-col gap-3 bg-white dark:bg-zinc-900
          border-2 border-green-400/50 dark:border-green-500/40 rounded-2xl p-4 min-h-[196px]
          shadow-md shadow-green-500/10"
      >
        <span className="text-xs font-black text-green-500 uppercase tracking-widest">{dia.abrev}</span>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Escolha o treino:</p>

        {fichas.length === 0 ? (
          <p className="text-xs text-zinc-400 italic flex-1">Nenhum treino cadastrado.</p>
        ) : (
          <select
            value={novaFichaId}
            onChange={e => setNovaFichaId(e.target.value)}
            className={selectCls}
            autoFocus
          >
            <option value="">Selecionar...</option>
            {fichas.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        )}

        <div className="flex gap-2 mt-auto">
          <button
            onClick={confirmar}
            disabled={!novaFichaId}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500
              disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 active:bg-green-600
              text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200 hover:-translate-y-px"
          >
            <Check size={12} strokeWidth={3} />
            Confirmar
          </button>
          <button
            onClick={cancelar}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800
              text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700
              transition-all duration-200 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Com treino atribuído ── */
  return (
    <div
      style={cardBase}
      className="animate-fade-up flex flex-col gap-3 bg-white dark:bg-zinc-900
        border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 min-h-[196px]
        shadow-sm hover:shadow-md hover:shadow-zinc-200/60 dark:hover:shadow-black/30
        transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black
          bg-green-500/10 text-green-600 dark:text-green-400 uppercase tracking-widest">
          {dia.abrev}
        </span>
        <button
          onClick={onRemover}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600
            hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
          title="Remover treino"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex items-start gap-2.5 flex-1">
        <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Dumbbell size={16} className="text-green-500" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-zinc-900 dark:text-white leading-snug line-clamp-2">
            {ficha?.nome ?? 'Treino removido'}
          </p>
          {ficha?.objetivo && (
            <p className="text-xs text-zinc-400 mt-0.5">{ficha.objetivo}</p>
          )}
        </div>
      </div>

      <select
        value={fichaId}
        onChange={e => onAlterar(e.target.value)}
        className={selectCls}
        title="Alterar treino do dia"
      >
        {fichas.map(f => (
          <option key={f.id} value={f.id}>{f.nome}</option>
        ))}
      </select>
    </div>
  );
}

export default function AlunoDetalhe({ aluno, fichas, onVoltar, onAtualizar }) {
  const { addToast } = useToast();

  const treinosSemana = aluno.treinosSemana ?? {
    segunda: '', terca: '', quarta: '', quinta: '', sexta: '',
  };

  const diasComTreino = DIAS_SEMANA.filter(d => treinosSemana[d.key]).length;

  function alterarTreino(diaKey, fichaId) {
    onAtualizar(aluno.id, { ...treinosSemana, [diaKey]: fichaId });
    addToast('Treino atualizado!', 'success');
  }

  function removerTreino(diaKey) {
    onAtualizar(aluno.id, { ...treinosSemana, [diaKey]: '' });
    addToast('Treino removido.', 'warning');
  }

  return (
    <div className="animate-fade-up">
      {/* Botão voltar */}
      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white
          mb-6 transition-colors duration-200 group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
        Voltar para lista
      </button>

      {/* Card do aluno */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center
            text-white text-xl font-bold shadow-lg shadow-green-500/30 shrink-0 select-none">
            {getInitials(aluno.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight truncate">
              {aluno.nome}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={aluno.status} />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{aluno.plano}</span>
              <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{aluno.peso} kg</span>
              <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{aluno.altura} m</span>
            </div>
          </div>
        </div>

        {/* Resumo semanal */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-zinc-400 shrink-0" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {diasComTreino === 0
                ? 'Nenhum treino agendado esta semana'
                : `${diasComTreino} dia${diasComTreino !== 1 ? 's' : ''} de treino esta semana`}
            </span>
          </div>
          <div className="flex gap-1.5">
            {DIAS_SEMANA.map(d => (
              <div
                key={d.key}
                title={d.label}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200 ${
                  treinosSemana[d.key]
                    ? 'bg-green-500 text-white shadow-sm shadow-green-500/40'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}
              >
                {d.abrev[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda semanal */}
      <div>
        <div className="mb-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Programação</p>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Agenda Semanal</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {DIAS_SEMANA.map((dia, i) => (
            <DiaCard
              key={dia.key}
              dia={dia}
              fichaId={treinosSemana[dia.key]}
              fichas={fichas}
              onAlterar={fichaId => alterarTreino(dia.key, fichaId)}
              onRemover={() => removerTreino(dia.key)}
              animDelay={i * 60}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
