const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

/**
 * Baixa um arquivo CSV com BOM UTF-8.
 * @param {string}   nomeArquivo  ex: 'inadimplentes_2026-05.csv'
 * @param {string[]} cabecalho    ['Aluno', 'Plano', ...]
 * @param {Array[]}  linhas       [['João', 'Mensal', ...], ...]
 */
export function exportarCSV(nomeArquivo, cabecalho, linhas) {
  const esc = v => `"${String(v ?? '—').replace(/"/g, '""')}"`;
  const conteudo = [
    cabecalho.map(esc).join(','),
    ...linhas.map(l => l.map(esc).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: nomeArquivo });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Abre uma nova aba com o relatório formatado e dispara o diálogo de impressão
 * (o usuário pode salvar como PDF).
 */
export function imprimirRelatorio(titulo, cabecalho, linhas) {
  const esc = s =>
    String(s ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${esc(titulo)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#18181b;font-size:13px}
    h1{font-size:22px;margin:0 0 4px;color:#18181b}
    .sub{color:#71717a;font-size:12px;margin:0 0 22px}
    .logo{color:#22c55e;font-weight:900;font-size:15px;margin:0 0 16px;letter-spacing:-.5px}
    table{width:100%;border-collapse:collapse}
    th{background:#22c55e;color:#fff;padding:8px 11px;text-align:left;font-size:11px;
       text-transform:uppercase;letter-spacing:.6px}
    td{padding:8px 11px;border-bottom:1px solid #e4e4e7;vertical-align:top}
    tr:nth-child(even) td{background:#f9fafb}
    tfoot td{background:#f0fdf4;font-weight:700;border-top:2px solid #22c55e}
    @media print{@page{margin:15mm}button{display:none}}
  </style>
</head>
<body>
  <p class="logo">GymBalance</p>
  <h1>${esc(titulo)}</h1>
  <p class="sub">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  <table>
    <thead><tr>${cabecalho.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Permita pop-ups para imprimir o relatório.'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

export { MESES };
