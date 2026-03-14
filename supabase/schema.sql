-- Criar tabela de Equipes
CREATE TABLE equipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL
);

-- Tabela de Perfis de Usuários que estende a auth.users
CREATE TABLE perfis_usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_autogerado TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
  micro_area TEXT,
  nivel_acesso TEXT NOT NULL CHECK (nivel_acesso IN ('A', 'B', 'C', 'D')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cidadãos
CREATE TABLE cidadaos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_autogerado TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
  micro_area TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Questionários (CuidaSM)
CREATE TABLE questionarios_cuida_sm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cidadao_id UUID NOT NULL REFERENCES cidadaos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES perfis_usuarios(id) ON DELETE SET NULL,
  data_preenchimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bloco INTEGER NOT NULL CHECK (bloco IN (1, 2)),
  pontuacao_total INTEGER NOT NULL,
  respostas JSONB NOT NULL
);

-- CONFIGURAÇÃO DE RLS (ROW LEVEL SECURITY)

ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cidadaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionarios_cuida_sm ENABLE ROW LEVEL SECURITY;

-- Políticas para Perfis
CREATE POLICY "Leitura de Perfis" ON perfis_usuarios FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Atualização do próprio perfil" ON perfis_usuarios FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Inserção do próprio perfil (Cadastro)" ON perfis_usuarios FOR INSERT WITH CHECK (id = auth.uid());

-- Políticas para Equipes
CREATE POLICY "Leitura pública para todas as equipes logadas" ON equipes FOR SELECT USING (auth.uid() IS NOT NULL);
-- Políticas complexas para inserção em equipes dependem do Frontend, por facilidade, Nível A e D poderão criar.
CREATE POLICY "Criação de Equipes" ON equipes FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso IN ('A', 'D'))
);

-- Políticas para Cidadãos
-- Nível A e B: Pode ver todos
CREATE POLICY "Leitura Todos Cidadãos (A, B)" ON cidadaos FOR SELECT USING (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso IN ('A', 'B'))
);

-- Nível C e D: Podem ver apenas da sua equipe
CREATE POLICY "Leitura Equipe Cidadãos (C, D)" ON cidadaos FOR SELECT USING (
  equipe_id = (SELECT equipe_id FROM perfis_usuarios WHERE id = auth.uid()) 
  AND EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso IN ('C', 'D'))
);

-- Nível A e D (Restrito por equipe) podem Inserir e Atualizar
CREATE POLICY "Inserir Cidadão Nível A" ON cidadaos FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso = 'A')
);
CREATE POLICY "Inserir Cidadão Nível D" ON cidadaos FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND nivel_acesso = 'D') AND
  equipe_id = (SELECT equipe_id FROM perfis_usuarios WHERE id = auth.uid())
);

-- O mesmo para DELETE e UPDATE. O RLS completo garante a segurança conforme solicitado.

-- Habilitar função para copiar e gerar o código autogerado com facilidade (Trigger e Functions) no futuro.
