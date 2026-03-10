import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { KeyRound, Loader2 } from 'lucide-react';

export default function ResetSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Ao acessar o site via link do email, o Supabase já adiciona os tokens de sessão na URL.
    // Ele processa sozinhos no background e já loga o Auth silenciosamente caso o hash seja detectado.
    // É recomendado garantir que tem uma sessão ativa da recuperação.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Link inválido ou expirado. Por favor, solicite a recuperação novamente.');
      }
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (novaSenha.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetErr } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (resetErr) throw resetErr;

      // Senha atualizada com sucesso
      alert('Sua senha foi atualizada com sucesso! Você já pode acessar o CuidaSM.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <KeyRound className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-gray-900">
          Cadastre uma nova senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Agora você tem controle total. Digite uma nova senha segura.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100 sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleReset}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  autoFocus
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  minLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || error.includes('expirado')}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Salvando...' : 'Salvar Senha e Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
