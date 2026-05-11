const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const pool           = require('./db');
const alunosRouter      = require('./routes/alunos');
const professoresRouter = require('./routes/professores');
const donosRouter       = require('./routes/donos');
const fichasRouter      = require('./routes/fichas');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/api/alunos',      alunosRouter);
app.use('/api/professores', professoresRouter);
app.use('/api/donos',       donosRouter);
app.use('/api/fichas',      fichasRouter);

app.get('/', (_req, res) => res.send('FitSystem API rodando! 🚀'));

// ─── Inicialização ───────────────────────────────────────────────────────────
async function iniciar() {
  // Testa conexão e cria tabelas
  try {
    await pool.query('SELECT 1');
    console.log('✓ Conectado ao PostgreSQL');

    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✓ Tabelas sincronizadas');
  } catch (err) {
    console.error('✗ Erro ao conectar ao banco de dados:', err.message);
    console.error('  Verifique as variáveis no arquivo .env e tente novamente.');
    process.exit(1);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}\n`);
  });
}

iniciar();
