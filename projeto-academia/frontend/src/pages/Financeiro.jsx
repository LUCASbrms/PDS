import { useState } from 'react';

// Agora ele recebe as mensalidades do App.jsx
export default function Financeiro({ mensalidades, setMensalidades }) {
  const PRECOS_PLANOS = {
    'Mensal': 130.00,
    'Trimestral': 330.00,
    'Anual': 1200.00,
    'Semestral': 600.00
  };

  const [modalAberto, setModalAberto] = useState(false);
  const [alunoInput, setAlunoInput] = useState('');
  const [planoInput, setPlanoInput] = useState('Mensal');
  const [valorInput, setValorInput] = useState(PRECOS_PLANOS['Mensal']);
  const [dataInput, setDataInput] = useState('');
  const [statusInput, setStatusInput] = useState('Pago');

  function mudarPlano(novoPlano) {
    setPlanoInput(novoPlano);
    setValorInput(PRECOS_PLANOS[novoPlano]);
  }

  // --- Lógica de Cálculos garantindo que a lista existe ---
  const listaSegura = mensalidades || [];

  const totalRecebido = listaSegura
    .filter(m => m.status === 'Pago')
    .reduce((soma, m) => soma + m.valor, 0);

  const totalPendente = listaSegura
    .filter(m => m.status === 'Pendente' || m.status === 'Atrasado')
    .reduce((soma, m) => soma + m.valor, 0);

  const totalPrevisto = totalRecebido + totalPendente;

  function salvarPagamento(e) {
    e.preventDefault();
    const novoPagamento = {
      id: Date.now(),
      aluno: alunoInput,
      plano: planoInput,
      valor: parseFloat(valorInput),
      data: dataInput,
      status: statusInput
    };
    
    setMensalidades([...listaSegura, novoPagamento]);
    setModalAberto(false);
    
    // Resetar campos
    setAlunoInput('');
    setPlanoInput('Mensal');
    setValorInput(PRECOS_PLANOS['Mensal']);
  }

  function marcarComoPago(id) {
    setMensalidades(listaSegura.map(m => m.id === id ? { ...m, status: 'Pago' } : m));
  }

  return (
    <div className="relative">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Mensalidades</h2>
          <p className="text-gray-400 mt-1">Valores fixos aplicados: Mensal (130), Trimestral (330) e Anual (1200).</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg">
          + Registrar Pagamento
        </button>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-l-green-500">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">Total Recebido</h3>
          <p className="text-3xl font-bold text-white">R$ {totalRecebido.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-l-orange-500">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">Pendente / Atrasado</h3>
          <p className="text-3xl font-bold text-white">R$ {totalPendente.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 border-l-4 border-l-blue-500">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">Total Previsto</h3>
          <p className="text-3xl font-bold text-white">R$ {totalPrevisto.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-sm">
              <th className="p-4">Aluno</th>
              <th className="p-4">Plano</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Vencimento</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {listaSegura.map((m) => (
              <tr key={m.id} className="hover:bg-gray-800/30">
                <td className="p-4 text-white">{m.aluno}</td>
                <td className="p-4 text-gray-400">{m.plano}</td>
                <td className="p-4 text-green-400 font-medium">R$ {m.valor.toFixed(2)}</td>
                <td className="p-4 text-gray-400">{m.data}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${m.status === 'Pago' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{m.status}</span>
                </td>
                <td className="p-4 text-center">
                  {m.status !== 'Pago' && (
                    <button onClick={() => marcarComoPago(m.id)} className="text-xs bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white px-3 py-1 rounded">Baixar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Novo Pagamento</h3>
            <form onSubmit={salvarPagamento} className="space-y-4">
              <input required type="text" value={alunoInput} onChange={(e) => setAlunoInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white" placeholder="Nome do Aluno" />
              
              <div className="grid grid-cols-2 gap-4">
                <select value={planoInput} onChange={(e) => mudarPlano(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white">
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
                <input required type="number" value={valorInput} onChange={(e) => setValorInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white" placeholder="Valor" />
              </div>

              <input required type="date" value={dataInput} onChange={(e) => setDataInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white" />

              <div className="grid grid-cols-1">
                <select value={statusInput} onChange={(e) => setStatusInput(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white">
                  <option value="Pago">Pago</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 text-gray-400">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}