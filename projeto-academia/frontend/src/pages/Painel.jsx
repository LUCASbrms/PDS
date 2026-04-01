export default function Painel({ setTelaAtiva, alunos, mensalidades }) {
  
  // ==========================================
  // MATEMÁTICA REAL BASEADA NOS DADOS
  // ==========================================
  const totalAlunos = alunos.length;
  
  // Conta quantos alunos estão com status "Ativo"
  const alunosAtivos = alunos.filter(a => a.status === 'Ativo').length;
  
  // Soma o valor de todas as mensalidades que estão com status "Pago"
  const faturamentoReal = mensalidades
    .filter(m => m.status === 'Pago')
    .reduce((soma, m) => soma + m.valor, 0);

  // Conta quantos pagamentos estão atrasados ou pendentes
  const inadimplentes = mensalidades.filter(m => m.status !== 'Pago').length;


  return (
    <div>
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-white">Visão Geral</h2>
        <p className="text-gray-400 mt-1">Bem-vindo de volta! Aqui está o resumo da sua academia hoje.</p>
      </header>

      {/* GRADE DE ESTATÍSTICAS REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Cartão 1: Total de Alunos */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg"><span className="text-blue-500 text-xl">👥</span></div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total de Alunos</h3>
            <p className="text-3xl font-bold text-white">{totalAlunos}</p>
          </div>
        </div>

        {/* Cartão 2: Alunos Ativos */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg"><span className="text-green-500 text-xl">⚡</span></div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Alunos Ativos</h3>
            <p className="text-3xl font-bold text-white">{alunosAtivos}</p>
          </div>
        </div>

        {/* Cartão 3: Faturamento Real */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg"><span className="text-emerald-500 text-xl">💰</span></div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Faturamento (Pago)</h3>
            <p className="text-3xl font-bold text-white">R$ {faturamentoReal.toFixed(2)}</p>
          </div>
        </div>

        {/* Cartão 4: Inadimplentes */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-500/10 p-3 rounded-lg"><span className="text-red-500 text-xl">⚠️</span></div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Pagamentos Pendentes</h3>
            <p className="text-3xl font-bold text-white">{inadimplentes}</p>
          </div>
        </div>

      </div>

      {/* Atalhos Rápidos */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setTelaAtiva('alunos')} className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-colors">
            + Cadastrar Aluno
          </button>
          <button onClick={() => setTelaAtiva('financeiro')} className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-colors">
            💲 Registrar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}