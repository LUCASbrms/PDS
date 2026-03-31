// Olha a "encomenda" (setTelaAtiva) chegando aqui em cima entre chaves!
export default function Painel({ setTelaAtiva }) {
  return (
    <div>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white">Visão Geral</h2>
          <p className="text-gray-400 mt-1">Acompanhe os números da sua academia hoje.</p>
        </div>
        
        {/* Usamos a função recebida para trocar para a tela de alunos */}
        <button 
          onClick={() => setTelaAtiva('alunos')} 
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-900/50 transition-all transform hover:scale-105"
        >
          Ver Alunos
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Alunos Ativos</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-extrabold text-white">342</span>
            <span className="text-green-500 font-bold text-sm bg-green-500/10 px-2 py-1 rounded">+12 este mês</span>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Mensalidades Atrasadas</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-extrabold text-white">18</span>
            <span className="text-orange-500 font-bold text-sm bg-orange-500/10 px-2 py-1 rounded">Atenção</span>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
          <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Faturamento Mensal</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-extrabold text-white">R$ 24k</span>
            <span className="text-gray-400 font-bold text-sm">Previsto</span>
          </div>
        </div>
      </div>
    </div>
  );
}