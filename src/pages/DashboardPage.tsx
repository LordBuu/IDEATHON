import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  UserX,
  PlusCircle,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { getPatients } from '../services/patientService';
import { getClinicUnits } from '../services/clinicService';
import { Appointment, ClinicUnit, Patient } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: 'agenda' | 'patients' | 'records' | 'clinic' | 'settings', patientId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { activeClinic, activeMember, user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [units, setUnits] = useState<ClinicUnit[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isReceptionist = activeMember?.role === 'receptionist';

  const loadData = async () => {
    if (!activeClinic) return;
    setLoading(true);
    try {
      // 1. Units
      const u = await getClinicUnits(activeClinic.id);
      setUnits(u);

      // 2. Appointments today
      const apps = await getAppointments(activeClinic.id, {
        startDate: todayStr,
        endDate: todayStr,
      });
      setTodayAppointments(apps);

      // 3. Patients (if not receptionist)
      if (!isReceptionist) {
        const pts = await getPatients(activeClinic.id, activeMember?.role || 'health_professional');
        setPatients(pts);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeClinic, activeMember]);

  const handleStatusChange = async (appointmentId: string, status: any) => {
    if (!activeClinic || !user || !activeMember) return;
    try {
      await updateAppointmentStatus(activeClinic.id, appointmentId, status, {
        uid: user.uid,
        displayName: user.displayName,
        role: activeMember.role,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  // KPIs
  const totalToday = todayAppointments.length;
  const completedToday = todayAppointments.filter(a => a.status === 'concluido').length;
  const presentToday = todayAppointments.filter(a => a.status === 'presente' || a.status === 'em_atendimento').length;
  const noShowToday = todayAppointments.filter(a => a.status === 'falta' || a.status === 'cancelado').length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-sky-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-sky-300" />
            <span>Painel Operacional &bull; {activeClinic?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {user?.displayName || 'Profissional'}
          </h1>
          <p className="mt-1 text-sm text-sky-100 max-w-xl">
            {isReceptionist
              ? 'Gestão de recepção ativa: organize a fila de espera, confirme presenças e acompanhe os horários de hoje.'
              : 'Gerencie atendimentos, prontuários clínicos e indicadores em tempo real com total conformidade LGPD.'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('agenda')}
            className="px-4 py-2.5 rounded-xl bg-white text-sky-900 font-semibold text-xs shadow-sm hover:bg-sky-50 transition-colors flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Novo Agendamento</span>
          </button>
          {!isReceptionist && (
            <button
              onClick={() => onNavigate('patients')}
              className="px-4 py-2.5 rounded-xl bg-sky-800/80 hover:bg-sky-800 border border-sky-400/40 text-white font-semibold text-xs transition-colors flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-sky-200" />
              <span>Novo Paciente</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Patients */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Pacientes Ativos</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {isReceptionist ? 'Restrito' : (loading ? '...' : patients.length)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Cadastrados no sistema</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Appointments Today */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Consultas Hoje</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? '...' : totalToday}
            </div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-1 font-medium">
              <Clock className="w-3 h-3" />
              <span>{presentToday} aguardando / em sessão</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Atendimentos Concluídos</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? '...' : completedToday}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sessões finalizadas</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* No Shows / Cancellations */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Faltas / Cancelamentos</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? '...' : noShowToday}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Taxa de falta monitorada</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Split: Today's Schedule & Units */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's appointments (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Agenda do Dia</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atendimentos agendados para hoje ({new Date().toLocaleDateString('pt-BR')})
              </p>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Ver agenda completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Carregando consultas...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm font-medium">Nenhum atendimento agendado para hoje.</div>
              <button
                onClick={() => onNavigate('agenda')}
                className="mt-3 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                + Agendar primeiro paciente
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map(app => {
                const getStatusStyle = (st: string) => {
                  switch (st) {
                    case 'concluido':
                      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                    case 'presente':
                      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
                    case 'em_atendimento':
                      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse';
                    case 'confirmado':
                      return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
                    case 'falta':
                      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                    default:
                      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                  }
                };

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="px-2.5 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono font-bold text-xs text-center">
                        {app.time}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{app.patientName}</span>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold ${getStatusStyle(app.status)}`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-3">
                          <span>Profissional: {app.professionalName}</span>
                          <span>&bull;</span>
                          <span>Especialidade: {app.specialty}</span>
                          <span>&bull;</span>
                          <span>Unidade: {app.unitName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational quick actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {app.status === 'agendado' && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'confirmado')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300"
                        >
                          Confirmar
                        </button>
                      )}
                      {(app.status === 'agendado' || app.status === 'confirmado') && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'presente')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300"
                        >
                          Chegou na Recepção
                        </button>
                      )}
                      {app.status === 'presente' && !isReceptionist && (
                        <button
                          onClick={() => {
                            handleStatusChange(app.id, 'em_atendimento');
                            onNavigate('records', app.patientId);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Chamar / Abrir Prontuário
                        </button>
                      )}
                      {app.status === 'em_atendimento' && (
                        <button
                          onClick={() => handleStatusChange(app.id, 'concluido')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                        >
                          Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side: Units & Clinical Summary */}
        <div className="space-y-6">
          
          {/* Units Overview */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-600" />
                <span>Unidades Físicas</span>
              </h2>
              {activeMember?.role === 'admin' && (
                <button
                  onClick={() => onNavigate('clinic')}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Gerenciar
                </button>
              )}
            </div>

            <div className="space-y-3">
              {units.map(unit => (
                <div
                  key={unit.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{unit.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                      Ativa
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {unit.address}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {unit.roomsCount ? `${unit.roomsCount} consultórios disponíveis` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinora SaaS Guarantee Card */}
          <div className="p-5 rounded-2xl border border-sky-100 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 text-slate-800 dark:text-slate-200">
            <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-300 font-bold text-xs mb-1">
              <Stethoscope className="w-4 h-4" />
              <span>Multi-Especialidades</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Prontuários especializados para Fisioterapia (exame motor e postural), Psicologia (estado mental), Medicina (SOAP) e Nutrição com cálculo de metas.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
