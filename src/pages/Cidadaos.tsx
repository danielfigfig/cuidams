import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, FileText, ClipboardList, Activity } from 'lucide-react';
import { classificarRisco } from '../lib/riscoUtils';
import clsx from 'clsx';

export default function Cidadaos() {
  const { perfil } = useAuth();
  const [cidadaos, setCidadaos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregarCidadaos = async () => {
    if (!perfil) return;
    setLoading(true);
    let q = supabase.from('cidadaos').select('*, equipes(nome), questionarios_cuida_sm(id, bloco, pontuacao_total, data_preenchimento)').order('nome');
    
    // RLS ja trata D, E e C, mas para garantir no front a nível de UX
    if (perfil.nivel_acesso === 'D' || perfil.nivel_acesso === 'E') {
      q = q.eq('equipe_id', perfil.equipe_id);
    } else if (perfil.nivel_acesso === 'C') {
      q = q.eq('usuario_id', perfil.id);
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

    const { data, error } = await q;
    if (error) console.error("Erro ao carregar cidadãos:", error);
    if (data) {
      console.log("Cidadãos carregados:", data);
      // Formatar os dados para incluir flag temQuestionario e o risco atualizado
      const cidadaosFormatados = data.map(cid => {
        const questionarios = cid.questionarios_cuida_sm || [];
        const temQuestionario = questionarios.length > 0;
        
        let riscoCalc = null;
        if (temQuestionario) {
          // Ordena questionarios do mais recente pro mais antigo
          const qs = [...questionarios].sort((a, b) => new Date(b.data_preenchimento).getTime() - new Date(a.data_preenchimento).getTime());
          
          // Pega o ultimo do bloco 1 e ultimo do bloco 2
          const utlBloco1 = qs.find(q => q.bloco === 1);
          const utlBloco2 = qs.find(q => q.bloco === 2);
          
          if (utlBloco1 || utlBloco2) {
            const pt1 = utlBloco1 ? utlBloco1.pontuacao_total : 0;
            const pt2 = utlBloco2 ? utlBloco2.pontuacao_total : 0;
            riscoCalc = classificarRisco(pt1 + pt2);
          }
        }

        return {
          ...cid,
          temQuestionario,
          riscoAtual: riscoCalc
        };
      });
      setCidadaos(cidadaosFormatados);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarCidadaos();
  }, [perfil, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestão de Cidadãos</h1>
        
        {(perfil?.nivel_acesso === 'A' || perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D' || perfil?.nivel_acesso === 'E') && (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold flex items-center gap-2">
                      {cid.nome}
                      {cid.riscoAtual && (
                        <span 
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${cid.riscoAtual.corCss}`}
                          title={`Pontuação Total: ${cid.riscoAtual.pontos} - ${cid.riscoAtual.nome}`}
                        >
                          <Activity className="w-3 h-3 inline mr-1 -mt-0.5" />
                          {cid.riscoAtual.sigla}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cid.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cid.equipes?.nome} <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">MA: {cid.micro_area}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {/* O botão de consulta agora é visível para TODOS os níveis, pois todos precisam saber se o cidadão já foi avaliado */}
                      {perfil && (
                        <Link
                          to={cid.temQuestionario ? `/cidadaos/${cid.id}/historico` : '#'}
                          onClick={(e) => !cid.temQuestionario && e.preventDefault()}
                          className={clsx(
                            "inline-flex items-center px-3 py-1.5 rounded-md transition-all",
                            cid.temQuestionario 
                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer" 
                              : "text-red-700 bg-red-50 cursor-not-allowed opacity-70"
                          )}
                          title={cid.temQuestionario ? "Consultar questionário preenchido" : "Ainda não há questionário preenchido para este cidadão"}
                        >
                          <ClipboardList className="w-4 h-4 mr-1.5" />
                          Consultar Questionário
                        </Link>
                      )}

                      {(perfil?.nivel_acesso === 'A' || perfil?.nivel_acesso === 'C' || perfil?.nivel_acesso === 'D' || perfil?.nivel_acesso === 'E') && (
                        <Link
                          to={`/cidadaos/${cid.id}/questionario`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
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
