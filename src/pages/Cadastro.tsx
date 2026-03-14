import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { HeartPulse, Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { validarCPF, formatarCPF, formatarMicroArea, gerarCodigo } from '../lib/utils';
import clsx from 'clsx';

export default function Cadastro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [equipes, setEquipes] = useState<{ id: string; nome: string }[]>([]);

  // State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [microArea, setMicroArea] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState<'C' | 'D'>('D');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [userIp, setUserIp] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Obter IP para log de auditoria LGPD
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(err => console.error('Erro ao obter IP:', err));
  }, []);

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
      // Verificar se o CPF ou o E-mail já existem antes de qualquer ação
      // Isso evita o erro de FK caso o e-mail já exista no Auth (o Supabase retorna um ID "falso" por segurança)
      const { data: existingUser } = await supabase
        .from('perfis_usuarios')
        .select('id, email, cpf')
        .or(`cpf.eq.${cpf.replace(/\D/g, '')},email.eq.${email}`)
        .maybeSingle();

      if (existingUser) {
        const field = existingUser.cpf === cpf.replace(/\D/g, '') ? 'CPF' : 'E-mail';
        setError(`Este ${field} já está cadastrado no sistema. Se você não recebeu o e-mail de confirmação, use o botão abaixo.`);
        setEmail(existingUser.email); // Garante que o email de reenvio seja o correto
        setLoading(false);
        return;
      }

      let finalEquipeId = equipeId;

      // 1. SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
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

        // 3. Registrar Log de Aceite dos Termos (Auditoria LGPD)
        await supabase.from('logs_aceite_termos').insert({
          usuario_id: authData.user.id,
          versao_termo: '1.0',
          ip_endereco: userIp,
          user_agent: navigator.userAgent
        });
        
        
        // Em vez de navegar para o login, mostramos a tela de sucesso
        setIsSuccess(true);
      } else {
        // Caso o usuário seja nulo e não haja erro, geralmente significa que o email já existe (segurança do Supabase)
        setError('Este e-mail já pode estar em uso. Tente fazer login ou verifique se recebeu o e-mail de confirmação.');
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      
      // Tratamento amigável para erro de FK (Foreign Key) ou Duplicidade
      if (err.message?.includes('perfis_usuarios_id_fkey') || err.message?.includes('foreign key constraint')) {
        setError('Este e-mail ou CPF já está vinculado a uma conta. Tente fazer login ou use o botão de reenvio de e-mail abaixo.');
      } else {
        setError(err.message || 'Ocorreu um erro inesperado durante o cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendMessage({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) throw error;
      setResendMessage({ type: 'success', text: 'E-mail de confirmação reenviado com sucesso!' });
    } catch (err: any) {
      setResendMessage({ type: 'error', text: err.message || 'Erro ao reenviar e-mail.' });
    } finally {
      setResendLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-xl shadow-emerald-100 rounded-2xl border border-gray-100 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-emerald-100 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Cadastro Realizado!</h2>
              <p className="text-gray-500">Enviamos um link de confirmação para o seu e-mail:</p>
              <p className="font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg inline-block">{email}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 text-left border border-blue-100">
              <p className="font-bold mb-1 flex items-center">
                <Mail className="w-4 h-4 mr-2" /> Próximo passo:
              </p>
              <p>Por favor, acesse sua caixa de entrada e clique no link para ativar sua conta. Verifique também a pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.</p>
            </div>

            {resendMessage.text && (
              <div className={clsx(
                "p-3 rounded-lg text-sm font-medium",
                resendMessage.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              )}>
                {resendMessage.text}
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border-2 border-emerald-600 rounded-lg text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {resendLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reenviar E-mail de Confirmação'}
              </button>
              
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-2.5 px-4 bg-gray-900 rounded-lg text-sm font-bold text-white hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <option value="C">C - Outro Profissional</option>
                  <option value="D">D - ACS</option>
                </select>
              </div>

              <div className="col-span-2 mt-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Termo de Uso e Consentimento para Tratamento de Dados Pessoais</h3>
                  <div className="text-[11px] text-gray-600 space-y-3 leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar text-left">
                    <p><strong>1. Objetivo e Natureza dos Dados</strong><br />
                    Ao prosseguir com o cadastro, você compreende que este sistema armazena dados pessoais sensíveis (informações de saúde, histórico clínico e indicadores de pacientes). O tratamento desses dados tem como finalidade exclusiva a gestão da assistência à saúde e o acompanhamento de indicadores clínicos no âmbito da Atenção Primária.</p>
                    
                    <p><strong>2. Responsabilidades do Usuário</strong><br />
                    Ao clicar em "Aceito", você se compromete a:<br />
                    • <strong>Sigilo Profissional:</strong> Manter total confidencialidade sobre as informações acessadas, não as compartilhando com terceiros não autorizados.<br />
                    • <strong>Uso de Credenciais:</strong> Reconhecer que o seu login e senha são pessoais e intransferíveis. Qualquer ação realizada sob seu usuário será de sua inteira responsabilidade.<br />
                    • <strong>Finalidade:</strong> Utilizar os dados apenas para o exercício de suas funções profissionais e atividades de gestão autorizadas.</p>
                    
                    <p><strong>3. Base Legal (LGPD)</strong><br />
                    O tratamento dos dados neste site fundamenta-se no Artigo 7º (Execução de Políticas Públicas) e Artigo 11 (Tutela da Saúde) da Lei nº 13.709/2018 (LGPD). Garantimos que a coleta é limitada ao mínimo necessário para a operação do serviço.</p>
                    
                    <p><strong>4. Segurança e Retenção</strong><br />
                    Implementamos medidas técnicas de segurança (como criptografia e controle de acesso) para proteger os dados contra acessos indevidos. Os logs de acesso são registrados para fins de auditoria e segurança.</p>
                    
                    <p><strong>5. Direitos do Titular</strong><br />
                    O sistema permite a retificação de dados e o controle de acesso conforme os níveis hierárquicos estabelecidos pela coordenação.</p>
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer group mt-2">
                    <div className="relative flex items-center mt-1">
                      <input
                        type="checkbox"
                        required
                        checked={aceitouTermos}
                        onChange={(e) => setAceitouTermos(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-emerald-600 checked:border-emerald-600 transition-all focus:ring-2 focus:ring-emerald-500"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600 leading-snug text-left group-hover:text-gray-900 transition-colors">
                      Li e concordo com os termos acima expostos e declaro estar ciente das minhas responsabilidades civis e administrativas no manejo de dados sensíveis de pacientes.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={loading || !aceitouTermos}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Cadastro'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm space-y-3 animate-shake">
                  <p className="font-medium">{error}</p>
                  {error.includes('CPF já está cadastrado') && (
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                      className="w-full py-2 px-3 bg-white border border-red-200 rounded-md text-xs font-bold text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                      {resendLoading ? 'Reenviando...' : 'Reenviar E-mail de Confirmação'}
                    </button>
                  )}
                  {resendMessage.text && (
                    <p className={clsx(
                      "text-[10px] font-bold uppercase p-1 rounded text-center",
                      resendMessage.type === 'success' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-800"
                    )}>
                      {resendMessage.text}
                    </p>
                  )}
                </div>
              )}
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

