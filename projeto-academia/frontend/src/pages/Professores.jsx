import { useState } from 'react';
import { Search, Trash2, ArrowLeft, UserPlus, Pencil, AlertCircle, GraduationCap, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { professoresApi } from '../api';

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

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function StatusBadge({ status }) {
  const cls = status === 'Ativo'
    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}

const FORM_VAZIO = { nome: '', email: '', telefone: '', cpf: '', especialidade: '', status: 'Ativo', senha: '' };

export default function Professores({ professores, setProfessores }) {
  const { addToast } = useToast();
  const [exibindoForm, setExibindoForm]       = useState(false);
  const [professorEditando, setProfessorEditando] = useState(null);
  const [busca, setBusca]                     = useState('');
  const [erros, setErros]                     = useState({});
  const [salvando, setSalvando]               = useState(false);
  const [form, setForm]                       = useState(FORM_VAZIO);

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }));
  }

  function abrirNovo() {
    setProfessorEditando(null);
    setForm(FORM_VAZIO);
    setErros({});
    setExibindoForm(true);
  }

  function abrirEdicao(prof) {
    setProfessorEditando(prof);
    setForm({
      nome:          prof.nome,
      email:         prof.email,
      telefone:      prof.telefone,
      cpf:           prof.cpf,
      especialidade: prof.especialidade,
      status:        prof.status,
      senha:         '',
    });
    setErros({});
    setExibindoForm(true);
  }

  function fecharForm() {
    setExibindoForm(false);
    setProfessorEditando(null);
    setForm(FORM_VAZIO);
    setErros({});
  }

  function validar() {
    const e = {};
    if (!form.nome.trim())                             e.nome = 'Nome é obrigatório';
    if (form.email && !validarEmail(form.email))       e.email = 'E-mail inválido';
    if (form.telefone && form.telefone.replace(/\D/g, '').length < 10)
                                                       e.telefone = 'Telefone inválido';
    if (form.cpf && form.cpf.replace(/\D/g, '').length !== 11)
                                                       e.cpf = 'CPF inválido — informe 11 dígitos';
    if (form.senha && form.senha.length < 6)           e.senha = 'Senha deve ter ao menos 6 caracteres';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvarProfessor(e) {
    e.preventDefault();
    if (!validar()) {
      addToast('Corrija os campos destacados antes de continuar.', 'error');
      return;
    }
    setSalvando(true);
    try {
      if (professorEditando) {
        const atualizado = await professoresApi.atualizar(professorEditando.id, form);
        setProfessores(prev => prev.map(p => p.id === professorEditando.id ? atualizado : p));
        addToast('Professor atualizado com sucesso!', 'success');
      } else {
        const novo = await professoresApi.criar(form);
        setProfessores(prev => [...prev, novo]);
        addToast('Professor cadastrado com sucesso!', 'success');
      }
      fecharForm();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar professor.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProfessor(id) {
    if (!confirm('Tem certeza que deseja excluir este professor?')) return;
    try {
      await professoresApi.excluir(id);
      setProfessores(prev => prev.filter(p => p.id !== id));
      addToast('Professor excluído.', 'warning');
    } catch (err) {
      addToast(err.message || 'Erro ao excluir professor.', 'error');
    }
  }

  const profFiltrados = professores.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // ── Formulário ───────────────────────────────────────────────────────────
  if (exibindoForm) {
    return (
      <div className="animate-fade-up max-w-3xl">
        <button
          onClick={fecharForm}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors duration-200 group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          Voltar para lista
        </button>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-6">
          {professorEditando ? 'Editar Professor' : 'Cadastro de Professor'}
        </h2>

        <form onSubmit={salvarProfessor} noValidate className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7 space-y-7 shadow-sm">
          {/* Dados Pessoais */}
          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={LBL}>Nome Completo *</label>
                <input
                  type="text" maxLength={100} value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  className={inputCls(!!erros.nome)} placeholder="Ex: Carlos Mendes"
                />
                <FieldError msg={erros.nome} />
              </div>
              <div>
                <label className={LBL}>E-mail</label>
                <input
                  type="email" maxLength={150} value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={inputCls(!!erros.email)} placeholder="professor@email.com"
                />
                <FieldError msg={erros.email} />
              </div>
              <div>
                <label className={LBL}>Telefone / WhatsApp</label>
                <input
                  type="text" inputMode="numeric" value={form.telefone}
                  onChange={e => set('telefone', mascaraTelefone(e.target.value))}
                  className={inputCls(!!erros.telefone)} placeholder="(11) 90000-0000"
                  maxLength={15}
                />
                <FieldError msg={erros.telefone} />
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
          </section>

          {/* Dados Profissionais */}
          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Dados Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LBL}>Especialidade</label>
                <input
                  type="text" maxLength={100} value={form.especialidade}
                  onChange={e => set('especialidade', e.target.value)}
                  className={inputCls(false)} placeholder="Ex: Musculação, CrossFit..."
                />
              </div>
              <div>
                <label className={LBL}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls(false)}>
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
            </div>
          </section>

          {/* Acesso ao Sistema */}
          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Acesso ao Sistema
            </h3>
            <div>
              <label className={LBL}>{professorEditando ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="password" value={form.senha}
                  onChange={e => set('senha', e.target.value)}
                  className={inputCls(!!erros.senha) + ' pl-10'}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <FieldError msg={erros.senha} />
              <p className="text-xs text-zinc-400 mt-1">O professor usará e-mail + senha para entrar no sistema.</p>
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={fecharForm}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={salvando}
              className="flex-1 bg-green-500 hover:bg-green-400 active:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {salvando ? 'Salvando…' : professorEditando ? 'Salvar Alterações' : 'Cadastrar Professor'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Lista ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <header className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Gestão</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Professores</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {professores.length} professor{professores.length !== 1 ? 'es' : ''} cadastrado{professores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <UserPlus size={15} />
          Novo Professor
        </button>
      </header>

      <div className="mb-5 relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text" placeholder="Buscar professor pelo nome..." value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
              {['Professor', 'Contato', 'Especialidade', 'Status', 'Ações'].map(h => (
                <th key={h} className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${h === 'Status' || h === 'Ações' ? 'text-center' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {profFiltrados.length > 0 ? profFiltrados.map(prof => (
              <tr key={prof.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold shrink-0 select-none">
                      {prof.nome.trim().split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{prof.nome}</p>
                      {prof.cpf && <p className="text-xs text-zinc-400 mt-0.5">CPF: {prof.cpf}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {prof.email
                    ? <p className="text-zinc-700 dark:text-zinc-300 font-medium">{prof.email}</p>
                    : <span className="text-xs text-zinc-400 italic">Sem e-mail</span>}
                  {prof.telefone && <p className="text-xs text-zinc-400 mt-0.5">{prof.telefone}</p>}
                </td>
                <td className="px-5 py-4">
                  {prof.especialidade
                    ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <GraduationCap size={10} />
                        {prof.especialidade}
                      </span>
                    : <span className="text-xs text-zinc-400 italic">Não informada</span>}
                </td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={prof.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => abrirEdicao(prof)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
                      title="Editar Professor"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => excluirProfessor(prof.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                      title="Excluir Professor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-5 py-14 text-center text-sm text-zinc-400 italic">
                  {busca ? 'Nenhum professor encontrado.' : 'Nenhum professor cadastrado ainda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
