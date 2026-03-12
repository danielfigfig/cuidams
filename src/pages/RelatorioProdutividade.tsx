import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileBarChart, Printer, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UsuarioRelatorio {
  id: string;
  nome_completo: string;
  cpf: string;
  equipe: string;
  micro_area: string;
  nivel_acesso: string;
  totalQuestionarios: number;
}

export default function RelatorioProdutividade() {
  const { perfil } = useAuth();
  const [dados, setDados] = useState<UsuarioRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGeral, setTotalGeral] = useState(0);

  useEffect(() => {
    const carregarRelatorio = async () => {
      setLoading(true);

      try {
        // Busca todos os perfis com seus questionarios
        // Dependendo do nível de acesso, poderíamos restringir, mas relatórios 
        // geralmente são vistos por gestores (A ou B). Vamos buscar todos para administradores,
        // ou limitar por equipe para gerentes.
        let q = supabase.from('perfis_usuarios').select('*, equipes(nome), questionarios_cuida_sm(id)');
        
        // Exemplo: se for nivel_acesso D (Gerente), apenas da sua equipe
        if (perfil?.nivel_acesso === 'D') {
          q = q.eq('equipe_id', perfil.equipe_id);
        }

        const { data, error } = await q;

        if (error) throw error;

        let total = 0;
        const processados: UsuarioRelatorio[] = (data || []).map(user => {
          const qtd = user.questionarios_cuida_sm ? user.questionarios_cuida_sm.length : 0;
          total += qtd;
          return {
            id: user.id,
            nome_completo: user.nome_completo,
            cpf: user.cpf,
            equipe: user.equipes?.nome || 'Sem Equipe',
            micro_area: user.micro_area || '-',
            nivel_acesso: user.nivel_acesso,
            totalQuestionarios: qtd
          };
        });

        // Ordena por quem aplicou mais questionários
        processados.sort((a, b) => b.totalQuestionarios - a.totalQuestionarios);

        setDados(processados);
        setTotalGeral(total);
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
      } finally {
        setLoading(false);
      }
    };

    if (perfil) {
      carregarRelatorio();
    }
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
      {/* Cabeçalho da página (oculto na impressão se quisermos estilizá-lo diferente, mas aqui vamos manter) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <FileBarChart className="w-6 h-6 mr-2 text-emerald-600" />
            Relatórios de Produtividade
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Acompanhe o quantitativo de questionários aplicados por profissional.
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

      {/* Cabeçalho específico para a impressão */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <img src="/logo-sesau.png" alt="Logo SESAU" className="h-12 object-contain mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Produtividade - CuidaSM</h1>
        <p className="text-sm text-gray-500">Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
        <p className="text-sm text-gray-500">Responsável: {perfil?.nome_completo}</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 pb-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center print:border-gray-300">
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 mr-4 print:bg-transparent">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total de Testes Aplicados</p>
            <p className="text-2xl font-bold text-gray-900">{totalGeral}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center print:border-gray-300">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4 print:bg-transparent">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Profissionais Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{dados.filter(d => d.totalQuestionarios > 0).length} de {dados.length}</p>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden print:shadow-none print:border-gray-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profissional
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipe / MA
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perfil
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Testes Aplicados
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    Nenhum dado encontrado para o relatório.
                  </td>
                </tr>
              ) : (
                dados.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors print:hover:bg-white">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{user.nome_completo}</div>
                      <div className="text-xs text-gray-500">{user.cpf}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.equipe} <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2 print:border">MA: {user.micro_area}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-md">Nível {user.nivel_acesso}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                      {user.totalQuestionarios}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Estilos para impressão */}
      <style>{`
        @media print {
          body {
            background-color: white;
          }
          aside, nav, header {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
