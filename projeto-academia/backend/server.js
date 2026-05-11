const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const pool           = require('./db');
const alunosRouter      = require('./routes/alunos');
const professoresRouter = require('./routes/professores');
const donosRouter       = require('./routes/donos');
const fichasRouter        = require('./routes/fichas');
const mensalidadesRouter  = require('./routes/mensalidades');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/api/alunos',      alunosRouter);
app.use('/api/professores', professoresRouter);
app.use('/api/donos',       donosRouter);
app.use('/api/fichas',        fichasRouter);
app.use('/api/mensalidades',  mensalidadesRouter);

app.get('/', (_req, res) => res.send('FitSystem API rodando! 🚀'));

// ─── Inicialização ───────────────────────────────────────────────────────────
async function iniciar() {
  // Testa conexão e cria tabelas
  try {
    await pool.query('SELECT 1');
    console.log('✓ Conectado ao PostgreSQL');

    const { rows } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'donos'
      ) AS existe
    `);

    if (!rows[0].existe) {
      const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      await pool.query(sql);
      console.log('✓ Tabelas criadas');
    } else {
      console.log('✓ Tabelas já existem — dados preservados');
    }

    // Migrações incrementais (seguras — IF NOT EXISTS)
    await pool.query(`ALTER TABLE donos        ADD COLUMN IF NOT EXISTS chave_pix    VARCHAR(100)`);
    await pool.query(`ALTER TABLE professores  ADD COLUMN IF NOT EXISTS senha_hash   VARCHAR(255)`);
    await pool.query(`ALTER TABLE alunos       ADD COLUMN IF NOT EXISTS senha_hash   VARCHAR(255)`);
    await pool.query(`ALTER TABLE alunos       ADD COLUMN IF NOT EXISTS ficha_ids    JSONB DEFAULT '[]'`);
    // Popula ficha_ids a partir de ficha_id para registros antigos
    await pool.query(`UPDATE alunos SET ficha_ids = jsonb_build_array(ficha_id) WHERE ficha_id IS NOT NULL AND ficha_ids = '[]'::jsonb`);
    console.log('✓ Migrações aplicadas');
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
