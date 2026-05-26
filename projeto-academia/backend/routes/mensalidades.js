const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { exigir } = require('../middleware/auth');
const { enviarEmailPagamentoConfirmado } = require('../utils/email');

const MESES_POR_PLANO = { Mensal: 1, Trimestral: 3, Semestral: 6, Anual: 12 };

async function criarProximaMensalidade(alunoId, plano, vencimentoAtual, valor) {
  const meses = MESES_POR_PLANO[plano] ?? 1;
  const proximo = new Date(vencimentoAtual + 'T12:00:00');
  proximo.setMonth(proximo.getMonth() + meses);
  const proximoStr = proximo.toISOString().slice(0, 10);

  // Só cria se não existir mensalidade para este vencimento
  const { rowCount } = await pool.query(
    `SELECT 1 FROM mensalidades WHERE aluno_id = $1 AND vencimento = $2`,
    [alunoId, proximoStr]
  );
  if (rowCount > 0) return;

  await pool.query(
    `INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, status)
     VALUES ($1, $2, $3, $4, 'Pendente')`,
    [alunoId, plano, valor, proximoStr]
  );
  console.log(`[mensalidades] Próxima mensalidade criada: aluno ${alunoId} · venc. ${proximoStr}`);
}

function mapMensalidade(row) {
  return {
    id:            row.id,
    alunoId:       row.aluno_id,
    alunoNome:     row.aluno_nome || '',
    plano:         row.plano,
    valor:         parseFloat(row.valor),
    vencimento:    row.vencimento    ? new Date(row.vencimento).toISOString().slice(0, 10)    : '',
    dataPagamento: row.data_pagamento ? new Date(row.data_pagamento).toISOString().slice(0, 10) : '',
    status:        row.status,
    observacoes:   row.observacoes || '',
  };
}

const COM_NOME = `
  SELECT m.*, a.nome AS aluno_nome
  FROM mensalidades m
  JOIN alunos a ON a.id = m.aluno_id
`;

// GET — listar todas (dono, professor e aluno — aluno vê as próprias no frontend)
router.get('/', exigir('dono', 'professor', 'aluno'), async (_req, res) => {
  try {
    // Atualiza para "Atrasado" qualquer mensalidade Pendente com vencimento anterior a hoje
    await pool.query(`
      UPDATE mensalidades
      SET status = 'Atrasado'
      WHERE status = 'Pendente'
        AND vencimento < CURRENT_DATE
    `);

    const { rows } = await pool.query(`${COM_NOME} ORDER BY m.vencimento DESC`);
    res.json(rows.map(mapMensalidade));
  } catch (err) {
    console.error('[mensalidades]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST — criar (somente dono)
router.post('/', exigir('dono'), async (req, res) => {
  const { alunoId, plano, valor, vencimento, dataPagamento, status, observacoes } = req.body;
  if (!alunoId)    return res.status(400).json({ erro: 'Aluno é obrigatório.' });
  if (!vencimento) return res.status(400).json({ erro: 'Vencimento é obrigatório.' });
  if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0)
    return res.status(400).json({ erro: 'Valor inválido.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *,
         (SELECT nome FROM alunos WHERE id = $1) AS aluno_nome`,
      [alunoId, plano || 'Mensal', parseFloat(valor), vencimento,
       dataPagamento || null, status || 'Pendente', observacoes || null],
    );
    res.status(201).json(mapMensalidade(rows[0]));
  } catch (err) {
    console.error('[mensalidades]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// PUT — atualizar (somente dono)
router.put('/:id', exigir('dono'), async (req, res) => {
  const { id } = req.params;
  const { alunoId, plano, valor, vencimento, dataPagamento, status, observacoes } = req.body;
  if (!alunoId)    return res.status(400).json({ erro: 'Aluno é obrigatório.' });
  if (!vencimento) return res.status(400).json({ erro: 'Vencimento é obrigatório.' });
  if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0)
    return res.status(400).json({ erro: 'Valor inválido.' });

  try {
    const { rows } = await pool.query(
      `UPDATE mensalidades
       SET aluno_id=$1, plano=$2, valor=$3, vencimento=$4,
           data_pagamento=$5, status=$6, observacoes=$7
       WHERE id=$8
       RETURNING *,
         (SELECT nome FROM alunos WHERE id = $1) AS aluno_nome`,
      [alunoId, plano || 'Mensal', parseFloat(valor), vencimento,
       dataPagamento || null, status || 'Pendente', observacoes || null, id],
    );
    if (!rows.length) return res.status(404).json({ erro: 'Mensalidade não encontrada.' });
    const m = rows[0];

    // Se acabou de ser marcada como Pago, gera a próxima mensalidade e envia email
    if (status === 'Pago') {
      await criarProximaMensalidade(
        m.aluno_id,
        m.plano,
        new Date(m.vencimento).toISOString().slice(0, 10),
        parseFloat(m.valor)
      );

      // Busca email do aluno e envia confirmação de pagamento
      const { rows: alunoRows } = await pool.query(
        'SELECT nome, email FROM alunos WHERE id=$1',
        [m.aluno_id]
      );
      const aluno = alunoRows[0];
      if (aluno?.email) {
        enviarEmailPagamentoConfirmado({
          nomeAluno:     aluno.nome,
          emailAluno:    aluno.email,
          plano:         m.plano,
          valor:         m.valor,
          dataPagamento: dataPagamento || new Date().toISOString().slice(0, 10),
        }).catch(err => console.error('[mensalidades] Erro ao enviar email de pagamento:', err.message, err.response || ''));
      } else {
        console.warn(`[mensalidades] Aluno id=${m.aluno_id} não tem email cadastrado — notificação não enviada`);
      }
    }

    res.json(mapMensalidade(m));
  } catch (err) {
    console.error('[mensalidades]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// DELETE — excluir (somente dono)
router.delete('/:id', exigir('dono'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM mensalidades WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Mensalidade não encontrada.' });
    res.status(204).end();
  } catch (err) {
    console.error('[mensalidades]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;
module.exports.criarProximaMensalidade = criarProximaMensalidade;
