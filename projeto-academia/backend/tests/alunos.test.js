/**
 * Testes de CRUD de alunos
 */

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../utils/email', () => ({
  enviarEmailFichaAtribuida:      jest.fn(),
  enviarEmailPagamentoConfirmado: jest.fn(),
  enviarEmailVencimentoProximo:   jest.fn(),
  enviarEmailTreinoAtualizado:    jest.fn(),
}));
jest.mock('../utils/notificacoes', () => ({
  iniciarCronNotificacoes: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2a$10$mocked_hash'),
  compare: jest.fn(),
}));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../server');
const pool    = require('../db');

const SECRET = process.env.JWT_SECRET || 'gymbalance_secret_2026';

// Tokens de teste
const tokenDono     = jwt.sign({ id: 1, tipo: 'dono'     }, SECRET);
const tokenProfessor = jwt.sign({ id: 2, tipo: 'professor'}, SECRET);
const tokenAluno    = jwt.sign({ id: 10, tipo: 'aluno'   }, SECRET);

// Linha de base de aluno fake
const alunoBD = {
  id:           10,
  nome:         'Maria Teste',
  nascimento:   null,
  cpf:          '111.222.333-44',
  telefone:     null,
  email:        'maria@gym.com',
  foto_url:     null,
  altura:       null,
  peso:         null,
  plano:        'Mensal',
  vencimento:   null,
  status:       'Ativo',
  ficha_id:     null,
  ficha_ids:    [],
  professor_id: null,
  treinos_semana: {},
  senha_hash:   '$2a$10$mocked_hash',
};

// ── GET /api/alunos ───────────────────────────────────────────────────────────
describe('GET /api/alunos', () => {
  test('401 sem token de autenticação', async () => {
    const res = await request(app).get('/api/alunos');
    expect(res.status).toBe(401);
  });

  test('200 e retorna lista de alunos (dono)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [alunoBD] });

    const res = await request(app)
      .get('/api/alunos')
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nome).toBe('Maria Teste');
  });

  test('200 e retorna lista de alunos (professor)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [alunoBD] });

    const res = await request(app)
      .get('/api/alunos')
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── POST /api/alunos ──────────────────────────────────────────────────────────
describe('POST /api/alunos', () => {
  test('400 quando nome está ausente', async () => {
    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ cpf: '000.000.000-00' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/nome/i);
  });

  test('403 quando aluno tenta criar outro aluno', async () => {
    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({ nome: 'Novo Aluno' });

    expect(res.status).toBe(403);
  });

  test('201 ao criar aluno com dados válidos (dono)', async () => {
    // INSERT aluno → rows com o aluno criado
    pool.query.mockResolvedValueOnce({ rows: [alunoBD] });
    // SELECT check mensalidade → rowCount 0 (não existe)
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    // INSERT mensalidade → sem retorno relevante
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ nome: 'Maria Teste', plano: 'Mensal', vencimento: '2026-06-01' });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Maria Teste');
  });

  test('201 ao criar aluno sem vencimento (sem mensalidade automática)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...alunoBD, vencimento: null }] });

    const res = await request(app)
      .post('/api/alunos')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ nome: 'Pedro Sem Plano' });

    expect(res.status).toBe(201);
  });
});

// ── DELETE /api/alunos/:id ────────────────────────────────────────────────────
describe('DELETE /api/alunos/:id', () => {
  test('401 sem token', async () => {
    const res = await request(app).delete('/api/alunos/10');
    expect(res.status).toBe(401);
  });

  test('404 quando aluno não existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete('/api/alunos/999')
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(404);
  });

  test('204 ao deletar aluno existente (dono)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/alunos/10')
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(204);
  });
});
