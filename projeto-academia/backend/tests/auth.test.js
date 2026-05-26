/**
 * Testes de autenticação — login do dono e do aluno
 */

// Mocks devem vir antes de qualquer require
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
const bcrypt  = require('bcryptjs');
const app     = require('../server');
const pool    = require('../db');

// ── Linha de base de dados fake ───────────────────────────────────────────────
const donoBD = {
  id:         1,
  nome:       'Admin',
  email:      'admin@gym.com',
  senha_hash: '$2a$10$mocked_hash',
  telefone:   null,
  cpf:        null,
  nome_academia: 'GymBalance',
  chave_pix:  null,
  foto_url:   null,
};

const alunoBD = {
  id:          10,
  nome:        'João Aluno',
  nascimento:  null,
  cpf:         '123.456.789-00',
  telefone:    null,
  email:       'joao@gym.com',
  foto_url:    null,
  altura:      null,
  peso:        null,
  plano:       'Mensal',
  vencimento:  null,
  status:      'Ativo',
  ficha_id:    null,
  ficha_ids:   [],
  professor_id: null,
  treinos_semana: {},
  senha_hash:  '$2a$10$mocked_hash',
};

// ── POST /api/donos/login ─────────────────────────────────────────────────────
describe('POST /api/donos/login', () => {
  test('400 quando campos estão ausentes', async () => {
    const res = await request(app).post('/api/donos/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('401 quando e-mail não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/donos/login')
      .send({ email: 'naoexiste@gym.com', senha: '123456' });

    expect(res.status).toBe(401);
  });

  test('401 quando senha está errada', async () => {
    pool.query.mockResolvedValueOnce({ rows: [donoBD] });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/donos/login')
      .send({ email: 'admin@gym.com', senha: 'errada' });

    expect(res.status).toBe(401);
  });

  test('200 e retorna token quando credenciais são válidas', async () => {
    pool.query.mockResolvedValueOnce({ rows: [donoBD] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/donos/login')
      .send({ email: 'admin@gym.com', senha: 'correta123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.email).toBe('admin@gym.com');
  });
});

// ── POST /api/alunos/login ────────────────────────────────────────────────────
describe('POST /api/alunos/login', () => {
  test('400 quando campos estão ausentes', async () => {
    const res = await request(app).post('/api/alunos/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('401 quando CPF não encontrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/alunos/login')
      .send({ cpf: '000.000.000-00', senha: '123456' });

    expect(res.status).toBe(401);
  });

  test('401 quando senha está errada', async () => {
    pool.query.mockResolvedValueOnce({ rows: [alunoBD] });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/alunos/login')
      .send({ cpf: '123.456.789-00', senha: 'errada' });

    expect(res.status).toBe(401);
  });

  test('200 e retorna token quando credenciais são válidas', async () => {
    pool.query.mockResolvedValueOnce({ rows: [alunoBD] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/alunos/login')
      .send({ cpf: '123.456.789-00', senha: 'correta123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.nome).toBe('João Aluno');
  });
});
