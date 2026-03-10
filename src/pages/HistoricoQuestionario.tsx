import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, User, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoQuestionario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [cidadao, setCidadao] = useState<any>(null);
  const [questionarios, setQuestionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQ, setSelectedQ] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');

      try {
        // Buscar dados do cidadão
        const { data: cidData, error: cidError } = await supabase
          .from('cidadaos')
          .select('*, equipes(nome)')
          .eq('id', id)
          .single();

        if (cidError) throw cidError;
        if (cidData) setCidadao(cidData);

        // Buscar histórico de questionários
        const { data: qData, error: qError } = await supabase
          .from('questionarios_cuida_sm')
          .select('*, perfis_usuarios(nome_completo)')
          .eq('cidadao_id', id)
          .order('created_at', { ascending: false });

        if (qError) throw qError;
        if (qData) setQuestionarios(qData);

      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError('Ocorreu um erro ao carregar o histórico.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !cidadao) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
        {error || 'Cidadão não encontrado.'}
        <button onClick={() => navigate('/cidadaos')} className="block mx-auto mt-2 font-bold underline">Voltar para Cidadãos</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate('/cidadaos')} className="mr-4 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Histórico CuidaSM</h1>
            <p className="text-sm text-gray-500">Cidadão: <span className="font-bold text-gray-700">{cidadao.nome}</span></p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">CPF</p>
          <p className="text-sm font-medium text-gray-700">{cidadao.cpf}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Questionários */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Avaliações Realizadas</h2>
          {questionarios.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center space-y-3">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto" />
              <p className="text-sm text-gray-400">Nenhum questionário preenchido ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questionarios.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQ(q)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedQ?.id === q.id 
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm ring-1 ring-emerald-200' 
                      : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      q.bloco === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      Bloco {q.bloco}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {format(new Date(q.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Nota: {q.pontuacao_total}</p>
                      <p className="text-[11px] text-gray-500 flex items-center mt-1">
                        <User className="w-3 h-3 mr-1" /> {q.perfis_usuarios?.nome_completo?.split(' ')[0]}
                      </p>
                    </div>
                    <div className="bg-white rounded-full p-1.5 shadow-inner">
                      <div className={`w-2 h-2 rounded-full ${q.bloco === 1 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes do Selecionado */}
        <div className="lg:col-span-2">
          {selectedQ ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">Respostas do Bloco {selectedQ.bloco}</h3>
                  <p className="text-xs text-gray-500">Realizado em {format(new Date(selectedQ.created_at), "PPP 'às' p", { locale: ptBR })}</p>
                </div>
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-center">
                  <p className="text-[10px] font-bold uppercase opacity-80 leading-none">Pontuação</p>
                  <p className="text-xl font-black">{selectedQ.pontuacao_total}</p>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-3">
                {Object.entries(selectedQ.respostas as Record<string, string>).map(([pergunta, resposta], idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                    <div className="mt-1">
                      {resposta === 'sim' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold mb-0.5">QUESTÃO {idx + 1}</p>
                      <p className="text-sm text-gray-700 leading-snug">{pergunta}</p>
                      <p className={`text-xs font-bold mt-1 uppercase ${resposta === 'sim' ? 'text-emerald-600' : 'text-gray-400'}`}>
                        Resposta: {resposta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-emerald-50/30 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Profissional Responsável</p>
                    <p className="text-sm font-bold text-gray-800">{selectedQ.perfis_usuarios?.nome_completo}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed p-12 flex flex-col items-center justify-center h-full min-h-[500px] text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">Detalhes da Avaliação</h3>
              <p className="text-sm text-gray-400 max-w-xs mt-2">
                Selecione uma avaliação na lista ao lado para visualizar os detalhes das respostas e a pontuação completa.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
