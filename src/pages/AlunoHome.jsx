import { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell, CreditCard, CalendarCheck2,
  ChevronLeft, ChevronRight, ArrowRight,
  CheckCircle2, AlertTriangle, Coffee, Loader2,
} from 'lucide-react';
import { presencasApi } from '../api';

const MESES       = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_HEADER = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// Mapeia getDay() → chave de treinosSemana (null = fim de semana)
const DIA_KEY   = [null, 'segunda', 'terca', 'quarta', 'quinta', 'sexta', null];
const DIA_LABEL = { segunda:'Segunda-feira', terca:'Terça-feira', quarta:'Quarta-feira', quinta:'Quinta-feira', sexta:'Sexta-feira' };

function formatarData(str) {
  if (!str) return '—';
  const [ano, mes, dia] = str.split('-');
  return `${dia}/${mes}/${ano}`;
}

function diaCls(status) {
  if (status === 'Presente')    return 'bg-green-500 text-white font-bold';
  if (status === 'Falta')       return 'bg-red-500/80 text-white font-bold';
  if (status === 'Justificada') return 'bg-orange-400 text-white font-bold';
  return 'text-zinc-400 dark:text-zinc-600';
}

export default function AlunoHome({ aluno, fichas, mensalidades, setTelaAtiva }) {
  const hoje       = new Date();
  const hojeStr    = hoje.toISOString().slice(0, 10);
  const diaIdx     = hoje.getDay();                              // 0–6
  const diaSemana  = DIA_KEY[diaIdx];                           // 'segunda' … ou null
  const ehFdS      = diaIdx === 0 || diaIdx === 6;
  const nomeTreino = diaSemana ? (aluno?.treinosSemana?.[diaSemana] || '') : '';
  const fichaHoje  = nomeTreino ? fichas.find(f => f.nome === nomeTreino) ?? null : null;

  // ── Mensalidade mais recente do aluno ─────────────────────────────────────
  const mensalidadeAtual = useMemo(() =>
    mensalidades
      .filter(m => String(m.alunoId) === String(aluno?.id))
      .sort((a, b) => new Date(b.vencimento) - new Date(a.vencimento))[0] ?? null,
    [mensalidades, aluno?.id]
  );

  // ── Presença do mês ───────────────────────────────────────────────────────
  const [mes, setMes]                       = useState(hoje.getMonth() + 1);
  const [ano, setAno]                       = useState(hoje.getFullYear());
  const [registros, setRegistros]           = useState([]);
  const [carregando, setCarregando]         = useState(false);

  useEffect(() => {
    if (!aluno?.id) return;
    setCarregando(true);
    presencasApi.historico(aluno.id, mes, ano)
      .then(data  => setRegistros(data || []))
      .catch(()   => setRegistros([]))
      .finally(() => setCarregando(false));
  }, [aluno?.id, mes, ano]);

  function navMes(delta) {
    let m = mes + delta, a = ano;
    if (m < 1)  { m = 12; a--; }
    if (m > 12) { m = 1;  a++; }
    setMes(m); setAno(a);
  }

  const mapaDias      = {};
  registros.forEach(r => { mapaDias[parseInt(r.data.slice(8, 10), 10)] = r.status; });
  const diasNoMes     = new Date(ano, mes, 0).getDate();
  const offsetInicio  = new Date(ano, mes - 1, 1).getDay();
  const presentes     = registros.filter(r => r.status === 'Presente').length;
  const faltas        = registros.filter(r => r.status === 'Falta').length;
  const taxa          = registros.length > 0 ? Math.round((presentes / registros.length) * 100) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <header>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Bem-vindo(a)</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Olá, {aluno?.nome?.split(' ')[0] || 'aluno'}!
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Treino do dia ───────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Dumbbell size={16} className="text-green-500" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Treino de Hoje</h3>
            </div>
            {diaSemana && (
              <span className="text-xs text-zinc-400">{DIA_LABEL[diaSemana]}</span>
            )}
          </div>

          {ehFdS ? (
            /* Fim de semana */
            <div className="flex flex-col items-center py-8 text-center">
              <Coffee size={36} className="text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Dia de descanso</p>
              <p className="text-xs text-zinc-400 mt-1">Aproveite o final de semana para recuperar!</p>
            </div>

          ) : fichaHoje ? (
            /* Ficha encontrada */
            <>
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-3">
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
                  {fichaHoje.objetivo}
                </p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">{fichaHoje.nome}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {fichaHoje.exercicios?.length ?? 0} exercício(s)
                </p>
              </div>

              <div className="space-y-0">
                {(fichaHoje.exercicios ?? []).slice(0, 4).map(ex => (
                  <div key={ex.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate mr-2">{ex.nome}</span>
                    <span className="text-xs text-zinc-400 shrink-0">{ex.series}×{ex.reps}</span>
                  </div>
                ))}
                {(fichaHoje.exercicios?.length ?? 0) > 4 && (
                  <p className="text-xs text-zinc-400 pt-2 text-center">
                    +{fichaHoje.exercicios.length - 4} exercícios
                  </p>
                )}
              </div>

              <button
                onClick={() => setTelaAtiva('treinos')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-green-600 dark:text-green-400 bg-green-500/8 hover:bg-green-500 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-200"
              >
                Ver ficha completa
                <ArrowRight size={14} />
              </button>
            </>

          ) : nomeTreino ? (
            /* Nome definido mas ficha não encontrada */
            <div className="flex flex-col items-center py-8 text-center">
              <Dumbbell size={36} className="text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">{nomeTreino}</p>
              <p className="text-xs text-zinc-400 mt-1">Ficha ainda não cadastrada pelo professor.</p>
            </div>

          ) : (
            /* Sem treino hoje */
            <div className="flex flex-col items-center py-8 text-center">
              <Coffee size={36} className="text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Sem treino hoje</p>
              <p className="text-xs text-zinc-400 mt-1">Nenhum treino programado para hoje.</p>
              <button
                onClick={() => setTelaAtiva('treinos')}
                className="mt-3 text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
              >
                Ver todas as fichas →
              </button>
            </div>
          )}
        </section>

        {/* ── Status financeiro ────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <CreditCard size={16} className="text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Financeiro</h3>
          </div>

          {mensalidadeAtual ? (
            <>
              <div className={`rounded-xl p-4 mb-4 border ${
                mensalidadeAtual.status === 'Pago'
                  ? 'bg-green-500/5 border-green-500/20'
                  : mensalidadeAtual.status === 'Atrasado'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-orange-500/5 border-orange-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {mensalidadeAtual.status === 'Pago'
                    ? <CheckCircle2 size={15} className="text-green-500" />
                    : <AlertTriangle size={15} className={mensalidadeAtual.status === 'Atrasado' ? 'text-red-500' : 'text-orange-500'} />
                  }
                  <span className={`text-sm font-bold ${
                    mensalidadeAtual.status === 'Pago'     ? 'text-green-600 dark:text-green-400'
                    : mensalidadeAtual.status === 'Atrasado' ? 'text-red-600 dark:text-red-400'
                    : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {mensalidadeAtual.status === 'Pago' ? 'Em dia!' : mensalidadeAtual.status === 'Atrasado' ? 'Em atraso!' : 'Pendente'}
                  </span>
                </div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">
                  R$ {Number(mensalidadeAtual.valor).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Plano {mensalidadeAtual.plano} · venc. {formatarData(mensalidadeAtual.vencimento)}
                </p>
              </div>

              {mensalidadeAtual.status !== 'Pago' && (
                <button
                  onClick={() => setTelaAtiva('pagamento')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/8 hover:bg-blue-500 hover:text-white border border-blue-500/20 hover:border-blue-500 transition-all duration-200"
                >
                  Pagar agora
                  <ArrowRight size={14} />
                </button>
              )}

              <button
                onClick={() => setTelaAtiva('pagamento')}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
              >
                Ver histórico completo
                <ArrowRight size={12} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <CreditCard size={36} className="text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400">Nenhuma mensalidade registrada.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── Histórico de presença ─────────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
              <CalendarCheck2 size={16} className="text-violet-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Presença</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navMes(-1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 min-w-[130px] text-center">
              {MESES[mes - 1]} {ano}
            </span>
            <button
              onClick={() => navMes(+1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Presenças', value: presentes, cls: 'text-green-600 dark:text-green-400',   bg: 'bg-green-500/8' },
            { label: 'Faltas',    value: faltas,    cls: 'text-red-600 dark:text-red-400',       bg: 'bg-red-500/8'   },
            { label: 'Taxa',      value: taxa !== null ? `${taxa}%` : '—', cls: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/8' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-black leading-none ${s.cls}`}>{s.value}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendário */}
        {carregando ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="text-violet-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 mb-1">
              {DIAS_HEADER.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offsetInicio }).map((_, i) => <div key={`off-${i}`} />)}
              {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
                const status = mapaDias[dia];
                const dStr   = `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                const ehHoje = dStr === hojeStr;
                return (
                  <div
                    key={dia}
                    title={status || (ehHoje ? 'Hoje' : 'Sem registro')}
                    className={`aspect-square flex items-center justify-center rounded-lg text-xs transition-all duration-200 ${
                      status
                        ? diaCls(status)
                        : ehHoje
                        ? 'ring-2 ring-violet-500 text-violet-600 dark:text-violet-400 font-bold'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {dia}
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
              {[
                { cor: 'bg-green-500',  label: 'Presente'    },
                { cor: 'bg-red-500',    label: 'Falta'       },
                { cor: 'bg-orange-400', label: 'Justificada' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.cor}`} />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
