import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, FileText } from 'lucide-react';

export default function Cidadaos() {
  const { perfil } = useAuth();
  const [cidadaos, setCidadaos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregarCidadaos = async () => {
    if (!perfil) return;
    setLoading(true);
    let q = supabase.from('cidadaos').select('*, equipes(nome)').order('nome');
    
    // RLS ja trata D e C, mas bom garantir no front
    if (perfil.nivel_acesso === 'C' || perfil.nivel_acesso === 'D') {
      q = q.eq('equipe_id', perfil.equipe_id);
    }
    if (busca) {
      // Remover máscara antes de buscar por CPF ou buscar por nome
      const buscaLimpa = busca.replace(/\D/g, '');
      if (buscaLimpa.length > 0 && !isNaN(Number(buscaLimpa))) {
        q = q.ilike('cpf', `%${buscaLimpa}%`);
      } else {
        q = q.ilike('nome', `%${busca}%`);
      }
    }

    const { data } = await q;
    if (data) setCidadaos(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarCidadaos();
  }, [perfil, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestão de Cidadãos</h1>
        
        {(perfil?.nivel_acesso === 'A' || perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D') && (
          <Link
            to="/cidadaos/novo"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cidadão
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Buscar cidadão por nome ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipe / MA
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div></div>
                  </td>
                </tr>
              ) : cidadaos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Nenhum cidadão encontrado.
                  </td>
                </tr>
              ) : (
                cidadaos.map((cid) => (
                  <tr key={cid.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cid.codigo_autogerado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                      {cid.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cid.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cid.equipes?.nome} <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">MA: {cid.micro_area}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {(perfil?.nivel_acesso === 'A' || perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D') && (
                        <Link
                          to={`/cidadaos/${cid.id}/questionario`}
                          className="inline-flex items-center text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
                          title="Avaliar CuidaSM"
                        >
                          <FileText className="w-4 h-4 mr-1.5" />
                          Aplicar CuidaSM
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
