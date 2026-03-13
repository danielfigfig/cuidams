import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, FileQuestion, Activity } from 'lucide-react';

export default function Dashboard() {
  const { perfil } = useAuth();
  const [stats, setStats] = useState({ cidadaos: 0, questionarios: 0 });

  useEffect(() => {
    if (!perfil) return;
    
    const fetchDados = async () => {
      let qCidadaos = supabase.from('cidadaos').select('*', { count: 'exact', head: true });
      let qQuestions = supabase.from('questionarios_cuida_sm').select('*', { count: 'exact', head: true });

      // Filtrar baseado no nível
      if (perfil.nivel_acesso === 'C' || perfil.nivel_acesso === 'D' || perfil.nivel_acesso === 'E') {
         qCidadaos = qCidadaos.eq('equipe_id', perfil.equipe_id);
      }

      const [{ count: countCidadaos }, { count: countQ }] = await Promise.all([
        qCidadaos,
        qQuestions
      ]);

      setStats({
        cidadaos: countCidadaos || 0,
        questionarios: countQ || 0
      });
    };

    fetchDados();
  }, [perfil]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Painel de Classificações</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="ml-5">
            <h2 className="text-sm font-medium text-gray-500">Cidadãos Monitorados</h2>
            <p className="text-3xl font-black text-gray-900 mt-1">{stats.cidadaos}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
          <div className="p-4 bg-emerald-50 rounded-lg">
            <FileQuestion className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="ml-5">
            <h2 className="text-sm font-medium text-gray-500">Questionários CuidaSM</h2>
            <p className="text-3xl font-black text-gray-900 mt-1">{stats.questionarios}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
          <h2 className="text-sm font-medium text-gray-500">Nível de Acesso Ativo</h2>
          <div className="mt-2 flex items-center">
            <Activity className="w-5 h-5 text-indigo-500 mr-2" />
            <span className="text-xl font-bold text-gray-800">
              {perfil?.nivel_acesso === 'A' && 'ADMINISTRADOR (A)'}
              {perfil?.nivel_acesso === 'B' && 'Coordenador (B)'}
              {perfil?.nivel_acesso === 'C' && 'Profissional (C)'}
              {perfil?.nivel_acesso === 'D' && 'Profissional/Agente (D)'}
              {perfil?.nivel_acesso === 'E' && 'Gerente da Unidade (E)'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {perfil?.nivel_acesso === 'A' && 'Acesso e modificação plenos em todo o sistema.'}
            {perfil?.nivel_acesso === 'B' && 'Visualização de todos os dados do município.'}
            {perfil?.nivel_acesso === 'C' && 'Cadastro e visualização apenas dos próprios cidadãos criados.'}
            {perfil?.nivel_acesso === 'D' && 'Cadastro e acompanhamento de cidadãos de sua equipe.'}
            {perfil?.nivel_acesso === 'E' && 'Acesso total aos dados de cidadãos da sua unidade (equipe).'}
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Bem-vindo(a) à plataforma CuidaSM</h3>
        <p className="text-gray-600">
          Você pode usar a barra lateral para navegar entre a gestão de cidadãos e acompanhamentos estruturados.
        </p>
      </div>

    </div>
  );
}
