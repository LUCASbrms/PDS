import { useState, useMemo, useEffect } from 'react';
import Paginacao from '../components/Paginacao';
import {
  Search, Calendar, CheckCircle2, XCircle, Clock,
  Users, ClipboardCheck, RotateCcw, ChevronLeft, ChevronRight, X, CalendarDays,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { presencasApi } from '../api';

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

function initials(nome) {
  const parts = nome.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STATUS_CFG = {
  Presente: {
    badgeCls:  'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    rowCls:    'bg-green-50/60 dark:bg-green-500/5 border-l-[3px] border-l-green-500',
    avatarCls: 'bg-green-500/15 text-green-600 dark:text-green-400',
    icon:      <CheckCircle2 size={11} />,
  },
  Falta: {
    badgeCls:  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    rowCls:    'bg-red-50/60 dark:bg-red-500/5 border-l-[3px] border-l-red-500',
    avatarCls: 'bg-red-500/15 text-red-600 dark:text-red-400',
    icon:      <XCircle size={11} />,
  },
  Justificada: {
    badgeCls:  'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    rowCls:    'bg-orange-50/60 dark:bg-orange-500/5 border-l-[3px] border-l-orange-500',
    avatarCls: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    icon:      <Clock size={11} />,
  },
};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function ModalHistorico({ aluno, presencas, onFechar }) {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1); // 1-12
  const [ano, setAno] = useState(agora.getFullYear());

  function navegar(delta) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 1)  { novoMes = 12; novoAno--; }
    if (novoMes > 12) { novoMes = 1;  novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
  }

  // filtra do array já carregado — sem nova chamada à API
  const prefixo   = `${ano}-${String(mes).padStart(2, '0')}-`;
  const registros = presencas.filter(p => p.alunoId === aluno.id && p.data.startsWith(prefixo));

  // mapa dia -> status (string comparison, sem timezone issues)
  const mapaDias = {};
  registros.forEach(r => {
    mapaDias[parseInt(r.data.slice(8, 10), 10)] = r.status;
  });

  const diasNoMes    = new Date(ano, mes, 0).getDate();
  const offsetInicio = new Date(ano, mes - 1, 1).getDay(); // 0=Dom

  const presentes    = registros.filter(r => r.status === 'Presente').length;
  const faltas       = registros.filter(r => r.status === 'Falta').length;
  const justificadas = registros.filter(r => r.status === 'Justificada').length;
  const totalReg     = presentes + faltas + justificadas;
  const taxa         = totalReg > 0 ? Math.round((presentes / totalReg) * 100) : null;

  const diaCls = (status) => {
    if (status === 'Presente')    return 'bg-green-500 text-white font-bold';
    if (status === 'Falta')       return 'bg-red-500 text-white font-bold';
    if (status === 'Justificada') return 'bg-orange-400 text-white font-bold';
    return 'text-zinc-400 dark:text-zinc-600';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {aluno.fotoUrl ? (
                <img src={`${API_SERVER}${aluno.fotoUrl}`} alt={aluno.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {initials(aluno.nome)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">{aluno.nome}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Histórico de Presença</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200">
            <X size={16} />
          </button>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={() => navegar(-1)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-zinc-900 dark:text-white">{MESES[mes - 1]} {ano}</span>
          <button onClick={() => navegar(+1)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 px-6 mb-5">
          {[
            { label: 'Presentes',    value: presentes,    cls: 'text-green-600 dark:text-green-400' },
            { label: 'Faltas',       value: faltas,       cls: 'text-red-600 dark:text-red-400' },
            { label: 'Justificadas', value: justificadas, cls: 'text-orange-500 dark:text-orange-400' },
            { label: 'Taxa',         value: taxa !== null ? `${taxa}%` : '—', cls: 'text-zinc-700 dark:text-zinc-200' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
              <p className={`text-lg font-black leading-none ${s.cls}`}>{s.value}</p>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendário */}
        <div className="px-6 pb-6">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Células de offset */}
            {Array.from({ length: offsetInicio }).map((_, i) => <div key={`off-${i}`} />)}
            {/* Dias do mês */}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
              const status = mapaDias[dia];
              return (
                <div
                  key={dia}
                  title={status || 'Sem registro'}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs transition-all duration-200 ${diaCls(status)}`}
                >
                  {dia}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 justify-center">
            {[
              { cor: 'bg-green-500',  label: 'Presente' },
              { cor: 'bg-red-500',    label: 'Falta' },
              { cor: 'bg-orange-400', label: 'Justificada' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${l.cor}`} />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Presenca({ alunos, presencas, setPresencas }) {
  const { addToast } = useToast();
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(hoje);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro]         = useState('todos');
  const [alunoHistorico, setAlunoHistorico] = useState(null);
  const [pagina, setPagina]         = useState(1);
  const POR_PAGINA = 15;

  useEffect(() => { setPagina(1); }, [busca, filtro, data]);

  function mudarData(novaData) {
    setData(novaData);
    setFiltro('todos');
  }

  function getStatus(alunoId) {
    return presencas.find(p => p.alunoId === alunoId && p.data === data)?.status ?? null;
  }

  async function marcar(alunoId, novoStatus) {
    try {
      const salvo = await presencasApi.criar({ alunoId, data, status: novoStatus });
      setPresencas(prev => {
        const idx = prev.findIndex(p => p.alunoId === alunoId && p.data === data);
        if (idx >= 0) return prev.map((p, i) => (i === idx ? salvo : p));
        return [...prev, salvo];
      });
    } catch (err) {
      addToast(err.message || 'Erro ao registrar presença.', 'error');
    }
  }

  async function desmarcar(alunoId) {
    const existente = presencas.find(p => p.alunoId === alunoId && p.data === data);
    if (!existente) return;
    try {
      await presencasApi.excluir(existente.id);
      setPresencas(prev => prev.filter(p => !(p.alunoId === alunoId && p.data === data)));
    } catch (err) {
      addToast(err.message || 'Erro ao remover presença.', 'error');
    }
  }

  async function marcarTodosPresentes() {
    const naoMarcados = alunos.filter(a => getStatus(a.id) === null);
    if (!naoMarcados.length) {
      addToast('Todos os alunos já estão registrados.', 'info');
      return;
    }
    try {
      const salvos = await Promise.all(
        naoMarcados.map(a => presencasApi.criar({ alunoId: a.id, data, status: 'Presente' }))
      );
      setPresencas(prev => [...prev, ...salvos]);
      addToast(`${salvos.length} aluno(s) marcado(s) como presente(s)!`, 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao registrar presenças.', 'error');
    }
  }

  const doDay      = presencas.filter(p => p.data === data);
  const presentes  = doDay.filter(p => p.status === 'Presente').length;
  const faltas     = doDay.filter(p => p.status === 'Falta').length;
  const justific   = doDay.filter(p => p.status === 'Justificada').length;
  const pendentes  = alunos.length - presentes - faltas - justific;
  const registrados = alunos.length - pendentes;
  const progresso  = alunos.length > 0 ? Math.round((registrados / alunos.length) * 100) : 0;

  const alunosFiltrados = useMemo(() => {
    return alunos.filter(a => {
      if (!a.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      const s = presencas.find(p => p.alunoId === a.id && p.data === data)?.status ?? null;
      if (filtro === 'todos') return true;
      if (filtro === 'pendente') return s === null;
      return s === filtro;
    });
  }, [alunos, busca, filtro, presencas, data]);

  const alunosPaginados = alunosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const nomeDia      = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(data + 'T12:00:00').getDay()];
  const isHoje       = data === hoje;
  const dataFmt      = data.split('-').reverse().join('/');

  const statCards = [
    { label: 'Presentes',    value: presentes, f: 'Presente',    iconBg: 'bg-green-500/10 dark:bg-green-500/15',   iconCl: 'text-green-500',  accent: 'border-b-2 border-b-green-500/30',                   icon: <CheckCircle2 size={18} /> },
    { label: 'Faltas',       value: faltas,    f: 'Falta',       iconBg: 'bg-red-500/10 dark:bg-red-500/15',       iconCl: 'text-red-500',    accent: 'border-b-2 border-b-red-500/30',                     icon: <XCircle size={18} /> },
    { label: 'Justificadas', value: justific,  f: 'Justificada', iconBg: 'bg-orange-500/10 dark:bg-orange-500/15', iconCl: 'text-orange-500', accent: 'border-b-2 border-b-orange-500/30',                  icon: <Clock size={18} /> },
    { label: 'Pendentes',    value: pendentes, f: 'pendente',    iconBg: 'bg-zinc-100 dark:bg-zinc-800',           iconCl: 'text-zinc-400',   accent: 'border-b-2 border-b-zinc-300 dark:border-b-zinc-600', icon: <Users size={18} /> },
  ];

  const filtros = [
    { id: 'todos',       label: 'Todos',        count: alunos.length },
    { id: 'Presente',    label: 'Presentes',    count: presentes },
    { id: 'Falta',       label: 'Faltas',       count: faltas },
    { id: 'Justificada', label: 'Justificadas', count: justific },
    { id: 'pendente',    label: 'Pendentes',    count: pendentes },
  ];

  return (
    <div>
      {/* Header */}
      <header className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Registro</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Controle de Presença</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isHoje ? 'Hoje' : nomeDia} · {dataFmt} · {registrados}/{alunos.length} registrado{registrados !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="date"
              value={data}
              onChange={e => mudarData(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
            />
          </div>
          <button
            onClick={marcarTodosPresentes}
            disabled={pendentes === 0}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <ClipboardCheck size={15} />
            Marcar todos presentes
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Progresso do registro
          </span>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{progresso}%</span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
        {progresso === 100 && (
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-2 animate-fade-up">
            ✓ Todos os alunos foram registrados!
          </p>
        )}
      </div>

      {/* Stat cards — clicáveis para filtrar */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {statCards.map(card => (
          <button
            key={card.label}
            onClick={() => setFiltro(filtro === card.f ? 'todos' : card.f)}
            className={`group text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 ${card.accent} hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-300 ${filtro === card.f ? 'ring-2 ring-green-500/25 shadow-sm' : ''}`}
          >
            <div className={`${card.iconBg} ${card.iconCl} p-2.5 rounded-xl inline-flex mb-3 transition-transform duration-300 group-hover:scale-110`}>
              {card.icon}
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{card.value}</p>
          </button>
        ))}
      </div>

      {/* Search + filter tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative max-w-sm w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 overflow-x-auto">
          {filtros.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filtro === f.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {f.label}{' '}
              <span className={`${filtro === f.id ? 'text-green-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Student list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {alunosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={22} className="text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-400 italic">Nenhum aluno encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {alunosPaginados.map(aluno => {
              const status = getStatus(aluno.id);
              const cfg    = status ? STATUS_CFG[status] : null;

              return (
                <div
                  key={aluno.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-all duration-300 ${
                    cfg ? cfg.rowCls : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full shrink-0 select-none overflow-hidden transition-all duration-300">
                    {aluno.fotoUrl ? (
                      <img
                        src={`${API_SERVER}${aluno.fotoUrl}`}
                        alt={aluno.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-sm font-bold ${
                          cfg
                            ? cfg.avatarCls
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {initials(aluno.nome)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <button
                    onClick={() => setAlunoHistorico(aluno)}
                    className="flex-1 min-w-0 text-left group"
                  >
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {aluno.nome}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{aluno.plano} · {aluno.telefone}</p>
                  </button>

                  {/* Action area */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setAlunoHistorico(aluno)}
                      title="Ver histórico"
                      className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all duration-200"
                    >
                      <CalendarDays size={14} />
                    </button>
                    {status ? (
                      <>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border animate-check-pop ${cfg.badgeCls}`}>
                          {cfg.icon}
                          {status}
                        </span>
                        <button
                          onClick={() => desmarcar(aluno.id)}
                          title="Desfazer"
                          className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => marcar(aluno.id, 'Presente')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <CheckCircle2 size={13} />
                          Presente
                        </button>
                        <button
                          onClick={() => marcar(aluno.id, 'Falta')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <XCircle size={13} />
                          Falta
                        </button>
                        <button
                          onClick={() => marcar(aluno.id, 'Justificada')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <Clock size={13} />
                          Justificada
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Paginacao
        pagina={pagina}
        totalItens={alunosFiltrados.length}
        porPagina={POR_PAGINA}
        onChange={setPagina}
      />

      {/* Modal histórico */}
      {alunoHistorico && (
        <ModalHistorico aluno={alunoHistorico} presencas={presencas} onFechar={() => setAlunoHistorico(null)} />
      )}
    </div>
  );
}
