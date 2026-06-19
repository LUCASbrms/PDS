const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const pool     = require('../db');
const { exigir } = require('../middleware/auth');

// ─── Multer com memória (sem disco) ───────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (permitidos.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
  },
});

// ─── Salva ou substitui foto no banco ─────────────────────────────────────────
async function salvarFoto(req, res, entidadeTipo, tabela, idParam) {
  const id = req.params[idParam];
  if (!req.file) return res.status(400).json({ erro: 'Nenhuma foto enviada.' });

  try {
    await pool.query(
      `INSERT INTO fotos (entidade_tipo, entidade_id, mime_type, dados)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (entidade_tipo, entidade_id)
       DO UPDATE SET mime_type = $3, dados = $4, criado_em = NOW()`,
      [entidadeTipo, id, req.file.mimetype, req.file.buffer],
    );

    const fotoUrl = `/api/uploads/imagem/${entidadeTipo}/${id}?v=${Date.now()}`;
    await pool.query(`UPDATE ${tabela} SET foto_url = $1 WHERE id = $2`, [fotoUrl, id]);

    res.json({ fotoUrl });
  } catch (err) {
    console.error('[uploads]', err.message);
    res.status(500).json({ erro: 'Erro ao salvar foto.' });
  }
}

// ─── GET /api/uploads/imagem/:tipo/:id — serve a imagem do banco ──────────────
// Rota pública — montada em /api/uploads/imagem, então path interno é /:tipo/:id
router.get('/:tipo/:id', async (req, res) => {
  const { tipo, id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT mime_type, dados FROM fotos WHERE entidade_tipo = $1 AND entidade_id = $2`,
      [tipo, id],
    );
    if (!rows.length) return res.status(404).json({ erro: 'Imagem não encontrada.' });

    const { mime_type, dados } = rows[0];
    res.set('Content-Type', mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); // cache 1 ano no browser
    res.send(dados);
  } catch (err) {
    console.error('[uploads/imagem]', err.message);
    res.status(500).json({ erro: 'Erro ao carregar imagem.' });
  }
});

// ─── POST /api/uploads/foto/:alunoId ─────────────────────────────────────────
router.post(
  '/foto/:alunoId',
  exigir('dono', 'professor', 'aluno'),
  (req, res, next) => {
    if (req.usuario.tipo === 'aluno' && String(req.usuario.id) !== String(req.params.alunoId)) {
      return res.status(403).json({ erro: 'Você só pode alterar a própria foto.' });
    }
    next();
  },
  upload.single('foto'),
  (req, res) => salvarFoto(req, res, 'aluno', 'alunos', 'alunoId'),
);

// ─── POST /api/uploads/professor/:professorId ─────────────────────────────────
router.post(
  '/professor/:professorId',
  exigir('dono', 'professor'),
  (req, res, next) => {
    if (req.usuario.tipo === 'professor' && String(req.usuario.id) !== String(req.params.professorId)) {
      return res.status(403).json({ erro: 'Você só pode alterar a própria foto.' });
    }
    next();
  },
  upload.single('foto'),
  (req, res) => salvarFoto(req, res, 'professor', 'professores', 'professorId'),
);

// ─── POST /api/uploads/dono/:donoId ──────────────────────────────────────────
router.post(
  '/dono/:donoId',
  exigir('dono'),
  upload.single('foto'),
  (req, res) => salvarFoto(req, res, 'dono', 'donos', 'donoId'),
);

module.exports = router;
