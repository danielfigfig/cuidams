-- Corrige a restrição de exclusão na tabela de logs LGPD
-- Permite que o usuário seja excluído mesmo se houver logs de aceite pendentes.

-- 1. Descobrir o nome da constraint de chave estrangeira (geralmente logs_aceite_termos_usuario_id_fkey)
-- 2. Recriar com ON DELETE CASCADE

DO $$ 
BEGIN
    -- Remove a constraint antiga se ela existir
    ALTER TABLE logs_aceite_termos DROP CONSTRAINT IF EXISTS logs_aceite_termos_usuario_id_fkey;
    
    -- Adiciona a nova com CASCADE
    ALTER TABLE logs_aceite_termos 
    ADD CONSTRAINT logs_aceite_termos_usuario_id_fkey 
    FOREIGN KEY (usuario_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
END $$;
