-- 1. Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users(id),
  usuario_email text,
  tabela text NOT NULL,
  operacao text NOT NULL,
  registro_id text NOT NULL,
  valores_antigos jsonb,
  valores_novos jsonb,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Habilitar RLS na tabela de auditoria
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 3. Criar funções helper SECURITY DEFINER para evitar recursão de políticas
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT papel FROM public.perfis WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_name()
RETURNS text AS $$
  SELECT nome FROM public.perfis WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 4. Criar políticas para logs_auditoria (apenas usuários de gestão podem ler, ninguém altera via API)
DROP POLICY IF EXISTS "Permitir leitura apenas para gestao" ON public.logs_auditoria;
CREATE POLICY "Permitir leitura apenas para gestao" ON public.logs_auditoria
  FOR SELECT TO authenticated USING (public.get_user_role() = 'gestao');

-- 5. Função de Trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_registro_id text;
  v_valores_antigos jsonb := NULL;
  v_valores_novos jsonb := NULL;
BEGIN
  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  IF (TG_OP = 'DELETE') THEN
    v_registro_id := CAST(OLD.id AS text);
    v_valores_antigos := to_jsonb(OLD);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_registro_id := CAST(NEW.id AS text);
    v_valores_antigos := to_jsonb(OLD);
    v_valores_novos := to_jsonb(NEW);
  ELSIF (TG_OP = 'INSERT') THEN
    v_registro_id := CAST(NEW.id AS text);
    v_valores_novos := to_jsonb(NEW);
  END IF;

  INSERT INTO public.logs_auditoria (usuario_id, usuario_email, tabela, operacao, registro_id, valores_antigos, valores_novos)
  VALUES (v_user_id, v_user_email, TG_TABLE_NAME, TG_OP, v_registro_id, v_valores_antigos, v_valores_novos);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Habilitar RLS em todas as tabelas públicas (19 tabelas)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tiposEvento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tiposEvidencia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos_salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_ajuda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boas_praticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de segurança para cada tabela
-- Tabela: perfis
DROP POLICY IF EXISTS "perfis_read_all" ON public.perfis;
CREATE POLICY "perfis_read_all" ON public.perfis FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "perfis_insert_own" ON public.perfis;
CREATE POLICY "perfis_insert_own" ON public.perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "perfis_update_own" ON public.perfis;
CREATE POLICY "perfis_update_own" ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "perfis_delete_own" ON public.perfis;
CREATE POLICY "perfis_delete_own" ON public.perfis FOR DELETE TO authenticated USING (auth.uid() = id);

-- Tabelas de Configuração (Leitura Geral, Escrita por Gestão/Secretaria)
-- professores, gestores, secretarias, tecnicos, turmas, alunos, tiposEvento, tiposEvidencia, disciplinas
-- Primeiro, corrigir disciplinas
DROP POLICY IF EXISTS "Permitir modificação apenas para gestão" ON public.disciplinas;
CREATE POLICY "Permitir modificação apenas para gestão" ON public.disciplinas FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- professores
DROP POLICY IF EXISTS "professores_select" ON public.professores;
CREATE POLICY "professores_select" ON public.professores FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "professores_all" ON public.professores;
CREATE POLICY "professores_all" ON public.professores FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- gestores
DROP POLICY IF EXISTS "gestores_select" ON public.gestores;
CREATE POLICY "gestores_select" ON public.gestores FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "gestores_all" ON public.gestores;
CREATE POLICY "gestores_all" ON public.gestores FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- secretarias
DROP POLICY IF EXISTS "secretarias_select" ON public.secretarias;
CREATE POLICY "secretarias_select" ON public.secretarias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "secretarias_all" ON public.secretarias;
CREATE POLICY "secretarias_all" ON public.secretarias FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- tecnicos
DROP POLICY IF EXISTS "tecnicos_select" ON public.tecnicos;
CREATE POLICY "tecnicos_select" ON public.tecnicos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tecnicos_all" ON public.tecnicos;
CREATE POLICY "tecnicos_all" ON public.tecnicos FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- turmas
DROP POLICY IF EXISTS "turmas_select" ON public.turmas;
CREATE POLICY "turmas_select" ON public.turmas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "turmas_all" ON public.turmas;
CREATE POLICY "turmas_all" ON public.turmas FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- alunos
DROP POLICY IF EXISTS "alunos_select" ON public.alunos;
CREATE POLICY "alunos_select" ON public.alunos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "alunos_all" ON public.alunos;
CREATE POLICY "alunos_all" ON public.alunos FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- tiposEvento
DROP POLICY IF EXISTS "tiposEvento_select" ON public."tiposEvento";
CREATE POLICY "tiposEvento_select" ON public."tiposEvento" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tiposEvento_all" ON public."tiposEvento";
CREATE POLICY "tiposEvento_all" ON public."tiposEvento" FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- tiposEvidencia
DROP POLICY IF EXISTS "tiposEvidencia_select" ON public."tiposEvidencia";
CREATE POLICY "tiposEvidencia_select" ON public."tiposEvidencia" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tiposEvidencia_all" ON public."tiposEvidencia";
CREATE POLICY "tiposEvidencia_all" ON public."tiposEvidencia" FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- Equipamentos e Salas (Leitura Geral, Escrita por Gestão/Técnicos)
-- salas
DROP POLICY IF EXISTS "salas_select" ON public.salas;
CREATE POLICY "salas_select" ON public.salas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "salas_all" ON public.salas;
CREATE POLICY "salas_all" ON public.salas FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'tecnico'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'tecnico'));

-- dispositivos
DROP POLICY IF EXISTS "dispositivos_select" ON public.dispositivos;
CREATE POLICY "dispositivos_select" ON public.dispositivos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "dispositivos_all" ON public.dispositivos;
CREATE POLICY "dispositivos_all" ON public.dispositivos FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'tecnico'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'tecnico'));

-- agendamentos_salas
DROP POLICY IF EXISTS "agendamentos_salas_select" ON public.agendamentos_salas;
CREATE POLICY "agendamentos_salas_select" ON public.agendamentos_salas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "agendamentos_salas_all" ON public.agendamentos_salas;
CREATE POLICY "agendamentos_salas_all" ON public.agendamentos_salas FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'tecnico'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'tecnico'));

-- solicitacoes_ajuda (Leitura geral, inserção por qualquer autenticado, modificação por Gestão/Técnicos/Criador)
DROP POLICY IF EXISTS "solicitacoes_ajuda_select" ON public.solicitacoes_ajuda;
CREATE POLICY "solicitacoes_ajuda_select" ON public.solicitacoes_ajuda FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "solicitacoes_ajuda_insert" ON public.solicitacoes_ajuda;
CREATE POLICY "solicitacoes_ajuda_insert" ON public.solicitacoes_ajuda FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "solicitacoes_ajuda_update" ON public.solicitacoes_ajuda;
CREATE POLICY "solicitacoes_ajuda_update" ON public.solicitacoes_ajuda FOR UPDATE TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'tecnico') OR public.get_user_name() = professor)
  WITH CHECK (public.get_user_role() IN ('gestao', 'tecnico') OR public.get_user_name() = professor);
DROP POLICY IF EXISTS "solicitacoes_ajuda_delete" ON public.solicitacoes_ajuda;
CREATE POLICY "solicitacoes_ajuda_delete" ON public.solicitacoes_ajuda FOR DELETE TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'tecnico'));

-- ocorrencias (Leitura geral, inserção por qualquer autenticado, modificação por Gestão/Criador)
DROP POLICY IF EXISTS "ocorrencias_select" ON public.ocorrencias;
CREATE POLICY "ocorrencias_select" ON public.ocorrencias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ocorrencias_insert" ON public.ocorrencias;
CREATE POLICY "ocorrencias_insert" ON public.ocorrencias FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ocorrencias_update_delete" ON public.ocorrencias;
CREATE POLICY "ocorrencias_update_delete" ON public.ocorrencias FOR ALL TO authenticated 
  USING (public.get_user_role() = 'gestao' OR public.get_user_name() = professor)
  WITH CHECK (public.get_user_role() = 'gestao' OR public.get_user_name() = professor);

-- registros (Evidências de eventos - Leitura geral, inserção por qualquer autenticado, modificação por Gestão/Criador)
DROP POLICY IF EXISTS "registros_select" ON public.registros;
CREATE POLICY "registros_select" ON public.registros FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "registros_insert" ON public.registros;
CREATE POLICY "registros_insert" ON public.registros FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "registros_update_delete" ON public.registros;
CREATE POLICY "registros_update_delete" ON public.registros FOR ALL TO authenticated 
  USING (public.get_user_role() = 'gestao' OR public.get_user_name() = teacher)
  WITH CHECK (public.get_user_role() = 'gestao' OR public.get_user_name() = teacher);

-- eventos (Leitura geral, escrita apenas por Gestão)
DROP POLICY IF EXISTS "eventos_select" ON public.eventos;
CREATE POLICY "eventos_select" ON public.eventos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "eventos_all" ON public.eventos;
CREATE POLICY "eventos_all" ON public.eventos FOR ALL TO authenticated 
  USING (public.get_user_role() = 'gestao')
  WITH CHECK (public.get_user_role() = 'gestao');

-- boas_praticas (Leitura geral, inserção por qualquer autenticado, modificação por Gestão/Criador)
DROP POLICY IF EXISTS "boas_praticas_select" ON public.boas_praticas;
CREATE POLICY "boas_praticas_select" ON public.boas_praticas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "boas_praticas_insert" ON public.boas_praticas;
CREATE POLICY "boas_praticas_insert" ON public.boas_praticas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "boas_praticas_update_delete" ON public.boas_praticas;
CREATE POLICY "boas_praticas_update_delete" ON public.boas_praticas FOR ALL TO authenticated 
  USING (public.get_user_role() = 'gestao' OR public.get_user_name() = professor)
  WITH CHECK (public.get_user_role() = 'gestao' OR public.get_user_name() = professor);

-- notificacoes_documentos (Leitura geral, escrita apenas por Gestão/Secretaria)
DROP POLICY IF EXISTS "notificacoes_documentos_select" ON public.notificacoes_documentos;
CREATE POLICY "notificacoes_documentos_select" ON public.notificacoes_documentos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "notificacoes_documentos_all" ON public.notificacoes_documentos;
CREATE POLICY "notificacoes_documentos_all" ON public.notificacoes_documentos FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('gestao', 'secretaria'))
  WITH CHECK (public.get_user_role() IN ('gestao', 'secretaria'));

-- attendance (Não utilizada ativamente no frontend, mas protegida - apenas Gestão acessa)
DROP POLICY IF EXISTS "attendance_all" ON public.attendance;
CREATE POLICY "attendance_all" ON public.attendance FOR ALL TO authenticated 
  USING (public.get_user_role() = 'gestao')
  WITH CHECK (public.get_user_role() = 'gestao');

-- 8. Adicionar triggers de auditoria automática nas tabelas críticas
DROP TRIGGER IF EXISTS audit_ocorrencias ON public.ocorrencias;
CREATE TRIGGER audit_ocorrencias
  AFTER INSERT OR UPDATE OR DELETE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_registros ON public.registros;
CREATE TRIGGER audit_registros
  AFTER INSERT OR UPDATE OR DELETE ON public.registros
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_turmas ON public.turmas;
CREATE TRIGGER audit_turmas
  AFTER INSERT OR UPDATE OR DELETE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_alunos ON public.alunos;
CREATE TRIGGER audit_alunos
  AFTER INSERT OR UPDATE OR DELETE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_notificacoes_documentos ON public.notificacoes_documentos;
CREATE TRIGGER audit_notificacoes_documentos
  AFTER INSERT OR UPDATE OR DELETE ON public.notificacoes_documentos
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
