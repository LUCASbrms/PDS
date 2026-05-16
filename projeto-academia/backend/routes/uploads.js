const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const nome = `aluno_${Date.now()}${ext}`;
    cb(null, nome);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const permitidos = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (permitidos.includes(ext)) return cb(null, true);
    cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
  },
});

// POST /api/uploads/foto/:alunoId
router.post('/foto/:alunoId', upload.single('foto'), async (req, res) => {
  const { alunoId } = req.params;
  if (!req.file) return res.status(400).json({ erro: 'Nenhuma foto enviada.' });

  try {
    // Remove foto antiga se existir
    const { rows } = await pool.query('SELECT foto_url FROM alunos WHERE id=$1', [alunoId]);
    if (rows.length && rows[0].foto_url) {
      const antigaPath = path.join(__dirname, '../uploads', path.basename(rows[0].foto_url));
      if (fs.existsSync(antigaPath)) fs.unlinkSync(antigaPath);
    }

    const fotoUrl = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE alunos SET foto_url=$1 WHERE id=$2', [fotoUrl, alunoId]);

    res.json({ fotoUrl });
  } catch (err) {
    console.error('[uploads]', err.message);
    res.status(500).json({ erro: 'Erro ao salvar foto.' });
  }
});

module.exports = router;
