const express = require('express');
const router  = express.Router();
const pool    = require('../db');

function mapProfessor(row) {
  return {
    id:            row.id,
    nome:          row.nome,
    email:         row.email         || '',
    telefone:      row.telefone      || '',
    cpf:           row.cpf           || '',
    especialidade: row.especialidade || '',
    status:        row.status        || 'Ativo',
  };
}

function handleDBError(err, res) {
  if (err.code === '23505') {
    const campo = err.constraint?.includes('cpf') ? 'CPF' : err.constraint?.includes('email') ? 'e-mail' : 'registro';
    return res.status(409).json({ erro: `Este ${campo} já está cadastrado.` });
  }
  console.error('[professores]', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

// GET — listar todos
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM professores ORDER BY nome');
    res.json(rows.map(mapProfessor));
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST — criar
router.post('/', async (req, res) => {
  const { nome, email, telefone, cpf, especialidade, status } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO professores (nome, email, telefone, cpf, especialidade, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        nome.trim(),
        email         || null,
        telefone      || null,
        cpf           || null,
        especialidade || null,
        status        || 'Ativo',
      ],
    );
    res.status(201).json(mapProfessor(rows[0]));
  } catch (err) {
    handleDBError(err, res);
  }
});

// PUT — atualizar
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, cpf, especialidade, status } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `UPDATE professores
       SET nome=$1, email=$2, telefone=$3, cpf=$4, especialidade=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [
        nome.trim(),
        email         || null,
        telefone      || null,
        cpf           || null,
        especialidade || null,
        status        || 'Ativo',
        id,
      ],
    );
    if (!rows.length) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.json(mapProfessor(rows[0]));
  } catch (err) {
    handleDBError(err, res);
  }
});

// DELETE — excluir
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM professores WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.status(204).end();
  } catch (err) {
    handleDBError(err, res);
  }
});

module.exports = router;
