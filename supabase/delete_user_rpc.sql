-- Criação da função RPC para deletar usuários completamente (Auth + Perfis) por um Administrador
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID, admin_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verifica se o usuário que está chamando a função é um Administrador (Nível 'A')
  IF EXISTS (
    SELECT 1 FROM perfis_usuarios 
    WHERE id = admin_user_id AND nivel_acesso = 'A'
  ) THEN
    -- 2. Deleta explicitamente do perfil PRIMEIRO (Garantia contra falta de CASCADE)
    DELETE FROM perfis_usuarios WHERE id = target_user_id;
    
    -- 3. Deleta da tabela auth.users.
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Acesso Negado. Apenas administradores podem excluir usuários completamente.';
  END IF;
END;
$$;
