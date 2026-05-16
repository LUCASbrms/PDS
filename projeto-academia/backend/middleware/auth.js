const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'gymbalance_secret_2026';

function autenticar(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Acesso não autorizado. Faça login.' });
  }

  const token = header.slice(7);
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

module.exports = { autenticar, SECRET };
