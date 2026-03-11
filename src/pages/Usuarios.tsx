import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';

export default function Usuarios() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoNivel, setNovoNivel] = useState('');
  
  const fetchUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('perfis_usuarios')
      .select('*, equipes(nome)')
      .order('criado_em', { ascending: false });
    if (data) setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => {
    if (perfil?.nivel_acesso === 'A') {
      fetchUsuarios();
    }
  }, [perfil]);

  if (perfil?.nivel_acesso !== 'A') {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg m-8">
        Acesso negado. Apenas administradores podem gerenciar usuários.
      </div>
    );
  }

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setNovoNivel(user.nivel_acesso);
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('perfis_usuarios')
      .update({ nivel_acesso: novoNivel })
      .eq('id', id);
      
    if (!error) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, nivel_acesso: novoNivel } : u));
    } else {
      alert('Erro ao atualizar nível. Você tem permissão para isso?');
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${nome}? Esta ação removerá o acesso dele ao sistema.`)) {
      setLoading(true);
      const { error } = await supabase
        .rpc('delete_user_by_admin', { target_user_id: id });
        
      if (!error) {
        setUsuarios(usuarios.filter(u => u.id !== id));
      } else {
        console.error('Erro na RPC de exclusão:', error);
        alert('Erro ao excluir usuário: ' + error.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
          <Shield className="mr-3 text-indigo-500 w-8 h-8" /> Gerenciamento de Usuários
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome e Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email e CPF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível de Acesso</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.nome_completo}</div>
                      <div className="text-xs text-emerald-600 font-semibold">{u.codigo_autogerado}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{u.email}</div>
                      <div className="text-xs text-gray-500">{u.cpf}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.equipes?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === u.id ? (
                        <select 
                          value={novoNivel} 
                          onChange={(e) => setNovoNivel(e.target.value)}
                          className="text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="A">A - ADMINISTRADOR</option>
                          <option value="B">B - Coordenador</option>
                          <option value="C">C - Outro Profissional</option>
                          <option value="D">D - ACS</option>
                          <option value="E">E - Gerente da Unidade</option>
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${u.nivel_acesso === 'A' ? 'bg-indigo-100 text-indigo-800' : 
                          u.nivel_acesso === 'B' ? 'bg-blue-100 text-blue-800' : 
                          u.nivel_acesso === 'C' ? 'bg-yellow-100 text-yellow-800' : 
                          u.nivel_acesso === 'E' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          Nível {u.nivel_acesso}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === u.id ? (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleSave(u.id)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 p-1.5 rounded-md"><Check className="w-5 h-5"/></button>
                          <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md"><X className="w-5 h-5"/></button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-md" title="Editar Nível">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(u.id, u.nome_completo)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md" title="Excluir Usuário">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
