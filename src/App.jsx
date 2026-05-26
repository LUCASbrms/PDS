import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Dumbbell, DollarSign, LogOut,
  Sun, Moon, Zap, CalendarCheck2, GraduationCap, Settings,
  ChevronLeft, ChevronRight, Camera, Home,
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useToast } from './context/ToastContext';
import { alunosApi, professoresApi, donoApi, fichasApi, mensalidadesApi, presencasApi, uploadsApi, setToken } from './api';

const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
import Alunos       from './pages/Alunos';
import Painel       from './pages/Painel';
import Treinos      from './pages/Treinos';
import Financeiro   from './pages/Financeiro';
import Presenca     from './pages/Presenca';
import Professores  from './pages/Professores';
import Configuracoes from './pages/Configuracoes';
import Pagamento    from './pages/Pagamento';
import AlunoHome    from './pages/AlunoHome';
import Login        from './pages/Login';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const { addToast }            = useToast();

  const [usuario, setUsuario]                 = useState(() => {
    try {
      const token = localStorage.getItem('gymbalance_token');
      if (!token) return null;
      return JSON.parse(localStorage.getItem('gymbalance_usuario')) ?? null;
    } catch { return null; }
  });
  const [servidorOffline, setServidorOffline] = useState(false);
  const [telaAtiva, setTelaAtiva]             = useState(() => {
    try {
      const token = localStorage.getItem('gymbalance_token');
      if (!token) return 'painel';
      const u = JSON.parse(localStorage.getItem('gymbalance_usuario'));
      return u?.tipo === 'aluno' ? 'home' : 'painel';
    } catch { return 'painel'; }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Verifica se o servidor está online ────────────────────────────────────
  useEffect(() => {
    donoApi.obter()
      .catch(err => {
        if (err instanceof TypeError || err.message === 'Failed to fetch') {
          setServidorOffline(true);
        }
      });
  }, []);

  // ── Logout automático quando token expira ─────────────────────────────────
  useEffect(() => {
    function handleLogout() {
      setUsuario(null);
      setTelaAtiva('painel');
    }
    window.addEventListener('gymbalance:logout', handleLogout);
    return () => window.removeEventListener('gymbalance:logout', handleLogout);
  }, []);

  // ── Estado global ──────────────────────────────────────────────────────────
  const [alunos, setAlunos]           = useState([]);
  const [professores, setProfessores] = useState([]);
  const [presencas, setPresencas]     = useState([]);
  const [fichas, setFichas]           = useState([]);

  const [mensalidades, setMensalidades] = useState([]);

  // ── Carrega dados do banco ao logar ───────────────────────────────────────
  useEffect(() => {
    if (!usuario) return;

    alunosApi.listar()
      .then(data => setAlunos(data))
      .catch(() => addToast('Não foi possível carregar os alunos. Verifique a conexão com o servidor.', 'warning'));

    professoresApi.listar()
      .then(data => setProfessores(data))
      .catch(() => {});

    fichasApi.listar()
      .then(data => setFichas(data))
      .catch(() => {});

    mensalidadesApi.listar()
      .then(data => setMensalidades(data))
      .catch(() => {});

    presencasApi.listar()
      .then(data => setPresencas(data))
      .catch(() => {});
  }, [usuario]);

  // ── Retorno do Stripe ──────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get('pagamento');
    if (resultado === 'sucesso') {
      addToast('Pagamento realizado com sucesso!', 'success');
      mensalidadesApi.listar().then(data => setMensalidades(data)).catch(() => {});
    } else if (resultado === 'cancelado') {
      addToast('Pagamento cancelado.', 'warning');
    }
    if (resultado) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  function handleLogar({ tipo, dados, token }) {
    const session = { tipo, dados };
    setUsuario(session);
    localStorage.setItem('gymbalance_usuario', JSON.stringify(session));
    if (token) { localStorage.setItem('gymbalance_token', token); setToken(token); }
    setTelaAtiva(tipo === 'aluno' ? 'home' : 'painel');
    addToast(`Bem-vindo ao GymBalance${dados?.nome ? `, ${dados.nome.split(' ')[0]}` : ''}!`, 'success');
  }

  function handleDeslogar() {
    setUsuario(null);
    localStorage.removeItem('gymbalance_usuario');
    localStorage.removeItem('gymbalance_token');
    sessionStorage.removeItem('gymbalance_token');
    setToken(null);
    setTelaAtiva('painel');
  }

  const inputFotoAlunoRef = useRef(null);

  async function handleFotoAluno(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo || !usuario?.dados?.id) return;
    try {
      const resultado = await uploadsApi.enviarFoto(usuario.dados.id, arquivo);
      const novosDados = { ...usuario.dados, fotoUrl: resultado.fotoUrl };
      const novaSession = { tipo: usuario.tipo, dados: novosDados };
      setUsuario(novaSession);
      localStorage.setItem('gymbalance_usuario', JSON.stringify(novaSession));
      setAlunos(prev => prev.map(a => a.id === usuario.dados.id ? { ...a, fotoUrl: resultado.fotoUrl } : a));
      addToast('Foto atualizada com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar foto.', 'error');
    }
    e.target.value = '';
  }

  if (servidorOffline) {
    return (
      <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={26} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Servidor offline</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Não foi possível conectar ao backend.<br />
            Verifique se o servidor está rodando.
          </p>
          <code className="block text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg px-4 py-2 mb-5">
            cd backend && node server.js
          </code>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Login aoLogar={handleLogar} />;
  }

  const { tipo: tipoUsuario, dados: dadosUsuario } = usuario;

  // ── Navegação por perfil ───────────────────────────────────────────────────
  const todosNavItems = [
    { id: 'home',        label: 'Início',      icon: <Home size={17} />,            perfis: ['aluno'] },
    { id: 'painel',      label: 'Painel',      icon: <LayoutDashboard size={17} />, perfis: ['dono', 'professor'] },
    { id: 'alunos',      label: 'Alunos',      icon: <Users size={17} />,           perfis: ['dono', 'professor'] },
    { id: 'presenca',    label: 'Presença',    icon: <CalendarCheck2 size={17} />,  perfis: ['dono', 'professor'] },
    { id: 'professores', label: 'Professores', icon: <GraduationCap size={17} />,   perfis: ['dono'] },
    { id: 'treinos',     label: 'Treinos',     icon: <Dumbbell size={17} />,        perfis: ['dono', 'professor', 'aluno'] },
    { id: 'financeiro',  label: 'Financeiro',  icon: <DollarSign size={17} />,      perfis: ['dono'] },
    { id: 'pagamento',   label: 'Pagamento',   icon: <DollarSign size={17} />,      perfis: ['aluno'] },
  ];
  const navItems = todosNavItems.filter(item => item.perfis.includes(tipoUsuario));

  // Itens da nav mobile: navItems + configuracoes (dono) + logout
  const mobileNavItems = [
    ...navItems,
    ...(tipoUsuario === 'dono' ? [{ id: 'configuracoes', label: 'Config.', icon: <Settings size={17} /> }] : []),
    { id: '__logout__', label: 'Sair', icon: <LogOut size={17} />, isLogout: true },
  ];

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans">

      {/* ── Sidebar — desktop only ── */}
      <aside className={`hidden md:flex shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col transition-[width] duration-300 overflow-hidden ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>

        {/* Header */}
        <div className={`shrink-0 border-b border-zinc-100 dark:border-zinc-800 flex items-center transition-all duration-300 ${sidebarCollapsed ? 'flex-col gap-2 py-3 px-2 justify-center' : 'px-5 py-4 justify-between'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30 shrink-0">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">GymBalance</span>
            )}
          </div>
          <div className={`flex items-center gap-1 ${sidebarCollapsed ? 'flex-col' : ''}`}>
            {!sidebarCollapsed && (
              <button
                onClick={toggleTheme}
                title={isDark ? 'Tema claro' : 'Tema escuro'}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? 'Expandir painel' : 'Recolher painel'}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTelaAtiva(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                telaAtiva === item.id
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className={`shrink-0 transition-colors duration-200 ${telaAtiva === item.id ? 'text-green-500' : ''}`}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span>{item.label}</span>
                  {telaAtiva === item.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-1 flex items-center gap-3">
              {tipoUsuario === 'aluno' ? (
                <button
                  onClick={() => inputFotoAlunoRef.current?.click()}
                  title="Alterar foto"
                  className="relative w-9 h-9 rounded-full shrink-0 group overflow-hidden focus:outline-none"
                >
                  {dadosUsuario?.fotoUrl ? (
                    <img
                      src={`${API_SERVER}${dadosUsuario.fotoUrl}`}
                      alt={dadosUsuario.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                      {(dadosUsuario?.nome || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={12} className="text-white" />
                  </div>
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {dadosUsuario?.fotoUrl
                    ? <img src={`${API_SERVER}${dadosUsuario.fotoUrl}`} alt={dadosUsuario.nome} className="w-full h-full object-cover" />
                    : (dadosUsuario?.nome || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                  }
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{dadosUsuario?.nome || '—'}</p>
                <p className="text-xs text-zinc-400 capitalize">{tipoUsuario}</p>
              </div>
            </div>
          )}
          {tipoUsuario === 'aluno' && (
            <input
              ref={inputFotoAlunoRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFotoAluno}
            />
          )}
          {sidebarCollapsed && tipoUsuario !== 'aluno' && dadosUsuario?.fotoUrl && (
            <div className="w-10 h-10 mx-auto rounded-full overflow-hidden shrink-0">
              <img src={`${API_SERVER}${dadosUsuario.fotoUrl}`} alt={dadosUsuario.nome} className="w-full h-full object-cover" />
            </div>
          )}
          {sidebarCollapsed && tipoUsuario === 'aluno' && (
            <button
              onClick={() => inputFotoAlunoRef.current?.click()}
              title="Alterar foto"
              className="relative w-10 h-10 mx-auto rounded-full overflow-hidden group focus:outline-none flex items-center justify-center"
            >
              {dadosUsuario?.fotoUrl ? (
                <img
                  src={`${API_SERVER}${dadosUsuario.fotoUrl}`}
                  alt={dadosUsuario.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                  {(dadosUsuario?.nome || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={12} className="text-white" />
              </div>
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={toggleTheme}
              title={isDark ? 'Tema claro' : 'Tema escuro'}
              className="w-full flex justify-center p-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
          {tipoUsuario === 'dono' && (
            <button
              onClick={() => setTelaAtiva('configuracoes')}
              title={sidebarCollapsed ? 'Configurações' : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                telaAtiva === 'configuracoes'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Settings size={17} className={`shrink-0 transition-colors duration-200 ${telaAtiva === 'configuracoes' ? 'text-green-500' : ''}`} />
              {!sidebarCollapsed && (
                <>
                  <span>Configurações</span>
                  {telaAtiva === 'configuracoes' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                </>
              )}
            </button>
          )}
          <button
            onClick={handleDeslogar}
            title={sidebarCollapsed ? 'Sair do Sistema' : undefined}
            className={`w-full flex items-center rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 ${
              sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {!sidebarCollapsed && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* ── Área de conteúdo ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30 shrink-0">
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black tracking-tight text-zinc-900 dark:text-white">GymBalance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">{dadosUsuario?.nome?.split(' ')[0] || '—'}</p>
              <p className="text-[10px] text-zinc-400 capitalize">{tipoUsuario}</p>
            </div>
            {tipoUsuario === 'aluno' && (
              <button
                onClick={() => inputFotoAlunoRef.current?.click()}
                title="Alterar foto"
                className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 group focus:outline-none"
              >
                {dadosUsuario?.fotoUrl ? (
                  <img src={`${API_SERVER}${dadosUsuario.fotoUrl}`} alt={dadosUsuario.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-[10px] font-bold">
                    {(dadosUsuario?.nome || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={10} className="text-white" />
                </div>
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 p-4 md:p-8 pb-20 md:pb-8">
          <div key={telaAtiva} className="animate-fade-up max-w-6xl mx-auto">
            {(() => {
            // Filtra dados conforme o perfil logado
            const alunosVisiveis = tipoUsuario === 'professor'
              ? alunos.filter(a => a.professorId === dadosUsuario.id)
              : alunos;

            const fichasVisiveis = tipoUsuario === 'aluno'
              ? fichas.filter(f => (dadosUsuario.fichaIds || []).includes(String(f.id)))
              : fichas; // dono e professor veem todas as fichas

            return (
              <>
                {telaAtiva === 'home'          && <AlunoHome aluno={dadosUsuario} fichas={fichasVisiveis} mensalidades={mensalidades} setTelaAtiva={setTelaAtiva} />}
                {telaAtiva === 'painel'        && <Painel setTelaAtiva={setTelaAtiva} alunos={alunosVisiveis} mensalidades={mensalidades} presencas={presencas} professores={professores} perfil={tipoUsuario} />}
                {telaAtiva === 'alunos'        && <Alunos alunos={alunosVisiveis} setAlunos={setAlunos} fichas={fichasVisiveis} professores={professores} />}
                {telaAtiva === 'presenca'      && <Presenca alunos={alunosVisiveis} presencas={presencas} setPresencas={setPresencas} />}
                {telaAtiva === 'professores'   && <Professores professores={professores} setProfessores={setProfessores} />}
                {telaAtiva === 'treinos'       && <Treinos fichas={fichasVisiveis} setFichas={setFichas} somenteLeitura={tipoUsuario === 'aluno'} />}
                {telaAtiva === 'financeiro'    && <Financeiro mensalidades={mensalidades} setMensalidades={setMensalidades} alunos={alunos} />}
                {telaAtiva === 'pagamento'     && <Pagamento aluno={dadosUsuario} mensalidades={mensalidades} />}
                {telaAtiva === 'configuracoes' && <Configuracoes onAtualizarDono={({ nome, fotoUrl }) => {
                  const novosDados = { ...usuario.dados, ...(nome && { nome }), ...(fotoUrl && { fotoUrl }) };
                  const novaSession = { tipo: usuario.tipo, dados: novosDados };
                  setUsuario(novaSession);
                  localStorage.setItem('gymbalance_usuario', JSON.stringify(novaSession));
                }} />}
              </>
            );
            })()}
          </div>
        </main>
      </div>

      {/* ── Nav mobile (bottom) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-stretch z-40">
        {mobileNavItems.map(item => {
          const ativo = !item.isLogout && telaAtiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.isLogout ? handleDeslogar() : setTelaAtiva(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-all duration-200 ${
                item.isLogout
                  ? 'text-zinc-400 hover:text-red-500'
                  : ativo
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              {ativo && <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-green-500" />}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
