const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { exigir } = require('../middleware/auth');

function mapPresenca(row) {
  return {
    id:          row.id,
    alunoId:     row.aluno_id,
    alunoNome:   row.aluno_nome || '',
    data:        row.data ? new Date(row.data).toISOString().slice(0, 10) : '',
    status:      row.status,
    observacoes: row.observacoes || '',
  };
}

const COM_NOME = `
  SELECT p.*, a.nome AS aluno_nome
  FROM presencas p
  JOIN alunos a ON a.id = p.aluno_id
`;

// GET — listar todas (dono e professor; aluno consulta pelo historico)
router.get('/', exigir('dono', 'professor'), async (_req, res) => {
  try {
    const { rows } = await pool.query(`${COM_NOME} ORDER BY p.data DESC`);
    res.json(rows.map(mapPresenca));
  } catch (err) {
    console.error('[presencas]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// GET /historico/:alunoId — histórico mensal de um aluno (todos os tipos)
router.get('/historico/:alunoId', exigir('dono', 'professor', 'aluno'), async (req, res) => {
  const { alunoId } = req.params;
  const mes = parseInt(req.query.mes, 10); // 1-12
  const ano = parseInt(req.query.ano, 10);

  if (!mes || !ano) return res.status(400).json({ erro: 'mes e ano são obrigatórios.' });

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.aluno_id, p.data, p.status, p.observacoes
       FROM presencas p
       WHERE p.aluno_id = $1
         AND EXTRACT(MONTH FROM p.data) = $2
         AND EXTRACT(YEAR  FROM p.data) = $3
       ORDER BY p.data`,
      [alunoId, mes, ano],
    );
    res.json(rows.map(r => ({
      id:          r.id,
      alunoId:     r.aluno_id,
      data:        new Date(r.data).toISOString().slice(0, 10),
      status:      r.status,
      observacoes: r.observacoes || '',
    })));
  } catch (err) {
    console.error('[presencas/historico]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST — registrar presença (somente dono e professor)
router.post('/', exigir('dono', 'professor'), async (req, res) => {
  const { alunoId, data, status, observacoes } = req.body;
  if (!alunoId) return res.status(400).json({ erro: 'Aluno é obrigatório.' });
  if (!data)    return res.status(400).json({ erro: 'Data é obrigatória.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO presencas (aluno_id, data, status, observacoes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (aluno_id, data) DO UPDATE
         SET status = EXCLUDED.status,
             observacoes = EXCLUDED.observacoes
       RETURNING *,
         (SELECT nome FROM alunos WHERE id = $1) AS aluno_nome`,
      [alunoId, data, status || 'Presente', observacoes || null],
    );
    res.status(201).json(mapPresenca(rows[0]));
  } catch (err) {
    console.error('[presencas]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// DELETE — remover presença (somente dono e professor)
router.delete('/:id', exigir('dono', 'professor'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM presencas WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Presença não encontrada.' });
    res.status(204).end();
  } catch (err) {
    console.error('[presencas]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;
