import { useState } from 'react';
import { Dumbbell, Mail, Lock, Eye, EyeOff, Shield, GraduationCap, User } from 'lucide-react';
import { donoApi, professoresApi, alunosApi } from '../api';

const PERFIS = [
  { key: 'dono',      label: 'Dono',      icon: Shield,          cor: 'green' },
  { key: 'professor', label: 'Professor', icon: GraduationCap,   cor: 'blue'  },
  { key: 'aluno',     label: 'Aluno',     icon: User,            cor: 'orange'},
];

export default function Login({ aoLogar }) {
  const [perfil, setPerfil]     = useState('dono');
  const [modo, setModo]         = useState('login'); // 'login' | 'registro'  (só para dono)
  const [email, setEmail]       = useState('');
  const [cpf, setCpf]           = useState('');
  const [senha, setSenha]       = useState('');
  const [nome, setNome]         = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro]         = useState('');
  const [carregando, setCarregando] = useState(false);

  function trocarPerfil(novoPerfil) {
    setPerfil(novoPerfil);
    setModo('login');
    setErro('');
    setEmail('');
    setCpf('');
    setSenha('');
    setNome('');
    setConfirmar('');
    setVerSenha(false);
  }

  function mascaraCPF(v) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  async function fazerLogin(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      let dados;
      if (perfil === 'dono') {
        dados = await donoApi.login({ email, senha });
      } else if (perfil === 'professor') {
        dados = await professoresApi.login({ email, senha });
      } else {
        dados = await alunosApi.login({ cpf, senha });
      }
      aoLogar({ tipo: perfil, dados });
    } catch (err) {
      setErro(err.message || 'Credenciais incorretas.');
    } finally {
      setCarregando(false);
    }
  }

  async function fazerRegistro(e) {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return; }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    setCarregando(true);
    try {
      await donoApi.registrar({ nome, email, senha });
      const dados = await donoApi.login({ email, senha });
      aoLogar({ tipo: 'dono', dados });
    } catch (err) {
      setErro(err.message || 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  }

  const inputCls = [
    'w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700',
    'rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-white',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    'outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
    'transition-all duration-200',
  ].join(' ');
  const inputCpfCls = inputCls; // sem ícone à direita
  const inputSenhaCls = inputCls.replace('pr-4', 'pr-10');

  const perfilAtual = PERFIS.find(p => p.key === perfil);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-green-500/8 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/8 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/60 dark:shadow-black/40 p-8">

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500/15 to-emerald-500/15 border border-green-500/20 rounded-2xl mb-4">
              <Dumbbell size={26} className="text-green-500" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Gym<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-orange-500">Balance</span>
            </h1>
          </div>

          {/* Seletor de perfil */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mb-6">
            {PERFIS.map(p => {
              const Icone = p.icon;
              const ativo = perfil === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => trocarPerfil(p.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    ativo
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icone size={14} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Subtítulo */}
          <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center mb-5">
            {perfil === 'dono' && modo === 'registro'
              ? 'Crie sua conta de administrador'
              : perfil === 'dono'
              ? 'Acesso do proprietário'
              : perfil === 'professor'
              ? 'Acesso do professor'
              : 'Acesso do aluno'}
          </p>

          {/* Formulário de LOGIN */}
          {(perfil !== 'dono' || modo === 'login') && (
            <form onSubmit={fazerLogin} className="space-y-4">

              {/* E-mail (dono e professor) */}
              {perfil !== 'aluno' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">E-mail</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      required type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={inputCls} placeholder="seu@email.com"
                    />
                  </div>
                </div>
              )}

              {/* CPF (aluno) */}
              {perfil === 'aluno' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">CPF</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      required type="text" inputMode="numeric" value={cpf}
                      onChange={e => setCpf(mascaraCPF(e.target.value))}
                      className={inputCpfCls} placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>
              )}

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    required type={verSenha ? 'text' : 'password'} value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className={inputSenhaCls} placeholder="••••••••"
                  />
                  <button
                    type="button" onClick={() => setVerSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {erro && <p className="text-sm text-red-500 text-center -mb-1">{erro}</p>}

              <button
                type="submit" disabled={carregando}
                className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {carregando ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Formulário de REGISTRO (só dono) */}
          {perfil === 'dono' && modo === 'registro' && (
            <form onSubmit={fazerRegistro} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Nome completo</label>
                <div className="relative">
                  <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className={inputCls} placeholder="Seu nome completo" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="seu@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input required type={verSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} className={inputSenhaCls} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setVerSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Confirmar senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input required type={verSenha ? 'text' : 'password'} value={confirmar} onChange={e => setConfirmar(e.target.value)} className={inputCls} placeholder="Repita a senha" />
                </div>
              </div>

              {erro && <p className="text-sm text-red-500 text-center -mb-1">{erro}</p>}

              <button type="submit" disabled={carregando} className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 mt-2">
                {carregando ? 'Criando conta…' : 'Criar Conta'}
              </button>
            </form>
          )}

          {/* Link registro/login — só para dono */}
          {perfil === 'dono' && (
            <div className="mt-5 text-center">
              {modo === 'login' ? (
                <p className="text-xs text-zinc-400">
                  Sem conta?{' '}
                  <button onClick={() => { setModo('registro'); setErro(''); }} className="text-green-500 hover:text-green-400 font-semibold transition-colors duration-200">
                    Criar conta
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Já tem conta?{' '}
                  <button onClick={() => { setModo('login'); setErro(''); }} className="text-green-500 hover:text-green-400 font-semibold transition-colors duration-200">
                    Entrar
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Dica para professores e alunos */}
          {perfil !== 'dono' && (
            <p className="mt-5 text-center text-xs text-zinc-400">
              {perfil === 'professor'
                ? 'Sua senha é definida pelo dono da academia.'
                : 'Seu CPF e senha são definidos pelo dono da academia.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
