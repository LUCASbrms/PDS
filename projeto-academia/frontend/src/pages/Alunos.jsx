import { useState } from 'react';

export default function Alunos() {
  // 1. Estado da Lista de Alunos
  const [alunos, setAlunos] = useState([
    { id: 1, nome: 'João Silva', plano: 'Anual', vencimento: '2026-04-15', status: 'Ativo' },
    { id: 2, nome: 'Maria Oliveira', plano: 'Mensal', vencimento: '2026-04-10', status: 'Pendente' },
    { id: 3, nome: 'Carlos Souza', plano: 'Trimestral', vencimento: '2026-05-22', status: 'Ativo' },
  ]);

  // 2. Estados para o Modal e Inputs de Cadastro
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeInput, setNomeInput] = useState('');
  const [planoInput, setPlanoInput] = useState('Mensal');
  const [vencimentoInput, setVencimentoInput] = useState('');

  // 3. NOVO: Estado para a Busca
  const [busca, setBusca] = useState('');

  // --- FUNÇÕES DE LÓGICA ---

  function salvarAluno(e) {
    e.preventDefault();
    const novoAluno = {
      id: Date.now(),
      nome: nomeInput,
      plano: planoInput,
      vencimento: vencimentoInput,
      status: 'Ativo'
    };
    setAlunos([...alunos, novoAluno]);
    setNomeInput('');
    setVencimentoInput('');
    setModalAberto(false);
  }

  // NOVA: Função para excluir um aluno
  function excluirAluno(id) {
    if (confirm("Tem certeza que deseja excluir este aluno?")) {
      // Filtramos a lista mantendo apenas quem tem o ID diferente do que queremos apagar
      const listaAtualizada = alunos.filter(aluno => aluno.id !== id);
      setAlunos(listaAtualizada);
    }
  }

  // NOVA: Lógica de Filtro para a Tabela
  // Criamos uma lista temporária baseada no que está escrito na busca
  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="relative">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white">Gerenciar Alunos</h2>
          <p className="text-gray-400 mt-1">Lista completa e cadastro de novos alunos.</p>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-900/50 transition-all transform hover:scale-105"
        >
          + Novo Aluno
        </button>
      </header>

      {/* BARRA DE BUSCA */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            🔍
          </span>
          <input 
            type="text"
            placeholder="Buscar aluno pelo nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
        </div>
      </div>
      
      {/* Tabela de Alunos */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Nome do Aluno</th>
              <th className="p-4 font-semibold">Plano</th>
              <th className="p-4 font-semibold">Vencimento</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {/* AGORA USAMOS A LISTA FILTRADA PARA DESENHAR AS LINHAS */}
            {alunosFiltrados.length > 0 ? (
              alunosFiltrados.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 text-white font-medium">{aluno.nome}</td>
                  <td className="p-4 text-gray-300">{aluno.plano}</td>
                  <td className="p-4 text-gray-400">{aluno.vencimento}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      aluno.status === 'Ativo' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {aluno.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => excluirAluno(aluno.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-2"
                      title="Excluir Aluno"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-500 italic">
                  Nenhum aluno encontrado com esse nome.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO (O mesmo de antes) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Cadastrar Novo Aluno</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-500 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={salvarAluno} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={nomeInput}
                  onChange={(e) => setNomeInput(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="Ex: Pedro Alvares" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Plano</label>
                  <select 
                    value={planoInput}
                    onChange={(e) => setPlanoInput(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none"
                  >
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Vencimento</label>
                  <input 
                    required
                    type="date" 
                    value={vencimentoInput}
                    onChange={(e) => setVencimentoInput(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-green-500" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 px-4 py-3 text-gray-400 hover:bg-gray-800 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg">Salvar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}