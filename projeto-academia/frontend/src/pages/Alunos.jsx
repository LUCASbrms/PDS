import { useState } from 'react';
import { Search, Trash2, ArrowLeft, UserPlus, Pencil, AlertCircle, Eye, Dumbbell, Lock, ShieldOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { alunosApi } from '../api';
import AlunoDetalhe from './AlunoDetalhe';

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

function StatusBadge({ status }) {
  const map = {
    Ativo:    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Pendente: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Inativo:  'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.Inativo}`}>
      {status}
    </span>
  );
}

const FORM_VAZIO = {
  nome: '', nascimento: '', cpf: '', telefone: '',
  altura: '', peso: '', plano: 'Mensal', vencimento: '', fichaIds: [], professorId: '', senha: '',
};

export default function Alunos({ alunos, setAlunos, fichas, professores = [] }) {
  const { addToast } = useToast();
  const [exibindoForm, setExibindoForm] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);
  const [alunoVisualizandoId, setAlunoVisualizandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [erros, setErros] = useState({});

  const [form, setForm] = useState(FORM_VAZIO);

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }));
  }

  function abrirNovo() {
    setAlunoEditando(null);
    setForm(FORM_VAZIO);
    setErros({});
    setExibindoForm(true);
  }

  function abrirEdicao(aluno) {
    setAlunoEditando(aluno);
    setForm({
      nome:        aluno.nome,
      nascimento:  aluno.nascimento,
      cpf:         aluno.cpf,
      telefone:    aluno.telefone,
      altura:      aluno.altura,
      peso:        aluno.peso,
      plano:       aluno.plano,
      vencimento:  aluno.vencimento,
      fichaIds:    aluno.fichaIds    || [],
      professorId: aluno.professorId != null ? String(aluno.professorId) : '',
      senha:       '',
    });
    setErros({});
    setExibindoForm(true);
  }

  function fecharForm() {
    setExibindoForm(false);
    setAlunoEditando(null);
    setForm(FORM_VAZIO);
    setErros({});
  }

  function validar() {
    const e = {};
    if (!form.nome.trim())                                   e.nome = 'Nome é obrigatório';
    if (!form.nascimento)                                    e.nascimento = 'Data de nascimento obrigatória';
    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11)                             e.cpf = 'CPF inválido — informe 11 dígitos';
    const telDigits = form.telefone.replace(/\D/g, '');
    if (telDigits.length < 10)                               e.telefone = 'Telefone inválido';
    const alt = parseFloat(form.altura);
    if (!form.altura || isNaN(alt) || alt < 0.5 || alt > 2.5) e.altura = 'Altura entre 0,50 e 2,50 m';
    const peso = parseFloat(form.peso);
    if (!form.peso || isNaN(peso) || peso <= 0)              e.peso = 'Peso inválido';
    if (!form.vencimento)                                    e.vencimento = 'Data de vencimento obrigatória';
    if (form.senha && form.senha.length < 6)                 e.senha = 'Senha deve ter ao menos 6 caracteres';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  const [salvando, setSalvando] = useState(false);

  async function salvarAluno(e) {
    e.preventDefault();
    if (!validar()) {
      addToast('Corrija os campos destacados antes de continuar.', 'error');
      return;
    }
    setSalvando(true);
    try {
      if (alunoEditando) {
        const atualizado = await alunosApi.atualizar(alunoEditando.id, {
          ...form,
          treinosSemana: alunoEditando.treinosSemana || { segunda: '', terca: '', quarta: '', quinta: '', sexta: '' },
        });
        setAlunos(prev => prev.map(a => a.id === alunoEditando.id ? atualizado : a));
        addToast('Aluno atualizado com sucesso!', 'success');
      } else {
        const novo = await alunosApi.criar({
          ...form,
          status: 'Ativo',
          treinosSemana: { segunda: '', terca: '', quarta: '', quinta: '', sexta: '' },
        });
        setAlunos(prev => [...prev, novo]);
        addToast('Aluno cadastrado com sucesso!', 'success');
      }
      fecharForm();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar aluno.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      await alunosApi.excluir(id);
      setAlunos(prev => prev.filter(a => a.id !== id));
      addToast('Aluno excluído.', 'warning');
    } catch (err) {
      addToast(err.message || 'Erro ao excluir aluno.', 'error');
    }
  }

  async function atualizarTreinosSemana(alunoId, novosTreinos) {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return;
    setAlunos(prev => prev.map(a => a.id === alunoId ? { ...a, treinosSemana: novosTreinos } : a));
    try {
      await alunosApi.atualizar(alunoId, { ...aluno, treinosSemana: novosTreinos });
    } catch {
      // falha silenciosa — UI já atualizou optimisticamente
    }
  }

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (alunoVisualizandoId) {
    const alunoAtual = alunos.find(a => a.id === alunoVisualizandoId);
    if (alunoAtual) {
      return (
        <AlunoDetalhe
          aluno={alunoAtual}
          fichas={fichas}
          onVoltar={() => setAlunoVisualizandoId(null)}
          onAtualizar={atualizarTreinosSemana}
        />
      );
    }
  }

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
          {alunoEditando ? 'Editar Aluno' : 'Ficha de Matrícula'}
        </h2>

        <form onSubmit={salvarAluno} noValidate className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7 space-y-7 shadow-sm">
          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LBL}>Nome Completo</label>
                <input
                  type="text" maxLength={80} value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  className={inputCls(!!erros.nome)} placeholder="Ex: Pedro Alvares"
                />
                <FieldError msg={erros.nome} />
              </div>
              <div>
                <label className={LBL}>Data de Nascimento</label>
                <input
                  type="date" value={form.nascimento}
                  onChange={e => set('nascimento', e.target.value)}
                  className={inputCls(!!erros.nascimento)}
                />
                <FieldError msg={erros.nascimento} />
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
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">Medidas Corporais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LBL}>Altura (m)</label>
                <input
                  type="number" step="0.01" min="0.5" max="2.5" value={form.altura}
                  onChange={e => set('altura', e.target.value)}
                  className={inputCls(!!erros.altura)} placeholder="1.75"
                />
                <FieldError msg={erros.altura} />
              </div>
              <div>
                <label className={LBL}>Peso (kg)</label>
                <input
                  type="number" step="0.1" min="1" max="999" value={form.peso}
                  onChange={e => set('peso', e.target.value)}
                  className={inputCls(!!erros.peso)} placeholder="80.5"
                />
                <FieldError msg={erros.peso} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">Matrícula e Treino</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={LBL}>Plano</label>
                <select value={form.plano} onChange={e => set('plano', e.target.value)} className={inputCls(false)}>
                  <option>Mensal</option>
                  <option>Trimestral</option>
                  <option>Semestral</option>
                  <option>Anual</option>
                </select>
              </div>
              <div>
                <label className={LBL}>Primeiro Vencimento</label>
                <input
                  type="date" value={form.vencimento}
                  onChange={e => set('vencimento', e.target.value)}
                  className={inputCls(!!erros.vencimento)}
                />
                <FieldError msg={erros.vencimento} />
              </div>
              <div className="md:col-span-3">
                <label className={LBL}>Fichas de Treino</label>
                {fichas.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">Nenhuma ficha cadastrada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {fichas.map(f => {
                      const checked = form.fichaIds.includes(String(f.id));
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-all duration-150 select-none ${
                            checked
                              ? 'bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400'
                              : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-green-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-green-500"
                            checked={checked}
                            onChange={() => {
                              const id = String(f.id);
                              set('fichaIds', checked
                                ? form.fichaIds.filter(x => x !== id)
                                : [...form.fichaIds, id]);
                            }}
                          />
                          {f.nome}
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-zinc-400 mt-1.5">Selecione uma ou mais fichas para vincular ao aluno.</p>
              </div>
              <div>
                <label className={LBL}>Professor Responsável</label>
                <select value={form.professorId} onChange={e => set('professorId', e.target.value)} className={inputCls(false)}>
                  <option value="">Sem professor vinculado</option>
                  {professores.filter(p => p.status === 'Ativo').map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Acesso ao Sistema */}
          <section>
            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">Acesso ao Sistema</h3>
            <div>
              <label className={LBL}>{alunoEditando ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}</label>
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
              <p className="text-xs text-zinc-400 mt-1">O aluno usará CPF + senha para entrar no sistema.</p>
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
              {salvando ? 'Salvando…' : alunoEditando ? 'Salvar Alterações' : 'Salvar Matrícula'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <header className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Gestão</p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Alunos</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-green-500/25 hover:shadow-green-500/35 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <UserPlus size={15} />
          Novo Aluno
        </button>
      </header>

      <div className="mb-5 relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text" placeholder="Buscar aluno pelo nome..." value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40">
              {['Aluno', 'Físico', 'Plano', 'Treino', 'Status', 'Ações'].map(h => (
                <th key={h} className={`px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${h === 'Status' || h === 'Ações' ? 'text-center' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {alunosFiltrados.length > 0 ? alunosFiltrados.map(aluno => (
              <tr key={aluno.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-zinc-900 dark:text-white">{aluno.nome}</p>
                    {!aluno.temSenha && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20" title="Sem senha — não consegue logar">
                        <ShieldOff size={10} />
                        Sem acesso
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{aluno.telefone}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">{aluno.peso} kg</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{aluno.altura} m</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">{aluno.plano}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Vence: {aluno.vencimento}</p>
                </td>
                <td className="px-5 py-4">
                  {(() => {
                    const ts = aluno.treinosSemana;
                    const dias = ts ? Object.values(ts).filter(Boolean).length : 0;
                    if (dias === 0) return <span className="text-xs text-zinc-400 italic">Sem agenda</span>;
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        <Dumbbell size={10} />
                        {dias} dia{dias !== 1 ? 's' : ''}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={aluno.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setAlunoVisualizandoId(aluno.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all duration-200"
                      title="Ver Treinos"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => abrirEdicao(aluno)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
                      title="Editar Aluno"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => excluirAluno(aluno.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                      title="Excluir Aluno"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-5 py-14 text-center text-sm text-zinc-400 italic">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
