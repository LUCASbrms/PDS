const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { enviarEmailTreinoAtualizado } = require('../utils/email');
const { exigir } = require('../middleware/auth');

function mapFicha(row, exercicios = []) {
  return {
    id:          row.id,
    nome:        row.nome,
    objetivo:    row.objetivo,
    professorId: row.professor_id != null ? row.professor_id : null,
    partes:    row.partes || [],
    exercicios: exercicios
      .filter(ex => ex.ficha_id === row.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map(ex => ({
        id:       ex.id,
        fichaId:  ex.ficha_id,
        nome:     ex.nome,
        series:   ex.series   || '',
        reps:     ex.repeticoes || '',
        carga:    ex.carga    || '',
        descanso: ex.descanso || '',
      })),
  };
}

function handleDBError(err, res) {
  console.error('[fichas]', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

// GET — listar todas com exercícios (todos os tipos)
router.get('/', exigir('dono', 'professor', 'aluno'), async (_req, res) => {
  try {
    const { rows: fichas }    = await pool.query('SELECT * FROM fichas ORDER BY id');
    const { rows: exercicios } = await pool.query('SELECT * FROM exercicios ORDER BY ficha_id, ordem');
    res.json(fichas.map(f => mapFicha(f, exercicios)));
  } catch (err) {
    handleDBError(err, res);
  }
});

// POST — criar ficha + exercícios (somente dono e professor)
router.post('/', exigir('dono', 'professor'), async (req, res) => {
  const { nome, objetivo, partes, exercicios } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });

  const professorId = req.usuario.tipo === 'professor' ? req.usuario.id : null;
  const donoId      = req.usuario.tipo === 'dono'      ? req.usuario.id : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO fichas (nome, objetivo, partes, professor_id, dono_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome.trim(), objetivo || 'Hipertrofia', JSON.stringify(partes || []), professorId, donoId],
    );
    const ficha = rows[0];

    const exRows = [];
    if (Array.isArray(exercicios) && exercicios.length > 0) {
      for (let i = 0; i < exercicios.length; i++) {
        const ex = exercicios[i];
        const { rows: exR } = await client.query(
          `INSERT INTO exercicios (ficha_id, nome, series, repeticoes, carga, descanso, ordem)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [ficha.id, ex.nome, ex.series || '', ex.reps || '', ex.carga || '', ex.descanso || '', i],
        );
        exRows.push(exR[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(mapFicha(ficha, exRows.map(r => ({ ...r, ficha_id: ficha.id }))));
  } catch (err) {
    await client.query('ROLLBACK');
    handleDBError(err, res);
  } finally {
    client.release();
  }
});

// PUT — atualizar ficha + sincronizar exercícios (somente dono e professor)
router.put('/:id', exigir('dono', 'professor'), async (req, res) => {
  const { id } = req.params;
  const { nome, objetivo, partes, exercicios } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE fichas SET nome=$1, objetivo=$2, partes=$3 WHERE id=$4 RETURNING *`,
      [nome.trim(), objetivo || 'Hipertrofia', JSON.stringify(partes || []), id],
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Ficha não encontrada.' });
    }
    const ficha = rows[0];

    // Apaga exercícios antigos e insere os novos
    await client.query('DELETE FROM exercicios WHERE ficha_id=$1', [id]);

    const exRows = [];
    if (Array.isArray(exercicios) && exercicios.length > 0) {
      for (let i = 0; i < exercicios.length; i++) {
        const ex = exercicios[i];
        const { rows: exR } = await client.query(
          `INSERT INTO exercicios (ficha_id, nome, series, repeticoes, carga, descanso, ordem)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [ficha.id, ex.nome, ex.series || '', ex.reps || '', ex.carga || '', ex.descanso || '', i],
        );
        exRows.push(exR[0]);
      }
    }

    await client.query('COMMIT');
    res.json(mapFicha(ficha, exRows.map(r => ({ ...r, ficha_id: ficha.id }))));

    // Envia email para todos os alunos que possuem esta ficha
    try {
      const { rows: afetados } = await pool.query(
        `SELECT nome, email FROM alunos WHERE ficha_ids @> $1::jsonb AND email IS NOT NULL`,
        [JSON.stringify([Number(id)])],
      );
      for (const aluno of afetados) {
        enviarEmailTreinoAtualizado({
          nomeAluno: aluno.nome,
          emailAluno: aluno.email,
          nomeFicha: ficha.nome,
          objetivo: ficha.objetivo,
        }).catch(err => console.error('[fichas] erro ao enviar email:', err.message));
      }
    } catch (notifErr) {
      console.error('[fichas] erro ao buscar alunos para notificação:', notifErr.message);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    handleDBError(err, res);
  } finally {
    client.release();
  }
});

// DELETE — excluir ficha (exercícios em CASCADE) (somente dono e professor)
router.delete('/:id', exigir('dono', 'professor'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM fichas WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ erro: 'Ficha não encontrada.' });
    res.status(204).end();
  } catch (err) {
    handleDBError(err, res);
  }
});

module.exports = router;
