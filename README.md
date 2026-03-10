# 🏥 CuidaSM - Sistema de Gestão de Cadastros e Questionários

Este é o sistema oficial de gestão de moradores e aplicação de questionários **CuidaSM**, desenvolvido para a **SESAU - Secretaria Municipal de Saúde de Aquidauana**.

O sistema foi projetado para facilitar a triagem e o acompanhamento de cidadãos, permitindo que profissionais de diferentes níveis (Coordenadores, Médicos/Enfermeiros e ACS) gerenciem dados e histórico de avaliações de forma segura e eficiente.

---

## 🚀 Funcionalidades Principais

### 👥 Gestão de Cidadãos
- **Cadastro Completo**: Registro de cidadãos com geração automática de códigos, validação de CPF e vinculação obrigatória a Equipes e Microáreas.
- **Busca Inteligente**: Pesquisa rápida por nome ou CPF com filtros automáticos baseados no nível de acesso do usuário.
- **Histórico Individual**: Visualização de todos os questionários preenchidos anteriormente, com data, pontuação e profissional responsável.

### 📝 Questionário CuidaSM
- **Bloco 1 (Dimensões Autorreferidas)**: 17 perguntas sobre autonomia e bem-estar.
- **Bloco 2 (Dimensões Avaliadas)**: 14 perguntas técnicas para avaliação profissional.
- **Cálculo de Score**: Pontuação automática baseada nas respostas, integrada ao registro do cidadão.
- **Acesso Rápido**: Aba dedicada para aplicação de questionários buscando o cidadão pelo nome ou CPF no momento do atendimento.

### 🔐 Segurança e Acessos (Níveis)
O sistema utiliza **Row Level Security (RLS)** no banco de dados para garantir a privacidade dos dados:
- **Nível A (Admin/Master)**: Gestão total de usuários (promoção de perfis), cidadãos e questionários de todas as equipes.
- **Nível B (Coordenador)**: Acesso de leitura total a todos os dados do sistema.
- **Nível C (Outro Profissional)**: Gestão de cidadãos e questionários restritos à sua própria equipe.
- **Nível D (ACS)**: Cadastro de cidadãos restrito à sua equipe e microárea.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + Vite + TailwindCSS (Interface moderna, rápida e responsiva).
- **Backend / Banco de Dados**: Supabase (PostgreSQL com políticas de RLS).
- **Autenticação**: Supabase Auth (Login seguro com recuperação de senha via email).
- **Hospedagem**: Vercel (Deploy automático via GitHub).

---

## 📂 Estrutura do Projeto

- `/src/pages`: Telas principais do sistema (Dashboard, Login, Questionários, etc).
- `/src/components`: Componentes reutilizáveis (Layout, Sidebar, Botões).
- `/src/lib`: Funções utilitárias (Validadores de CPF, máscaras, conexão Supabase).
- `/supabase`: Scripts SQL para criação de tabelas e políticas de segurança.

---

## 💻 Como continuar o desenvolvimento (Em outro PC)

1. **Repositório**: O código está seguro em `https://github.com/danielfigfig/cuidams`.
2. **Setup**:
   ```bash
   git clone https://github.com/danielfigfig/cuidams.git
   cd cuidams
   npm install
   ```
3. **Variáveis de Ambiente**: Crie um arquivo `.env` na raiz com as chaves do seu Supabase (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
4. **Execução**: `npm run dev` para rodar localmente.

---

## 📞 Suporte e Contato
Desenvolvido em parceria com a **Coordenação de Saúde Digital da SESAU**.
WhatsApp de Suporte: (67) 99217-8731

*Documentação gerada automaticamente para o projeto CuidaSM em 10 de Março de 2026.*
