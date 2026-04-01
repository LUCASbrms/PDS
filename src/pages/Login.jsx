import { useState } from 'react';

// Recebemos a função "aoLogar" que o App.jsx vai nos passar
export default function Login({ aoLogar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function fazerLogin(e) {
    e.preventDefault();
    
    // Aqui no futuro você vai verificar no banco de dados se a senha está certa.
    // Por enquanto, como estamos montando o visual, qualquer clique em "Entrar" vai funcionar!
    aoLogar(); 
  }

  return (
    // Fundo escuro cobrindo a tela toda, centralizando o conteúdo
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      
      {/* Cartão de Login */}
      <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl p-8">
        
        {/* Logotipo ou Nome do Sistema */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Fit<span className="text-blue-500">System</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Acesse o painel da sua academia</p>
        </div>

        {/* Formulário */}
        <form onSubmit={fazerLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="seu@email.com" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
            <input 
              required
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/30 transition-all transform hover:scale-[1.02]"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Esqueceu sua senha?
          </a>
        </div>

      </div>
    </div>
  );
}