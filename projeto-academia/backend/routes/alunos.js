const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { SECRET, exigir } = require('../middleware/auth');
const { enviarEmailFichaAtribuida } = require('../utils/email');

const PRECOS_PLANOS = { Mensal: 130, Trimestral: 330, Semestral: 600, Anual: 1200 };

async function criarMensalidadeSeNecessario(alunoId, plano, vencimento) {
  if (!vencimento) return;
  // Só cria se ainda não existe mensalidade para este aluno neste vencimento
  const { rowCount } = await pool.query(
    `SELECT 1 FROM mensalidades WHERE aluno_id = $1 AND vencimento = $2`,
    [alunoId, vencimento]
  );
  if (rowCount > 0) return;
  const valor = PRECOS_PLANOS[plano] ?? PRECOS_PLANOS['Mensal'];
  await pool.query(
    `INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, status)
     VALUES ($1, $2, $3, $4, 'Pendente')`,
    [alunoId, plano || 'Mensal', valor, vencimento]
  );
}

function mapAluno(row) {
  const ts = row.treinos_semana || {};
  return {
    id:            row.id,
    nome:          row.nome,
    nascimento:    row.nascimento ? new Date(row.nascimento).toISOString().slice(0, 10) : '',
    cpf:           row.cpf           || '',
    telefone:      row.telefone      || '',
    email:         row.email         || '',
    fotoUrl:       row.foto_url      || '',
    altura:        row.altura  != null ? String(row.altura)  : '',
    peso:          row.peso    != null ? String(row.peso)    : '',
    plano:         row.plano         || 'Mensal',
    vencimento:    row.vencimento ? new Date(row.vencimento).toISOString().slice(0, 10) : '',
    status:        row.status        || 'Ativo',
    fichaId:       row.ficha_id      != null ? String(row.ficha_id)      : '',
    fichaIds:      Array.isArray(row.ficha_ids) ? row.ficha_ids.map(id => String(id)) : [],
    professorId:   row.professor_id  != null ? row.professor_id          : null,
    treinosSemana: {
      segunda: ts.segunda || '',
      terca:   ts.terca   || '',
      quarta:  ts.quarta  || '',
      quinta:  ts.quinta  || '',
      sexta:   ts.sexta   || '',
    },
    temSenha: !!row.senha_hash,
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

// GET — listar todos (dono, professor e aluno)
router.get('/', exigir('dono', 'professor', 'aluno'), async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM alunos ORDER BY nome');
    res.json(rows.map(mapAluno));
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST — criar (somente dono e professor)
router.post('/', exigir('dono', 'professor'), async (req, res) => {
  const { nome, nascimento, cpf, telefone, email, altura, peso, plano, vencimento, status, fichaIds, professorId, treinosSemana, senha } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  try {
    const senhaHash = senha ? await bcrypt.hash(senha, 10) : null;
    const fichaIdsArr = Array.isArray(fichaIds) ? fichaIds : [];
    const fichaIdPrimario = fichaIdsArr.length > 0 ? fichaIdsArr[0] : null;
    const { rows } = await pool.query(
      `INSERT INTO alunos (nome, nascimento, cpf, telefone, email, altura, peso, plano, vencimento, status, ficha_id, ficha_ids, professor_id, treinos_semana, senha_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        nome.trim(),
        nascimento    || null,
        cpf           || null,
        telefone      || null,
        email         || null,
        altura        || null,
        peso          || null,
        plano         || 'Mensal',
        vencimento    || null,
        status        || 'Ativo',
        fichaIdPrimario,
        JSON.stringify(fichaIdsArr),
        professorId   || null,
        JSON.stringify(treinosSemana || { segunda: '', terca: '', quarta: '', quinta: '', sexta: '' }),
        senhaHash,
      ],
    );
    const aluno = rows[0];
    await criarMensalidadeSeNecessario(aluno.id, aluno.plano, vencimento);
    res.status(201).json(mapAluno(aluno));
  } catch (err) {
    handleDBError(err, res);
  }
});

// PUT — atualizar (somente dono e professor)
router.put('/:id', exigir('dono', 'professor'), async (req, res) => {
  const { id } = req.params;
  const { nome, nascimento, cpf, telefone, email, altura, peso, plano, vencimento, status, fichaIds, professorId, treinosSemana, senha } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  const fichaIdsArr = Array.isArray(fichaIds) ? fichaIds : [];
  const fichaIdPrimario = fichaIdsArr.length > 0 ? fichaIdsArr[0] : null;
  try {
    // Guarda fichaIds antigas para detectar novas atribuições
    const { rows: atual } = await pool.query(
      'SELECT ficha_ids, email AS email_atual FROM alunos WHERE id=$1',
      [id]
    );
    const fichaIdsAntigas = (atual[0]?.ficha_ids || []).map(String);

    let query, params;
    if (senha && senha.length >= 6) {
      const senhaHash = await bcrypt.hash(senha, 10);
      query = `UPDATE alunos
               SET nome=$1, nascimento=$2, cpf=$3, telefone=$4, email=$5, altura=$6, peso=$7,
                   plano=$8, vencimento=$9, status=$10, ficha_id=$11, ficha_ids=$12,
                   professor_id=$13, treinos_semana=$14, senha_hash=$15
               WHERE id=$16 RETURNING *`;
      params = [nome.trim(), nascimento||null, cpf||null, telefone||null, email||null, altura||null, peso||null,
                plano||'Mensal', vencimento||null, status||'Ativo', fichaIdPrimario, JSON.stringify(fichaIdsArr),
                professorId||null, JSON.stringify(treinosSemana||{}), senhaHash, id];
    } else {
      query = `UPDATE alunos
               SET nome=$1, nascimento=$2, cpf=$3, telefone=$4, email=$5, altura=$6, peso=$7,
                   plano=$8, vencimento=$9, status=$10, ficha_id=$11, ficha_ids=$12,
                   professor_id=$13, treinos_semana=$14
               WHERE id=$15 RETURNING *`;
      params = [nome.trim(), nascimento||null, cpf||null, telefone||null, email||null, altura||null, peso||null,
                plano||'Mensal', vencimento||null, status||'Ativo', fichaIdPrimario, JSON.stringify(fichaIdsArr),
                professorId||null, JSON.stringify(treinosSemana||{}), id];
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    const aluno = rows[0];
    await criarMensalidadeSeNecessario(aluno.id, aluno.plano, vencimento);
    res.json(mapAluno(aluno));

    // Detecta fichas recém-atribuídas e notifica o aluno
    const fichasNovas = fichaIdsArr.map(String).filter(fid => !fichaIdsAntigas.includes(fid));
    if (fichasNovas.length > 0 && aluno.email) {
      const { rows: fichasRows } = await pool.query(
        'SELECT id, nome, objetivo FROM fichas WHERE id = ANY($1::int[])',
        [fichasNovas.map(Number)]
      );
      for (const ficha of fichasRows) {
        enviarEmailFichaAtribuida({
          nomeAluno:  aluno.nome,
          emailAluno: aluno.email,
          nomeFicha:  ficha.nome,
          objetivo:   ficha.objetivo,
        }).catch(err => console.error('[alunos] Erro ao enviar email de ficha:', err.message));
      }
    }
  } catch (err) {
    handleDBError(err, res);
  }
});

// DELETE — excluir (somente dono e professor)
router.delete('/:id', exigir('dono', 'professor'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM alunos WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.status(204).end();
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST /login — autenticar aluno via CPF + senha
router.post('/login', async (req, res) => {
  const { cpf, senha } = req.body;
  if (!cpf || !senha) return res.status(400).json({ erro: 'CPF e senha são obrigatórios.' });
  try {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const { rows } = await pool.query(
      "SELECT * FROM alunos WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1",
      [cpfLimpo],
    );
    if (!rows.length || !rows[0].senha_hash) return res.status(401).json({ erro: 'CPF ou senha incorretos.' });
    const valido = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!valido) return res.status(401).json({ erro: 'CPF ou senha incorretos.' });
    const token = jwt.sign({ id: rows[0].id, tipo: 'aluno' }, SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: mapAluno(rows[0]) });
  } catch (err) {
    console.error('[alunos/login]', err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
});

module.exports = router;
