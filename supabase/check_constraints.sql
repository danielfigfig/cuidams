-- Função auxiliar para inspecionar restrições que podem causar erro na exclusão
-- Cria uma função que retorna colunas NOT NULL que possuem FKs com ON DELETE SET NULL

CREATE OR REPLACE FUNCTION check_potential_deletion_errors()
RETURNS TABLE (
    tabela TEXT,
    coluna TEXT,
    is_nullable TEXT,
    delete_rule TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_name::TEXT as tabela, 
        kcu.column_name::TEXT as coluna, 
        cols.is_nullable::TEXT,
        rc.delete_rule::TEXT
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.columns AS cols
          ON tc.table_name = cols.table_name
          AND kcu.column_name = cols.column_name
    WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND rc.delete_rule = 'SET NULL'
        AND cols.is_nullable = 'NO'
        AND tc.table_schema = 'public';
END;
$$;
