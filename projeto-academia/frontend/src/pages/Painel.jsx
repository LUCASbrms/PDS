import { useMemo } from 'react';
import { Users, Zap, TrendingUp, AlertTriangle, UserPlus, CreditCard, ArrowRight, CalendarCheck2, GraduationCap, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatarData(str) {
  if (!str) return '—';
  const [ano, mes, dia] = str.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function Painel({ setTelaAtiva, alunos, mensalidades, presencas, professores, perfil = 'dono' }) {
  const { isDark } = useTheme();
  const hoje              = new Date().toISOString().slice(0, 10);
  const totalAlunos       = alunos.length;
  const alunosAtivos      = alunos.filter(a => a.status === 'Ativo').length;
  const faturamentoReal   = mensalidades
    .filter(m => m.status === 'Pago')
    .reduce((soma, m) => soma + m.valor, 0);
  const inadimplentes     = mensalidades.filter(m => m.status !== 'Pago').length;
  const presentesHoje     = presencas.filter(p => p.data === hoje && p.status === 'Presente').length;
  const totalProfessores  = (professores || []).length;

  // Lista de inadimplentes com dias de atraso (só para dono)
  const inadimplentesLista = perfil === 'dono' ? alunos
    .map(aluno => {
      const pendente = mensalidades
        .filter(m => String(m.alunoId) === String(aluno.id) && m.status !== 'Pago')
        .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))[0];
      if (!pendente) return null;
      const diasAtraso = Math.floor((new Date() - new Date(pendente.vencimento + 'T00:00:00')) / (1000 * 60 * 60 * 24));
      if (diasAtraso < 0) return null;
      return { aluno, mensalidade: pendente, diasAtraso };
    })
    .filter(Boolean)
    .sort((a, b) => b.diasAtraso - a.diasAtraso)
  : [];

  // ── Dados para gráficos ───────────────────────────────────────────────────
  const receitaChart = useMemo(() => {
    const agora = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d     = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const doMes = mensalidades.filter(m => m.vencimento?.startsWith(chave));
      return {
        mes:          MESES_ABREV[d.getMonth()],
        Pago:         +doMes.filter(m => m.status === 'Pago').reduce((s, m) => s + m.valor, 0).toFixed(2),
        'Em aberto':  +doMes.filter(m => m.status !== 'Pago').reduce((s, m) => s + m.valor, 0).toFixed(2),
      };
    });
  }, [mensalidades]);

  const distribuicaoStatus = useMemo(() => [
    { name: 'Pago',     value: mensalidades.filter(m => m.status === 'Pago').length,     cor: '#22c55e' },
    { name: 'Pendente', value: mensalidades.filter(m => m.status === 'Pendente').length, cor: '#f97316' },
    { name: 'Atrasado', value: mensalidades.filter(m => m.status === 'Atrasado').length, cor: '#ef4444' },
  ].filter(d => d.value > 0), [mensalidades]);

  const tickStyle   = { fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 };
  const gridColor   = isDark ? '#27272a' : '#f4f4f5';
  const tooltipBox  = { background: isDark ? '#18181b' : '#fff', border: `1px solid ${isDark ? '#3f3f46' : '#e4e4e7'}`, borderRadius: 10, fontSize: 12 };
  const tooltipLbl  = { color: isDark ? '#e4e4e7' : '#18181b', fontWeight: 700 };

  const todosCards = [
    {
      label: 'Total de Alunos',
      value: totalAlunos,
      icon: <Users size={20} />,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconColor: 'text-blue-500',
      accent: 'border-b-2 border-b-blue-500/30',
      perfis: ['dono', 'professor'],
    },
    {
      label: 'Alunos Ativos',
      value: alunosAtivos,
      icon: <Zap size={20} />,
      iconBg: 'bg-green-500/10 dark:bg-green-500/15',
      iconColor: 'text-green-500',
      accent: 'border-b-2 border-b-green-500/30',
      perfis: ['dono', 'professor'],
    },
    {
      label: 'Faturamento Pago',
      value: `R$ ${faturamentoReal.toFixed(2)}`,
      icon: <TrendingUp size={20} />,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      accent: 'border-b-2 border-b-emerald-500/30',
      perfis: ['dono'],
    },
    {
      label: 'Pagamentos Pendentes',
      value: inadimplentes,
      icon: <AlertTriangle size={20} />,
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/15',
      iconColor: 'text-orange-500',
      accent: 'border-b-2 border-b-orange-500/30',
      perfis: ['dono'],
    },
    {
      label: 'Presentes Hoje',
      value: presentesHoje,
      sub: `de ${totalAlunos} alunos`,
      icon: <CalendarCheck2 size={20} />,
      iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
      iconColor: 'text-violet-500',
      accent: 'border-b-2 border-b-violet-500/30',
      tela: 'presenca',
      perfis: ['dono', 'professor'],
    },
    {
      label: 'Professores',
      value: totalProfessores,
      icon: <GraduationCap size={20} />,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconColor: 'text-blue-400',
      accent: 'border-b-2 border-b-blue-400/30',
      tela: 'professores',
      perfis: ['dono'],
    },
  ];
  const cards = todosCards.filter(c => c.perfis.includes(perfil));

  const todasAcoes = [
    { label: 'Cadastrar Aluno',      icon: <UserPlus size={16} />,       tela: 'alunos',      variant: 'primary',    perfis: ['dono', 'professor'] },
    { label: 'Registrar Pagamento',  icon: <CreditCard size={16} />,     tela: 'financeiro',  variant: 'secondary',  perfis: ['dono'] },
    { label: 'Controle de Presença', icon: <CalendarCheck2 size={16} />, tela: 'presenca',    variant: 'secondary',  perfis: ['dono', 'professor'] },
    { label: 'Novo Professor',       icon: <GraduationCap size={16} />,  tela: 'professores', variant: 'secondary',  perfis: ['dono'] },
  ];
  const acoes = todasAcoes.filter(a => a.perfis.includes(perfil));

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-1">Dashboard</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Visão Geral</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Acompanhe os indicadores da sua academia em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
        {cards.map((card, i) => {
          const inner = (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} ${card.iconColor} p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{card.value}</p>
              {card.sub && <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>}
            </>
          );
          const cls = `group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 ${card.accent} hover:shadow-md hover:shadow-zinc-200/60 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-300 text-left w-full`;
          return card.tela ? (
            <button key={card.label} onClick={() => setTelaAtiva(card.tela)} className={cls} style={{ animationDelay: `${i * 60}ms` }}>
              {inner}
            </button>
          ) : (
            <div key={card.label} className={cls} style={{ animationDelay: `${i * 60}ms` }}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-5">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          {acoes.map(acao => (
            <button
              key={acao.tela}
              onClick={() => setTelaAtiva(acao.tela)}
              className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                acao.variant === 'primary'
                  ? 'bg-green-500 hover:bg-green-400 text-white shadow-md shadow-green-500/25 hover:shadow-green-500/35'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
              }`}
            >
              {acao.icon}
              {acao.label}
              <ArrowRight size={14} className="ml-0.5 opacity-60 -translate-x-1 group-hover:translate-x-0 transition-transform duration-200" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Gráficos (só dono) ── */}
      {perfil === 'dono' && mensalidades.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Bar chart — evolução 6 meses */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">Evolução</p>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-5">Receita dos Últimos 6 Meses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={receitaChart} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip
                  formatter={(v, name) => [`R$ ${Number(v).toFixed(2)}`, name]}
                  contentStyle={tooltipBox}
                  labelStyle={tooltipLbl}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}
                />
                <Bar dataKey="Pago"        fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Em aberto"   fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 justify-end">
              {[['#22c55e', 'Pago'], ['#f97316', 'Em aberto']].map(([cor, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: cor }} />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie chart — distribuição de status */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">Distribuição</p>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Status das Mensalidades</h3>
            {distribuicaoStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={distribuicaoStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {distribuicaoStatus.map(d => <Cell key={d.name} fill={d.cor} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, name]}
                      contentStyle={tooltipBox}
                      labelStyle={tooltipLbl}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-2">
                  {distribuicaoStatus.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: d.cor }} />
                        <span className="text-zinc-600 dark:text-zinc-400">{d.name}</span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Sem dados</div>
            )}
          </div>
        </div>
      )}

      {/* ── Inadimplentes (só dono) ── */}
      {inadimplentesLista.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Alunos com Mensalidade em Aberto
            </h3>
            <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
              {inadimplentesLista.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {inadimplentesLista.map(({ aluno, mensalidade, diasAtraso }) => (
              <div key={aluno.id} className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{aluno.nome}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Venceu em {formatarData(mensalidade.vencimento)} · R$ {Number(mensalidade.valor).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    diasAtraso >= 30
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                      : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                  }`}>
                    {diasAtraso}d em atraso
                  </span>
                  <button
                    onClick={() => setTelaAtiva('financeiro')}
                    className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
                  >
                    Baixar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
