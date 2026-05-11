const { Pool } = require('pg');
require('dotenv').config();

// ============================================================
// Configuração do pool de conexões — PostgreSQL
// ============================================================
const pool = new Pool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '5432'),
  database:           process.env.DB_NAME     || 'academia_db',
  user:               process.env.DB_USER     || 'postgres',
  password:           process.env.DB_PASSWORD || '',

  // Tamanho do pool (ajuste conforme carga esperada)
  max:                parseInt(process.env.DB_POOL_MAX  || '10'),
  idleTimeoutMillis:  parseInt(process.env.DB_IDLE_TIMEOUT  || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000'),
});

// Loga erros inesperados em clientes ociosos
pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool:', err.message);
});

// Testa a conexão ao iniciar o servidor
pool.connect()
  .then((client) => {
    console.log(`[DB] Conectado: ${process.env.DB_NAME || 'academia_db'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
    client.release();
  })
  .catch((err) => {
    console.error('[DB] Falha ao conectar:', err.message);
    process.exit(1); // Encerra se o banco não estiver disponível
  });

module.exports = pool;
