-- Migration: 20260813000000_optimize_buscar_prateleiras.sql
-- Otimização da busca de prateleiras da biblioteca (Item 8.2)

-- 1. Função RPC pública leve: buscar_prateleiras_biblioteca (SECURITY DEFINER)
-- Retorna exclusivamente prateleiras únicas, ordenadas alfabeticamente,
-- sem expor qualquer dado pessoal, id de aluno, exemplar ou empréstimo.
CREATE OR REPLACE FUNCTION public.buscar_prateleiras_biblioteca()
RETURNS TABLE (prateleira text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT l.prateleira
  FROM public.livros l
  WHERE l.prateleira IS NOT NULL AND TRIM(l.prateleira) <> ''
  ORDER BY l.prateleira ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar permissão EXECUTE de PUBLIC
REVOKE EXECUTE ON FUNCTION public.buscar_prateleiras_biblioteca() FROM PUBLIC;

-- Conceder permissão EXECUTE para leitores públicos e autenticados
GRANT EXECUTE ON FUNCTION public.buscar_prateleiras_biblioteca() TO anon, authenticated;

-- 2. Manter alias buscar_prateleiras_catalogo para compatibilidade retroativa
CREATE OR REPLACE FUNCTION public.buscar_prateleiras_catalogo()
RETURNS TABLE (prateleira text) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.buscar_prateleiras_biblioteca();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.buscar_prateleiras_catalogo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_prateleiras_catalogo() TO anon, authenticated;
