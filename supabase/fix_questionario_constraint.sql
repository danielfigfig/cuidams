ALTER TABLE questionarios_cuida_sm ALTER COLUMN usuario_id DROP NOT NULL;

-- Proativo: Também removemos o NOT NULL da tabela de logs se ela existir
-- para evitar problemas similares no futuro se houver registros nela.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'logs_aceite_termos' AND column_name = 'usuario_id') THEN
        ALTER TABLE logs_aceite_termos ALTER COLUMN usuario_id DROP NOT NULL;
    END IF;
END $$;
