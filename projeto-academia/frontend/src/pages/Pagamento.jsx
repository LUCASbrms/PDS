import { useState, useEffect, useMemo } from 'react';
import {
  Copy, Check, CreditCard, QrCode, Calendar, Tag,
  CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { donoApi } from '../api';

function formatarData(str) {
  if (!str) return '—';
  const [ano, mes, dia] = str.split('-');
  return `${dia}/${mes}/${ano}`;
}

function StatusPagamentoBadge({ status }) {
  if (!status) return null;
  const map = {
    Pago:     'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Pendente: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Atrasado: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.Pendente}`}>
      {status}
    </span>
  );
}

function StatusPresencaBadge({ status }) {
  const map = {
    Presente:    { cls: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: <CheckCircle2 size={11} /> },
    Falta:       { cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',         icon: <XCircle size={11} /> },
    Justificada: { cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: <Clock size={11} /> },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.icon}{status}
    </span>
  );
}

export default function Pagamento({ aluno, mensalidades = [], presencas = [] }) {
  const { addToast } = useToast();
  const [copiado, setCopiado] = useState(false);
  const [metodo, setMetodo]   = useState(null);
  const [pixKey, setPixKey]   = useState('');
  const [pixNome, setPixNome] = useState('Academia GymBalance');

  useEffect(() => {
    donoApi.obter().then(dono => {
      if (dono?.chavePix)     setPixKey(dono.chavePix);
      if (dono?.nomeAcademia) setPixNome(dono.nomeAcademia);
    }).catch(() => {});
  }, []);

  // Mensalidades deste aluno, mais recente primeiro
  const minhasMensalidades = useMemo(() =>
    mensalidades
      .filter(m => String(m.alunoId) === String(aluno?.id))
      .sort((a, b) => new Date(b.vencimento) - new Date(a.vencimento)),
    [mensalidades, aluno?.id]
  );
  const mensalidadeAtual = minhasMensalidades[0] ?? null;

  // Presenças deste aluno, mais recente primeiro
  const minhasPresencas = useMemo(() =>
    presencas
      .filter(p => String(p.alunoId) === String(aluno?.id))
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 30),
    [presencas, aluno?.id]
  );

  const totalPresentes = minhasPresencas.filter(p => p.status === 'Presente').length;
  const totalFaltas    = minhasPresencas.filter(p => p.status === 'Falta').length;
  const totalJustific  = minhasPresencas.filter(p => p.status === 'Justificada').length;

  function copiarPix() {
    navigator.clipboard.writeText(pixKey).then(() => {
      setCopiado(true);
      addToast('Chave PIX copiada!', 'success');
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header className="mb-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Minha Conta</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Financeiro & Presença</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Acompanhe sua situação na academia</p>
      </header>

      {/* ── Situação financeira ── */}
      <section>
        <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Situação Financeira</h3>

        {mensalidadeAtual ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            {/* Mensalidade atual */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Tag size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">Plano {aluno?.plano ?? '—'}</p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    Vencimento: {formatarData(mensalidadeAtual.vencimento)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black text-green-500">
                  R$ {Number(mensalidadeAtual.valor).toFixed(2)}
                </p>
                <StatusPagamentoBadge status={mensalidadeAtual.status} />
              </div>
            </div>

            {/* Histórico de mensalidades */}
            {minhasMensalidades.length > 1 && (
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Histórico</p>
                <div className="space-y-2">
                  {minhasMensalidades.slice(1, 6).map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={13} className="text-zinc-400" />
                        <span className="text-zinc-600 dark:text-zinc-300">{m.plano}</span>
                        <span className="text-zinc-400 text-xs">· venc. {formatarData(m.vencimento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 dark:text-zinc-400 text-xs">R$ {Number(m.valor).toFixed(2)}</span>
                        <StatusPagamentoBadge status={m.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-zinc-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Plano {aluno?.plano ?? '—'}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Nenhuma mensalidade registrada ainda.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Meio de pagamento ── */}
      <section>
        <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Realizar Pagamento</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setMetodo(metodo === 'pix' ? null : 'pix')}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
              metodo === 'pix'
                ? 'border-green-500 bg-green-500/5 shadow-md shadow-green-500/10'
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-green-500/50'
            }`}
          >
            <QrCode size={28} className={metodo === 'pix' ? 'text-green-500' : 'text-zinc-400'} />
            <span className={`text-sm font-bold ${metodo === 'pix' ? 'text-green-500' : 'text-zinc-600 dark:text-zinc-300'}`}>PIX</span>
            <span className="text-xs text-zinc-400">Aprovação imediata</span>
          </button>

          <button
            onClick={() => setMetodo(metodo === 'cartao' ? null : 'cartao')}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
              metodo === 'cartao'
                ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10'
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-500/50'
            }`}
          >
            <CreditCard size={28} className={metodo === 'cartao' ? 'text-blue-500' : 'text-zinc-400'} />
            <span className={`text-sm font-bold ${metodo === 'cartao' ? 'text-blue-500' : 'text-zinc-600 dark:text-zinc-300'}`}>Cartão</span>
            <span className="text-xs text-zinc-400">Débito ou crédito</span>
          </button>
        </div>

        {metodo === 'pix' && (
          <div className="bg-white dark:bg-zinc-900 border border-green-500/30 rounded-2xl p-6 shadow-sm animate-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-green-500" />
              <h4 className="font-bold text-zinc-900 dark:text-white">Pagamento via PIX</h4>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Copie a chave PIX abaixo e realize a transferência pelo app do seu banco.
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-3">
              <p className="text-xs text-zinc-400 mb-1">Beneficiário</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{pixNome}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-3">
              <p className="text-xs text-zinc-400 mb-1">Chave PIX</p>
              <div className="flex items-center justify-between gap-3">
                {pixKey
                  ? <p className="font-mono font-semibold text-zinc-900 dark:text-white">{pixKey}</p>
                  : <p className="text-sm text-zinc-400 italic">Não configurada — contate a recepção.</p>
                }
                <button
                  onClick={copiarPix}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    copiado ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white'
                  } ${!pixKey ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  {copiado ? <Check size={13} /> : <Copy size={13} />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            {mensalidadeAtual && (
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-400 mb-1">Valor</p>
                <p className="text-xl font-black text-green-500">R$ {Number(mensalidadeAtual.valor).toFixed(2)}</p>
              </div>
            )}
            <p className="text-xs text-zinc-400 mt-4 text-center">
              Após o pagamento, apresente o comprovante na recepção ou envie pelo WhatsApp da academia.
            </p>
          </div>
        )}

        {metodo === 'cartao' && (
          <div className="bg-white dark:bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 shadow-sm animate-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-blue-500" />
              <h4 className="font-bold text-zinc-900 dark:text-white">Pagamento com Cartão</h4>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              O pagamento com cartão é realizado presencialmente na recepção. Aceitamos:
            </p>
            <div className="space-y-3">
              {[
                { label: 'Débito',  detalhe: 'Aprovação imediata',       cor: 'text-blue-500',   bg: 'bg-blue-500/10' },
                { label: 'Crédito', detalhe: 'Parcelamento disponível',  cor: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map(op => (
                <div key={op.label} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                  <div className={`${op.bg} p-2 rounded-lg`}>
                    <CreditCard size={16} className={op.cor} />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">{op.label}</p>
                    <p className="text-xs text-zinc-400">{op.detalhe}</p>
                  </div>
                  <CheckCircle2 size={16} className="text-green-500 ml-auto" />
                </div>
              ))}
            </div>
            <div className="mt-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-xs text-zinc-400">Dirija-se à recepção com seu documento e cartão.</p>
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mt-1">Seg–Sex 6h–22h · Sáb 8h–14h</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Histórico de presença ── */}
      <section>
        <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Minha Presença</h3>

        {/* Mini resumo */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Presenças',    value: totalPresentes, cls: 'text-green-500',  bg: 'bg-green-500/10'  },
            { label: 'Faltas',       value: totalFaltas,    cls: 'text-red-500',    bg: 'bg-red-500/10'    },
            { label: 'Justificadas', value: totalJustific,  cls: 'text-orange-500', bg: 'bg-orange-500/10' },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
              <p className={`text-2xl font-black ${c.cls}`}>{c.value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {minhasPresencas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-400 italic">Nenhuma presença registrada ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {minhasPresencas.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={13} className="text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {formatarData(p.data)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(p.data + 'T12:00:00').getDay()]}
                    </span>
                  </div>
                  <StatusPresencaBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
