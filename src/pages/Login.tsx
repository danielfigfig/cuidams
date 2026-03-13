import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { HeartPulse, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8 px-4">
          <img 
            src="/logo.png" 
            alt="SESAU Aquidauana" 
            className="w-full h-auto max-h-24 object-contain drop-shadow-sm" 
          />
        </div>
        <div className="flex justify-center">
          <HeartPulse className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-gray-900">
          Acesse o CuidaSM
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Plataforma de Gestão de Cadastros e Avaliações
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100 sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                Usuário ou senha inválidos.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Novo por aqui?</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link to="/recuperar-senha" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                Esqueci minha senha
              </Link>
              <Link to="/cadastro" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                Criar uma conta
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 pt-4">
          <p className="font-semibold text-gray-700">Responsável pelo Sistema</p>
          <p className="mt-1">Daniel Figueiredo Marmol</p>
          <p className="text-xs">Coordenador da Saúde Digital - SESAU</p>
          <p className="mt-2">
            Sugestões e Suporte:{' '}
            <a href="https://wa.me/5567992178731" target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 font-semibold whitespace-nowrap">
              WhatsApp (67) 99217-8731
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
