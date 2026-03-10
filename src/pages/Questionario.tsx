import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Loader2, Save, Search, UserCheck } from 'lucide-react';

const perguntasBloco1 = [
  "Você tem amigos?",
  "Você conversa com seus amigos?",
  "Você consegue manter amizades?",
  "Você é capaz de ir aos serviços de saúde sozinho?",
  "Você consegue desenvolver suas atividades do trabalho?",
  "Você consegue se manter trabalhando?",
  "Você é capaz de fazer as compras para o seu dia a dia?",
  "Você é capaz de tomar banho sozinho?",
  "Você realiza a sua higiene diária sozinho?",
  "Você se veste sozinho?",
  "Você é capaz de controlar a sua impulsividade?",
  "Você é capaz de controlar a sua agressividade verbal?",
  "Você é capaz de controlar sua agresão física?",
  "Você encontra sentido na vida?",
  "Você sente que sua vida tem uma finalidade?",
  "Você consegue ter admiração pelas coisas a seu redor?",
  "Você está esperançoso com sua vida?"
];

const perguntasBloco2 = [
  "O usuário foi testemunha de violência?",
  "O usuário foi autor de violência?",
  "O usuário foi vítima de violência?",
  "O usuário tem desejo de morte?",
  "O usuário tem ideação suicida?",
  "O usuário tem planejamento suicida?",
  "O usuário tentou suicídio?",
  "O usuário pensa em se agredir?",
  "O usuário apresenta risco iminente para autoagressividade?",
  "O usuário tem história de autoagressividade?",
  "A equipe ESF apresenta dificuldades no manejo desse caso?",
  "O usuário nega a sua doença?",
  "O usuário desconhece a sua doença?",
  "O usuário demonstra resistência ao plano de cuidado proposto?"
];

export default function Questionario() {
  const { id } = useParams<{ id?: string }>();
  const { perfil } = useAuth();
  const navigate = useNavigate();
  
  const [cidadao, setCidadao] = useState<any>(null);
  const [bloco, setBloco] = useState<1 | 2 | null>(null);
  const [respostas, setRespostas] = useState<Record<string, 'sim' | 'não'>>({});
  
  const [loadingCidadao, setLoadingCidadao] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  // States para a busca caso não venha com ID na rota
  const [buscaParam, setBuscaParam] = useState('');
  const [cidadaosBuscados, setCidadaosBuscados] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchCidadao = async () => {
      if (id) {
        setLoadingCidadao(true);
        const { data } = await supabase.from('cidadaos').select('*').eq('id', id).single();
        if (data) {
          setCidadao(data);
        } else {
           setError('Cidadão não encontrado ou sem acesso.');
        }
        setLoadingCidadao(false);
      } else {
        // Modo Avulso (Acesso pelo Menu) - Não carrega nada inicial, apenas libera a tela
        setLoadingCidadao(false);
      }
    };
    fetchCidadao();
  }, [id]);

  // Função para buscar cidadão no Modo Avulso
  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil || !buscaParam) return;
    setIsSearching(true);
    setError('');

    let q = supabase.from('cidadaos').select('id, nome, cpf, micro_area').order('nome').limit(20);
    
    // RLS já ajuda, mas garantimos no front a listagem correta (Restrito à equipe para C e D)
    if (perfil.nivel_acesso === 'C' || perfil.nivel_acesso === 'D') {
      q = q.eq('equipe_id', perfil.equipe_id);
    }
    
    const buscaLimpa = buscaParam.replace(/\D/g, '');
    if (buscaLimpa.length > 0 && !isNaN(Number(buscaLimpa))) {
      q = q.ilike('cpf', `%${buscaLimpa}%`);
    } else {
      q = q.ilike('nome', `%${buscaParam}%`);
    }

    const { data, error: err } = await q;
    if (err) {
      setError('Erro ao buscar cidadãos.');
    } else if (data) {
      setCidadaosBuscados(data);
      if (data.length === 0) setError('Nenhum cidadão encontrado na sua equipe com esse termo.');
    }
    setIsSearching(false);
  };

  const handleResposta = (pergunta: string, valor: 'sim' | 'não') => {
    setRespostas(prev => ({ ...prev, [pergunta]: valor }));
  };

  const calcularPontuacao = () => {
    return Object.values(respostas).filter(r => r === 'sim').length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil || !cidadao) return;
    setLoadingSubmit(true);
    setError('');

    const perguntasAtuais = bloco === 1 ? perguntasBloco1 : perguntasBloco2;
    if (Object.keys(respostas).length < perguntasAtuais.length) {
      setError('Por favor, responda todas as perguntas antes de finalizar.');
      setLoadingSubmit(false);
      return;
    }

    try {
      const pontuacao = calcularPontuacao();
      const { error: err } = await supabase.from('questionarios_cuida_sm').insert({
        cidadao_id: cidadao.id,
        usuario_id: perfil.id,
        bloco,
        pontuacao_total: pontuacao,
        respostas
      });

      if (err) throw err;
      
      // Se tava no modo avulso, reseta a tela, senao volta pra cidadãos
      if (!id) {
        alert('Questionário salvo com sucesso!');
        setCidadao(null);
        setBloco(null);
        setBuscaParam('');
        setCidadaosBuscados([]);
      } else {
        navigate('/cidadaos');
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar questionário.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingCidadao) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        {!id && !cidadao ? null : (
          <button onClick={() => !id ? setCidadao(null) : navigate('/cidadaos')} className="mr-4 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Questionário CuidaSM</h1>
          {cidadao && <p className="text-sm text-gray-500">Avaliando cidadão: <strong>{cidadao.nome}</strong></p>}
        </div>
      </div>

      {!cidadao ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Selecione o Cidadão</h2>
            <p className="text-gray-500 text-sm">Busque pelo Nome ou CPF de um cidadão da sua equipe para iniciar a avaliação.</p>
          </div>
          
          <form onSubmit={handleBuscar} className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nome ou CPF..."
                value={buscaParam}
                onChange={(e) => setBuscaParam(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !buscaParam}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {error && <p className="text-red-500 text-sm text-center font-medium mt-4">{error}</p>}

          {cidadaosBuscados.length > 0 && (
            <div className="mt-8 max-w-2xl mx-auto border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
              {cidadaosBuscados.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{c.nome}</p>
                    <p className="text-xs text-gray-500">CPF: {c.cpf} {c.micro_area ? `- MA: ${c.micro_area}` : ''}</p>
                  </div>
                  <button
                    onClick={() => { setCidadao(c); setCidadaosBuscados([]); }}
                    className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded hover:bg-emerald-100 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 mr-1.5" /> Confirmar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !bloco ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Selecione o Bloco de Avaliação</h2>
          <p className="text-gray-500 text-sm">Escolha qual grupo de perguntas será aplicado.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <button 
              onClick={() => { setBloco(1); setRespostas({}); setError(''); }}
              className="flex flex-col items-center justify-center p-8 border-2 border-emerald-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-emerald-900 group"
            >
              <h3 className="text-lg font-bold group-hover:text-emerald-700">Bloco 1</h3>
              <p className="text-sm text-gray-500 mt-2">Dimensões autorreferidas (17 perguntas)</p>
            </button>
            <button 
              onClick={() => { setBloco(2); setRespostas({}); setError(''); }}
              className="flex flex-col items-center justify-center p-8 border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-900 group"
            >
              <h3 className="text-lg font-bold group-hover:text-blue-700">Bloco 2</h3>
              <p className="text-sm text-gray-500 mt-2">Dimensões avaliadas pelo profissional (14 perguntas)</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {bloco === 1 ? 'Bloco 1 - Dimensões Autorreferidas' : 'Bloco 2 - Dimensões Avaliadas'}
            </h2>
            <button onClick={() => setBloco(null)} className="text-sm text-emerald-600 font-semibold hover:underline">
              Trocar Bloco
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {(bloco === 1 ? perguntasBloco1 : perguntasBloco2).map((pergunta, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-800 flex-1 pr-6 mb-3 md:mb-0">
                    <span className="text-emerald-600 mr-2">{idx + 1}.</span> 
                    {pergunta}
                  </p>
                  <div className="flex gap-4 shrink-0">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`pergunta-${idx}`} 
                        checked={respostas[pergunta] === 'sim'} 
                        onChange={() => handleResposta(pergunta, 'sim')}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
                      />
                      <span className="text-sm font-medium text-gray-700">Sim</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`pergunta-${idx}`} 
                        checked={respostas[pergunta] === 'não'} 
                        onChange={() => handleResposta(pergunta, 'não')}
                        className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500" 
                      />
                      <span className="text-sm font-medium text-gray-700">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg font-semibold flex items-center">
                Pontuação Prevista: <span className="text-xl ml-2 font-black">{calcularPontuacao()}</span>
              </div>
              
              <button
                type="submit"
                disabled={loadingSubmit}
                className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loadingSubmit ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                {loadingSubmit ? 'Salvando...' : 'Salvar Questionário'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
