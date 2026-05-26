import { ChevronLeft, ChevronRight } from 'lucide-react';

const JANELA = 2; // páginas visíveis ao redor da atual

export default function Paginacao({ pagina, totalItens, porPagina, onChange }) {
  const totalPaginas = Math.ceil(totalItens / porPagina);
  if (totalPaginas <= 1) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fim    = Math.min(pagina * porPagina, totalItens);

  // gera array de páginas com null para ellipsis
  function paginas() {
    const nums = new Set([1, totalPaginas]);
    for (let i = pagina - JANELA; i <= pagina + JANELA; i++) {
      if (i > 1 && i < totalPaginas) nums.add(i);
    }
    const sorted = [...nums].sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const n of sorted) {
      if (n - prev > 1) result.push(null); // ellipsis
      result.push(n);
      prev = n;
    }
    return result;
  }

  const BTN = 'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200';

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-zinc-400">
        {inicio}–{fim} de {totalItens}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className={`${BTN} text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronLeft size={15} />
        </button>

        {paginas().map((p, i) =>
          p === null ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-zinc-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`${BTN} ${
                p === pagina
                  ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className={`${BTN} text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
