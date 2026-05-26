-- =============================================================
-- SEEDS — Dados de demonstração (ambiente de desenvolvimento)
-- =============================================================
-- Credenciais padrão para TODOS os usuários:
--   Dono:       admin@academia.com  / 123456
--   Professores: marcos@academia.com / 123456  (etc.)
--   Alunos:     CPF + senha 123456  (login pelo CPF)
-- =============================================================

-- Limpa tudo e reinicia os IDs
TRUNCATE presencas, mensalidades, exercicios, ficha_grupos_musculares,
         fichas, alunos, professores, donos
RESTART IDENTITY CASCADE;

-- ─── HASH bcrypt para "123456" (10 rounds) ───────────────────────────────────
-- $2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K

-- ─── DONO ────────────────────────────────────────────────────────────────────
INSERT INTO donos (nome, email, senha_hash, telefone, cpf, nome_academia, chave_pix)
VALUES (
  'Carlos Silva',
  'admin@academia.com',
  '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K',
  '(11) 99999-0001',
  '123.456.789-00',
  'GymBalance Academia',
  'admin@academia.com'
);

-- ─── PROFESSORES ─────────────────────────────────────────────────────────────
INSERT INTO professores (dono_id, nome, email, telefone, cpf, especialidade, status, senha_hash)
VALUES
  (1, 'Marcos Oliveira', 'marcos@academia.com',   '(11) 98888-0001', '111.222.333-01', 'Musculação',  'Ativo',   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),
  (1, 'Fernanda Costa',  'fernanda@academia.com', '(11) 98888-0002', '111.222.333-02', 'CrossFit',    'Ativo',   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),
  (1, 'Ricardo Almeida', 'ricardo@academia.com',  '(11) 98888-0003', '111.222.333-03', 'Pilates',     'Ativo',   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),
  (1, 'Juliana Martins', 'juliana@academia.com',  '(11) 98888-0004', '111.222.333-04', 'Funcional',   'Inativo', '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K');

-- ─── FICHAS ───────────────────────────────────────────────────────────────────
INSERT INTO fichas (dono_id, professor_id, nome, objetivo, observacoes)
VALUES
  (1, 1, 'Treino A — Peito e Tríceps', 'Hipertrofia',     'Foco em sobrecarga progressiva. Descanso de 90s entre séries.'),
  (1, 1, 'Treino B — Costas e Bíceps', 'Hipertrofia',     'Incluir puxadas e remadas variadas.'),
  (1, 1, 'Treino C — Pernas Completo', 'Hipertrofia',     'Agachamento livre como movimento principal.'),
  (1, 2, 'HIIT Cardio 30min',          'Emagrecimento',   'Intervalos de alta intensidade — 30s trabalho / 30s descanso.'),
  (1, 2, 'Full Body Iniciante',        'Condicionamento', 'Ideal para alunos nos primeiros 3 meses. Cargas leves.');

-- ─── GRUPOS MUSCULARES ────────────────────────────────────────────────────────
INSERT INTO ficha_grupos_musculares (ficha_id, grupo) VALUES
  (1,'peito'),(1,'triceps'),(1,'ombros'),
  (2,'costas'),(2,'biceps'),(2,'trapezio'),
  (3,'quadriceps'),(3,'posterior'),(3,'gluteos'),(3,'panturrilha'),
  (4,'abdomen'),(4,'quadriceps'),(4,'posterior'),
  (5,'peito'),(5,'costas'),(5,'ombros'),(5,'quadriceps');

-- ─── EXERCÍCIOS ───────────────────────────────────────────────────────────────
INSERT INTO exercicios (ficha_id, nome, series, repeticoes, carga, descanso, ordem)
VALUES
  -- Ficha 1: Peito e Tríceps
  (1,'Supino Reto',               '4','8 a 10', '60kg', '90s', 0),
  (1,'Supino Inclinado Halteres', '3','10 a 12','20kg', '90s', 1),
  (1,'Crucifixo na Polia',        '3','12 a 15','15kg', '60s', 2),
  (1,'Tríceps Corda',             '4','12',     '25kg', '60s', 3),
  (1,'Tríceps Testa',             '3','10 a 12','20kg', '60s', 4),
  -- Ficha 2: Costas e Bíceps
  (2,'Puxada Frontal',            '4','8 a 10', '70kg', '90s', 0),
  (2,'Remada Curvada',            '4','10 a 12','60kg', '90s', 1),
  (2,'Remada Unilateral',         '3','12',     '25kg', '60s', 2),
  (2,'Rosca Direta',              '3','10 a 12','20kg', '60s', 3),
  (2,'Rosca Concentrada',         '3','12 a 15','12kg', '45s', 4),
  -- Ficha 3: Pernas
  (3,'Agachamento Livre',         '4','8 a 10', '80kg', '120s',0),
  (3,'Leg Press 45°',             '4','12 a 15','150kg','90s', 1),
  (3,'Cadeira Extensora',         '3','15',     '50kg', '60s', 2),
  (3,'Stiff',                     '3','10 a 12','60kg', '90s', 3),
  (3,'Panturrilha em Pé',         '4','20',     '80kg', '45s', 4),
  -- Ficha 4: HIIT
  (4,'Burpee',                    '5','30s trabalho','peso corporal','30s',0),
  (4,'Jumping Jack',              '5','30s trabalho','peso corporal','30s',1),
  (4,'Mountain Climber',          '5','30s trabalho','peso corporal','30s',2),
  (4,'Prancha Abdominal',         '3','45s',          'peso corporal','15s',3),
  -- Ficha 5: Full Body
  (5,'Agachamento com Halteres',  '3','12','10kg','60s',0),
  (5,'Supino com Halteres',       '3','12','10kg','60s',1),
  (5,'Remada com Halteres',       '3','12','10kg','60s',2),
  (5,'Desenvolvimento Ombros',    '3','12', '8kg','60s',3);

-- ─── ALUNOS ───────────────────────────────────────────────────────────────────
-- IMPORTANTE: treinos_semana usa o nome EXATO das fichas para o portal do aluno
-- Login: CPF (sem máscara) + senha 123456
INSERT INTO alunos (
  dono_id, professor_id, ficha_id,
  nome, nascimento, cpf, telefone, email,
  altura, peso, plano, vencimento, status,
  treinos_semana, senha_hash
) VALUES
  -- 1 · Ana — Musculação ABC, plano mensal em dia
  (1,1,1, 'Ana Beatriz Santos','1998-03-15','222.333.444-01','(11) 91111-0001','ana@email.com',
   1.65,62.5,'Mensal',(CURRENT_DATE+INTERVAL'15 days'),'Ativo',
   '{"segunda":"Treino A — Peito e Tríceps","terca":"","quarta":"Treino B — Costas e Bíceps","quinta":"","sexta":"Treino C — Pernas Completo"}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 2 · Bruno — Musculação completo, trimestral em dia
  (1,1,2, 'Bruno Ferreira','1995-07-22','222.333.444-02','(11) 91111-0002','bruno@email.com',
   1.80,88.0,'Trimestral',(CURRENT_DATE+INTERVAL'45 days'),'Ativo',
   '{"segunda":"Treino A — Peito e Tríceps","terca":"Treino B — Costas e Bíceps","quarta":"","quinta":"Treino C — Pernas Completo","sexta":"Treino A — Peito e Tríceps"}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 3 · Camila — HIIT, mensal ATRASADA
  (1,2,4, 'Camila Rodrigues','2001-11-08','222.333.444-03','(11) 91111-0003','camila@email.com',
   1.60,55.0,'Mensal',(CURRENT_DATE-INTERVAL'5 days'),'Pendente',
   '{"segunda":"HIIT Cardio 30min","terca":"","quarta":"HIIT Cardio 30min","quinta":"","sexta":"HIIT Cardio 30min"}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 4 · Diego — ABC variado, semestral em dia
  (1,1,3, 'Diego Mendes','1990-02-28','222.333.444-04','(11) 91111-0004',NULL,
   1.75,95.3,'Semestral',(CURRENT_DATE+INTERVAL'120 days'),'Ativo',
   '{"segunda":"Treino C — Pernas Completo","terca":"Treino A — Peito e Tríceps","quarta":"","quinta":"Treino B — Costas e Bíceps","sexta":"Treino C — Pernas Completo"}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 5 · Elisa — Full Body, anual em dia
  (1,2,5, 'Elisa Carvalho','2003-06-01','222.333.444-05','(11) 91111-0005','elisa@email.com',
   1.68,58.0,'Anual',(CURRENT_DATE+INTERVAL'250 days'),'Ativo',
   '{"segunda":"Full Body Iniciante","terca":"","quarta":"Full Body Iniciante","quinta":"","sexta":"Full Body Iniciante"}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 6 · Felipe — sem ficha, inativo/inadimplente
  (1,3,NULL, 'Felipe Nascimento','1988-09-14','222.333.444-06','(11) 91111-0006',NULL,
   1.82,102.0,'Mensal',(CURRENT_DATE-INTERVAL'20 days'),'Inativo',
   '{"segunda":"","terca":"","quarta":"","quinta":"","sexta":""}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 7 · Gabriela — ABC, mensal vencendo em breve
  (1,1,1, 'Gabriela Lima','2000-04-19','222.333.444-07','(11) 91111-0007','gabi@email.com',
   1.62,65.0,'Mensal',(CURRENT_DATE+INTERVAL'8 days'),'Ativo',
   '{"segunda":"Treino A — Peito e Tríceps","terca":"","quarta":"Treino B — Costas e Bíceps","quinta":"","sexta":"Treino A — Peito e Tríceps"}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K'),

  -- 8 · Henrique — HIIT, trimestral em dia
  (1,2,4, 'Henrique Sousa','1993-12-05','222.333.444-08','(11) 91111-0008',NULL,
   1.78,80.0,'Trimestral',(CURRENT_DATE+INTERVAL'60 days'),'Ativo',
   '{"segunda":"HIIT Cardio 30min","terca":"HIIT Cardio 30min","quarta":"","quinta":"HIIT Cardio 30min","sexta":""}',
   '$2b$10$Q3QyQk7bZ57MvABstDh0yOyCxBO5bHKOrkQQg474vGrluYgwF0.9K');

-- Atualiza ficha_ids (coluna adicionada pelas migrações do server.js)
UPDATE alunos SET ficha_ids = jsonb_build_array(ficha_id) WHERE ficha_id IS NOT NULL;
UPDATE alunos SET ficha_ids = '[]'::jsonb                  WHERE ficha_id IS NULL;

-- ─── MENSALIDADES — 6 meses históricos ───────────────────────────────────────
-- Cada mês tem: alunos mensais (R$ 130) + trimestral nos meses certos (R$ 330)
-- Semestral (R$ 600) e Anual (R$ 1200) aparecem 1× nos últimos 6 meses

DO $$
DECLARE
  m0 DATE := DATE_TRUNC('month', CURRENT_DATE);          -- Mês atual
  m1 DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month';
  m2 DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months';
  m3 DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months';
  m4 DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '4 months';
  m5 DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months';
BEGIN

  -- ── Aluno 1 (Ana) — Mensal R$130 ─────────────────────────────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (1,'Mensal',130, m5+1, m5-INTERVAL'2 days', 'Pago'),
    (1,'Mensal',130, m4+1, m4-INTERVAL'1 day',  'Pago'),
    (1,'Mensal',130, m3+1, m3+1,                 'Pago'),
    (1,'Mensal',130, m2+1, m2+INTERVAL'3 days',  'Pago'),
    (1,'Mensal',130, m1+1, m1+INTERVAL'2 days',  'Pago'),
    (1,'Mensal',130, m0+INTERVAL'15 days', m0+INTERVAL'5 days', 'Pago');

  -- ── Aluno 2 (Bruno) — Trimestral R$330 (a cada 3 meses) ─────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (2,'Trimestral',330, m5+1, m5-INTERVAL'1 day',   'Pago'),
    (2,'Trimestral',330, m2+1, m2+INTERVAL'2 days',  'Pago'),
    (2,'Trimestral',330, CURRENT_DATE+INTERVAL'45 days', NULL, 'Pendente');

  -- ── Aluno 3 (Camila) — Mensal R$130, com atraso recente ─────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (3,'Mensal',130, m5+1, m5+1,                 'Pago'),
    (3,'Mensal',130, m4+1, m4+INTERVAL'3 days',  'Pago'),
    (3,'Mensal',130, m3+1, m3+INTERVAL'1 day',   'Pago'),
    (3,'Mensal',130, m2+1, m2+INTERVAL'5 days',  'Pago'),
    (3,'Mensal',130, m1+1, m1+INTERVAL'4 days',  'Pago'),
    (3,'Mensal',130, CURRENT_DATE-INTERVAL'5 days', NULL, 'Atrasado');

  -- ── Aluno 4 (Diego) — Semestral R$600 ────────────────────────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (4,'Semestral',600, m5+1, m5-INTERVAL'3 days', 'Pago'),
    (4,'Semestral',600, CURRENT_DATE+INTERVAL'120 days', m0+INTERVAL'10 days', 'Pago');

  -- ── Aluno 5 (Elisa) — Anual R$1200 ───────────────────────────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (5,'Anual',1200, CURRENT_DATE+INTERVAL'250 days', m0-INTERVAL'5 days', 'Pago');

  -- ── Aluno 6 (Felipe) — Mensal R$130, INADIMPLENTE ────────────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (6,'Mensal',130, m4+1, m4+INTERVAL'2 days', 'Pago'),
    (6,'Mensal',130, m3+1, NULL, 'Atrasado'),
    (6,'Mensal',130, m2+1, NULL, 'Atrasado'),
    (6,'Mensal',130, m1+1, NULL, 'Atrasado'),
    (6,'Mensal',130, CURRENT_DATE-INTERVAL'20 days', NULL, 'Atrasado');

  -- ── Aluno 7 (Gabriela) — Mensal R$130, próxima a vencer ─────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (7,'Mensal',130, m5+1, m5+INTERVAL'1 day',   'Pago'),
    (7,'Mensal',130, m4+1, m4+1,                  'Pago'),
    (7,'Mensal',130, m3+1, m3+INTERVAL'2 days',   'Pago'),
    (7,'Mensal',130, m2+1, m2+INTERVAL'3 days',   'Pago'),
    (7,'Mensal',130, m1+1, m1+INTERVAL'1 day',    'Pago'),
    (7,'Mensal',130, CURRENT_DATE+INTERVAL'8 days', NULL, 'Pendente');

  -- ── Aluno 8 (Henrique) — Trimestral R$330 ────────────────────────────────
  INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status) VALUES
    (8,'Trimestral',330, m4+1, m4-INTERVAL'1 day',  'Pago'),
    (8,'Trimestral',330, m1+1, m1+INTERVAL'3 days', 'Pago'),
    (8,'Trimestral',330, CURRENT_DATE+INTERVAL'60 days', m0+INTERVAL'2 days', 'Pago');

END $$;

-- ─── PRESENÇAS — últimos 30 dias úteis (seg–sex) ─────────────────────────────
INSERT INTO presencas (aluno_id, data, status)
SELECT
  a.id,
  d.dia,
  CASE
    WHEN random() < 0.78 THEN 'Presente'::status_presenca_enum
    WHEN random() < 0.60 THEN 'Justificada'::status_presenca_enum
    ELSE                       'Falta'::status_presenca_enum
  END
FROM alunos a
CROSS JOIN (
  SELECT gs::DATE AS dia
  FROM generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) gs
  WHERE EXTRACT(DOW FROM gs) BETWEEN 1 AND 5  -- apenas seg–sex
) d
WHERE a.status = 'Ativo'
ON CONFLICT (aluno_id, data) DO NOTHING;

-- ─── VERIFICAÇÃO ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_donos INT; v_prof INT; v_fichas INT; v_ex INT;
  v_alunos INT; v_mens INT; v_pres INT;
BEGIN
  SELECT COUNT(*) INTO v_donos  FROM donos;
  SELECT COUNT(*) INTO v_prof   FROM professores;
  SELECT COUNT(*) INTO v_fichas FROM fichas;
  SELECT COUNT(*) INTO v_ex     FROM exercicios;
  SELECT COUNT(*) INTO v_alunos FROM alunos;
  SELECT COUNT(*) INTO v_mens   FROM mensalidades;
  SELECT COUNT(*) INTO v_pres   FROM presencas;
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'SEEDS OK:';
  RAISE NOTICE '  Donos: %        Professores: %', v_donos, v_prof;
  RAISE NOTICE '  Fichas: %       Exercícios: %', v_fichas, v_ex;
  RAISE NOTICE '  Alunos: %       Mensalidades: %', v_alunos, v_mens;
  RAISE NOTICE '  Presenças: %', v_pres;
  RAISE NOTICE '=========================================';
END $$;
