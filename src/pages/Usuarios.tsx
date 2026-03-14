import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, Edit2, Check, X, Trash2 } from 'lucide-react';

export default function Usuarios() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoNivel, setNovoNivel] = useState('');
  const [novaEquipeId, setNovaEquipeId] = useState<string>('');
  
  const fetchUsuarios = async () => {
    setLoading(true);
    const [{ data: usersData }, { data: equipesData }] = await Promise.all([
      supabase.from('perfis_usuarios').select('*, equipes(nome)').order('criado_em', { ascending: false }),
      supabase.from('equipes').select('id, nome').order('nome')
    ]);
    if (usersData) setUsuarios(usersData);
    if (equipesData) setEquipes(equipesData);
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
  const [changingPasswordId, setChangingPasswordId] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setNovoNivel(user.nivel_acesso);
    setNovaEquipeId(user.equipe_id || '');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingPasswordId || !novaSenha) return;
    
    setResetting(true);
    try {
      const { data, error } = await supabase.rpc('change_user_password_by_admin', {
        target_user_id_text: changingPasswordId,
        admin_user_id_text: perfil?.id,
        new_password: novaSenha
      });

      if (error) throw error;
      
      const result = data as { success: boolean, message: string };
      if (result.success) {
        alert(result.message);
        setChangingPasswordId(null);
        setNovaSenha('');
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro ao alterar senha: ' + (error.message || 'Verifique se você executou o script SQL no Supabase.'));
    } finally {
      setResetting(false);
    }
  };

  const handleSave = async (id: string) => {
    const equipeIdToSave = novaEquipeId === '' ? null : novaEquipeId;
    const { error } = await supabase
      .from('perfis_usuarios')
      .update({ nivel_acesso: novoNivel, equipe_id: equipeIdToSave })
      .eq('id', id);
      
    if (!error) {
      const equipeNome = equipes.find(e => e.id === novaEquipeId)?.nome || null;
      setUsuarios(usuarios.map(u => u.id === id
        ? { ...u, nivel_acesso: novoNivel, equipe_id: equipeIdToSave, equipes: equipeNome ? { nome: equipeNome } : null }
        : u
      ));
    } else {
      alert('Erro ao atualizar. Você tem permissão para isso?');
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${nome}? Esta ação removerá o acesso dele ao sistema.`)) {
      setLoading(true);
      const { error } = await supabase
        .rpc('delete_user_by_admin', { 
          target_user_id_text: id, 
          admin_user_id_text: perfil?.id 
        });
        
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
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
          <Shield className="mr-3 text-indigo-500 w-8 h-8" /> Gerenciamento de Usuários
        </h1>
      </div>

      {/* Modal de Alteração de Senha */}
      {changingPasswordId && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Alterar Senha do Usuário</h3>
              <button onClick={() => setChangingPasswordId(null)} className="text-white/80 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handlePasswordReset} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Alterando senha de: <span className="font-bold text-gray-900">
                  {usuarios.find(u => u.id === changingPasswordId)?.nome_completo}
                </span>
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-left">Nova Senha</label>
                <input
                  type="password"
                  required
                  min={6}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangingPasswordId(null)}
                  className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetting || novaSenha.length < 6}
                  className="flex-1 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      {editingId === u.id ? (
                        <select
                          value={novaEquipeId}
                          onChange={(e) => setNovaEquipeId(e.target.value)}
                          className="text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 w-full"
                        >
                          <option value="">Sem equipe</option>
                          {equipes.map((eq) => (
                            <option key={eq.id} value={eq.id}>{eq.nome}</option>
                          ))}
                        </select>
                      ) : (
                        u.equipes?.nome || '-'
                      )}
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
                          <button onClick={() => setChangingPasswordId(u.id)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 p-1.5 rounded-md" title="Alterar Senha">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5" />
                            </svg>
                          </button>
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
