import { useState } from 'react';
import Alunos from './pages/Alunos';
import Painel from './pages/Painel'; // Importamos o Painel novo!

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('painel');

  return (
    <div className="flex h-screen bg-black font-sans text-white">
      
      {/* Menu Lateral */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 text-center border-b border-gray-800">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-white">Fit</span>
            <span className="text-green-500">System</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTelaAtiva('painel')} className={`w-full text-left block px-4 py-3 rounded-lg font-medium transition-colors ${telaAtiva === 'painel' ? 'bg-gray-800 text-white border-l-4 border-green-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            Painel Principal
          </button>
          <button onClick={() => setTelaAtiva('alunos')} className={`w-full text-left block px-4 py-3 rounded-lg font-medium transition-colors ${telaAtiva === 'alunos' ? 'bg-gray-800 text-white border-l-4 border-green-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            Alunos
          </button>
          <button onClick={() => setTelaAtiva('treinos')} className={`w-full text-left block px-4 py-3 rounded-lg font-medium transition-colors ${telaAtiva === 'treinos' ? 'bg-gray-800 text-white border-l-4 border-green-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            Treinos
          </button>
          <button onClick={() => setTelaAtiva('financeiro')} className={`w-full text-left block px-4 py-3 rounded-lg font-medium transition-colors ${telaAtiva === 'financeiro' ? 'bg-gray-800 text-white border-l-4 border-green-500' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            Financeiro
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-4 py-2 text-sm font-semibold text-gray-400 hover:text-orange-500 transition-colors">
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Área Principal - Olha a limpeza aqui! */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Passamos o setTelaAtiva como "encomenda" pro Painel */}
        {telaAtiva === 'painel' && <Painel setTelaAtiva={setTelaAtiva} />}
        
        {telaAtiva === 'alunos' && <Alunos />}

        {(telaAtiva === 'treinos' || telaAtiva === 'financeiro') && (
          <div className="h-full flex items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-500">Tela de {telaAtiva} em construção 🚧</h2>
          </div>
        )}

      </main>
    </div>
  );
}