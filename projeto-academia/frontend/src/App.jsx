import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Dumbbell, DollarSign, LogOut,
  Sun, Moon, Zap, CalendarCheck2, GraduationCap, Settings,
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useToast } from './context/ToastContext';
import { alunosApi, professoresApi, donoApi, fichasApi, mensalidadesApi } from './api';
import Alunos       from './pages/Alunos';
import Painel       from './pages/Painel';
import Treinos      from './pages/Treinos';
import Financeiro   from './pages/Financeiro';
import Presenca     from './pages/Presenca';
import Professores  from './pages/Professores';
import Configuracoes from './pages/Configuracoes';
import Pagamento    from './pages/Pagamento';
import Login        from './pages/Login';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const { addToast }            = useToast();

  const [usuario, setUsuario]                 = useState(null); // { tipo: 'dono'|'professor'|'aluno', dados: {...} }
  const [servidorOffline, setServidorOffline] = useState(false);
  const [telaAtiva, setTelaAtiva]             = useState('painel');

  // ── Verifica se o servidor está online ────────────────────────────────────
  useEffect(() => {
    donoApi.obter()
      .catch(err => {
        if (err instanceof TypeError || err.message === 'Failed to fetch') {
          setServidorOffline(true);
        }
      });
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
  }, [usuario]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  function handleLogar({ tipo, dados }) {
    setUsuario({ tipo, dados });
    addToast(`Bem-vindo ao GymBalance${dados?.nome ? `, ${dados.nome.split(' ')[0]}` : ''}!`, 'success');
  }

  function handleDeslogar() {
    setUsuario(null);
    setTelaAtiva('painel');
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
    { id: 'painel',      label: 'Painel',      icon: <LayoutDashboard size={17} />, perfis: ['dono', 'professor'] },
    { id: 'alunos',      label: 'Alunos',      icon: <Users size={17} />,           perfis: ['dono', 'professor'] },
    { id: 'presenca',    label: 'Presença',    icon: <CalendarCheck2 size={17} />,  perfis: ['dono', 'professor'] },
    { id: 'professores', label: 'Professores', icon: <GraduationCap size={17} />,   perfis: ['dono'] },
    { id: 'treinos',     label: 'Treinos',     icon: <Dumbbell size={17} />,        perfis: ['dono', 'professor', 'aluno'] },
    { id: 'financeiro',  label: 'Financeiro',  icon: <DollarSign size={17} />,      perfis: ['dono'] },
    { id: 'pagamento',   label: 'Pagamento',   icon: <DollarSign size={17} />,      perfis: ['aluno'] },
  ];
  const navItems = todosNavItems.filter(item => item.perfis.includes(tipoUsuario));

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30 shrink-0">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">GymBalance</span>
          </div>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Tema claro' : 'Tema escuro'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTelaAtiva(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                telaAtiva === item.id
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className={`shrink-0 transition-colors duration-200 ${telaAtiva === item.id ? 'text-green-500' : ''}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {telaAtiva === item.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
          {/* Usuário logado */}
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{dadosUsuario?.nome || '—'}</p>
            <p className="text-xs text-zinc-400 capitalize">{tipoUsuario}</p>
          </div>

          {tipoUsuario === 'dono' && (
            <button
              onClick={() => setTelaAtiva('configuracoes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                telaAtiva === 'configuracoes'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Settings size={17} className={`shrink-0 transition-colors duration-200 ${telaAtiva === 'configuracoes' ? 'text-green-500' : ''}`} />
              <span>Configurações</span>
              {telaAtiva === 'configuracoes' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              )}
            </button>
          )}
          <button
            onClick={handleDeslogar}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} className="shrink-0" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 p-8">
        <div key={telaAtiva} className="animate-fade-up max-w-6xl mx-auto">
          {telaAtiva === 'painel'        && <Painel setTelaAtiva={setTelaAtiva} alunos={alunos} mensalidades={mensalidades} presencas={presencas} professores={professores} />}
          {telaAtiva === 'alunos'        && <Alunos alunos={alunos} setAlunos={setAlunos} fichas={fichas} />}
          {telaAtiva === 'presenca'      && <Presenca alunos={alunos} presencas={presencas} setPresencas={setPresencas} />}
          {telaAtiva === 'professores'   && <Professores professores={professores} setProfessores={setProfessores} />}
          {telaAtiva === 'treinos'       && <Treinos fichas={fichas} setFichas={setFichas} />}
          {telaAtiva === 'financeiro'    && <Financeiro mensalidades={mensalidades} setMensalidades={setMensalidades} alunos={alunos} />}
          {telaAtiva === 'pagamento'     && <Pagamento aluno={dadosUsuario} />}
          {telaAtiva === 'configuracoes' && <Configuracoes />}
        </div>
      </main>
    </div>
  );
}
