-- 1. Remove qualquer versão anterior da função para evitar conflitos de "overload"
DROP FUNCTION IF EXISTS delete_user_by_admin(UUID);
DROP FUNCTION IF EXISTS delete_user_by_admin(UUID, UUID);
DROP FUNCTION IF EXISTS delete_user_by_admin(TEXT, TEXT);

-- 2. Cria a nova função usando TEXT para os parâmetros (evita erros de type-casting no cache)
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id_text TEXT, admin_user_id_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  admin_id UUID;
BEGIN
  -- Converte os textos para UUID
  target_id := target_user_id_text::UUID;
  admin_id := admin_user_id_text::UUID;

  -- 1. Verifica se o usuário que está chamando a função é um Administrador (Nível 'A')
  IF EXISTS (
    SELECT 1 FROM perfis_usuarios 
    WHERE id = admin_id AND nivel_acesso = 'A'
  ) THEN
    -- 2. Deleta explicitamente do perfil (Garantia contra falta de CASCADE)
    DELETE FROM perfis_usuarios WHERE id = target_id;
    
    -- 3. Deleta da tabela auth.users.
    DELETE FROM auth.users WHERE id = target_id;
  ELSE
    RAISE EXCEPTION 'Acesso Negado. Apenas administradores podem excluir usuários.';
  END IF;
END;
$$;
