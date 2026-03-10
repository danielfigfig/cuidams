-- Ajuste de Política para Equipes (Permitindo leitura no Cadastro Público)

-- 1. Removemos a política restritiva antiga
DROP POLICY IF EXISTS "Leitura pública para todas as equipes logadas" ON equipes;

-- 2. Criamos uma nova política que permite leitura para QUALQUER UM (mesmo não logado)
-- Isso é necessário para que o dropdown de "Equipes" funcione na tela de Cadastro
CREATE POLICY "Leitura pública de equipes" ON equipes FOR SELECT USING (true);
