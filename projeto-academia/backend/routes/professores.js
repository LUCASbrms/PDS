const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { SECRET, exigir } = require('../middleware/auth');

function mapProfessor(row) {
  return {
    id:            row.id,
    nome:          row.nome,
    email:         row.email         || '',
    telefone:      row.telefone      || '',
    cpf:           row.cpf           || '',
    especialidade: row.especialidade || '',
    status:        row.status        || 'Ativo',
    temSenha:      !!row.senha_hash,
    fotoUrl:       row.foto_url      || '',
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

// GET — listar todos (todos os tipos)
router.get('/', exigir('dono', 'professor', 'aluno'), async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM professores ORDER BY nome');
    res.json(rows.map(mapProfessor));
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST — criar (somente dono)
router.post('/', exigir('dono'), async (req, res) => {
  const { nome, email, telefone, cpf, especialidade, status, senha } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    const senhaHash = senha ? await bcrypt.hash(senha, 10) : null;
    const { rows } = await pool.query(
      `INSERT INTO professores (nome, email, telefone, cpf, especialidade, status, senha_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        nome.trim(),
        email         || null,
        telefone      || null,
        cpf           || null,
        especialidade || null,
        status        || 'Ativo',
        senhaHash,
      ],
    );
    res.status(201).json(mapProfessor(rows[0]));
  } catch (err) {
    handleDBError(err, res);
  }
});

// PUT — atualizar (somente dono)
router.put('/:id', exigir('dono'), async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, cpf, especialidade, status, senha } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    let query, params;
    if (senha && senha.length >= 6) {
      const senhaHash = await bcrypt.hash(senha, 10);
      query = `UPDATE professores SET nome=$1, email=$2, telefone=$3, cpf=$4, especialidade=$5, status=$6, senha_hash=$7 WHERE id=$8 RETURNING *`;
      params = [nome.trim(), email||null, telefone||null, cpf||null, especialidade||null, status||'Ativo', senhaHash, id];
    } else {
      query = `UPDATE professores SET nome=$1, email=$2, telefone=$3, cpf=$4, especialidade=$5, status=$6 WHERE id=$7 RETURNING *`;
      params = [nome.trim(), email||null, telefone||null, cpf||null, especialidade||null, status||'Ativo', id];
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.json(mapProfessor(rows[0]));
  } catch (err) {
    handleDBError(err, res);
  }
});

// DELETE — excluir (somente dono)
router.delete('/:id', exigir('dono'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM professores WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Professor não encontrado.' });
    res.status(204).end();
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST /login — autenticar professor via e-mail + senha
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  try {
    const { rows } = await pool.query('SELECT * FROM professores WHERE email=$1 LIMIT 1', [email.trim()]);
    if (!rows.length || !rows[0].senha_hash) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    const valido = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!valido) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    const token = jwt.sign({ id: rows[0].id, tipo: 'professor' }, SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: mapProfessor(rows[0]) });
  } catch (err) {
    console.error('[professores/login]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;
