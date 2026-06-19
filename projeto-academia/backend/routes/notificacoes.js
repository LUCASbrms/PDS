const express = require('express');
const router  = express.Router();
const { verificarVencimentos } = require('../utils/notificacoes');

// GET /api/notificacoes/verificar
// Chamado pelo cron-job.org todo dia às 08:00 BRT
// Protegido pela variável CRON_SECRET
router.get('/verificar', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ erro: 'Não autorizado.' });
  }

  try {
    await verificarVencimentos();
    res.json({ ok: true, executadoEm: new Date().toISOString() });
  } catch (err) {
    console.error('[notificacoes/verificar]', err.message);
    res.status(500).json({ erro: 'Erro ao verificar vencimentos.' });
  }
});

module.exports = router;
