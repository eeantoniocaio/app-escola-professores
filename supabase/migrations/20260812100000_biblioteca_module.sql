-- Migration: 20260812100000_biblioteca_module.sql
-- Módulo de Biblioteca: Obra (livros), Exemplares Físicos (exemplares_livros), Empréstimos (emprestimos_livros)

-- 1. Atualizar a constraint de papéis na tabela perfis para permitir o papel 'biblioteca' (Aditivo / Não Destrutivo)
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_papel_check;
ALTER TABLE public.perfis ADD CONSTRAINT perfis_papel_check 
  CHECK (papel IN ('gestao', 'professor', 'secretaria', 'tecnico', 'agente', 'biblioteca'));

-- 2. Tabela de Obras (livros)
CREATE TABLE IF NOT EXISTS public.livros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  autor text NOT NULL,
  prateleira text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices em livros
CREATE INDEX IF NOT EXISTS idx_livros_titulo ON public.livros (titulo);
CREATE INDEX IF NOT EXISTS idx_livros_autor ON public.livros (autor);
CREATE INDEX IF NOT EXISTS idx_livros_prateleira ON public.livros (prateleira);

-- 3. Tabela de Exemplares Físicos (exemplares_livros)
CREATE TABLE IF NOT EXISTS public.exemplares_livros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livro_id uuid NOT NULL REFERENCES public.livros(id) ON DELETE CASCADE,
  codigo_exemplar text NOT NULL,
  status text DEFAULT 'disponivel' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_exemplar_status CHECK (status IN ('disponivel', 'emprestado', 'manutencao', 'extraviado'))
);

-- Índices e Unicidade em exemplares_livros
CREATE UNIQUE INDEX IF NOT EXISTS idx_exemplares_codigo ON public.exemplares_livros (UPPER(TRIM(codigo_exemplar)));
CREATE INDEX IF NOT EXISTS idx_exemplares_livro_id ON public.exemplares_livros (livro_id);

-- 4. Tabela de Empréstimos (emprestimos_livros)
CREATE TABLE IF NOT EXISTS public.emprestimos_livros (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exemplar_id uuid NOT NULL REFERENCES public.exemplares_livros(id),
  aluno_id bigint NOT NULL REFERENCES public.alunos(id),
  data_retirada timestamptz DEFAULT now() NOT NULL,
  data_prevista_devolucao date NOT NULL,
  data_devolucao timestamptz NULL,
  status text DEFAULT 'ativo' NOT NULL,
  observacoes text NULL,
  operador_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_emprestimo_status CHECK (status IN ('ativo', 'devolvido'))
);

-- Índices e Garantia Única de Empréstimo Ativo por Exemplar
CREATE UNIQUE INDEX IF NOT EXISTS idx_exemplar_emprestimo_ativo 
ON public.emprestimos_livros (exemplar_id) 
WHERE status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_emprestimos_aluno_ativo 
ON public.emprestimos_livros (aluno_id) 
WHERE status = 'ativo';

-- 5. Visão Pública do Catálogo (vw_livros_catalogo)
-- Exposição estritamente limitada a: titulo, autor, prateleira, disponivel
-- Criada com o owner padrão (postgres) para que anon acesse a view sem requerer SELECT direto nas tabelas base
CREATE OR REPLACE VIEW public.vw_livros_catalogo AS
SELECT 
  l.titulo,
  l.autor,
  l.prateleira,
  (COUNT(e.id) FILTER (WHERE e.status = 'disponivel') > 0) AS disponivel
FROM public.livros l
LEFT JOIN public.exemplares_livros e ON e.livro_id = l.id
GROUP BY l.id, l.titulo, l.autor, l.prateleira;

-- Atribuir permissões SELECT na view pública para anon e authenticated
GRANT SELECT ON public.vw_livros_catalogo TO anon, authenticated;

-- 6. Habilitar RLS nas tabelas
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exemplares_livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos_livros ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS
-- livros: Acesso restrito a gestao, biblioteca e secretaria. Anon e outros papéis não acessam diretamente.
DROP POLICY IF EXISTS "livros_select" ON public.livros;
DROP POLICY IF EXISTS "livros_admin" ON public.livros;
DROP POLICY IF EXISTS "livros_admin_policy" ON public.livros;
CREATE POLICY "livros_admin_policy" ON public.livros FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'biblioteca', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'biblioteca', 'secretaria'));

-- exemplares_livros: Acesso restrito a gestao, biblioteca e secretaria. Anon e outros papéis não acessam diretamente.
DROP POLICY IF EXISTS "exemplares_select" ON public.exemplares_livros;
DROP POLICY IF EXISTS "exemplares_admin" ON public.exemplares_livros;
DROP POLICY IF EXISTS "exemplares_admin_policy" ON public.exemplares_livros;
CREATE POLICY "exemplares_admin_policy" ON public.exemplares_livros FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'biblioteca', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'biblioteca', 'secretaria'));

-- emprestimos_livros: Apenas SELECT para gestao, biblioteca e secretaria.
-- INSERT, UPDATE e DELETE direto via API são BLOQUEADOS. Operações ocorrem EXCLUSIVAMENTE pelas RPCs SECURITY DEFINER.
DROP POLICY IF EXISTS "emprestimos_admin" ON public.emprestimos_livros;
DROP POLICY IF EXISTS "emprestimos_select_admin" ON public.emprestimos_livros;
CREATE POLICY "emprestimos_select_admin" ON public.emprestimos_livros FOR SELECT TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'biblioteca', 'secretaria'));

-- 8. Função RPC: realizar_emprestimo_livro (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.realizar_emprestimo_livro(
  p_codigo_exemplar text,
  p_aluno_id bigint,
  p_data_prevista_devolucao date DEFAULT (CURRENT_DATE + INTERVAL '7 days')::date,
  p_observacoes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_exemplar_id uuid;
  v_exemplar_status text;
  v_aluno_id bigint;
  v_qtd_ativos int;
  v_emprestimo_id bigint;
  v_operador_id uuid;
BEGIN
  -- 1. Identificar e validar usuário autenticado exclusivamente via auth.uid()
  v_operador_id := auth.uid();
  IF v_operador_id IS NULL THEN
    RAISE EXCEPTION 'Usuário autenticado não identificado.';
  END IF;

  -- 2. Verificar permissão de operador no banco
  IF public.get_user_role() NOT IN ('gestao', 'biblioteca', 'secretaria') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas Gestão, Biblioteca e Secretaria podem realizar empréstimos.';
  END IF;

  -- 3. Validação rigorosa de data no backend (PostgreSQL)
  IF p_data_prevista_devolucao IS NULL THEN
    RAISE EXCEPTION 'A data prevista de devolução é obrigatória.';
  END IF;

  IF p_data_prevista_devolucao < CURRENT_DATE THEN
    RAISE EXCEPTION 'A data prevista de devolução não pode ser anterior à data atual.';
  END IF;

  -- 4. BLOQUEIO DE LINHA ESTÁVEL DO ALUNO (FOR UPDATE)
  SELECT id INTO v_aluno_id
  FROM public.alunos
  WHERE id = p_aluno_id
  FOR UPDATE;

  IF v_aluno_id IS NULL THEN
    RAISE EXCEPTION 'Aluno com ID % não foi encontrado.', p_aluno_id;
  END IF;

  -- 5. Contar empréstimos ativos para este aluno (com a linha do aluno travada)
  SELECT COUNT(*) INTO v_qtd_ativos
  FROM public.emprestimos_livros
  WHERE aluno_id = p_aluno_id AND status = 'ativo';

  IF v_qtd_ativos >= 2 THEN
    RAISE EXCEPTION 'O aluno já possui % empréstimo(s) ativo(s). Limite máximo de 2 livros atingido.', v_qtd_ativos;
  END IF;

  -- 6. BLOQUEIO DO EXEMPLAR (FOR UPDATE)
  SELECT id, status INTO v_exemplar_id, v_exemplar_status
  FROM public.exemplares_livros
  WHERE UPPER(TRIM(codigo_exemplar)) = UPPER(TRIM(p_codigo_exemplar))
  FOR UPDATE;

  IF v_exemplar_id IS NULL THEN
    RAISE EXCEPTION 'Exemplar com o código "%" não foi encontrado.', p_codigo_exemplar;
  END IF;

  IF v_exemplar_status != 'disponivel' THEN
    RAISE EXCEPTION 'Este exemplar não está disponível para empréstimo (Status atual: %).', v_exemplar_status;
  END IF;

  -- 7. Registrar Empréstimo com operador_id derivado exclusivamente da sessão (auth.uid())
  INSERT INTO public.emprestimos_livros (
    exemplar_id,
    aluno_id,
    data_retirada,
    data_prevista_devolucao,
    status,
    observacoes,
    operador_id
  ) VALUES (
    v_exemplar_id,
    p_aluno_id,
    now(),
    p_data_prevista_devolucao,
    'ativo',
    p_observacoes,
    v_operador_id
  ) RETURNING id INTO v_emprestimo_id;

  -- 8. Atualizar status do exemplar para 'emprestado'
  UPDATE public.exemplares_livros
  SET status = 'emprestado', updated_at = now()
  WHERE id = v_exemplar_id;

  RETURN jsonb_build_object(
    'success', true,
    'emprestimo_id', v_emprestimo_id,
    'mensagem', 'Empréstimo realizado com sucesso!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Função RPC: registrar_devolucao_livro (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.registrar_devolucao_livro(
  p_codigo_exemplar text,
  p_observacoes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_exemplar_id uuid;
  v_emprestimo_id bigint;
  v_operador_id uuid;
BEGIN
  -- 1. Identificar e validar usuário autenticado exclusivamente via auth.uid()
  v_operador_id := auth.uid();
  IF v_operador_id IS NULL THEN
    RAISE EXCEPTION 'Usuário autenticado não identificado.';
  END IF;

  -- 2. Verificar permissão de operador no banco
  IF public.get_user_role() NOT IN ('gestao', 'biblioteca', 'secretaria') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas Gestão, Biblioteca e Secretaria podem registrar devoluções.';
  END IF;

  -- 3. Localizar o exemplar pelo código (FOR UPDATE)
  SELECT id INTO v_exemplar_id
  FROM public.exemplares_livros
  WHERE UPPER(TRIM(codigo_exemplar)) = UPPER(TRIM(p_codigo_exemplar))
  FOR UPDATE;

  IF v_exemplar_id IS NULL THEN
    RAISE EXCEPTION 'Exemplar com o código "%" não foi encontrado.', p_codigo_exemplar;
  END IF;

  -- 4. Localizar empréstimo ativo deste exemplar (FOR UPDATE)
  SELECT id INTO v_emprestimo_id
  FROM public.emprestimos_livros
  WHERE exemplar_id = v_exemplar_id AND status = 'ativo'
  FOR UPDATE;

  IF v_emprestimo_id IS NULL THEN
    RAISE EXCEPTION 'Não existe empréstimo ativo registrado para este exemplar.';
  END IF;

  -- 5. Marcar empréstimo como devolvido
  UPDATE public.emprestimos_livros
  SET 
    status = 'devolvido',
    data_devolucao = now(),
    observacoes = COALESCE(p_observacoes, observacoes),
    updated_at = now()
  WHERE id = v_emprestimo_id;

  -- 6. Atualizar o exemplar para disponível
  UPDATE public.exemplares_livros
  SET status = 'disponivel', updated_at = now()
  WHERE id = v_exemplar_id;

  RETURN jsonb_build_object(
    'success', true,
    'emprestimo_id', v_emprestimo_id,
    'mensagem', 'Devolução registrada com sucesso!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar permissão EXECUTE de PUBLIC e anon nas RPCs
REVOKE EXECUTE ON FUNCTION public.realizar_emprestimo_livro(text, bigint, date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_devolucao_livro(text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.realizar_emprestimo_livro(text, bigint, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_devolucao_livro(text, text) TO authenticated;

-- 10. Trigger de Proteção de Status do Exemplar
CREATE OR REPLACE FUNCTION public.check_exemplar_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o exemplar possui um empréstimo ativo na tabela emprestimos_livros
  IF EXISTS (SELECT 1 FROM public.emprestimos_livros WHERE exemplar_id = NEW.id AND status = 'ativo') THEN
    -- Bloquear qualquer alteração de status, EXCETO a transição válida de 'disponivel' -> 'emprestado'
    IF NOT (OLD.status = 'disponivel' AND NEW.status = 'emprestado') THEN
      RAISE EXCEPTION 'Não é possível alterar o status de um exemplar que possui empréstimo ativo. Registre a devolução do livro primeiro.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_exemplar_status ON public.exemplares_livros;
CREATE TRIGGER trg_check_exemplar_status
  BEFORE UPDATE OF status ON public.exemplares_livros
  FOR EACH ROW EXECUTE FUNCTION public.check_exemplar_status_change();

-- 11. Triggers de Auditoria Automática
DROP TRIGGER IF EXISTS audit_livros ON public.livros;
CREATE TRIGGER audit_livros
  AFTER INSERT OR UPDATE OR DELETE ON public.livros
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_exemplares ON public.exemplares_livros;
CREATE TRIGGER audit_exemplares
  AFTER INSERT OR UPDATE OR DELETE ON public.exemplares_livros
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_emprestimos ON public.emprestimos_livros;
CREATE TRIGGER audit_emprestimos
  AFTER INSERT OR UPDATE OR DELETE ON public.emprestimos_livros
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 12. Função RPC: buscar_alunos_biblioteca (SECURITY DEFINER)
-- Retorna estritamente id, nome, turma, ra limitados a 20 registros para busca de empréstimos
CREATE OR REPLACE FUNCTION public.buscar_alunos_biblioteca(
  p_termo text
)
RETURNS TABLE (
  id bigint,
  nome text,
  turma text,
  ra text
) AS $$
DECLARE
  v_termo text;
  v_user_role text;
BEGIN
  -- 1. Controle de Autorização por Papel (gestao, biblioteca, secretaria)
  v_user_role := public.get_user_role();
  IF v_user_role IS NULL OR v_user_role NOT IN ('gestao', 'biblioteca', 'secretaria') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas Gestão, Biblioteca e Secretaria podem pesquisar alunos para empréstimo.';
  END IF;

  -- 2. Normalização do termo de busca
  v_termo := TRIM(COALESCE(p_termo, ''));

  -- 3. Retornar vazio se o termo tiver menos de 2 caracteres
  IF length(v_termo) < 2 THEN
    RETURN;
  END IF;

  -- 4. Busca parametrizada segura (Nome ou RA) limitada a 20 resultados
  RETURN QUERY
  SELECT 
    a.id,
    a.nome,
    a.turma,
    a.ra
  FROM public.alunos a
  WHERE 
    a.nome ILIKE '%' || v_termo || '%' 
    OR a.ra ILIKE '%' || v_termo || '%'
  ORDER BY a.nome ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar permissão EXECUTE de PUBLIC e anon
REVOKE EXECUTE ON FUNCTION public.buscar_alunos_biblioteca(text) FROM PUBLIC, anon;

-- Conceder EXECUTE para authenticated (a autorização definitiva por papel ocorre via get_user_role() dentro da RPC)
GRANT EXECUTE ON FUNCTION public.buscar_alunos_biblioteca(text) TO authenticated;

-- 13. Autorização de Acesso do E-mail da Biblioteca e Atualização do Trigger handle_new_user
INSERT INTO public.emails_autorizados (email)
SELECT 'bibliotecaantoniocaio@gmail.com'
WHERE NOT EXISTS (
  SELECT 1 FROM public.emails_autorizados WHERE LOWER(email) = 'bibliotecaantoniocaio@gmail.com'
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, papel, nome)
  VALUES (
    NEW.id,
    CASE 
      WHEN LOWER(NEW.email) = 'e017590a@educacao.sp.gov.br' OR LOWER(NEW.email) = 'secretariaantoniocaio@gmail.com' THEN 'secretaria'
      WHEN LOWER(NEW.email) = 'proatiantoniocaio@gmail.com' THEN 'tecnico'
      WHEN LOWER(NEW.email) = 'agenteantoniocaio@gmail.com' OR LOWER(NEW.email) = 'agenteantonniocaio@gmail.com' THEN 'agente'
      WHEN LOWER(NEW.email) = 'bibliotecaantoniocaio@gmail.com' THEN 'biblioteca'
      ELSE 'professor'
    END,
    CASE 
      WHEN LOWER(NEW.email) = 'e017590a@educacao.sp.gov.br' OR LOWER(NEW.email) = 'secretariaantoniocaio@gmail.com' THEN 'Secretaria'
      WHEN LOWER(NEW.email) = 'proatiantoniocaio@gmail.com' THEN 'Tecnico'
      WHEN LOWER(NEW.email) = 'agenteantoniocaio@gmail.com' OR LOWER(NEW.email) = 'agenteantonniocaio@gmail.com' THEN 'Agente'
      WHEN LOWER(NEW.email) = 'bibliotecaantoniocaio@gmail.com' THEN 'Biblioteca'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    papel = EXCLUDED.papel,
    nome = EXCLUDED.nome;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

