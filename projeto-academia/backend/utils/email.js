const nodemailer = require('nodemailer');

// Configuração explícita do SMTP do Gmail (mais confiável que service:'gmail' no v8)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    // Remove espaços da senha de app do Google (gerada como "xxxx xxxx xxxx xxxx")
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Testa a conexão ao iniciar (apenas loga, não trava o servidor)
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((err) => {
    if (err) {
      console.error('[email] Falha na conexão SMTP:', err.message);
      console.error('[email] Verifique EMAIL_USER e EMAIL_PASS no .env');
    } else {
      console.log('[email] SMTP conectado — notificações por email ativas');
    }
  });
} else {
  console.warn('[email] EMAIL_USER ou EMAIL_PASS não configurados — emails desativados');
}

function guard(emailAluno, contexto) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`[email-${contexto}] Credenciais de email não configuradas no .env`);
    return false;
  }
  if (!emailAluno || !emailAluno.includes('@')) {
    console.warn(`[email-${contexto}] Email do destinatário inválido ou ausente: "${emailAluno}"`);
    return false;
  }
  return true;
}

// ── 1. Treino atualizado (ficha editada pelo professor/dono) ──────────────────
async function enviarEmailTreinoAtualizado({ nomeAluno, emailAluno, nomeFicha, objetivo }) {
  if (!guard(emailAluno, 'treino-atualizado')) return;
  console.log('[email-treino-atualizado] Enviando para:', emailAluno);
  await transporter.sendMail({
    from: `"GymBalance" <${process.env.EMAIL_USER}>`,
    to: emailAluno,
    subject: 'Seu treino foi atualizado — GymBalance',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#22c55e;margin-bottom:4px">Treino atualizado!</h2>
        <p style="color:#71717a;margin-top:0">Olá, <strong style="color:#18181b">${nomeAluno}</strong>!</p>
        <p style="color:#71717a">Seu professor atualizou seu treino. Acesse o GymBalance para conferir as novidades.</p>
        <div style="background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px">DETALHES DO TREINO</p>
          <p style="margin:6px 0"><strong>Ficha:</strong> ${nomeFicha}</p>
          <p style="margin:6px 0"><strong>Objetivo:</strong> ${objetivo}</p>
          <p style="margin:6px 0"><strong>Atualizado em:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <p style="color:#71717a;font-size:13px">Bons treinos! 💪</p>
      </div>
    `,
  });
}

// ── 2. Nova ficha atribuída ao aluno ─────────────────────────────────────────
async function enviarEmailFichaAtribuida({ nomeAluno, emailAluno, nomeFicha, objetivo }) {
  if (!guard(emailAluno, 'ficha-atribuida')) return;
  console.log('[email-ficha-atribuida] Enviando para:', emailAluno);
  await transporter.sendMail({
    from: `"GymBalance" <${process.env.EMAIL_USER}>`,
    to: emailAluno,
    subject: 'Nova ficha de treino disponível — GymBalance',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#22c55e;margin-bottom:4px">Nova ficha de treino! 🏋️</h2>
        <p style="color:#71717a;margin-top:0">Olá, <strong style="color:#18181b">${nomeAluno}</strong>!</p>
        <p style="color:#71717a">Seu professor criou uma nova ficha de treino para você. Acesse o GymBalance para ver os exercícios.</p>
        <div style="background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px">DETALHES DA FICHA</p>
          <p style="margin:6px 0"><strong>Nome:</strong> ${nomeFicha}</p>
          <p style="margin:6px 0"><strong>Objetivo:</strong> ${objetivo}</p>
          <p style="margin:6px 0"><strong>Atribuída em:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <p style="color:#71717a;font-size:13px">Bons treinos! 💪</p>
      </div>
    `,
  });
}

// ── 3. Pagamento confirmado ───────────────────────────────────────────────────
async function enviarEmailPagamentoConfirmado({ nomeAluno, emailAluno, plano, valor, dataPagamento }) {
  if (!guard(emailAluno, 'pagamento')) return;
  console.log('[email-pagamento] Enviando para:', emailAluno);
  await transporter.sendMail({
    from: `"GymBalance" <${process.env.EMAIL_USER}>`,
    to: emailAluno,
    subject: 'Pagamento confirmado — GymBalance',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#22c55e;margin-bottom:4px">Pagamento confirmado!</h2>
        <p style="color:#71717a;margin-top:0">Olá, <strong style="color:#18181b">${nomeAluno}</strong>!</p>
        <p style="color:#71717a">Seu pagamento foi registrado com sucesso. Obrigado por manter sua mensalidade em dia!</p>
        <div style="background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px">DETALHES DO PAGAMENTO</p>
          <p style="margin:6px 0"><strong>Plano:</strong> ${plano}</p>
          <p style="margin:6px 0"><strong>Valor:</strong> R$ ${Number(valor).toFixed(2)}</p>
          <p style="margin:6px 0"><strong>Data:</strong> ${new Date(dataPagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
          <p style="margin:6px 0"><strong>Status:</strong> <span style="color:#22c55e;font-weight:bold">Pago ✓</span></p>
        </div>
        <p style="color:#71717a;font-size:13px">Bons treinos! 💪</p>
      </div>
    `,
  });
}

// ── 4. Alerta de vencimento próximo ──────────────────────────────────────────
async function enviarEmailVencimentoProximo({ nomeAluno, emailAluno, vencimento, plano, valor, diasRestantes }) {
  if (!guard(emailAluno, 'vencimento')) return;
  console.log('[email-vencimento] Enviando para:', emailAluno);
  const dataFormatada = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR');
  const urgente = diasRestantes <= 1;
  await transporter.sendMail({
    from: `"GymBalance" <${process.env.EMAIL_USER}>`,
    to: emailAluno,
    subject: urgente
      ? `⚠️ Mensalidade vence AMANHÃ — GymBalance`
      : `Lembrete: mensalidade vence em ${diasRestantes} dias — GymBalance`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:${urgente ? '#ef4444' : '#f97316'};margin-bottom:4px">
          ${urgente ? '⚠️ Vencimento amanhã!' : `📅 Vencimento em ${diasRestantes} dias`}
        </h2>
        <p style="color:#71717a;margin-top:0">Olá, <strong style="color:#18181b">${nomeAluno}</strong>!</p>
        <p style="color:#71717a">
          ${urgente
            ? 'Sua mensalidade vence <strong>amanhã</strong>. Não esqueça de realizar o pagamento!'
            : `Sua mensalidade vence em <strong>${diasRestantes} dias</strong>. Fique em dia para continuar treinando!`}
        </p>
        <div style="background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px">DETALHES DA MENSALIDADE</p>
          <p style="margin:6px 0"><strong>Plano:</strong> ${plano}</p>
          <p style="margin:6px 0"><strong>Valor:</strong> R$ ${Number(valor).toFixed(2)}</p>
          <p style="margin:6px 0"><strong>Vencimento:</strong> <span style="color:${urgente ? '#ef4444' : '#f97316'};font-weight:bold">${dataFormatada}</span></p>
        </div>
        <p style="color:#71717a;font-size:13px">Em caso de dúvidas, entre em contato com a academia.</p>
      </div>
    `,
  });
}

module.exports = {
  transporter,
  enviarEmailTreinoAtualizado,
  enviarEmailFichaAtribuida,
  enviarEmailPagamentoConfirmado,
  enviarEmailVencimentoProximo,
};
