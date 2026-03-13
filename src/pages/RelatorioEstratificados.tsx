import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Printer, Loader2, Users, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { classificarRisco } from '../lib/riscoUtils';

interface CidadaoEstratificado {
  id: string;
  nome: string;
  cpf: string;
  equipe: string;
  micro_area: string;
  questionarios: any[];
  risco: any | null;
}

export default function RelatorioEstratificados() {
  const { perfil } = useAuth();
  const [dados, setDados] = useState<CidadaoEstratificado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarRelatorio = async () => {
      if (!perfil) return;
      setLoading(true);

      try {
        let q = supabase.from('cidadaos')
          .select('*, equipes(nome), questionarios_cuida_sm(id, bloco, pontuacao_total, data_preenchimento)')
          .order('nome');
        
        if (perfil.nivel_acesso === 'D' || perfil.nivel_acesso === 'E') {
          q = q.eq('equipe_id', perfil.equipe_id);
        }

        const { data, error } = await q;

        if (error) throw error;

        const processados: CidadaoEstratificado[] = (data || [])
          .map(cid => {
            const qs = cid.questionarios_cuida_sm || [];
            if (qs.length === 0) return null;

            // Pega o ultimo do bloco 1 e ultimo do bloco 2
            const utlBloco1 = qs.filter((q: any) => q.bloco === 1).sort((a: any, b: any) => new Date(b.data_preenchimento).getTime() - new Date(a.data_preenchimento).getTime())[0];
            const utlBloco2 = qs.filter((q: any) => q.bloco === 2).sort((a: any, b: any) => new Date(b.data_preenchimento).getTime() - new Date(a.data_preenchimento).getTime())[0];
            
            let risco = null;
            // Mostrar a classificação apenas se ele tiver os 2 questionários preenchidos
            if (utlBloco1 && utlBloco2) {
              risco = classificarRisco(utlBloco1.pontuacao_total + utlBloco2.pontuacao_total);
            }

            return {
              id: cid.id,
              nome: cid.nome,
              cpf: cid.cpf,
              equipe: cid.equipes?.nome || 'Sem Equipe',
              micro_area: cid.micro_area || '-',
              questionarios: qs,
              risco
            };
          })
          .filter((item): item is CidadaoEstratificado => item !== null);

        setDados(processados);
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarRelatorio();
  }, [perfil]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:max-w-none print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-emerald-600" />
            Pacientes Estratificados
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pacientes com questionários aplicados e sua respectiva classificação de risco.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir PDF
        </button>
      </div>

      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <img src="/logo-sesau.png" alt="Logo SESAU" className="h-12 object-contain mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Pacientes Estratificados - CuidaSM</h1>
        <p className="text-sm text-gray-500">Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden print:shadow-none print:border-gray-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipe / MA
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questionários
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classificação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    Nenhum paciente estratificado encontrado.
                  </td>
                </tr>
              ) : (
                dados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-white">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{item.nome}</div>
                      <div className="text-xs text-gray-500">{item.cpf}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.equipe} <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2 print:border">MA: {item.micro_area}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-1">
                        {item.questionarios.some(q => q.bloco === 1) && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Bloco 1</span>
                        )}
                        {item.questionarios.some(q => q.bloco === 2) && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Bloco 2</span>
                        )}
                        {!item.questionarios.some(q => q.bloco === 1) || !item.questionarios.some(q => q.bloco === 2) ? (
                           <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase italic">Incompleto</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.risco ? (
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${item.risco.corCss}`}>
                          <Activity className="w-3 h-3 mr-1" />
                          {item.risco.sigla}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Aguardando questionários</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        @media print {
          body { background-color: white; }
          aside, nav, header { display: none !important; }
          main { margin-left: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
