import { useState } from 'react';
import { LayoutDashboard, Users, Dumbbell, DollarSign, LogOut, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useToast } from './context/ToastContext';
import Alunos from './pages/Alunos';
import Painel from './pages/Painel';
import Treinos from './pages/Treinos';
import Financeiro from './pages/Financeiro';
import Login from './pages/Login';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const [estaLogado, setEstaLogado] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState('painel');

  const [alunos, setAlunos] = useState([
    { id: 1, nome: 'João Silva', telefone: '(11) 98765-4321', cpf: '111.222.333-44', nascimento: '1995-05-12', altura: '1.75', peso: '80', plano: 'Anual', vencimento: '2026-04-15', status: 'Ativo', fichaId: '1', treinosSemana: { segunda: '1', terca: '2', quarta: '', quinta: '1', sexta: '2' } },
    { id: 2, nome: 'Maria Oliveira', telefone: '(21) 99999-8888', cpf: '222.333.444-55', nascimento: '1998-10-25', altura: '1.65', peso: '62', plano: 'Mensal', vencimento: '2026-04-10', status: 'Pendente', fichaId: '', treinosSemana: { segunda: '', terca: '', quarta: '', quinta: '', sexta: '' } },
  ]);

  const [mensalidades, setMensalidades] = useState([
    { id: 1, aluno: 'João Silva', plano: 'Anual', valor: 1200.00, data: '2026-04-15', status: 'Pago' },
    { id: 2, aluno: 'Maria Oliveira', plano: 'Mensal', valor: 130.00, data: '2026-04-10', status: 'Pendente' },
    { id: 3, aluno: 'Carlos Souza', plano: 'Trimestral', valor: 330.00, data: '2026-04-22', status: 'Pago' },
    { id: 4, aluno: 'Ana Costa', plano: 'Mensal', valor: 130.00, data: '2026-03-01', status: 'Atrasado' },
  ]);

  const [fichas, setFichas] = useState([
    { id: 1, nome: 'Treino A - Peito e Tríceps', objetivo: 'Hipertrofia' },
    { id: 2, nome: 'Treino B - Costas e Bíceps', objetivo: 'Hipertrofia' },
  ]);

  const [exercicios, setExercicios] = useState([
    { id: 1, fichaId: 1, nome: 'Supino Reto', series: '4', reps: '10 a 12', carga: '20kg', descanso: '60s' },
    { id: 2, fichaId: 1, nome: 'Tríceps Pulley', series: '3', reps: '12', carga: '15kg', descanso: '45s' },
  ]);

  function handleLogar() {
    setEstaLogado(true);
    addToast('Bem-vindo ao FitSystem!', 'success');
  }

  function handleDeslogar() {
    setEstaLogado(false);
    setTelaAtiva('painel');
  }

  if (!estaLogado) {
    return <Login aoLogar={handleLogar} />;
  }

  const navItems = [
    { id: 'painel',     label: 'Painel',     icon: <LayoutDashboard size={17} /> },
    { id: 'alunos',     label: 'Alunos',     icon: <Users size={17} /> },
    { id: 'treinos',    label: 'Treinos',    icon: <Dumbbell size={17} /> },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={17} /> },
  ];

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans">
      <aside className="w-60 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30 shrink-0">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">FitSystem</span>
          </div>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Tema claro' : 'Tema escuro'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
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

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={handleDeslogar}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} className="shrink-0" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 p-8">
        <div key={telaAtiva} className="animate-fade-up max-w-6xl mx-auto">
          {telaAtiva === 'painel'     && <Painel setTelaAtiva={setTelaAtiva} alunos={alunos} mensalidades={mensalidades} />}
          {telaAtiva === 'alunos'     && <Alunos alunos={alunos} setAlunos={setAlunos} fichas={fichas} />}
          {telaAtiva === 'treinos'    && <Treinos fichas={fichas} setFichas={setFichas} exercicios={exercicios} setExercicios={setExercicios} />}
          {telaAtiva === 'financeiro' && <Financeiro mensalidades={mensalidades} setMensalidades={setMensalidades} />}
        </div>
      </main>
    </div>
  );
}
