-- Migration: 20260813100000_decouple_handle_new_user.sql
-- Desacoplamento da função global de trigger handle_new_user() (Item 8.3)

-- Redefinir a função public.handle_new_user() para ser genérica, limpa e desacoplada.
-- Ela insere o perfil básico para novos usuários cadastrados em auth.users apenas se o perfil não existir.
-- A tabela public.perfis permanece como a Fonte Única da Verdade (SSOT) para os papéis (gestao, biblioteca, secretaria, tecnico, agente, professor).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, papel, nome)
  VALUES (
    NEW.id,
    'professor',
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
