import { Users, Zap, TrendingUp, AlertTriangle, UserPlus, CreditCard, ArrowRight, CalendarCheck2, GraduationCap } from 'lucide-react';

export default function Painel({ setTelaAtiva, alunos, mensalidades, presencas, professores }) {
  const hoje              = new Date().toISOString().slice(0, 10);
  const totalAlunos       = alunos.length;
  const alunosAtivos      = alunos.filter(a => a.status === 'Ativo').length;
  const faturamentoReal   = mensalidades
    .filter(m => m.status === 'Pago')
    .reduce((soma, m) => soma + m.valor, 0);
  const inadimplentes     = mensalidades.filter(m => m.status !== 'Pago').length;
  const presentesHoje     = presencas.filter(p => p.data === hoje && p.status === 'Presente').length;
  const totalProfessores  = (professores || []).length;

  const cards = [
    {
      label: 'Total de Alunos',
      value: totalAlunos,
      icon: <Users size={20} />,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconColor: 'text-blue-500',
      accent: 'border-b-2 border-b-blue-500/30',
    },
    {
      label: 'Alunos Ativos',
      value: alunosAtivos,
      icon: <Zap size={20} />,
      iconBg: 'bg-green-500/10 dark:bg-green-500/15',
      iconColor: 'text-green-500',
      accent: 'border-b-2 border-b-green-500/30',
    },
    {
      label: 'Faturamento Pago',
      value: `R$ ${faturamentoReal.toFixed(2)}`,
      icon: <TrendingUp size={20} />,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      accent: 'border-b-2 border-b-emerald-500/30',
    },
    {
      label: 'Pagamentos Pendentes',
      value: inadimplentes,
      icon: <AlertTriangle size={20} />,
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/15',
      iconColor: 'text-orange-500',
      accent: 'border-b-2 border-b-orange-500/30',
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
    },
    {
      label: 'Professores',
      value: totalProfessores,
      icon: <GraduationCap size={20} />,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconColor: 'text-blue-400',
      accent: 'border-b-2 border-b-blue-400/30',
      tela: 'professores',
    },
  ];

  const acoes = [
    { label: 'Cadastrar Aluno',      icon: <UserPlus size={16} />,       tela: 'alunos',      variant: 'primary' },
    { label: 'Registrar Pagamento',  icon: <CreditCard size={16} />,     tela: 'financeiro',  variant: 'secondary' },
    { label: 'Controle de Presença', icon: <CalendarCheck2 size={16} />, tela: 'presenca',    variant: 'secondary' },
    { label: 'Novo Professor',       icon: <GraduationCap size={16} />,  tela: 'professores', variant: 'secondary' },
  ];

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
    </div>
  );
}
