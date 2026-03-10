-- Ajuste de Política para Perfis de Usuários (Permitindo Cadastro Inicial)

-- 1. Removemos a política antiga que exigia que o usuário estivesse logado (o que falha se houver confirmação de e-mail)
DROP POLICY IF EXISTS "Inserção do próprio perfil (Cadastro)" ON perfis_usuarios;

-- 2. Criamos uma política que permite a inserção do perfil durante o cadastro.
-- Como a coluna 'id' referencia 'auth.users(id)', o Supabase já garante que o ID deve existir na tabela de autenticação.
-- Deixamos sem o CHECK de auth.uid() para permitir que o perfil seja criado mesmo antes da confirmação do e-mail (onde o usuário ainda não tem sessão ativa).
CREATE POLICY "Inserção de Perfil no Cadastro" ON perfis_usuarios FOR INSERT WITH CHECK (true);
