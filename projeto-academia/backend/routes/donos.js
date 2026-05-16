const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');
const { SECRET } = require('../middleware/auth');

function mapDono(row) {
  return {
    id:           row.id,
    nome:         row.nome,
    email:        row.email,
    telefone:     row.telefone      || '',
    cpf:          row.cpf           || '',
    nomeAcademia: row.nome_academia || '',
    chavePix:     row.chave_pix     || '',
  };
}

// GET — obtém o dono cadastrado (único)
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM donos ORDER BY id LIMIT 1');
    if (!rows.length) return res.status(404).json(null);
    res.json(mapDono(rows[0]));
  } catch (err) {
    console.error('[donos]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST — registrar dono (só permitido se nenhum existe)
router.post('/', async (req, res) => {
  const { nome, email, senha, telefone, cpf, nomeAcademia } = req.body;
  if (!nome?.trim())  return res.status(400).json({ erro: 'Nome é obrigatório.' });
  if (!email?.trim()) return res.status(400).json({ erro: 'E-mail é obrigatório.' });
  if (!senha || senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter ao menos 6 caracteres.' });

  try {
    const { rows: existente } = await pool.query('SELECT id FROM donos LIMIT 1');
    if (existente.length) {
      return res.status(409).json({ erro: 'Já existe um dono cadastrado. Use a edição para alterar os dados.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO donos (nome, email, senha_hash, telefone, cpf, nome_academia)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nome.trim(), email.trim(), senhaHash, telefone || null, cpf || null, nomeAcademia || null],
    );
    res.status(201).json(mapDono(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    console.error('[donos]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// PUT — atualizar dono
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, telefone, cpf, nomeAcademia, chavePix } = req.body;
  if (!nome?.trim())  return res.status(400).json({ erro: 'Nome é obrigatório.' });
  if (!email?.trim()) return res.status(400).json({ erro: 'E-mail é obrigatório.' });

  try {
    let query, params;

    if (senha && senha.length >= 6) {
      const senhaHash = await bcrypt.hash(senha, 10);
      query = `UPDATE donos SET nome=$1, email=$2, senha_hash=$3, telefone=$4, cpf=$5, nome_academia=$6, chave_pix=$7 WHERE id=$8 RETURNING *`;
      params = [nome.trim(), email.trim(), senhaHash, telefone || null, cpf || null, nomeAcademia || null, chavePix || null, id];
    } else {
      query = `UPDATE donos SET nome=$1, email=$2, telefone=$3, cpf=$4, nome_academia=$5, chave_pix=$6 WHERE id=$7 RETURNING *`;
      params = [nome.trim(), email.trim(), telefone || null, cpf || null, nomeAcademia || null, chavePix || null, id];
    }

    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ erro: 'Dono não encontrado.' });
    res.json(mapDono(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    console.error('[donos]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

// POST /login — autenticar dono
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

  try {
    const { rows } = await pool.query('SELECT * FROM donos WHERE email=$1 LIMIT 1', [email.trim()]);
    if (!rows.length) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    const valido = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!valido) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    const token = jwt.sign({ id: rows[0].id, tipo: 'dono' }, SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: mapDono(rows[0]) });
  } catch (err) {
    console.error('[donos/login]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;
