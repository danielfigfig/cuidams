-- Criação da função RPC para deletar usuários completamente (Auth + Perfis) por um Administrador
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Verifica se o usuário que está chamando a função é um Administrador (Nível 'A')
  IF EXISTS (
    SELECT 1 FROM public.perfis_usuarios 
    WHERE id = auth.uid() AND nivel_acesso = 'A'
  ) THEN
    -- 2. Deleta o usuário da tabela auth.users. 
    -- Como a tabela perfis_usuarios possui "REFERENCES auth.users(id) ON DELETE CASCADE", 
    -- isso vai deletar automaticamente da tabela perfis_usuarios também!
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Acesso Negado. Apenas administradores podem excluir usuários completamente.';
  END IF;
END;
$$;
