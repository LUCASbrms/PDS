import { useState } from 'react';
import Alunos from './pages/Alunos';
import Painel from './pages/Painel';
import Treinos from './pages/Treinos';
import Financeiro from './pages/Financeiro';
import Login from './pages/Login';

export default function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState('painel');

  // ==========================================
  // ESTADOS GLOBAIS (O "Banco de Dados" atual)
  // ==========================================
  const [alunos, setAlunos] = useState([
    { id: 1, nome: 'João Silva', telefone: '(11) 98765-4321', cpf: '111.222.333-44', nascimento: '1995-05-12', altura: '1.75', peso: '80', plano: 'Anual', vencimento: '2026-04-15', status: 'Ativo' },
    { id: 2, nome: 'Maria Oliveira', telefone: '(21) 99999-8888', cpf: '222.333.444-55', nascimento: '1998-10-25', altura: '1.65', peso: '62', plano: 'Mensal', vencimento: '2026-04-10', status: 'Pendente' },
  ]);

  const [mensalidades, setMensalidades] = useState([
    { id: 1, aluno: 'João Silva', plano: 'Anual', valor: 1200.00, data: '2026-04-15', status: 'Pago' },
    { id: 2, aluno: 'Maria Oliveira', plano: 'Mensal', valor: 130.00, data: '2026-04-10', status: 'Pendente' },
    { id: 3, aluno: 'Carlos Souza', plano: 'Trimestral', valor: 330.00, data: '2026-04-22', status: 'Pago' },
    { id: 4, aluno: 'Ana Costa', plano: 'Mensal', valor: 130.00, data: '2026-03-01', status: 'Atrasado' },
  ]);

  if (!estaLogado) {
    return <Login aoLogar={() => setEstaLogado(true)} />
  }

  return (
    <div className="flex h-screen bg-black font-sans text-white">
      {/* BARRA LATERAL */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            FitSystem
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTelaAtiva('painel')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${telaAtiva === 'painel' ? 'bg-green-600/10 text-green-500 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
            <span>📊</span><span>Painel</span>
          </button>
          <button onClick={() => setTelaAtiva('alunos')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${telaAtiva === 'alunos' ? 'bg-green-600/10 text-green-500 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
            <span>👥</span><span>Alunos</span>
          </button>
          <button onClick={() => setTelaAtiva('treinos')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${telaAtiva === 'treinos' ? 'bg-green-600/10 text-green-500 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
            <span>🏋️</span><span>Treinos</span>
          </button>
          <button onClick={() => setTelaAtiva('financeiro')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${telaAtiva === 'financeiro' ? 'bg-green-600/10 text-green-500 font-bold' : 'text-gray-400 hover:bg-gray-800'}`}>
            <span>💰</span><span>Financeiro</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setEstaLogado(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <span>🚪</span><span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL: Passando os dados para as telas! */}
      <main className="flex-1 bg-gray-950 p-8 overflow-y-auto">
        {telaAtiva === 'painel' && <Painel setTelaAtiva={setTelaAtiva} alunos={alunos} mensalidades={mensalidades} />}
        {telaAtiva === 'alunos' && <Alunos alunos={alunos} setAlunos={setAlunos} />}
        {telaAtiva === 'treinos' && <Treinos />}
        {telaAtiva === 'financeiro' && <Financeiro mensalidades={mensalidades} setMensalidades={setMensalidades} />}
      </main>
    </div>
  );
}