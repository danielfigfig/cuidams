import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HeartPulse, LayoutDashboard, Users, LogOut, Shield, FileText, FileBarChart, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Layout() {
  const { user, perfil, loading, signOut } = useAuth();
  const location = useLocation();
  const [relatoriosOpen, setRelatoriosOpen] = useState(location.pathname.startsWith('/relatorios'));

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
    { to: '/dashboard', icon: LayoutDashboard, label: 'CLASSIFICAÇÕES' },
    { to: '/cidadaos', icon: Users, label: 'Cidadãos' }
  ];

  const relatoriosLinks = [
    { to: '/relatorios/produtividade', label: 'Produtividade' },
    { to: '/relatorios/estratificados', label: 'Pacientes Estratificados' }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed">
        <div className="h-20 flex flex-col justify-center items-center px-6 border-b border-gray-100 bg-white">
          <img src="/logo-sesau.png" alt="Logo SESAU" className="h-8 object-contain mb-1" />
          <div className="flex items-center">
            <HeartPulse className="w-5 h-5 text-emerald-500 mr-1" />
            <span className="text-lg font-black tracking-tight text-gray-900 leading-none">CuidaSM</span>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">

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
            {(perfil.nivel_acesso === 'A' || perfil.nivel_acesso === 'C' || perfil.nivel_acesso === 'D' || perfil.nivel_acesso === 'E') && (
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

            {/* Menu Relatórios com Submenus */}
            <div>
              <button
                onClick={() => setRelatoriosOpen(!relatoriosOpen)}
                className={twMerge(
                  clsx(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                    location.pathname.startsWith('/relatorios')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                )}
              >
                <div className="flex items-center">
                  <FileBarChart className={clsx('mr-3 h-5 w-5', location.pathname.startsWith('/relatorios') ? 'text-emerald-500' : 'text-gray-400')} />
                  Relatórios
                </div>
                {relatoriosOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {relatoriosOpen && (
                <div className="mt-1 ml-8 space-y-1">
                  {relatoriosLinks.map((sublink) => {
                    const isSubActive = location.pathname === sublink.to;
                    return (
                      <Link
                        key={sublink.to}
                        to={sublink.to}
                        className={twMerge(
                          clsx(
                            'block px-3 py-2 text-xs font-medium rounded-md transition-colors',
                            isSubActive
                              ? 'text-emerald-700 bg-emerald-50/50'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          )
                        )}
                      >
                        {sublink.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 px-2 py-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{perfil.nome_completo}</p>
            <p className="text-xs text-emerald-600 font-medium">Nível: {perfil.nivel_acesso}</p>
          </div>
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
