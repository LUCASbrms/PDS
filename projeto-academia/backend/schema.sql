-- =============================================================
-- SCHEMA COMPLETO - SISTEMA DE GESTÃO DE ACADEMIA
-- PostgreSQL 14+ | snake_case | Versão 2.0
-- =============================================================
-- Gerado em: 2026-04-23
-- Tecnologia: Node.js + Express + PostgreSQL (pg)
-- =============================================================

-- ============================================================
-- LIMPEZA (para re-execução em ambiente de desenvolvimento)
-- ============================================================
DROP TABLE IF EXISTS presencas          CASCADE;
DROP TABLE IF EXISTS mensalidades       CASCADE;
DROP TABLE IF EXISTS exercicios         CASCADE;
DROP TABLE IF EXISTS ficha_grupos_musculares CASCADE;
DROP TABLE IF EXISTS fichas             CASCADE;
DROP TABLE IF EXISTS alunos             CASCADE;
DROP TABLE IF EXISTS professores        CASCADE;
DROP TABLE IF EXISTS donos              CASCADE;

DROP TYPE IF EXISTS status_aluno_enum       CASCADE;
DROP TYPE IF EXISTS status_professor_enum   CASCADE;
DROP TYPE IF EXISTS tipo_plano_enum         CASCADE;
DROP TYPE IF EXISTS objetivo_ficha_enum     CASCADE;
DROP TYPE IF EXISTS grupo_muscular_enum     CASCADE;
DROP TYPE IF EXISTS status_presenca_enum    CASCADE;
DROP TYPE IF EXISTS status_mensalidade_enum CASCADE;

-- ============================================================
-- FUNÇÃO AUXILIAR: atualiza atualizado_em automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ENUMS — tipos controlados pelo banco
-- ============================================================

-- Status do aluno
CREATE TYPE status_aluno_enum AS ENUM (
  'Ativo',
  'Pendente',
  'Inativo'
);

-- Status do professor
CREATE TYPE status_professor_enum AS ENUM (
  'Ativo',
  'Inativo'
);

-- Planos de matrícula
CREATE TYPE tipo_plano_enum AS ENUM (
  'Mensal',
  'Trimestral',
  'Semestral',
  'Anual'
);

-- Objetivo de um programa de treino
CREATE TYPE objetivo_ficha_enum AS ENUM (
  'Hipertrofia',
  'Emagrecimento',
  'Resistência',
  'Condicionamento'
);

-- Grupos musculares disponíveis
CREATE TYPE grupo_muscular_enum AS ENUM (
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior',
  'gluteos',
  'abdomen',
  'panturrilha',
  'trapezio'
);

-- Status de presença
CREATE TYPE status_presenca_enum AS ENUM (
  'Presente',
  'Falta',
  'Justificada'
);

-- Status de pagamento
CREATE TYPE status_mensalidade_enum AS ENUM (
  'Pago',
  'Pendente',
  'Atrasado'
);

-- ============================================================
-- TABELA: donos
-- Representa o proprietário/gestor da academia.
-- Regra: apenas 1 dono por instância do sistema.
-- ============================================================
CREATE TABLE donos (
  id            SERIAL          PRIMARY KEY,
  nome          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL,
  senha_hash    VARCHAR(255)    NOT NULL,
  telefone      VARCHAR(20),
  cpf           VARCHAR(14),
  nome_academia VARCHAR(150),
  criado_em     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT donos_email_unique UNIQUE (email),
  CONSTRAINT donos_cpf_unique   UNIQUE (cpf)
);

-- Trigger: atualiza atualizado_em a cada UPDATE
CREATE TRIGGER trg_donos_atualizado_em
  BEFORE UPDATE ON donos
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

COMMENT ON TABLE  donos              IS 'Proprietário/gestor da academia — 1 por instância';
COMMENT ON COLUMN donos.senha_hash   IS 'Senha criptografada com bcrypt (min. 6 chars)';
COMMENT ON COLUMN donos.cpf          IS 'Formato: 000.000.000-00';

-- ============================================================
-- TABELA: professores
-- Instrutores e professores vinculados ao dono.
-- ============================================================
CREATE TABLE professores (
  id            SERIAL                PRIMARY KEY,
  dono_id       INTEGER               REFERENCES donos(id) ON DELETE SET NULL,
  nome          VARCHAR(100)          NOT NULL,
  email         VARCHAR(150),
  telefone      VARCHAR(20),
  cpf           VARCHAR(14),
  especialidade VARCHAR(100),
  status        status_professor_enum NOT NULL DEFAULT 'Ativo',
  criado_em     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  CONSTRAINT professores_email_unique UNIQUE (email),
  CONSTRAINT professores_cpf_unique   UNIQUE (cpf)
);

CREATE TRIGGER trg_professores_atualizado_em
  BEFORE UPDATE ON professores
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

COMMENT ON TABLE  professores               IS 'Instrutores/professores da academia';
COMMENT ON COLUMN professores.especialidade IS 'Ex: Musculação, CrossFit, Pilates';
COMMENT ON COLUMN professores.dono_id       IS 'FK para o dono que cadastrou o professor';

-- ============================================================
-- TABELA: fichas
-- Programas de treino prescritos para os alunos.
-- Relacionamento: 1 ficha pode ser atribuída a N alunos.
-- ============================================================
CREATE TABLE fichas (
  id            SERIAL              PRIMARY KEY,
  dono_id       INTEGER             REFERENCES donos(id) ON DELETE SET NULL,
  professor_id  INTEGER             REFERENCES professores(id) ON DELETE SET NULL,
  nome          VARCHAR(100)        NOT NULL,
  objetivo      objetivo_ficha_enum NOT NULL DEFAULT 'Hipertrofia',
  partes        JSONB               NOT NULL DEFAULT '[]',
  observacoes   TEXT,
  criado_em     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_fichas_atualizado_em
  BEFORE UPDATE ON fichas
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

COMMENT ON TABLE  fichas              IS 'Programas de treino (fichas)';
COMMENT ON COLUMN fichas.objetivo     IS 'Objetivo principal da ficha: Hipertrofia, Emagrecimento, etc.';
COMMENT ON COLUMN fichas.professor_id IS 'Professor que prescreveu a ficha (nullable)';

-- ============================================================
-- TABELA: ficha_grupos_musculares
-- Relacionamento N:N entre fichas e grupos musculares.
-- Uma ficha pode treinar múltiplos grupos (peito + ombros, etc.)
-- ============================================================
CREATE TABLE ficha_grupos_musculares (
  ficha_id INTEGER             NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  grupo    grupo_muscular_enum NOT NULL,

  PRIMARY KEY (ficha_id, grupo)
);

COMMENT ON TABLE ficha_grupos_musculares IS 'Grupos musculares trabalhados em cada ficha (N:N)';

-- ============================================================
-- TABELA: exercicios
-- Exercícios individuais de cada ficha de treino.
-- Relacionamento: N exercícios por 1 ficha.
-- ============================================================
CREATE TABLE exercicios (
  id             SERIAL              PRIMARY KEY,
  ficha_id       INTEGER             NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  nome           VARCHAR(100)        NOT NULL,
  grupo_muscular grupo_muscular_enum,
  series         VARCHAR(20),
  repeticoes     VARCHAR(30),
  carga          VARCHAR(30),
  descanso       VARCHAR(20),
  ordem          SMALLINT            NOT NULL DEFAULT 0,
  observacoes    TEXT,
  criado_em      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT exercicios_ordem_positivo CHECK (ordem >= 0)
);

COMMENT ON TABLE  exercicios            IS 'Exercícios individuais de cada ficha';
COMMENT ON COLUMN exercicios.series     IS 'Ex: "4", "3-4"';
COMMENT ON COLUMN exercicios.repeticoes IS 'Ex: "10 a 12", "12", "até a falha"';
COMMENT ON COLUMN exercicios.carga      IS 'Ex: "20kg", "30%", "peso corporal"';
COMMENT ON COLUMN exercicios.descanso   IS 'Ex: "60s", "90s", "2min"';
COMMENT ON COLUMN exercicios.ordem      IS 'Posição do exercício dentro da ficha (0-based)';

-- ============================================================
-- TABELA: alunos
-- Alunos matriculados na academia.
-- Relacionamentos:
--   N:1 fichas       (aluno tem 1 ficha ativa)
--   N:1 professores  (aluno tem 1 professor responsável)
--   1:N presencas    (aluno tem N registros de presença)
--   1:N mensalidades (aluno tem N registros financeiros)
-- ============================================================
CREATE TABLE alunos (
  id             SERIAL            PRIMARY KEY,
  dono_id        INTEGER           REFERENCES donos(id) ON DELETE SET NULL,
  professor_id   INTEGER           REFERENCES professores(id) ON DELETE SET NULL,
  ficha_id       INTEGER           REFERENCES fichas(id) ON DELETE SET NULL,
  nome           VARCHAR(100)      NOT NULL,
  nascimento     DATE,
  cpf            VARCHAR(14),
  telefone       VARCHAR(20),
  email          VARCHAR(150),
  altura         NUMERIC(4,2),
  peso           NUMERIC(5,1),
  plano          tipo_plano_enum   NOT NULL DEFAULT 'Mensal',
  vencimento     DATE,
  status         status_aluno_enum NOT NULL DEFAULT 'Ativo',
  treinos_semana JSONB             NOT NULL DEFAULT '{"segunda":"","terca":"","quarta":"","quinta":"","sexta":""}',
  observacoes    TEXT,
  criado_em      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT alunos_cpf_unique         UNIQUE (cpf),
  CONSTRAINT alunos_altura_valida      CHECK (altura IS NULL OR (altura BETWEEN 0.50 AND 2.50)),
  CONSTRAINT alunos_peso_valido        CHECK (peso IS NULL OR peso > 0)
);

CREATE TRIGGER trg_alunos_atualizado_em
  BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

COMMENT ON TABLE  alunos               IS 'Alunos matriculados na academia';
COMMENT ON COLUMN alunos.cpf           IS 'Formato: 000.000.000-00 (único)';
COMMENT ON COLUMN alunos.altura        IS 'Altura em metros (0.50 a 2.50)';
COMMENT ON COLUMN alunos.peso          IS 'Peso em kg (> 0)';
COMMENT ON COLUMN alunos.treinos_semana IS 'JSONB com dias da semana e tipos de treino';
COMMENT ON COLUMN alunos.plano         IS 'Plano de matrícula: Mensal, Trimestral, Semestral, Anual';
COMMENT ON COLUMN alunos.vencimento    IS 'Data de vencimento do plano atual';

-- ============================================================
-- TABELA: mensalidades
-- Registros financeiros de pagamento por aluno.
-- Relacionamento: N mensalidades por 1 aluno.
-- ============================================================
CREATE TABLE mensalidades (
  id             SERIAL                  PRIMARY KEY,
  aluno_id       INTEGER                 NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  plano          tipo_plano_enum         NOT NULL,
  valor          NUMERIC(10,2)           NOT NULL,
  vencimento     DATE                    NOT NULL,
  data_pagamento DATE,
  status         status_mensalidade_enum NOT NULL DEFAULT 'Pendente',
  observacoes    TEXT,
  criado_em      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT mensalidades_valor_positivo CHECK (valor >= 0),
  CONSTRAINT mensalidades_data_pagamento_valida
    CHECK (data_pagamento IS NULL OR data_pagamento >= '2000-01-01')
);

CREATE TRIGGER trg_mensalidades_atualizado_em
  BEFORE UPDATE ON mensalidades
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

COMMENT ON TABLE  mensalidades                IS 'Registros de pagamentos/mensalidades dos alunos';
COMMENT ON COLUMN mensalidades.valor          IS 'Valor em reais (R$)';
COMMENT ON COLUMN mensalidades.vencimento     IS 'Data de vencimento da cobrança';
COMMENT ON COLUMN mensalidades.data_pagamento IS 'Data efetiva do pagamento (NULL = não pago)';

-- ============================================================
-- TABELA: presencas
-- Registro de presença/ausência diária dos alunos.
-- Relacionamento: N presenças por 1 aluno.
-- Constraint: 1 registro por aluno por dia.
-- ============================================================
CREATE TABLE presencas (
  id          SERIAL               PRIMARY KEY,
  aluno_id    INTEGER              NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  data        DATE                 NOT NULL DEFAULT CURRENT_DATE,
  status      status_presenca_enum NOT NULL DEFAULT 'Presente',
  observacoes TEXT,
  criado_em   TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  CONSTRAINT presencas_unica_por_dia UNIQUE (aluno_id, data)
);

COMMENT ON TABLE  presencas         IS 'Registro diário de presença dos alunos';
COMMENT ON COLUMN presencas.data    IS 'Data do registro (1 por aluno por dia)';
COMMENT ON COLUMN presencas.status  IS 'Presente | Falta | Justificada';

-- ============================================================
-- ÍNDICES — otimização de consultas frequentes
-- ============================================================

-- donos
CREATE INDEX idx_donos_email            ON donos(email);

-- professores
CREATE INDEX idx_professores_dono_id    ON professores(dono_id);
CREATE INDEX idx_professores_status     ON professores(status);
CREATE INDEX idx_professores_nome       ON professores(nome);

-- fichas
CREATE INDEX idx_fichas_dono_id         ON fichas(dono_id);
CREATE INDEX idx_fichas_professor_id    ON fichas(professor_id);
CREATE INDEX idx_fichas_objetivo        ON fichas(objetivo);

-- exercicios (consulta mais comum: listar exercícios de uma ficha em ordem)
CREATE INDEX idx_exercicios_ficha_ordem ON exercicios(ficha_id, ordem);

-- alunos (filtros mais usados na aplicação)
CREATE INDEX idx_alunos_dono_id         ON alunos(dono_id);
CREATE INDEX idx_alunos_professor_id    ON alunos(professor_id);
CREATE INDEX idx_alunos_ficha_id        ON alunos(ficha_id);
CREATE INDEX idx_alunos_status          ON alunos(status);
CREATE INDEX idx_alunos_plano           ON alunos(plano);
CREATE INDEX idx_alunos_vencimento      ON alunos(vencimento);
CREATE INDEX idx_alunos_nome            ON alunos(nome);

-- mensalidades (filtros de dashboard financeiro)
CREATE INDEX idx_mensalidades_aluno_id  ON mensalidades(aluno_id);
CREATE INDEX idx_mensalidades_status    ON mensalidades(status);
CREATE INDEX idx_mensalidades_vencimento ON mensalidades(vencimento);

-- presencas (filtros de data e aluno)
CREATE INDEX idx_presencas_aluno_id     ON presencas(aluno_id);
CREATE INDEX idx_presencas_data         ON presencas(data);

-- ============================================================
-- VIEWS ÚTEIS (opcionais, facilitam consultas do backend)
-- ============================================================

-- View: alunos com status de mensalidade mais recente
CREATE OR REPLACE VIEW vw_alunos_financeiro AS
SELECT
  a.id,
  a.nome,
  a.plano,
  a.vencimento,
  a.status AS status_aluno,
  m.valor,
  m.status AS status_mensalidade,
  m.vencimento AS vencimento_mensalidade,
  m.data_pagamento
FROM alunos a
LEFT JOIN LATERAL (
  SELECT * FROM mensalidades
  WHERE aluno_id = a.id
  ORDER BY vencimento DESC
  LIMIT 1
) m ON true;

-- View: resumo do dashboard (KPIs)
CREATE OR REPLACE VIEW vw_dashboard_kpis AS
SELECT
  (SELECT COUNT(*)                 FROM alunos)                           AS total_alunos,
  (SELECT COUNT(*)                 FROM alunos WHERE status = 'Ativo')    AS alunos_ativos,
  (SELECT COUNT(*)                 FROM professores WHERE status = 'Ativo') AS professores_ativos,
  (SELECT COALESCE(SUM(valor), 0)  FROM mensalidades WHERE status = 'Pago'
     AND DATE_TRUNC('month', data_pagamento) = DATE_TRUNC('month', NOW())) AS receita_mes,
  (SELECT COALESCE(SUM(valor), 0)  FROM mensalidades WHERE status = 'Pendente') AS total_pendente,
  (SELECT COALESCE(SUM(valor), 0)  FROM mensalidades WHERE status = 'Atrasado') AS total_atrasado,
  (SELECT COUNT(*)                 FROM presencas WHERE data = CURRENT_DATE AND status = 'Presente') AS presencas_hoje;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
