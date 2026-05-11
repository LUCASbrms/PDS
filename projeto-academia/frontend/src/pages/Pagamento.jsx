import { useState } from 'react';
import { Copy, Check, CreditCard, QrCode, Calendar, Tag, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// Chave PIX e dados do cartão configurados pela academia
// (futuramente pode vir das configurações do dono)
const PIX_KEY   = '00.000.000/0001-00';   // substitua pela chave PIX real da academia
const PIX_NOME  = 'Academia GymBalance';

const PRECOS = { Mensal: 130, Trimestral: 330, Semestral: 600, Anual: 1200 };

function formatarData(str) {
  if (!str) return '—';
  const [ano, mes, dia] = str.split('-');
  return `${dia}/${mes}/${ano}`;
}

function StatusBadge({ vencimento }) {
  if (!vencimento) return null;
  const hoje = new Date();
  const venc = new Date(vencimento + 'T00:00:00');
  const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));

  if (diff < 0)  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">Atrasado</span>;
  if (diff <= 5) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20">Vence em {diff}d</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Em dia</span>;
}

export default function Pagamento({ aluno }) {
  const { addToast }    = useToast();
  const [copiado, setCopiado] = useState(false);
  const [metodo, setMetodo]   = useState(null); // 'pix' | 'cartao'

  const valor = PRECOS[aluno?.plano] ?? '—';

  function copiarPix() {
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setCopiado(true);
      addToast('Chave PIX copiada!', 'success');
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <div className="max-w-xl">
      <header className="mb-7">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">Financeiro</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Pagamento</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Escolha como deseja pagar sua mensalidade</p>
      </header>

      {/* Resumo do plano */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm">
        <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-3">Sua mensalidade</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Tag size={18} className="text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">Plano {aluno?.plano ?? '—'}</p>
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <Calendar size={11} />
                Vencimento: {formatarData(aluno?.vencimento)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-black text-green-500">
              {typeof valor === 'number' ? `R$ ${valor.toFixed(2)}` : '—'}
            </p>
            <StatusBadge vencimento={aluno?.vencimento} />
          </div>
        </div>
      </div>

      {/* Seleção de método */}
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Escolha o meio de pagamento</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
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

      {/* Painel PIX */}
      {metodo === 'pix' && (
        <div className="bg-white dark:bg-zinc-900 border border-green-500/30 rounded-2xl p-6 shadow-sm animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={18} className="text-green-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">Pagamento via PIX</h3>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Copie a chave PIX abaixo e realize a transferência pelo app do seu banco. O pagamento é confirmado imediatamente.
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-zinc-400 mb-1">Beneficiário</p>
            <p className="font-semibold text-zinc-900 dark:text-white">{PIX_NOME}</p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-zinc-400 mb-1">Chave PIX (CNPJ)</p>
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono font-semibold text-zinc-900 dark:text-white">{PIX_KEY}</p>
              <button
                onClick={copiarPix}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  copiado
                    ? 'bg-green-500 text-white'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white'
                }`}
              >
                {copiado ? <Check size={13} /> : <Copy size={13} />}
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Valor</p>
            <p className="text-xl font-black text-green-500">
              {typeof valor === 'number' ? `R$ ${valor.toFixed(2)}` : '—'}
            </p>
          </div>

          <p className="text-xs text-zinc-400 mt-4 text-center">
            Após o pagamento, apresente o comprovante na recepção ou envie pelo WhatsApp da academia.
          </p>
        </div>
      )}

      {/* Painel Cartão */}
      {metodo === 'cartao' && (
        <div className="bg-white dark:bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 shadow-sm animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-blue-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">Pagamento com Cartão</h3>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            O pagamento com cartão é realizado presencialmente na recepção da academia. Aceitamos:
          </p>

          <div className="space-y-3">
            {[
              { label: 'Débito',  detalhe: 'Aprovação imediata', cor: 'text-blue-500',  bg: 'bg-blue-500/10' },
              { label: 'Crédito', detalhe: 'Parcelamento disponível', cor: 'text-purple-500', bg: 'bg-purple-500/10' },
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
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mt-1">Horário de atendimento: Seg–Sex 6h–22h · Sáb 8h–14h</p>
          </div>
        </div>
      )}
    </div>
  );
}
