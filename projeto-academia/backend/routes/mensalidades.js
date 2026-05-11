const express = require('express');
const router  = express.Router();
const pool    = require('../db');

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

// GET — listar todas
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`${COM_NOME} ORDER BY m.vencimento DESC`);
    res.json(rows.map(mapMensalidade));
  } catch (err) {
    console.error('[mensalidades]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST — criar
router.post('/', async (req, res) => {
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

// PUT — atualizar
router.put('/:id', async (req, res) => {
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
    res.json(mapMensalidade(rows[0]));
  } catch (err) {
    console.error('[mensalidades]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// DELETE — excluir
router.delete('/:id', async (req, res) => {
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
