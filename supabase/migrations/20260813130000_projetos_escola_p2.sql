-- Migration: 20260813130000_projetos_escola_p2.sql
-- Módulo Projetos da Escola - Sprint P2 (Administração, RLS Completo, Auditoria e RPC)

-- 1. Atualizar Políticas de Segurança (RLS) para public.projetos
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projetos_select_policy" ON public.projetos;
CREATE POLICY "projetos_select_policy" ON public.projetos FOR SELECT TO authenticated
  USING (
    ativo = true 
    OR public.get_user_role() IN ('gestao', 'secretaria')
  );

DROP POLICY IF EXISTS "projetos_insert_policy" ON public.projetos;
CREATE POLICY "projetos_insert_policy" ON public.projetos FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_update_policy" ON public.projetos;
CREATE POLICY "projetos_update_policy" ON public.projetos FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_delete_policy" ON public.projetos;
CREATE POLICY "projetos_delete_policy" ON public.projetos FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'));

-- 2. Atualizar Políticas de Segurança (RLS) para public.projetos_alunos
ALTER TABLE public.projetos_alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projetos_alunos_select_policy" ON public.projetos_alunos;
CREATE POLICY "projetos_alunos_select_policy" ON public.projetos_alunos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = projetos_alunos.projeto_id
        AND (p.ativo = true OR public.get_user_role() IN ('gestao', 'secretaria'))
    )
  );

DROP POLICY IF EXISTS "projetos_alunos_insert_policy" ON public.projetos_alunos;
CREATE POLICY "projetos_alunos_insert_policy" ON public.projetos_alunos FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_alunos_update_policy" ON public.projetos_alunos;
CREATE POLICY "projetos_alunos_update_policy" ON public.projetos_alunos FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_alunos_delete_policy" ON public.projetos_alunos;
CREATE POLICY "projetos_alunos_delete_policy" ON public.projetos_alunos FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'));

-- 3. Atualizar Políticas de Segurança (RLS) para public.projetos_responsaveis
ALTER TABLE public.projetos_responsaveis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projetos_responsaveis_select_policy" ON public.projetos_responsaveis;
CREATE POLICY "projetos_responsaveis_select_policy" ON public.projetos_responsaveis FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = projetos_responsaveis.projeto_id
        AND (p.ativo = true OR public.get_user_role() IN ('gestao', 'secretaria'))
    )
  );

DROP POLICY IF EXISTS "projetos_responsaveis_insert_policy" ON public.projetos_responsaveis;
CREATE POLICY "projetos_responsaveis_insert_policy" ON public.projetos_responsaveis FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_responsaveis_update_policy" ON public.projetos_responsaveis;
CREATE POLICY "projetos_responsaveis_update_policy" ON public.projetos_responsaveis FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_responsaveis_delete_policy" ON public.projetos_responsaveis;
CREATE POLICY "projetos_responsaveis_delete_policy" ON public.projetos_responsaveis FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'));

-- 4. Atualizar Políticas de Segurança (RLS) para public.projetos_horarios
ALTER TABLE public.projetos_horarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projetos_horarios_select_policy" ON public.projetos_horarios;
CREATE POLICY "projetos_horarios_select_policy" ON public.projetos_horarios FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos p
      WHERE p.id = projetos_horarios.projeto_id
        AND (p.ativo = true OR public.get_user_role() IN ('gestao', 'secretaria'))
    )
  );

DROP POLICY IF EXISTS "projetos_horarios_insert_policy" ON public.projetos_horarios;
CREATE POLICY "projetos_horarios_insert_policy" ON public.projetos_horarios FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_horarios_update_policy" ON public.projetos_horarios;
CREATE POLICY "projetos_horarios_update_policy" ON public.projetos_horarios FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

DROP POLICY IF EXISTS "projetos_horarios_delete_policy" ON public.projetos_horarios;
CREATE POLICY "projetos_horarios_delete_policy" ON public.projetos_horarios FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('gestao', 'secretaria'));

-- 5. Conceder Permissões CRUD aos Usuários Autenticados (Regidos por RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos, public.projetos_alunos, public.projetos_responsaveis, public.projetos_horarios TO authenticated;
REVOKE ALL ON public.projetos, public.projetos_alunos, public.projetos_responsaveis, public.projetos_horarios FROM anon, public;

-- 6. Função RPC de Busca de Alunos para Projetos (SECURITY DEFINER)
-- Retorna id, nome, turma, ra limitados a 20 registros para adição de participantes por Gestão/Secretaria
CREATE OR REPLACE FUNCTION public.buscar_alunos_projetos(
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
  v_user_role := public.get_user_role();
  IF v_user_role IS NULL OR v_user_role NOT IN ('gestao', 'secretaria') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas Gestão e Secretaria podem pesquisar alunos para projetos.';
  END IF;

  v_termo := TRIM(COALESCE(p_termo, ''));

  IF length(v_termo) < 2 THEN
    RETURN;
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.buscar_alunos_projetos(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_alunos_projetos(text) TO authenticated;

-- 7. Triggers de Auditoria Integrados à Infraestrutura Existente (public.process_audit_log)
DROP TRIGGER IF EXISTS audit_projetos ON public.projetos;
CREATE TRIGGER audit_projetos
  AFTER INSERT OR UPDATE OR DELETE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_projetos_alunos ON public.projetos_alunos;
CREATE TRIGGER audit_projetos_alunos
  AFTER INSERT OR UPDATE OR DELETE ON public.projetos_alunos
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_projetos_responsaveis ON public.projetos_responsaveis;
CREATE TRIGGER audit_projetos_responsaveis
  AFTER INSERT OR UPDATE OR DELETE ON public.projetos_responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_projetos_horarios ON public.projetos_horarios;
CREATE TRIGGER audit_projetos_horarios
  AFTER INSERT OR UPDATE OR DELETE ON public.projetos_horarios
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
