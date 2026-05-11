-- =============================================================
-- SEEDS — Dados iniciais para ambiente de desenvolvimento
-- Sistema de Gestão de Academia
-- =============================================================
-- ATENÇÃO: Execute APENAS em ambiente de desenvolvimento!
-- Pré-requisito: schema.sql já executado
-- =============================================================

-- ============================================================
-- DONO DA ACADEMIA
-- Login: admin@academia.com | Senha: 123456
-- (senha_hash gerada com bcrypt, 10 rounds)
-- ============================================================
INSERT INTO donos (nome, email, senha_hash, telefone, cpf, nome_academia)
VALUES (
  'Carlos Silva',
  'admin@academia.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: "password" (bcrypt)
  '(11) 99999-0001',
  '123.456.789-00',
  'Academia FitSystem'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PROFESSORES
-- ============================================================
INSERT INTO professores (dono_id, nome, email, telefone, cpf, especialidade, status)
VALUES
  (1, 'Marcos Oliveira',  'marcos@academia.com', '(11) 98888-0001', '111.222.333-01', 'Musculação',       'Ativo'),
  (1, 'Fernanda Costa',   'fernanda@academia.com','(11) 98888-0002', '111.222.333-02', 'CrossFit',         'Ativo'),
  (1, 'Ricardo Almeida',  'ricardo@academia.com', '(11) 98888-0003', '111.222.333-03', 'Pilates',          'Ativo'),
  (1, 'Juliana Martins',  'juliana@academia.com', '(11) 98888-0004', '111.222.333-04', 'Funcional',        'Inativo')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FICHAS DE TREINO
-- ============================================================
INSERT INTO fichas (dono_id, professor_id, nome, objetivo, observacoes)
VALUES
  (1, 1, 'Treino A — Peito e Tríceps',   'Hipertrofia',    'Foco em sobrecarga progressiva. Descanso de 90s entre séries.'),
  (1, 1, 'Treino B — Costas e Bíceps',   'Hipertrofia',    'Incluir puxadas e remadas variadas.'),
  (1, 1, 'Treino C — Pernas Completo',   'Hipertrofia',    'Agachamento livre como movimento principal.'),
  (1, 2, 'HIIT Cardio 30min',             'Emagrecimento', 'Intervalos de alta intensidade — 30s trabalho / 30s descanso.'),
  (1, 2, 'Full Body Iniciante',           'Condicionamento','Ideal para alunos nos primeiros 3 meses. Cargas leves.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GRUPOS MUSCULARES DAS FICHAS
-- ============================================================
INSERT INTO ficha_grupos_musculares (ficha_id, grupo) VALUES
  (1, 'peito'),    (1, 'triceps'),   (1, 'ombros'),
  (2, 'costas'),   (2, 'biceps'),    (2, 'trapezio'),
  (3, 'quadriceps'),(3, 'posterior'),(3, 'gluteos'),  (3, 'panturrilha'),
  (4, 'abdomen'),  (4, 'quadriceps'),(4, 'posterior'),
  (5, 'peito'),    (5, 'costas'),    (5, 'ombros'),   (5, 'quadriceps')
ON CONFLICT DO NOTHING;

-- ============================================================
-- EXERCÍCIOS
-- ============================================================
INSERT INTO exercicios (ficha_id, nome, grupo_muscular, series, repeticoes, carga, descanso, ordem)
VALUES
  -- Ficha 1: Peito e Tríceps
  (1, 'Supino Reto',            'peito',    '4', '8 a 10',   '60kg',   '90s', 0),
  (1, 'Supino Inclinado Halteres','peito',  '3', '10 a 12',  '20kg',   '90s', 1),
  (1, 'Crucifixo na Polia',     'peito',    '3', '12 a 15',  '15kg',   '60s', 2),
  (1, 'Tríceps Corda',          'triceps',  '4', '12',        '25kg',   '60s', 3),
  (1, 'Tríceps Testa',          'triceps',  '3', '10 a 12',  '20kg',   '60s', 4),

  -- Ficha 2: Costas e Bíceps
  (2, 'Puxada Frontal',         'costas',   '4', '8 a 10',   '70kg',   '90s', 0),
  (2, 'Remada Curvada',         'costas',   '4', '10 a 12',  '60kg',   '90s', 1),
  (2, 'Remada Unilateral',      'costas',   '3', '12',        '25kg',   '60s', 2),
  (2, 'Rosca Direta',           'biceps',   '3', '10 a 12',  '20kg',   '60s', 3),
  (2, 'Rosca Concentrada',      'biceps',   '3', '12 a 15',  '12kg',   '45s', 4),

  -- Ficha 3: Pernas
  (3, 'Agachamento Livre',      'quadriceps','4', '8 a 10',  '80kg',  '120s', 0),
  (3, 'Leg Press 45°',          'quadriceps','4', '12 a 15',  '150kg','90s',  1),
  (3, 'Cadeira Extensora',      'quadriceps','3', '15',        '50kg', '60s',  2),
  (3, 'Stiff',                  'posterior', '3', '10 a 12',  '60kg', '90s',  3),
  (3, 'Panturrilha em Pé',      'panturrilha','4','20',         '80kg', '45s', 4),

  -- Ficha 4: HIIT
  (4, 'Burpee',                 'quadriceps','5', '30s trabalho','peso corporal','30s', 0),
  (4, 'Jumping Jack',           'quadriceps','5', '30s trabalho','peso corporal','30s', 1),
  (4, 'Mountain Climber',       'abdomen',   '5', '30s trabalho','peso corporal','30s', 2),
  (4, 'Prancha Abdominal',      'abdomen',   '3', '45s',          'peso corporal','15s', 3),

  -- Ficha 5: Full Body
  (5, 'Agachamento com Halteres','quadriceps','3','12',           '10kg', '60s', 0),
  (5, 'Supino com Halteres',    'peito',     '3', '12',           '10kg', '60s', 1),
  (5, 'Remada com Halteres',    'costas',    '3', '12',           '10kg', '60s', 2),
  (5, 'Desenvolvimento Ombros', 'ombros',    '3', '12',           '8kg',  '60s', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ALUNOS
-- ============================================================
INSERT INTO alunos (
  dono_id, professor_id, ficha_id,
  nome, nascimento, cpf, telefone, email,
  altura, peso, plano, vencimento, status,
  treinos_semana
)
VALUES
  (1, 1, 1, 'Ana Beatriz Santos',  '1998-03-15', '222.333.444-01', '(11) 91111-0001', 'ana@email.com',
   1.65, 62.5, 'Mensal',     (CURRENT_DATE + INTERVAL '15 days'),  'Ativo',
   '{"segunda":"A","terca":"","quarta":"B","quinta":"","sexta":"C"}'),

  (1, 1, 2, 'Bruno Ferreira',      '1995-07-22', '222.333.444-02', '(11) 91111-0002', 'bruno@email.com',
   1.80, 88.0, 'Trimestral', (CURRENT_DATE + INTERVAL '45 days'),  'Ativo',
   '{"segunda":"A","terca":"B","quarta":"","quinta":"C","sexta":"A"}'),

  (1, 2, 4, 'Camila Rodrigues',    '2001-11-08', '222.333.444-03', '(11) 91111-0003', 'camila@email.com',
   1.60, 55.0, 'Mensal',     (CURRENT_DATE - INTERVAL '5 days'),   'Pendente',
   '{"segunda":"HIIT","terca":"","quarta":"HIIT","quinta":"","sexta":"HIIT"}'),

  (1, 1, 3, 'Diego Mendes',        '1990-02-28', '222.333.444-04', '(11) 91111-0004', NULL,
   1.75, 95.3, 'Semestral',  (CURRENT_DATE + INTERVAL '120 days'), 'Ativo',
   '{"segunda":"C","terca":"A","quarta":"","quinta":"B","sexta":"C"}'),

  (1, 2, 5, 'Elisa Carvalho',      '2003-06-01', '222.333.444-05', '(11) 91111-0005', 'elisa@email.com',
   1.68, 58.0, 'Anual',      (CURRENT_DATE + INTERVAL '250 days'), 'Ativo',
   '{"segunda":"Full","terca":"","quarta":"Full","quinta":"","sexta":"Full"}'),

  (1, 3, NULL,'Felipe Nascimento',  '1988-09-14', '222.333.444-06', '(11) 91111-0006', NULL,
   1.82, 102.0,'Mensal',     (CURRENT_DATE - INTERVAL '20 days'),  'Inativo',
   '{"segunda":"","terca":"","quarta":"","quinta":"","sexta":""}'),

  (1, 1, 1, 'Gabriela Lima',       '2000-04-19', '222.333.444-07', '(11) 91111-0007', 'gabi@email.com',
   1.62, 65.0, 'Mensal',     (CURRENT_DATE + INTERVAL '8 days'),   'Ativo',
   '{"segunda":"A","terca":"","quarta":"B","quinta":"","sexta":"A"}'),

  (1, 2, 4, 'Henrique Sousa',      '1993-12-05', '222.333.444-08', '(11) 91111-0008', NULL,
   1.78, 80.0, 'Trimestral', (CURRENT_DATE + INTERVAL '60 days'),  'Ativo',
   '{"segunda":"HIIT","terca":"HIIT","quarta":"","quinta":"HIIT","sexta":""}')
ON CONFLICT (cpf) DO NOTHING;

-- ============================================================
-- MENSALIDADES
-- ============================================================
INSERT INTO mensalidades (aluno_id, plano, valor, vencimento, data_pagamento, status)
VALUES
  -- Ana — Mensal, em dia
  (1, 'Mensal', 130.00, CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE - INTERVAL '5 days',  'Pago'),
  (1, 'Mensal', 130.00, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '20 days', 'Pago'),

  -- Bruno — Trimestral, em dia
  (2, 'Trimestral', 330.00, CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE - INTERVAL '1 day', 'Pago'),

  -- Camila — Mensal, PENDENTE (vencida 5 dias atrás)
  (3, 'Mensal', 130.00, CURRENT_DATE - INTERVAL '5 days',  NULL, 'Atrasado'),
  (3, 'Mensal', 130.00, CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '38 days', 'Pago'),

  -- Diego — Semestral
  (4, 'Semestral', 600.00, CURRENT_DATE + INTERVAL '120 days', CURRENT_DATE - INTERVAL '10 days', 'Pago'),

  -- Elisa — Anual
  (5, 'Anual', 1200.00, CURRENT_DATE + INTERVAL '250 days', CURRENT_DATE - INTERVAL '3 days', 'Pago'),

  -- Felipe — ATRASADO (inativo)
  (6, 'Mensal', 130.00, CURRENT_DATE - INTERVAL '20 days', NULL, 'Atrasado'),
  (6, 'Mensal', 130.00, CURRENT_DATE - INTERVAL '50 days', NULL, 'Atrasado'),

  -- Gabriela — Pendente (vence em breve)
  (7, 'Mensal', 130.00, CURRENT_DATE + INTERVAL '8 days', NULL, 'Pendente'),
  (7, 'Mensal', 130.00, CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE - INTERVAL '25 days', 'Pago'),

  -- Henrique — Trimestral, pago
  (8, 'Trimestral', 330.00, CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE - INTERVAL '2 days', 'Pago')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PRESENÇAS (últimos 7 dias úteis)
-- ============================================================
INSERT INTO presencas (aluno_id, data, status)
SELECT
  a.id,
  d.dia,
  CASE
    WHEN random() < 0.80 THEN 'Presente'::status_presenca_enum
    WHEN random() < 0.50 THEN 'Falta'::status_presenca_enum
    ELSE 'Justificada'::status_presenca_enum
  END
FROM alunos a
CROSS JOIN (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::DATE AS dia
) d
WHERE a.status = 'Ativo'
ON CONFLICT (aluno_id, data) DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
DO $$
DECLARE
  v_donos        INT; v_professores INT; v_fichas       INT;
  v_exercicios   INT; v_alunos      INT; v_mensalidades INT;
  v_presencas    INT;
BEGIN
  SELECT COUNT(*) INTO v_donos        FROM donos;
  SELECT COUNT(*) INTO v_professores  FROM professores;
  SELECT COUNT(*) INTO v_fichas       FROM fichas;
  SELECT COUNT(*) INTO v_exercicios   FROM exercicios;
  SELECT COUNT(*) INTO v_alunos       FROM alunos;
  SELECT COUNT(*) INTO v_mensalidades FROM mensalidades;
  SELECT COUNT(*) INTO v_presencas    FROM presencas;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEEDS INSERIDOS COM SUCESSO:';
  RAISE NOTICE '  Donos:        %', v_donos;
  RAISE NOTICE '  Professores:  %', v_professores;
  RAISE NOTICE '  Fichas:       %', v_fichas;
  RAISE NOTICE '  Exercícios:   %', v_exercicios;
  RAISE NOTICE '  Alunos:       %', v_alunos;
  RAISE NOTICE '  Mensalidades: %', v_mensalidades;
  RAISE NOTICE '  Presenças:    %', v_presencas;
  RAISE NOTICE '============================================';
END $$;
