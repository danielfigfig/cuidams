import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import RecuperarSenha from './pages/RecuperarSenha';
import ResetSenha from './pages/ResetSenha';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Cidadaos from './pages/Cidadaos';
import CidadaoForm from './pages/CidadaoForm';
import Questionario from './pages/Questionario';
import HistoricoQuestionario from './pages/HistoricoQuestionario';
import RelatorioProdutividade from './pages/RelatorioProdutividade';
import RelatorioEstratificados from './pages/RelatorioEstratificados';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/reset-senha" element={<ResetSenha />} />

          {/* Rotas Privadas Wrapper */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/questionario" element={<Questionario />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/cidadaos" element={<Cidadaos />} />
            <Route path="/cidadaos/novo" element={<CidadaoForm />} />
            <Route path="/cidadaos/:id/questionario" element={<Questionario />} />
            <Route path="/cidadaos/:id/historico" element={<HistoricoQuestionario />} />
            <Route path="/relatorios" element={<Navigate to="/relatorios/produtividade" replace />} />
            <Route path="/relatorios/produtividade" element={<RelatorioProdutividade />} />
            <Route path="/relatorios/estratificados" element={<RelatorioEstratificados />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
