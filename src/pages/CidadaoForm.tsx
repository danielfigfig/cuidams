import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { validarCPF, formatarCPF, formatarMicroArea, gerarCodigo } from '../lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function CidadaoForm() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [microArea, setMicroArea] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [equipes, setEquipes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redireciona usuários sem permissão de cadastro
  useEffect(() => {
    if (perfil && !['A', 'C', 'D', 'E'].includes(perfil.nivel_acesso)) {
      navigate('/cidadaos', { replace: true });
    }
  }, [perfil, navigate]);

  useEffect(() => {
    const fetchEq = async () => {
      const { data } = await supabase.from('equipes').select('*').order('nome');
      if (data) setEquipes(data);
      
      if (perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D' || perfil?.nivel_acesso === 'E') {
        setEquipeId(perfil.equipe_id);
      }
    };
    fetchEq();
  }, [perfil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validarCPF(cpf)) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }
    
    if (microArea && microArea.length < 2) {
       setError('A Micro Área deve ter 2 dígitos caso informada.');
       setLoading(false);
       return;
    }

    try {
      const { error: err } = await supabase.from('cidadaos').insert({
        codigo_autogerado: gerarCodigo(),
        nome,
        cpf: cpf.replace(/\D/g, ''),
        micro_area: microArea,
        equipe_id: equipeId,
        usuario_id: perfil?.id || undefined // Registra quem criou
      });

      if (err) throw err;
      
      navigate('/cidadaos');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cidadão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <button onClick={() => navigate('/cidadaos')} className="mr-4 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Novo Cidadão</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo *</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CPF *</label>
              <input type="text" required value={cpf} onChange={(e) => setCpf(formatarCPF(e.target.value))} maxLength={14} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Micro Área (2 dígitos) (para ACS)</label>
              <input type="text" value={microArea} onChange={(e) => setMicroArea(formatarMicroArea(e.target.value))} maxLength={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Equipe *</label>
              <select 
                required 
                value={equipeId} 
                onChange={(e) => setEquipeId(e.target.value)} 
                disabled={perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D' || perfil?.nivel_acesso === 'E'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white disabled:bg-gray-100 transition-all"
              >
                <option value="">Selecione uma equipe</option>
                {equipes.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              {(perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D' || perfil?.nivel_acesso === 'E') && (
                <p className="mt-1 flex items-center text-xs text-emerald-600">Sua equipe foi pré-selecionada automaticamente.</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Salvando...' : 'Salvar Cidadão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
