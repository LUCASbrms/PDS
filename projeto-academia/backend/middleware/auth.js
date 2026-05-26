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

// Middleware de autorização por tipo de usuário
// Uso: exigir('dono', 'professor')
function exigir(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario?.tipo)) {
      console.warn(`[auth] Acesso negado — tipo="${req.usuario?.tipo}" não está em [${tipos.join(', ')}] | rota: ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ erro: 'Acesso não autorizado.' });
    }
    next();
  };
}

module.exports = { autenticar, exigir, SECRET };
