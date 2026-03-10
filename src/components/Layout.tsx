import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HeartPulse, LayoutDashboard, Users, LogOut, Shield, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Layout() {
  const { user, perfil, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user || !perfil) {
    return <Navigate to="/login" replace />;
  }

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cidadaos', icon: Users, label: 'Cidadãos' }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <HeartPulse className="w-8 h-8 text-emerald-500 mr-2" />
          <span className="text-xl font-black tracking-tight text-gray-900">CuidaSM</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 px-2 py-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{perfil.nome_completo}</p>
            <p className="text-xs text-emerald-600 font-medium">Nível: {perfil.nivel_acesso}</p>
          </div>

          <nav className="space-y-1">
            {perfil.nivel_acesso === 'A' && (
              <Link
                to="/usuarios"
                className={twMerge(
                  clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                    location.pathname.startsWith('/usuarios') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                )}
              >
                <Shield className={clsx('mr-3 h-5 w-5', location.pathname.startsWith('/usuarios') ? 'text-emerald-500' : 'text-gray-400')} />
                Ver Usuários
              </Link>
            )}
            {perfil.nivel_acesso === 'C' && (
              <Link
                to="/questionario"
                className={twMerge(
                  clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                    location.pathname === '/questionario' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                )}
              >
                <FileText className={clsx('mr-3 h-5 w-5', location.pathname === '/questionario' ? 'text-emerald-500' : 'text-gray-400')} />
                Aplicar Questionário
              </Link>
            )}
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.to);
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={twMerge(
                    clsx(
                      'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  )}
                >
                  <Icon className={clsx('mr-3 h-5 w-5', isActive ? 'text-emerald-500' : 'text-gray-400')} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 text-xs text-center text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="font-semibold text-gray-700">Dúvidas? Fale com a SESAU</p>
            <p className="mt-1">Coordenação de Saúde Digital</p>
            <p className="font-medium text-emerald-600 mt-1">
              WhatsApp: (67) 99217-8731
            </p>
          </div>
          <button 
            onClick={signOut} 
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 opacity-80" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
