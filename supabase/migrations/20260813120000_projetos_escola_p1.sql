-- Migration: 20260813120000_projetos_escola_p1.sql
-- Módulo Projetos da Escola - Sprint P1 (Banco de Dados + RLS)

-- 1. Tabela: public.projetos
CREATE TABLE IF NOT EXISTS public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  objetivo text,
  local text,
  capa_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices em projetos
CREATE INDEX IF NOT EXISTS idx_projetos_ativo ON public.projetos (ativo);
CREATE INDEX IF NOT EXISTS idx_projetos_nome ON public.projetos (nome);

-- 2. Tabela: public.projetos_alunos
CREATE TABLE IF NOT EXISTS public.projetos_alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  aluno_id bigint NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_projetos_alunos UNIQUE (projeto_id, aluno_id)
);

-- Índices em projetos_alunos
CREATE INDEX IF NOT EXISTS idx_projetos_alunos_projeto_id ON public.projetos_alunos (projeto_id);
CREATE INDEX IF NOT EXISTS idx_projetos_alunos_aluno_id ON public.projetos_alunos (aluno_id);

-- 3. Tabela: public.projetos_responsaveis
CREATE TABLE IF NOT EXISTS public.projetos_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL,
  funcao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_projetos_responsaveis_tipo CHECK (tipo IN ('professor', 'funcionario', 'voluntario'))
);

-- Índices em projetos_responsaveis
CREATE INDEX IF NOT EXISTS idx_projetos_responsaveis_projeto_id ON public.projetos_responsaveis (projeto_id);

-- 4. Tabela: public.projetos_horarios
CREATE TABLE IF NOT EXISTS public.projetos_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  dia_semana smallint NOT NULL,
  hora_inicio time,
  hora_fim time,
  local text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_projetos_horarios_dia_semana CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT chk_projetos_horarios_horario CHECK (hora_fim IS NULL OR hora_inicio IS NULL OR hora_fim >= hora_inicio)
);

-- Índices em projetos_horarios
CREATE INDEX IF NOT EXISTS idx_projetos_horarios_projeto_id ON public.projetos_horarios (projeto_id);

-- 5. Habilitar Row Level Security (RLS) nas novas tabelas
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_horarios ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Segurança (RLS)
-- Permitir SELECT exclusivamente para usuários autenticados em projetos ativos e dados associados a projetos ativos
DROP POLICY IF EXISTS "projetos_select_policy" ON public.projetos;
CREATE POLICY "projetos_select_policy" ON public.projetos
  FOR SELECT TO authenticated
  USING (ativo = true);

DROP POLICY IF EXISTS "projetos_alunos_select_policy" ON public.projetos_alunos;
CREATE POLICY "projetos_alunos_select_policy" ON public.projetos_alunos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = projetos_alunos.projeto_id
        AND p.ativo = true
    )
  );

DROP POLICY IF EXISTS "projetos_responsaveis_select_policy" ON public.projetos_responsaveis;
CREATE POLICY "projetos_responsaveis_select_policy" ON public.projetos_responsaveis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = projetos_responsaveis.projeto_id
        AND p.ativo = true
    )
  );

DROP POLICY IF EXISTS "projetos_horarios_select_policy" ON public.projetos_horarios;
CREATE POLICY "projetos_horarios_select_policy" ON public.projetos_horarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = projetos_horarios.projeto_id
        AND p.ativo = true
    )
  );

-- 7. Permissões de Acesso
GRANT SELECT ON public.projetos, public.projetos_alunos, public.projetos_responsaveis, public.projetos_horarios TO authenticated;
REVOKE ALL ON public.projetos, public.projetos_alunos, public.projetos_responsaveis, public.projetos_horarios FROM anon, public;
