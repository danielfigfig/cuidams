import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type Perfil = {
  id: string;
  codigo_autogerado: string;
  cpf: string;
  nome_completo: string;
  email: string;
  equipe_id: string;
  micro_area: string;
  nivel_acesso: 'A' | 'B' | 'C' | 'D' | 'E';
};

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true); // Garantir que está carregando o perfil
        fetchPerfil(session.user.id);
      } else {
        setPerfil(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) setPerfil(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setPerfil(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
