import { useState } from 'react';

export default function Treinos() {
  // ==========================================
  // 1. ESTADOS DO BANCO DE DADOS (Fichas e Exercícios)
  // ==========================================
  const [fichas, setFichas] = useState([
    { id: 1, nome: 'Treino A - Peito e Tríceps', objetivo: 'Hipertrofia' },
    { id: 2, nome: 'Treino B - Costas e Bíceps', objetivo: 'Hipertrofia' },
  ]);

  const [exercicios, setExercicios] = useState([
    { id: 1, fichaId: 1, nome: 'Supino Reto', series: '4', reps: '10 a 12', carga: '20kg', descanso: '60s' },
    { id: 2, fichaId: 1, nome: 'Tríceps Pulley', series: '3', reps: '12', carga: '15kg', descanso: '45s' },
  ]);

  // ==========================================
  // 2. ESTADOS DE CONTROLE DE TELA
  // ==========================================
  const [fichaSelecionada, setFichaSelecionada] = useState(null); // Controla se estamos vendo as Fichas ou os Exercícios
  
  // Modais
  const [modalFichaAberto, setModalFichaAberto] = useState(false);
  const [modalExercicioAberto, setModalExercicioAberto] = useState(false);

  // Inputs Nova Ficha
  const [nomeFichaInput, setNomeFichaInput] = useState('');
  const [objetivoInput, setObjetivoInput] = useState('Hipertrofia');

  // Inputs Novo Exercício
  const [nomeExercicioInput, setNomeExercicioInput] = useState('');
  const [seriesInput, setSeriesInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [cargaInput, setCargaInput] = useState('');
  const [descansoInput, setDescansoInput] = useState('');

  // ==========================================
  // 3. FUNÇÕES DE FICHAS
  // ==========================================
  function salvarFicha(e) {
    e.preventDefault();
    const novaFicha = { id: Date.now(), nome: nomeFichaInput, objetivo: objetivoInput };
    setFichas([...fichas, novaFicha]);
    setModalFichaAberto(false);
    setNomeFichaInput(''); setObjetivoInput('Hipertrofia');
  }

  function excluirFicha(id) {
    if (confirm("Excluir esta ficha apagará todos os exercícios dela. Tem certeza?")) {
      setFichas(fichas.filter(f => f.id !== id));
      setExercicios(exercicios.filter(ex => ex.fichaId !== id)); // Apaga os exercícios dela também
    }
  }

  // ==========================================
  // 4. FUNÇÕES DE EXERCÍCIOS
  // ==========================================
  function salvarExercicio(e) {
    e.preventDefault();
    const novoExercicio = {
      id: Date.now(),
      fichaId: fichaSelecionada.id, // Liga o exercício à ficha atual
      nome: nomeExercicioInput,
      series: seriesInput,
      reps: repsInput,
      carga: cargaInput,
      descanso: descansoInput
    };
    
    setExercicios([...exercicios, novoExercicio]);
    setModalExercicioAberto(false);
    
    // Limpar campos
    setNomeExercicioInput(''); setSeriesInput(''); setRepsInput(''); setCargaInput(''); setDescansoInput('');
  }

  function excluirExercicio(id) {
    setExercicios(exercicios.filter(ex => ex.id !== id));
  }

  // Filtra apenas os exercícios da ficha que clicamos
  const exerciciosDestaFicha = fichaSelecionada 
    ? exercicios.filter(ex => ex.fichaId === fichaSelecionada.id) 
    : [];

  // =========================================================
  // RENDERIZAÇÃO: TELA DE EXERCÍCIOS (Se uma ficha foi clicada)
  // =========================================================
  if (fichaSelecionada) {
    return (
      <div className="relative">
        <header className="mb-8 border-b border-gray-800 pb-6">
          <button 
            onClick={() => setFichaSelecionada(null)} 
            className="text-gray-500 hover:text-white flex items-center gap-2 mb-4 transition-colors"
          >
            ← Voltar para Fichas
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-green-500">{fichaSelecionada.nome}</h2>
              <p className="text-gray-400 mt-1">Objetivo: {fichaSelecionada.objetivo}</p>
            </div>
            <button 
              onClick={() => setModalExercicioAberto(true)} 
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg"
            >
              + Adicionar Exercício
            </button>
          </div>
        </header>

        {/* Tabela de Exercícios */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4">Aparelho / Exercício</th>
                <th className="p-4 text-center">Séries</th>
                <th className="p-4 text-center">Repetições</th>
                <th className="p-4 text-center">Carga</th>
                <th className="p-4 text-center">Descanso</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {exerciciosDestaFicha.length > 0 ? exerciciosDestaFicha.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 text-white font-medium text-lg">{ex.nome}</td>
                  <td className="p-4 text-gray-300 text-center">{ex.series}</td>
                  <td className="p-4 text-gray-300 text-center">{ex.reps}</td>
                  <td className="p-4 text-green-400 font-medium text-center">{ex.carga || '-'}</td>
                  <td className="p-4 text-gray-400 text-center text-sm">⏱ {ex.descanso}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => excluirExercicio(ex.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2">🗑️</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-10 text-center text-gray-500 italic">Nenhum exercício cadastrado nesta ficha.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de Novo Exercício */}
        {modalExercicioAberto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Adicionar Exercício</h3>
              <form onSubmit={salvarExercicio} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome do Aparelho/Exercício</label>
                  <input required type="text" value={nomeExercicioInput} onChange={(e) => setNomeExercicioInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500" placeholder="Ex: Cadeira Extensora" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Séries</label>
                    <input required type="text" value={seriesInput} onChange={(e) => setSeriesInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500" placeholder="Ex: 4" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Repetições</label>
                    <input required type="text" value={repsInput} onChange={(e) => setRepsInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500" placeholder="Ex: 10 a 12" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Carga (Opcional)</label>
                    <input type="text" value={cargaInput} onChange={(e) => setCargaInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500" placeholder="Ex: 25kg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Descanso</label>
                    <input required type="text" value={descansoInput} onChange={(e) => setDescansoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500" placeholder="Ex: 60s" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button type="button" onClick={() => setModalExercicioAberto(false)} className="flex-1 text-gray-400 hover:text-white py-3">Cancelar</button>
                  <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg">Salvar Exercício</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // RENDERIZAÇÃO: TELA DE FICHAS (Padrão)
  // =========================================================
  return (
    <div className="relative">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white">Fichas de Treino</h2>
          <p className="text-gray-400 mt-1">Crie e gerencie os programas de treinamento.</p>
        </div>
        <button onClick={() => setModalFichaAberto(true)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105">
          + Nova Ficha
        </button>
      </header>

      {/* GRADE DE FICHAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fichas.map((ficha) => {
          // Conta quantos exercícios tem dentro desta ficha para exibir no card
          const qtdExercicios = exercicios.filter(ex => ex.fichaId === ficha.id).length;

          return (
            <div key={ficha.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-500/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{ficha.nome}</h3>
                <button onClick={() => excluirFicha(ficha.id)} className="text-gray-500 hover:text-red-500 p-1 transition-colors" title="Excluir Ficha">🗑️</button>
              </div>
              
              <div className="mb-6 flex flex-col gap-2">
                <span className="w-fit bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">Objetivo: {ficha.objetivo}</span>
                <span className="text-sm text-gray-500">{qtdExercicios} exercícios cadastrados</span>
              </div>

              {/* AGORA ESSE BOTÃO TEM VIDA! */}
              <div className="mt-auto pt-4 border-t border-gray-800">
                <button 
                  onClick={() => setFichaSelecionada(ficha)} 
                  className="w-full bg-gray-800 hover:bg-green-600 hover:text-white text-green-500 font-semibold py-2 rounded-lg transition-colors"
                >
                  Ver Exercícios
                </button>
              </div>
            </div>
          )
        })}

        {fichas.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 italic bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
            Nenhuma ficha cadastrada ainda. Clique em "+ Nova Ficha" para começar.
          </div>
        )}
      </div>

      {/* Modal de Nova Ficha */}
      {modalFichaAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Criar Nova Ficha</h3>
            <form onSubmit={salvarFicha} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome da Ficha</label>
                <input required type="text" value={nomeFichaInput} onChange={(e) => setNomeFichaInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500" placeholder="Ex: Treino A - Peito" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Objetivo Principal</label>
                <select value={objetivoInput} onChange={(e) => setObjetivoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500">
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Emagrecimento">Emagrecimento</option>
                  <option value="Resistência">Resistência</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setModalFichaAberto(false)} className="flex-1 text-gray-400 hover:text-white py-3">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg">Criar Ficha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}