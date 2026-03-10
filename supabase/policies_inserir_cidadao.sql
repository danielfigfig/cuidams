-- Atualização de Políticas (RLS) para Cidadãos (Liberando inserção Nível C)

-- 1. Removemos as políticas antigas de Inserir Cidadão (se existirem)
DROP POLICY IF EXISTS "Inserir Cidadão Nível D" ON cidadaos;
DROP POLICY IF EXISTS "Inserir Cidadão Nível C e D" ON cidadaos;

-- 2. Recriamos a política unificando C e D (ambos restritos à equipe logada)
-- Usamos cidadaos.equipe_id explicitamente para evitar ambiguidade com a subquery
CREATE POLICY "Inserir Cidadão Nível C e D" ON cidadaos FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso IN ('C', 'D')) AND
  cidadaos.equipe_id = (SELECT equipe_id FROM perfis_usuarios WHERE id = auth.uid())
);
