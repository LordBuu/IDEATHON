import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { AgendaPage } from './pages/AgendaPage';
import { PatientsPage } from './pages/PatientsPage';
import { MedicalRecordPage } from './pages/MedicalRecordPage';
import { ClinicManagementPage } from './pages/ClinicManagementPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AuthPage } from './pages/AuthPage';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, activeClinic, loading, activeMember } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-400 text-white font-bold text-xl flex items-center justify-center animate-pulse shadow-lg">
            C
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            <span>Carregando CliniOn Saúde...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in or no active clinic selected
  if (!user || !activeClinic) {
    return <AuthPage />;
  }

  const handleOpenMedicalRecord = (patientId: string) => {
    setSelectedPatientForRecord(patientId);
    setCurrentTab('records');
  };

  const handleDashboardNavigate = (tab: 'agenda' | 'patients' | 'records' | 'clinic' | 'settings', patientId?: string) => {
    if (patientId) {
      setSelectedPatientForRecord(patientId);
    }
    setCurrentTab(tab as NavTab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigateToSettings={() => setCurrentTab('settings')}
      />

      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            setCurrentTab(tab);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={handleDashboardNavigate} />
          )}

          {currentTab === 'agenda' && (
            <AgendaPage onOpenMedicalRecord={handleOpenMedicalRecord} />
          )}

          {currentTab === 'patients' && (
            <PatientsPage onOpenMedicalRecord={handleOpenMedicalRecord} />
          )}

          {currentTab === 'records' && (
            <MedicalRecordPage
              initialPatientId={selectedPatientForRecord}
              onBackToPatients={() => setCurrentTab('patients')}
            />
          )}

          {currentTab === 'clinic' && (
            <ClinicManagementPage />
          )}

          {currentTab === 'audit' && (
            <AuditLogPage />
          )}

          {currentTab === 'settings' && (
            <ClinicManagementPage />
          )}
        </main>

      </div>

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
