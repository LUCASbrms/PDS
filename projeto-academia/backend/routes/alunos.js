const express = require('express');
const router  = express.Router();
const pool    = require('../db');

function mapAluno(row) {
  const ts = row.treinos_semana || {};
  return {
    id:            row.id,
    nome:          row.nome,
    nascimento:    row.nascimento ? new Date(row.nascimento).toISOString().slice(0, 10) : '',
    cpf:           row.cpf           || '',
    telefone:      row.telefone      || '',
    altura:        row.altura  != null ? String(row.altura)  : '',
    peso:          row.peso    != null ? String(row.peso)    : '',
    plano:         row.plano         || 'Mensal',
    vencimento:    row.vencimento ? new Date(row.vencimento).toISOString().slice(0, 10) : '',
    status:        row.status        || 'Ativo',
    fichaId:       row.ficha_id != null ? String(row.ficha_id) : '',
    treinosSemana: {
      segunda: ts.segunda || '',
      terca:   ts.terca   || '',
      quarta:  ts.quarta  || '',
      quinta:  ts.quinta  || '',
      sexta:   ts.sexta   || '',
    },
  };
}

function handleDBError(err, res) {
  if (err.code === '23505') {
    const campo = err.constraint?.includes('cpf') ? 'CPF' : 'registro';
    return res.status(409).json({ erro: `${campo} já cadastrado no sistema.` });
  }
  console.error('[alunos]', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

// GET — listar todos
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM alunos ORDER BY nome');
    res.json(rows.map(mapAluno));
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST — criar
router.post('/', async (req, res) => {
  const { nome, nascimento, cpf, telefone, altura, peso, plano, vencimento, status, fichaId, treinosSemana } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO alunos (nome, nascimento, cpf, telefone, altura, peso, plano, vencimento, status, ficha_id, treinos_semana)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        nome.trim(),
        nascimento  || null,
        cpf         || null,
        telefone    || null,
        altura      || null,
        peso        || null,
        plano       || 'Mensal',
        vencimento  || null,
        status      || 'Ativo',
        fichaId     || null,
        JSON.stringify(treinosSemana || { segunda: '', terca: '', quarta: '', quinta: '', sexta: '' }),
      ],
    );
    res.status(201).json(mapAluno(rows[0]));
  } catch (err) {
    handleDBError(err, res);
  }
});

// PUT — atualizar
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, nascimento, cpf, telefone, altura, peso, plano, vencimento, status, fichaId, treinosSemana } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `UPDATE alunos
       SET nome=$1, nascimento=$2, cpf=$3, telefone=$4, altura=$5, peso=$6,
           plano=$7, vencimento=$8, status=$9, ficha_id=$10, treinos_semana=$11
       WHERE id=$12 RETURNING *`,
      [
        nome.trim(),
        nascimento  || null,
        cpf         || null,
        telefone    || null,
        altura      || null,
        peso        || null,
        plano       || 'Mensal',
        vencimento  || null,
        status      || 'Ativo',
        fichaId     || null,
        JSON.stringify(treinosSemana || {}),
        id,
      ],
    );
    if (!rows.length) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json(mapAluno(rows[0]));
  } catch (err) {
    handleDBError(err, res);
  }
});

// DELETE — excluir
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM alunos WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.status(204).end();
  } catch (err) {
    handleDBError(err, res);
  }
});

module.exports = router;
