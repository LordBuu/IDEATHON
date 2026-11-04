import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Building2,
  ChevronDown,
  UserCheck,
  LogOut,
  ShieldAlert,
  Stethoscope,
  GraduationCap,
  Sparkles,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigateToSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigateToSettings }) => {
  const { user, activeClinic, activeMember, userClinics, switchClinic, signOut, switchDemoPersona } = useAuth();
  const { mode, setMode } = useTheme();

  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: ShieldAlert,
        };
      case 'health_professional':
        return {
          label: 'Profissional de Saúde',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: Stethoscope,
        };
      case 'student':
        return {
          label: 'Aluno / Estagiário',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: GraduationCap,
        };
      case 'receptionist':
        return {
          label: 'Recepção / Operacional',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: UserCheck,
        };
      default:
        return {
          label: 'Membro',
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
          icon: UserCheck,
        };
    }
  };

  const roleInfo = getRoleBadge(activeMember?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left side: Hamburger & Branding */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-tr from-sky-600 to-teal-400 text-white font-bold tracking-wider text-lg">
              C
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Clini<span className="text-sky-600 dark:text-sky-400">On</span></span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded tracking-wider bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  SaaS Saúde
                </span>
              </span>
            </div>
          </div>

          {/* Clinic Switcher */}
          {activeClinic && (
            <div className="relative ml-4 hidden md:block">
              <button
                onClick={() => setClinicMenuOpen(!clinicMenuOpen)}
                className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[160px] truncate">{activeClinic.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {clinicMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Clínicas Vinculadas
                  </div>
                  {userClinics.map(({ clinic, member }) => (
                    <button
                      key={clinic.id}
                      onClick={() => {
                        switchClinic(clinic.id);
                        setClinicMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        activeClinic.id === clinic.id ? 'font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{clinic.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {member.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quick RBAC Persona Switcher (For testing roles easily) */}
          {activeClinic && (
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${roleInfo.color}`}
                title="Trocar perfil para testes de permissões RBAC"
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{roleInfo.label}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>Simular Papel (RBAC)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Teste o isolamento de dados e regras do sistema alternando de função em tempo real:
                  </p>
                  <div className="mt-1 space-y-1">
                    <button
                      onClick={() => {
                        switchDemoPersona('admin');
                        setPersonaMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">Administrador</div>
                        <div className="text-[10px] text-slate-500">Gestão geral, unidades, equipe e identidade</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        switchDemoPersona('doctor');
                        setPersonaMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                    >
                      <Stethoscope className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">Profissional de Saúde</div>
                        <div className="text-[10px] text-slate-500">Agenda, pacientes e prontuário completo</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        switchDemoPersona('student');
                        setPersonaMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                    >
                      <GraduationCap className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">Aluno / Estagiário</div>
                        <div className="text-[10px] text-slate-500">Prontuário com validação de supervisor</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        switchDemoPersona('receptionist');
                        setPersonaMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                    >
                      <UserCheck className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">Recepcionista</div>
                        <div className="text-[10px] text-slate-500">Apenas agendamentos (Prontuário estritamente BLOQUEADO)</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Mode Selector (Light, Dark, System) */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Aparência do Tema"
              aria-label="Trocar tema"
            >
              {mode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {mode === 'dark' && <Moon className="w-4 h-4 text-sky-400" />}
              {mode === 'system' && <Monitor className="w-4 h-4 text-slate-500" />}
            </button>

            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-50">
                <button
                  onClick={() => {
                    setMode('light');
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs ${
                    mode === 'light' ? 'font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Modo Claro</span>
                </button>
                <button
                  onClick={() => {
                    setMode('dark');
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs ${
                    mode === 'dark' ? 'font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-4 h-4 text-sky-400" />
                  <span>Modo Escuro</span>
                </button>
                <button
                  onClick={() => {
                    setMode('system');
                    setThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs ${
                    mode === 'system' ? 'font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-slate-500" />
                  <span>Automático</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center space-x-2 p-1 pl-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex flex-col text-right hidden md:block">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                  {user?.displayName || 'Usuário'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.profession || 'Saúde'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {user?.displayName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </div>
                  {user?.professionalRegister && (
                    <div className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 inline-block">
                      {user.professionalRegister}
                    </div>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      onNavigateToSettings();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <span>Configurações & Temas</span>
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
