const express      = require('express');
const router       = express.Router();
const Stripe       = require('stripe');
const nodemailer   = require('nodemailer');
const pool         = require('../db');
const { criarProximaMensalidade } = require('./mensalidades');

const stripe       = Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmailPagamento({ nomeAluno, emailAluno, plano, valor, dataPagamento }) {
  console.log('[email] EMAIL_USER:', process.env.EMAIL_USER || '(vazio)');
  console.log('[email] EMAIL_PASS:', process.env.EMAIL_PASS ? '(preenchido)' : '(vazio)');
  console.log('[email] Destinatário:', emailAluno || '(vazio)');
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !emailAluno) {
    console.log('[email] Envio cancelado — credencial ou email do aluno ausente.');
    return;
  }
  console.log('[email] Enviando para:', emailAluno);
  await transporter.sendMail({
    from: `"GymBalance" <${process.env.EMAIL_USER}>`,
    to: emailAluno,
    subject: 'Pagamento confirmado — GymBalance',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#22c55e;margin-bottom:4px">Pagamento confirmado!</h2>
        <p style="color:#71717a;margin-top:0">Olá, <strong style="color:#18181b">${nomeAluno}</strong>!</p>
        <div style="background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px">DETALHES DO PAGAMENTO</p>
          <p style="margin:6px 0"><strong>Plano:</strong> ${plano}</p>
          <p style="margin:6px 0"><strong>Valor:</strong> R$ ${Number(valor).toFixed(2)}</p>
          <p style="margin:6px 0"><strong>Data:</strong> ${new Date(dataPagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
          <p style="margin:6px 0"><strong>Status:</strong> <span style="color:#22c55e;font-weight:bold">Pago</span></p>
        </div>
        <p style="color:#71717a;font-size:13px">Obrigado por estar com a gente. Bons treinos!</p>
      </div>
    `,
  });
}

// POST /api/pagamento/criar-sessao
// Cria uma Stripe Checkout Session para uma mensalidade específica
router.post('/criar-sessao', async (req, res) => {
  const { mensalidadeId } = req.body;
  if (!mensalidadeId) return res.status(400).json({ erro: 'mensalidadeId é obrigatório.' });

  try {
    const { rows } = await pool.query(
      `SELECT m.*, a.nome AS aluno_nome
       FROM mensalidades m
       JOIN alunos a ON a.id = m.aluno_id
       WHERE m.id = $1`,
      [mensalidadeId]
    );

    if (!rows.length) return res.status(404).json({ erro: 'Mensalidade não encontrada.' });

    const m = rows[0];

    if (m.status === 'Pago') {
      return res.status(400).json({ erro: 'Esta mensalidade já foi paga.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Mensalidade ${m.plano}`,
              description: `Academia · Aluno: ${m.aluno_nome} · Vencimento: ${new Date(m.vencimento).toLocaleDateString('pt-BR')}`,
            },
            unit_amount: Math.round(parseFloat(m.valor) * 100), // centavos
          },
          quantity: 1,
        },
      ],
      metadata: {
        mensalidadeId: String(m.id),
        alunoId:       String(m.aluno_id),
      },
      success_url: `${FRONTEND_URL}?pagamento=sucesso&mensalidadeId=${m.id}`,
      cancel_url:  `${FRONTEND_URL}?pagamento=cancelado`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[pagamento/criar-sessao]', err.message);
    res.status(500).json({ erro: 'Erro ao criar sessão de pagamento.' });
  }
});

// POST /api/pagamento/webhook
// Stripe chama esta rota após pagamento confirmado
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = secret
      ? stripe.webhooks.constructEvent(req.body, sig, secret)
      : JSON.parse(req.body);
  } catch (err) {
    console.error('[webhook] Assinatura inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session      = event.data.object;
    const mensalidadeId = session.metadata?.mensalidadeId;

    if (mensalidadeId) {
      try {
        const { rows } = await pool.query(
          `UPDATE mensalidades
           SET status = 'Pago', data_pagamento = CURRENT_DATE
           WHERE id = $1 AND status != 'Pago'
           RETURNING *, (SELECT nome  FROM alunos WHERE id = aluno_id) AS aluno_nome,
                        (SELECT email FROM alunos WHERE id = aluno_id) AS aluno_email`,
          [mensalidadeId]
        );
        if (rows.length) {
          const m = rows[0];
          console.log(`[webhook] Mensalidade ${mensalidadeId} marcada como Pago.`);
          console.log(`[webhook] aluno_nome: ${m.aluno_nome} | aluno_email: ${m.aluno_email}`);

          // Gera a próxima mensalidade automaticamente
          await criarProximaMensalidade(
            m.aluno_id,
            m.plano,
            new Date(m.vencimento).toISOString().slice(0, 10),
            parseFloat(m.valor)
          );
          try {
            await enviarEmailPagamento({
              nomeAluno:     m.aluno_nome,
              emailAluno:    m.aluno_email,
              plano:         m.plano,
              valor:         m.valor,
              dataPagamento: m.data_pagamento,
            });
            console.log('[email] Enviado com sucesso!');
          } catch (emailErr) {
            console.error('[email] Erro ao enviar:', emailErr.message);
          }
        } else {
          console.log(`[webhook] Mensalidade ${mensalidadeId} já estava paga ou não encontrada.`);
        }
      } catch (err) {
        console.error('[webhook] Erro ao atualizar mensalidade:', err.message);
      }
    }
  }

  res.json({ recebido: true });
});

module.exports = router;
