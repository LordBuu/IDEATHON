import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Building,
  ShieldCheck,
  Palette,
  X,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 'dashboard' | 'agenda' | 'patients' | 'records' | 'clinic' | 'audit' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onClose }) => {
  const { activeMember } = useAuth();
  const role = activeMember?.role || 'health_professional';

  const isReceptionist = role === 'receptionist';
  const isAdmin = role === 'admin';

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      id: 'agenda' as NavTab,
      label: 'Agenda de Consultas',
      icon: Calendar,
      allowed: true,
    },
    {
      id: 'patients' as NavTab,
      label: 'Pacientes',
      icon: Users,
      allowed: !isReceptionist, // STRICT: Hidden from receptionist
      restrictedMsg: 'Restrito para equipe clínica',
    },
    {
      id: 'records' as NavTab,
      label: 'Prontuário Eletrônico',
      icon: FileText,
      allowed: !isReceptionist, // STRICT: Hidden from receptionist
      restrictedMsg: 'Restrito para equipe clínica',
    },
    {
      id: 'clinic' as NavTab,
      label: 'Gestão da Clínica',
      icon: Building,
      allowed: isAdmin,
      adminOnly: true,
    },
    {
      id: 'audit' as NavTab,
      label: 'Auditoria & LGPD',
      icon: ShieldCheck,
      allowed: isAdmin,
      adminOnly: true,
    },
    {
      id: 'settings' as NavTab,
      label: 'Identidade & Temas',
      icon: Palette,
      allowed: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          
          {/* Top part */}
          <div>
            {/* Mobile Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 lg:hidden">
              <span className="font-bold text-slate-900 dark:text-white">Navegação CliniOn</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receptionist Notice */}
            {isReceptionist && (
              <div className="my-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
                <div className="flex items-center space-x-1.5 font-semibold text-[11px] mb-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Modo Recepção Ativo</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                  Acesso exclusivo a agenda e atendimentos operacionais. Prontuários e fichas clínicas bloqueados por sigilo.
                </p>
              </div>
            )}

            {/* Navigation links */}
            <nav className="mt-4 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                if (!item.allowed) {
                  // Show locked item disabled
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/40 select-none"
                      title={item.restrictedMsg || 'Acesso restrito ao administrador'}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 opacity-50" />
                        <span>{item.label}</span>
                      </div>
                      <Lock className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 dark:bg-sky-500'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom quick badge */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">CliniOn SaaS v1.0</div>
            <div>Multi-tenant &bull; Firestore &bull; LGPD</div>
          </div>

        </div>
      </aside>
    </>
  );
};
