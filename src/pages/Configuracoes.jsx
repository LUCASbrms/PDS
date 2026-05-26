import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Save, Building2, User, Eye, EyeOff, CheckCircle2, QrCode, Camera, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { donoApi, uploadsApi } from '../api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

function mascaraCPF(v) {
  return v.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function mascaraTelefone(v) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2)  return `(${n}`;
  if (n.length <= 6)  return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

function inputCls(hasError) {
  return [
    'w-full bg-zinc-50 dark:bg-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm',
    'text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    'outline-none focus:ring-2 transition-all duration-200',
    hasError
      ? 'border border-red-400 dark:border-red-500 focus:ring-red-400/20 focus:border-red-400'
      : 'border border-zinc-200 dark:border-zinc-700 focus:ring-green-500/20 focus:border-green-500',
  ].join(' ');
}

const LBL = 'block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle size={11} strokeWidth={2.5} />
      {msg}
    </p>
  );
}

const FORM_VAZIO = { nome: '', email: '', senha: '', confirmarSenha: '', telefone: '', cpf: '', nomeAcademia: '', chavePix: '' };

export default function Configuracoes({ aoRegistrar, onAtualizarDono }) {
  const { addToast } = useToast();
  const [form, setForm]             = useState(FORM_VAZIO);
  const [erros, setErros]           = useState({});
  const [donoId, setDonoId]         = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [verSenha, setVerSenha]     = useState(false);
  const [salvoOk, setSalvoOk]       = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [fotoUrlAtual, setFotoUrlAtual] = useState(null);
  const inputFotoRef                  = useRef(null);

  useEffect(() => {
    donoApi.obter()
      .then(dono => {
        if (dono) {
          setDonoId(dono.id);
          setForm({
            nome:          dono.nome          || '',
            email:         dono.email         || '',
            senha:         '',
            confirmarSenha:'',
            telefone:      dono.telefone      || '',
            cpf:           dono.cpf           || '',
            nomeAcademia:  dono.nomeAcademia  || '',
            chavePix:      dono.chavePix      || '',
          });
          if (dono.fotoUrl) { setFotoPreview(`${API_BASE}${dono.fotoUrl}`); setFotoUrlAtual(dono.fotoUrl); }
        }
      })
      .catch(() => {}) // nenhum dono cadastrado ainda
      .finally(() => setCarregando(false));
  }, []);

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }));
  }

  function onSelecionarFoto(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setFotoArquivo(arquivo);
    setFotoPreview(URL.createObjectURL(arquivo));
  }

  function removerFoto() {
    setFotoArquivo(null);
    setFotoPreview(null);
    if (inputFotoRef.current) inputFotoRef.current.value = '';
  }

  function validar() {
    const e = {};
    if (!form.nome.trim())  e.nome  = 'Nome é obrigatório';
    if (!form.email.trim()) e.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';

    if (!donoId && !form.senha) {
      e.senha = 'Senha obrigatória no primeiro cadastro';
    }
    if (form.senha && form.senha.length < 6) {
      e.senha = 'Senha deve ter ao menos 6 caracteres';
    }
    if (form.senha && form.confirmarSenha !== form.senha) {
      e.confirmarSenha = 'As senhas não coincidem';
    }
    if (form.cpf && form.cpf.replace(/\D/g, '').length !== 11) {
      e.cpf = 'CPF inválido — informe 11 dígitos';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validar()) {
      addToast('Corrija os campos destacados.', 'error');
      return;
    }

    setSalvando(true);
    const payload = {
      nome:         form.nome,
      email:        form.email,
      senha:        form.senha || undefined,
      telefone:     form.telefone || undefined,
      cpf:          form.cpf     || undefined,
      nomeAcademia: form.nomeAcademia || undefined,
      chavePix:     form.chavePix     || undefined,
    };

    try {
      let dono;
      if (donoId) {
        dono = await donoApi.atualizar(donoId, payload);
        addToast('Perfil atualizado com sucesso!', 'success');
      } else {
        dono = await donoApi.registrar(payload);
        setDonoId(dono.id);
        addToast('Academia registrada com sucesso!', 'success');
        aoRegistrar?.();
      }

      let fotoUrlFinal = null;
      if (fotoArquivo && dono?.id) {
        const { fotoUrl } = await uploadsApi.enviarFotoDono(dono.id, fotoArquivo);
        setFotoPreview(`${API_BASE}${fotoUrl}`);
        setFotoUrlAtual(fotoUrl);
        setFotoArquivo(null);
        fotoUrlFinal = fotoUrl;
      }

      onAtualizarDono?.({ nome: payload.nome, fotoUrl: fotoUrlFinal ?? fotoUrlAtual });
      setForm(prev => ({ ...prev, senha: '', confirmarSenha: '' }));
      setSalvoOk(true);
      setTimeout(() => setSalvoOk(false), 3000);
    } catch (err) {
      addToast(err.message || 'Erro ao salvar dados.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isNovo = !donoId;

  return (
    <div className="max-w-3xl animate-fade-up">
      <header className="mb-8">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Administração</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {isNovo ? 'Registrar Academia' : 'Configurações'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {isNovo
            ? 'Preencha os dados do dono e da academia para começar.'
            : 'Gerencie as informações do dono e da academia.'}
        </p>
      </header>

      {/* Banner de primeiro cadastro */}
      {isNovo && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-green-500/8 dark:bg-green-500/10 border border-green-500/20">
          <Building2 size={18} className="text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Bem-vindo ao GymBalance!</p>
            <p className="text-xs text-green-600/80 dark:text-green-400/70 mt-0.5">
              Registre sua academia para ter acesso completo ao sistema.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Perfil do Dono */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
              <User size={14} className="text-green-500" />
            </div>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">Perfil do Dono</h3>
          </div>

          {/* ── Foto do dono ── */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                {fotoPreview
                  ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                  : <Camera size={32} className="text-zinc-400" />
                }
              </div>
              {fotoPreview && (
                <button
                  type="button"
                  onClick={removerFoto}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <input ref={inputFotoRef} type="file" accept="image/*" className="hidden" onChange={onSelecionarFoto} />
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <Camera size={13} />
              {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
            </button>
            <p className="text-xs text-zinc-400">JPG, PNG ou WEBP · máx. 5 MB</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={LBL}>Nome Completo *</label>
              <input
                type="text" maxLength={100} value={form.nome}
                onChange={e => set('nome', e.target.value)}
                className={inputCls(!!erros.nome)} placeholder="Seu nome completo"
              />
              <FieldError msg={erros.nome} />
            </div>

            <div>
              <label className={LBL}>E-mail *</label>
              <input
                type="email" maxLength={150} value={form.email}
                onChange={e => set('email', e.target.value)}
                className={inputCls(!!erros.email)} placeholder="seu@email.com"
              />
              <FieldError msg={erros.email} />
            </div>

            <div>
              <label className={LBL}>Telefone</label>
              <input
                type="text" inputMode="numeric" value={form.telefone}
                onChange={e => set('telefone', mascaraTelefone(e.target.value))}
                className={inputCls(false)} placeholder="(11) 90000-0000"
                maxLength={15}
              />
            </div>

            <div>
              <label className={LBL}>CPF</label>
              <input
                type="text" inputMode="numeric" value={form.cpf}
                onChange={e => set('cpf', mascaraCPF(e.target.value))}
                className={inputCls(!!erros.cpf)} placeholder="000.000.000-00"
                maxLength={14}
              />
              <FieldError msg={erros.cpf} />
            </div>
          </div>
        </div>

        {/* Senha */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle size={14} className="text-green-500" />
            </div>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">
              {donoId ? 'Alterar Senha' : 'Definir Senha *'}
            </h3>
          </div>

          {donoId && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              Deixe em branco para manter a senha atual.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>{donoId ? 'Nova Senha' : 'Senha *'}</label>
              <div className="relative">
                <input
                  type={verSenha ? 'text' : 'password'} value={form.senha}
                  onChange={e => set('senha', e.target.value)}
                  className={inputCls(!!erros.senha) + ' pr-10'} placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button" onClick={() => setVerSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FieldError msg={erros.senha} />
            </div>

            <div>
              <label className={LBL}>{donoId ? 'Confirmar Nova Senha' : 'Confirmar Senha'}</label>
              <input
                type={verSenha ? 'text' : 'password'} value={form.confirmarSenha}
                onChange={e => set('confirmarSenha', e.target.value)}
                className={inputCls(!!erros.confirmarSenha)} placeholder="Repita a senha"
              />
              <FieldError msg={erros.confirmarSenha} />
            </div>
          </div>
        </div>

        {/* Academia */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-green-500" />
            </div>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest">Dados da Academia</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Nome da Academia</label>
              <input
                type="text" maxLength={100} value={form.nomeAcademia}
                onChange={e => set('nomeAcademia', e.target.value)}
                className={inputCls(false)} placeholder="Ex: Academia GymBalance"
              />
            </div>
            <div>
              <label className={LBL}>Chave PIX</label>
              <div className="relative">
                <QrCode size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text" maxLength={100} value={form.chavePix}
                  onChange={e => set('chavePix', e.target.value)}
                  className={inputCls(false) + ' pl-9'}
                  placeholder="CPF, CNPJ, e-mail ou telefone"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1">Exibida na tela de pagamento do aluno.</p>
            </div>
          </div>
        </div>

        {/* Botão */}
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={salvando}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save size={15} />
            {salvando ? 'Salvando…' : isNovo ? 'Registrar Academia' : 'Salvar Alterações'}
          </button>

          {salvoOk && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium animate-fade-up">
              <CheckCircle2 size={15} />
              Salvo com sucesso!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
