/**
 * Testes de CRUD de mensalidades
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

const tokenDono  = jwt.sign({ id: 1, tipo: 'dono'  }, SECRET);
const tokenAluno = jwt.sign({ id: 10, tipo: 'aluno' }, SECRET);

// Mensalidade fake retornada pelo BD
const mensalidadeBD = {
  id:             1,
  aluno_id:       10,
  aluno_nome:     'João Aluno',
  plano:          'Mensal',
  valor:          '130.00',
  vencimento:     new Date('2026-06-01'),
  data_pagamento: null,
  status:         'Pendente',
  observacoes:    null,
};

// ── GET /api/mensalidades ─────────────────────────────────────────────────────
describe('GET /api/mensalidades', () => {
  test('401 sem token', async () => {
    const res = await request(app).get('/api/mensalidades');
    expect(res.status).toBe(401);
  });

  test('200 e retorna lista (dono)', async () => {
    // 1ª query: UPDATE atrasados; 2ª query: SELECT mensalidades
    pool.query
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mensalidadeBD] });

    const res = await request(app)
      .get('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].plano).toBe('Mensal');
  });

  test('200 e retorna lista (aluno)', async () => {
    pool.query
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [mensalidadeBD] });

    const res = await request(app)
      .get('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenAluno}`);

    expect(res.status).toBe(200);
  });
});

// ── POST /api/mensalidades ────────────────────────────────────────────────────
describe('POST /api/mensalidades', () => {
  test('400 quando alunoId está ausente', async () => {
    const res = await request(app)
      .post('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ valor: '130', vencimento: '2026-06-01' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/aluno/i);
  });

  test('400 quando vencimento está ausente', async () => {
    const res = await request(app)
      .post('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ alunoId: 10, valor: '130' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/vencimento/i);
  });

  test('400 quando valor é inválido', async () => {
    const res = await request(app)
      .post('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ alunoId: 10, vencimento: '2026-06-01', valor: '-50' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/valor/i);
  });

  test('403 quando aluno tenta criar mensalidade', async () => {
    const res = await request(app)
      .post('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({ alunoId: 10, valor: '130', vencimento: '2026-06-01' });

    expect(res.status).toBe(403);
  });

  test('201 ao criar mensalidade com dados válidos', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ ...mensalidadeBD, id: 2 }],
    });

    const res = await request(app)
      .post('/api/mensalidades')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ alunoId: 10, plano: 'Mensal', valor: '130', vencimento: '2026-06-01' });

    expect(res.status).toBe(201);
    expect(res.body.valor).toBe(130);
    expect(res.body.plano).toBe('Mensal');
  });
});

// ── PUT /api/mensalidades/:id ─────────────────────────────────────────────────
describe('PUT /api/mensalidades/:id', () => {
  test('403 quando aluno tenta atualizar', async () => {
    const res = await request(app)
      .put('/api/mensalidades/1')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({ alunoId: 10, valor: '130', vencimento: '2026-06-01', status: 'Pago' });

    expect(res.status).toBe(403);
  });

  test('404 quando mensalidade não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/mensalidades/999')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ alunoId: 10, valor: '130', vencimento: '2026-06-01', status: 'Pendente' });

    expect(res.status).toBe(404);
  });

  test('200 ao atualizar mensalidade para Pendente', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mensalidadeBD] });

    const res = await request(app)
      .put('/api/mensalidades/1')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ alunoId: 10, plano: 'Mensal', valor: '130', vencimento: '2026-06-01', status: 'Pendente' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Pendente');
  });
});

// ── DELETE /api/mensalidades/:id ──────────────────────────────────────────────
describe('DELETE /api/mensalidades/:id', () => {
  test('401 sem token', async () => {
    const res = await request(app).delete('/api/mensalidades/1');
    expect(res.status).toBe(401);
  });

  test('404 quando mensalidade não existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete('/api/mensalidades/999')
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(404);
  });

  test('204 ao deletar mensalidade existente', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/mensalidades/1')
      .set('Authorization', `Bearer ${tokenDono}`);

    expect(res.status).toBe(204);
  });
});
