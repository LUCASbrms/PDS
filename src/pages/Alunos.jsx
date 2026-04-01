import { useState } from 'react';

// AGORA ELE RECEBE "alunos" E "setAlunos" DO PAI (App.jsx)
export default function Alunos({ alunos, setAlunos }) {
  // 2. Estado para controlar SE estamos vendo a lista ou o formulário
  const [exibindoCadastro, setExibindoCadastro] = useState(false);
  const [busca, setBusca] = useState('');

  // 3. Estados dos campos do formulário
  const [nomeInput, setNomeInput] = useState('');
  const [nascimentoInput, setNascimentoInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');
  const [alturaInput, setAlturaInput] = useState('');
  const [pesoInput, setPesoInput] = useState('');
  
  // Dados do plano (para já matricular o aluno no cadastro)
  const [planoInput, setPlanoInput] = useState('Mensal');
  const [vencimentoInput, setVencimentoInput] = useState('');

  // --- FUNÇÕES ---

  function salvarAluno(e) {
    e.preventDefault();
    const novoAluno = {
      id: Date.now(),
      nome: nomeInput,
      nascimento: nascimentoInput,
      cpf: cpfInput,
      telefone: telefoneInput,
      altura: alturaInput,
      peso: pesoInput,
      plano: planoInput,
      vencimento: vencimentoInput,
      status: 'Ativo'
    };
    
    setAlunos([...alunos, novoAluno]);
    
    // Limpa o formulário e volta para a lista
    limparFormulario();
    setExibindoCadastro(false);
  }

  function limparFormulario() {
    setNomeInput(''); setNascimentoInput(''); setCpfInput(''); 
    setTelefoneInput(''); setAlturaInput(''); setPesoInput('');
    setPlanoInput('Mensal'); setVencimentoInput('');
  }

  function excluirAluno(id) {
    if (confirm("Tem certeza que deseja excluir este aluno?")) {
      setAlunos(alunos.filter(aluno => aluno.id !== id));
    }
  }

  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="relative">
      
      {/* ========================================================= */}
      {/* MODO 1: TELA DE LISTA DE ALUNOS (Só aparece se exibindoCadastro for false) */}
      {/* ========================================================= */}
      {!exibindoCadastro && (
        <>
          <header className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white">Gerenciar Alunos</h2>
              <p className="text-gray-400 mt-1">Lista completa de alunos matriculados.</p>
            </div>
            <button 
              onClick={() => setExibindoCadastro(true)} // Muda a tela para o formulário
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-900/50 transition-all transform hover:scale-105"
            >
              + Novo Aluno
            </button>
          </header>

          <div className="mb-6 relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">🔍</span>
            <input 
              type="text" placeholder="Buscar aluno pelo nome..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nome e Contato</th>
                  <th className="p-4 font-semibold">Físico</th>
                  <th className="p-4 font-semibold">Plano</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {alunosFiltrados.length > 0 ? alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="text-white font-medium">{aluno.nome}</div>
                      <div className="text-sm text-gray-500">{aluno.telefone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300">{aluno.peso}kg</div>
                      <div className="text-sm text-gray-500">{aluno.altura}m</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300">{aluno.plano}</div>
                      <div className="text-sm text-gray-500">Vence: {aluno.vencimento}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${aluno.status === 'Ativo' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {aluno.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => excluirAluno(aluno.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2" title="Excluir Aluno">
                        🗑️
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-10 text-center text-gray-500 italic">Nenhum aluno encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* MODO 2: TELA DE CADASTRO (Só aparece se exibindoCadastro for true) */}
      {/* ========================================================= */}
      {exibindoCadastro && (
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <button 
                onClick={() => setExibindoCadastro(false)} 
                className="text-gray-500 hover:text-white flex items-center gap-2 mb-2 transition-colors"
              >
                ← Voltar para lista
              </button>
              <h2 className="text-3xl font-bold text-white">Ficha de Matrícula</h2>
            </div>
          </header>

          <form onSubmit={salvarAluno} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
            
            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <h3 className="text-lg font-bold text-green-500 mb-4 border-b border-gray-800 pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input required type="text" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: Pedro Alvares" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Data de Nascimento</label>
                <input required type="date" value={nascimentoInput} onChange={(e) => setNascimentoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">CPF</label>
                <input required type="text" value={cpfInput} onChange={(e) => setCpfInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telefone / WhatsApp</label>
                <input required type="text" value={telefoneInput} onChange={(e) => setTelefoneInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" placeholder="(11) 90000-0000" />
              </div>
            </div>

            {/* SEÇÃO 2: AVALIAÇÃO FÍSICA BÁSICA */}
            <h3 className="text-lg font-bold text-green-500 mb-4 border-b border-gray-800 pb-2">Medidas Corporais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Altura (m)</label>
                <input required type="number" step="0.01" value={alturaInput} onChange={(e) => setAlturaInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 1.75" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Peso (kg)</label>
                <input required type="number" step="0.1" value={pesoInput} onChange={(e) => setPesoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 80.5" />
              </div>
            </div>

            {/* SEÇÃO 3: PLANO ESCOLHIDO */}
            <h3 className="text-lg font-bold text-green-500 mb-4 border-b border-gray-800 pb-2">Matrícula</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Plano Escolhido</label>
                <select value={planoInput} onChange={(e) => setPlanoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500">
                  <option>Mensal</option>
                  <option>Trimestral</option>
                  <option>Semestral</option>
                  <option>Anual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Primeiro Vencimento</label>
                <input required type="date" value={vencimentoInput} onChange={(e) => setVencimentoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-4 pt-4 border-t border-gray-800">
              <button type="button" onClick={() => setExibindoCadastro(false)} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg transition-colors">
                Salvar Matrícula
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}