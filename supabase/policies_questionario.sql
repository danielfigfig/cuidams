-- Políticas para Questionários CuidaSM

-- DROP das políticas caso elas já existam (Para evitar erros na re-execução)
DROP POLICY IF EXISTS "Leitura Todos Questionários (A, B)" ON questionarios_cuida_sm;
DROP POLICY IF EXISTS "Leitura Equipe Questionários (C, D)" ON questionarios_cuida_sm;
DROP POLICY IF EXISTS "Inserir Questionário Nível A" ON questionarios_cuida_sm;
DROP POLICY IF EXISTS "Inserir Questionário Nível C e D" ON questionarios_cuida_sm;

-- Leitura: A e B podem ver todos os questionários
CREATE POLICY "Leitura Todos Questionários (A, B)" ON questionarios_cuida_sm FOR SELECT USING (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso IN ('A', 'B'))
);

-- Leitura: C e D podem ver questionários restritos aos cidadãos da sua própria equipe
CREATE POLICY "Leitura Equipe Questionários (C, D)" ON questionarios_cuida_sm FOR SELECT USING (
  EXISTS(
    SELECT 1 FROM cidadaos c
    JOIN perfis_usuarios p ON p.equipe_id = c.equipe_id
    WHERE c.id = questionarios_cuida_sm.cidadao_id AND p.id = auth.uid() AND p.nivel_acesso IN ('C', 'D')
  )
);

-- Inserção: A pode inserir questionário para qualquer cidadão
CREATE POLICY "Inserir Questionário Nível A" ON questionarios_cuida_sm FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso = 'A')
);

-- Inserção: C e D podem inserir questionários apenas para cidadãos que pertencem à sua equipe
CREATE POLICY "Inserir Questionário Nível C e D" ON questionarios_cuida_sm FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso IN ('C', 'D')) AND
  EXISTS(
    SELECT 1 FROM cidadaos c
    JOIN perfis_usuarios p ON p.equipe_id = c.equipe_id
    WHERE c.id = questionarios_cuida_sm.cidadao_id AND p.id = auth.uid()
  )
);
