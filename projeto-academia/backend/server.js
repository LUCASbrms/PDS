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
const presencasRouter     = require('./routes/presencas');
const pagamentoRouter     = require('./routes/pagamento');
const uploadsRouter       = require('./routes/uploads');
const { autenticar }      = require('./middleware/auth');

const app = express();

app.use(cors());

// Arquivos de upload acessíveis publicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Webhook do Stripe precisa do body raw (antes do express.json)
app.use('/api/pagamento/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// ─── Middleware de autenticação seletiva ──────────────────────────────────────
const ROTAS_PUBLICAS = [
  { method: 'POST', path: '/api/donos/login' },
  { method: 'POST', path: '/api/professores/login' },
  { method: 'POST', path: '/api/alunos/login' },
  { method: 'GET',  path: '/api/donos' },
  { method: 'POST', path: '/api/donos' },
  { method: 'POST', path: '/api/pagamento/webhook' },
];

app.use((req, res, next) => {
  const publica = ROTAS_PUBLICAS.some(
    r => r.method === req.method && req.path === r.path
  );
  if (publica) return next();
  return autenticar(req, res, next);
});

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/api/alunos',       alunosRouter);
app.use('/api/professores',  professoresRouter);
app.use('/api/donos',        donosRouter);
app.use('/api/fichas',       fichasRouter);
app.use('/api/mensalidades', mensalidadesRouter);
app.use('/api/presencas',    presencasRouter);
app.use('/api/pagamento',    pagamentoRouter);
app.use('/api/uploads',      uploadsRouter);

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
    await pool.query(`ALTER TABLE alunos       ADD COLUMN IF NOT EXISTS foto_url     VARCHAR(255)`);
    await pool.query(`ALTER TABLE professores  ADD COLUMN IF NOT EXISTS foto_url     VARCHAR(255)`);
    await pool.query(`ALTER TABLE donos        ADD COLUMN IF NOT EXISTS foto_url     VARCHAR(255)`);
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
