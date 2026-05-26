const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');
const { exigir } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

const fileFilter = (_req, file, cb) => {
  const permitidos = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (permitidos.includes(ext)) return cb(null, true);
  cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
};

function criarUpload(prefixo) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${prefixo}_${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter,
  });
}

async function salvarFoto(req, res, tabela, idParam) {
  const id = req.params[idParam];
  if (!req.file) return res.status(400).json({ erro: 'Nenhuma foto enviada.' });

  try {
    const { rows } = await pool.query(`SELECT foto_url FROM ${tabela} WHERE id=$1`, [id]);
    if (rows.length && rows[0].foto_url) {
      const antigaPath = path.join(UPLOADS_DIR, path.basename(rows[0].foto_url));
      if (fs.existsSync(antigaPath)) fs.unlinkSync(antigaPath);
    }

    const fotoUrl = `/uploads/${req.file.filename}`;
    await pool.query(`UPDATE ${tabela} SET foto_url=$1 WHERE id=$2`, [fotoUrl, id]);

    res.json({ fotoUrl });
  } catch (err) {
    console.error('[uploads]', err.message);
    res.status(500).json({ erro: 'Erro ao salvar foto.' });
  }
}

// POST /api/uploads/foto/:alunoId
// dono e professor podem atualizar qualquer aluno; aluno só atualiza a própria foto
router.post(
  '/foto/:alunoId',
  exigir('dono', 'professor', 'aluno'),
  (req, res, next) => {
    if (req.usuario.tipo === 'aluno' && String(req.usuario.id) !== String(req.params.alunoId)) {
      return res.status(403).json({ erro: 'Você só pode alterar a própria foto.' });
    }
    next();
  },
  criarUpload('aluno').single('foto'),
  (req, res) => salvarFoto(req, res, 'alunos', 'alunoId'),
);

// POST /api/uploads/professor/:professorId
// dono pode atualizar qualquer professor; professor só atualiza a própria foto
router.post(
  '/professor/:professorId',
  exigir('dono', 'professor'),
  (req, res, next) => {
    if (req.usuario.tipo === 'professor' && String(req.usuario.id) !== String(req.params.professorId)) {
      return res.status(403).json({ erro: 'Você só pode alterar a própria foto.' });
    }
    next();
  },
  criarUpload('professor').single('foto'),
  (req, res) => salvarFoto(req, res, 'professores', 'professorId'),
);

// POST /api/uploads/dono/:donoId (somente dono)
router.post(
  '/dono/:donoId',
  exigir('dono'),
  criarUpload('dono').single('foto'),
  (req, res) => salvarFoto(req, res, 'donos', 'donoId'),
);

module.exports = router;
