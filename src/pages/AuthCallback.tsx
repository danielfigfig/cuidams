import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { HeartPulse, Loader2, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // The supabase client automatically processes the URL hash when this page loads.
    // We just need to listen to the result via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Confirmation successful — go to dashboard
        navigate('/dashboard', { replace: true });
      } else if (event === 'SIGNED_OUT' || !session) {
        // Hash had an error or token was invalid
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const errorDescription = params.get('error_description');
        setError(
          errorDescription?.replace(/\+/g, ' ') ||
          'O link de confirmação é inválido ou expirou. Solicite um novo link.'
        );
      }
    });

    // Also check for an error directly in the hash (e.g. otp_expired)
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorDescription = params.get('error_description');
      setError(
        errorDescription?.replace(/\+/g, ' ') ||
        'O link de confirmação é inválido ou expirou. Solicite um novo link.'
      );
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-xl shadow-red-100 rounded-2xl border border-red-100 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Link Inválido</h2>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/cadastro"
                className="w-full flex justify-center items-center py-2.5 px-4 border-2 border-emerald-600 rounded-lg text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                Reenviar E-mail de Confirmação
              </Link>
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-2.5 px-4 bg-gray-900 rounded-lg text-sm font-bold text-white hover:bg-gray-800 transition-colors"
              >
                Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <HeartPulse className="w-12 h-12 text-emerald-500 mb-4" />
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      <p className="mt-4 text-sm text-gray-500 font-medium">Confirmando seu acesso...</p>
    </div>
  );
}
