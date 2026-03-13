import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatarCPF, validarCPF } from '../lib/utils';
import { UserCircle, Loader2, ArrowLeft, MailCheck, Mail } from 'lucide-react';

export default function RecuperarSenha() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');
  const navigate = useNavigate();

  // Estados para reenvio de confirmação
  const [aba, setAba] = useState<'senha' | 'confirmacao'>('senha');
  const [emailConfirmacao, setEmailConfirmacao] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSucesso, setResendSucesso] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validarCPF(cpf)) {
      setError('O CPF informado é inválido.');
      setLoading(false);
      return;
    }

    try {
      // 1. Busca o email associado ao CPF através da RPC (bypass RLS)
      const { data: email, error: rpcError } = await supabase.rpc('get_email_by_cpf', {
        cpf_input: cpf.replace(/\D/g, '')
      });

      if (rpcError) throw rpcError;
      
      if (!email) {
        throw new Error('Nenhum cadastro encontrado para este CPF.');
      }

      // 2. Dispara e-mail de recuperação de senha do Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-senha`,
      });

      if (resetError) throw resetError;

      // Oculta parte do e-mail por segurança
      const partes = email.split('@');
      const emailMascarado = partes[0].substring(0, 3) + '***' + '@' + partes[1];
      
      setEmailEnviado(emailMascarado);
      setSucesso(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendError('');

    if (!emailConfirmacao || !emailConfirmacao.includes('@')) {
      setResendError('Por favor, informe um e-mail válido.');
      setResendLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailConfirmacao,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      if (error) throw error;
      setResendSucesso(true);
    } catch (err: any) {
      setResendError(err.message || 'Erro ao reenviar o e-mail de confirmação.');
    } finally {
      setResendLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100 sm:rounded-xl sm:px-10 border border-gray-100 text-center">
            <MailCheck className="mx-auto w-16 h-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Email Enviado!</h2>
            <p className="text-gray-600 mb-6">
              Enviamos um link de redefinição de senha para o endereço de e-mail <strong>{emailEnviado}</strong> cadastrado para o seu CPF.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Lembre-se de checar sua caixa de Entrada e o Spam. Ao clicar no link, você poderá criar uma senha nova.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resendSucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100 sm:rounded-xl sm:px-10 border border-gray-100 text-center">
            <MailCheck className="mx-auto w-16 h-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">E-mail Reenviado!</h2>
            <p className="text-gray-600 mb-6">
              Reenviamos o link de confirmação para <strong>{emailConfirmacao}</strong>. Verifique sua caixa de entrada e a pasta de Spam.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <UserCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-gray-900">
          Acesso à conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Escolha uma opção abaixo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100 sm:rounded-xl sm:px-10 border border-gray-100">

          {/* Abas */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
            <button
              onClick={() => { setAba('senha'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${aba === 'senha' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Recuperar Senha
            </button>
            <button
              onClick={() => { setAba('confirmacao'); setResendError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${aba === 'confirmacao' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Reenviar Confirmação
            </button>
          </div>

          {/* Aba: Recuperar Senha (por CPF) */}
          {aba === 'senha' && (
            <form className="space-y-6" onSubmit={handleRecuperar}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Qual o seu CPF?</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    maxLength={14}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Buscando...' : 'Buscar e Enviar Link'}
              </button>
            </form>
          )}

          {/* Aba: Reenviar E-mail de Confirmação */}
          {aba === 'confirmacao' && (
            <form className="space-y-6" onSubmit={handleResendConfirmation}>
              {resendError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {resendError}
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-bold flex items-center gap-1"><Mail className="w-4 h-4" /> Conta não confirmada?</p>
                <p className="mt-1">Se você se cadastrou mas não recebeu ou perdeu o e-mail de confirmação, informe seu e-mail abaixo para receber um novo link.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Seu e-mail de cadastro</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={emailConfirmacao}
                    onChange={(e) => setEmailConfirmacao(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={resendLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {resendLoading ? 'Reenviando...' : 'Reenviar E-mail de Confirmação'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="flex items-center justify-center text-sm font-semibold text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4 mr-1"/> Voltar ao acesso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
