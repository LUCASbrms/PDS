const cron = require('node-cron');
const pool = require('../db');
const { enviarEmailVencimentoProximo } = require('./email');

// Dias antes do vencimento em que o aluno será notificado
const DIAS_ALERTA = [3, 1];

async function verificarVencimentos() {
  console.log('[cron] Verificando vencimentos próximos...');
  try {
    for (const dias of DIAS_ALERTA) {
      const { rows } = await pool.query(
        `SELECT m.id, m.plano, m.valor, m.vencimento::text AS vencimento,
                a.nome AS aluno_nome, a.email AS aluno_email
         FROM mensalidades m
         JOIN alunos a ON a.id = m.aluno_id
         WHERE m.status IN ('Pendente', 'Atrasado')
           AND m.vencimento = CURRENT_DATE + INTERVAL '${dias} days'
           AND a.email IS NOT NULL
           AND a.email <> ''`,
      );

      if (rows.length === 0) {
        console.log(`[cron] Nenhum vencimento em ${dias} dia(s).`);
        continue;
      }

      console.log(`[cron] ${rows.length} aluno(s) com vencimento em ${dias} dia(s).`);

      for (const row of rows) {
        enviarEmailVencimentoProximo({
          nomeAluno:     row.aluno_nome,
          emailAluno:    row.aluno_email,
          vencimento:    row.vencimento,
          plano:         row.plano,
          valor:         row.valor,
          diasRestantes: dias,
        }).catch(err =>
          console.error(`[cron] Erro ao enviar email para ${row.aluno_email}:`, err.message),
        );
      }
    }
  } catch (err) {
    console.error('[cron] Erro ao verificar vencimentos:', err.message);
  }
}

function iniciarCronNotificacoes() {
  // Executa todo dia às 08:00 (horário de Brasília)
  cron.schedule('0 8 * * *', verificarVencimentos, { timezone: 'America/Sao_Paulo' });
  console.log('✓ Cron de notificações agendado (diário às 08:00 BRT)');
}

module.exports = { iniciarCronNotificacoes, verificarVencimentos };
