import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { HeartPulse, Loader2 } from 'lucide-react';
import { validarCPF, formatarCPF, formatarMicroArea, gerarCodigo } from '../lib/utils';

export default function Cadastro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [equipes, setEquipes] = useState<{ id: string; nome: string }[]>([]);
  const navigate = useNavigate();

  // State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [microArea, setMicroArea] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState<'B' | 'C' | 'D' | 'E'>('D');

  useEffect(() => {
    const fetchEquipes = async () => {
      const { data } = await supabase.from('equipes').select('*').order('nome');
      if (data) setEquipes(data);
    };
    fetchEquipes();
  }, []);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validarCPF(cpf)) {
      setError('O CPF informado é inválido.');
      setLoading(false);
      return;
    }

    try {
      let finalEquipeId = equipeId;

      // 1. SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into perfis_usuarios
        const codigo = gerarCodigo();
        const { error: perfilErr } = await supabase.from('perfis_usuarios').insert({
          id: authData.user.id,
          codigo_autogerado: codigo,
          cpf: cpf.replace(/\D/g, ''),
          nome_completo: nomeCompleto,
          email,
          equipe_id: finalEquipeId || null, // Se a string for vazia, manda null para o DB ignorar e evitar erro de tipo uuid
          micro_area: microArea,
          nivel_acesso: nivelAcesso,
        });

        if (perfilErr) throw perfilErr;
        
        // Relogin is automatic in some cases, but redirect to login is best practice
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <HeartPulse className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-gray-900">
          Criar Conta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl shadow-emerald-100 sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleCadastro}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                <input type="text" required value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CPF *</label>
                <input type="text" required value={cpf} onChange={(e) => setCpf(formatarCPF(e.target.value))} maxLength={14} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Micro Área (2 dígitos) (para ACS)</label>
                <input type="text" value={microArea} onChange={(e) => setMicroArea(formatarMicroArea(e.target.value))} maxLength={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Senha *</label>
                <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
              </div>

              <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipe {(nivelAcesso === 'C' || nivelAcesso === 'D') && '*'}</label>
                <select required={nivelAcesso === 'C' || nivelAcesso === 'D'} value={equipeId} onChange={(e) => setEquipeId(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  <option value="">Selecione uma equipe</option>
                  {equipes.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil (Nível de Acesso)</label>
                <select value={nivelAcesso} onChange={(e) => setNivelAcesso(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  <option value="B">B - Coordenador</option>
                  <option value="C">C - Outro Profissional</option>
                  <option value="D">D - ACS</option>
                  <option value="E">E - Gerente da Unidade</option>
                </select>
              </div>

            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Já tem uma conta? Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
