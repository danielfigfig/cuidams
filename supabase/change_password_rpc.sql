-- Função RPC para que Administradores (Nível A) possam definir a senha de qualquer usuário
-- Execute este script no SQL Editor do Supabase

-- Remove versões anteriores para evitar conflitos
DROP FUNCTION IF EXISTS change_user_password_by_admin(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS change_user_password_by_admin(UUID, UUID, TEXT);

-- Cria a função com parâmetros em TEXT para maior compatibilidade
CREATE OR REPLACE FUNCTION change_user_password_by_admin(
  target_user_id_text TEXT,
  admin_user_id_text TEXT,
  new_password TEXT
)
RETURNS JSON
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

  -- Verifica se quem está chamando é um Administrador (Nível 'A')
  IF NOT EXISTS (
    SELECT 1 FROM perfis_usuarios
    WHERE id = admin_id AND nivel_acesso = 'A'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Acesso negado. Apenas administradores podem alterar senhas.');
  END IF;

  -- Verifica se a nova senha tem pelo menos 6 caracteres
  IF length(new_password) < 6 THEN
    RETURN json_build_object('success', false, 'message', 'A senha deve ter pelo menos 6 caracteres.');
  END IF;

  -- Atualiza a senha do usuário na tabela auth.users
  UPDATE auth.users
  SET
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado no sistema de autenticação.');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Senha alterada com sucesso!');
END;
$$;
