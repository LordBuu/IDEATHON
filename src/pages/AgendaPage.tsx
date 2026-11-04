import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  Building,
  User,
  Stethoscope,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment
} from '../services/appointmentService';
import { getClinicMembers, getClinicUnits } from '../services/clinicService';
import { getPatients } from '../services/patientService';
import { Appointment, AppointmentStatus, ClinicMember, ClinicUnit, Patient } from '../types';

interface AgendaPageProps {
  onOpenMedicalRecord?: (patientId: string) => void;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({ onOpenMedicalRecord }) => {
  const { activeClinic, activeMember, user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [units, setUnits] = useState<ClinicUnit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and views
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterProfessional, setFilterProfessional] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Form state
  const [formPatientId, setFormPatientId] = useState('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientPhone, setFormPatientPhone] = useState('');
  const [formProfessionalUid, setFormProfessionalUid] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('Fisioterapia');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(50);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleUnitId, setRescheduleUnitId] = useState('');

  const isReceptionist = activeMember?.role === 'receptionist';

  const loadData = async () => {
    if (!activeClinic) return;
    setLoading(true);
    try {
      const [u, m] = await Promise.all([
        getClinicUnits(activeClinic.id),
        getClinicMembers(activeClinic.id),
      ]);
      setUnits(u);
      setMembers(m);

      if (!isReceptionist) {
        try {
          const pts = await getPatients(activeClinic.id, activeMember?.role || 'health_professional');
          setPatients(pts);
        } catch (e) {
          console.warn('Patients fetch skipped for restricted role');
        }
      }

      await fetchFilteredAppointments();
    } catch (err) {
      console.error('Error loading agenda data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredAppointments = async () => {
    if (!activeClinic) return;
    try {
      let startDate = selectedDate;
      let endDate = selectedDate;

      if (viewMode === 'week') {
        const curr = new Date(selectedDate);
        const first = curr.getDate() - curr.getDay();
        const firstDay = new Date(curr.setDate(first));
        const lastDay = new Date(curr.setDate(first + 6));
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      } else if (viewMode === 'month') {
        const [year, month] = selectedDate.split('-');
        startDate = `${year}-${month}-01`;
        endDate = `${year}-${month}-31`;
      }

      const apps = await getAppointments(activeClinic.id, {
        startDate,
        endDate,
        professionalUid: filterProfessional !== 'all' ? filterProfessional : undefined,
        unitId: filterUnit !== 'all' ? filterUnit : undefined,
      });
      setAppointments(apps);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeClinic, activeMember]);

  useEffect(() => {
    fetchFilteredAppointments();
  }, [selectedDate, viewMode, filterProfessional, filterUnit]);

  // Navigate date
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handlePatientSelect = (patientId: string) => {
    setFormPatientId(patientId);
    const p = patients.find(x => x.id === patientId);
    if (p) {
      setFormPatientName(p.fullName);
      setFormPatientPhone(p.phone);
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activeClinic || !user || !activeMember) return;
    if (!formPatientName || !formProfessionalUid || !formUnitId || !formDate || !formTime) {
      setFormError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    const prof = members.find(m => m.uid === formProfessionalUid);
    const unt = units.find(u => u.id === formUnitId);

    try {
      await createAppointment(
        activeClinic.id,
        {
          patientId: formPatientId || 'temp_patient',
          patientName: formPatientName,
          patientPhone: formPatientPhone,
          professionalUid: formProfessionalUid,
          professionalName: prof?.displayName || 'Profissional',
          unitId: formUnitId,
          unitName: unt?.name || 'Unidade Principal',
          specialty: formSpecialty,
          date: formDate,
          time: formTime,
          durationMinutes: Number(formDuration),
          status: 'agendado',
          notes: formNotes,
        },
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );

      setCreateModalOpen(false);
      resetForm();
      await fetchFilteredAppointments();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar agendamento.');
    }
  };

  const handleStatusChange = async (appId: string, status: AppointmentStatus) => {
    if (!activeClinic || !user || !activeMember) return;
    try {
      await updateAppointmentStatus(activeClinic.id, appId, status, {
        uid: user.uid,
        displayName: user.displayName,
        role: activeMember.role,
      });
      await fetchFilteredAppointments();
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  const openReschedule = (app: Appointment) => {
    setSelectedAppointment(app);
    setRescheduleDate(app.date);
    setRescheduleTime(app.time);
    setRescheduleUnitId(app.unitId);
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic || !selectedAppointment || !user || !activeMember) return;

    const targetUnit = units.find(u => u.id === rescheduleUnitId);
    try {
      await rescheduleAppointment(
        activeClinic.id,
        selectedAppointment.id,
        rescheduleDate,
        rescheduleTime,
        rescheduleUnitId,
        targetUnit?.name,
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );
      setRescheduleModalOpen(false);
      await fetchFilteredAppointments();
    } catch (err: any) {
      alert(err.message || 'Erro ao reagendar.');
    }
  };

  const resetForm = () => {
    setFormPatientId('');
    setFormPatientName('');
    setFormPatientPhone('');
    setFormDate(selectedDate);
    setFormTime('09:00');
    setFormNotes('');
    setFormError('');
  };

  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case 'agendado':
        return { label: 'Agendado', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
      case 'confirmado':
        return { label: 'Confirmado', bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' };
      case 'presente':
        return { label: 'Presente na Recepção', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold' };
      case 'em_atendimento':
        return { label: 'Em Atendimento', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse font-bold' };
      case 'concluido':
        return { label: 'Concluído', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'falta':
        return { label: 'Falta', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'cancelado':
        return { label: 'Cancelado', bg: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 line-through' };
      case 'reagendado':
        return { label: 'Reagendado', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      default:
        return { label: st, bg: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-600" />
            <span>Agenda de Atendimentos</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de horários, presenças, confirmações e triagem por profissional e unidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'day' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'week' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'month' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Filters Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Dia anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Hoje
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />

          <button
            onClick={() => changeDate(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Próximo dia"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2 capitalize">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Professional Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterProfessional}
              onChange={e => setFilterProfessional(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Todos Profissionais</option>
              {members
                .filter(m => m.role === 'health_professional' || m.role === 'student' || m.role === 'admin')
                .map(m => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName} ({m.profession || m.role})
                  </option>
                ))}
            </select>
          </div>

          {/* Unit Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterUnit}
              onChange={e => setFilterUnit(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Todas Unidades</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Appointments List / Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Carregando agendamentos...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhuma consulta agendada para o período selecionado.
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clique em "+ Novo Agendamento" para adicionar um paciente na grade.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {appointments.map(app => {
              const badge = getStatusBadge(app.status);

              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Time, Patient and Details */}
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center justify-center w-14 py-2 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-100 dark:border-sky-900 text-sky-900 dark:text-sky-300 font-mono font-bold text-sm">
                      <span>{app.time}</span>
                      <span className="text-[10px] font-normal opacity-70">{app.durationMinutes}m</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {app.patientName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {app.date !== selectedDate && (
                          <span className="text-[10px] text-slate-400 font-mono">({app.date})</span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-slate-400" />
                          {app.professionalName} ({app.specialty})
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {app.unitName}
                        </span>
                        {app.patientPhone && (
                          <>
                            <span>&bull;</span>
                            <span>Tel: {app.patientPhone}</span>
                          </>
                        )}
                      </div>

                      {app.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded inline-block">
                          Obs: {app.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    
                    {/* Status quick buttons */}
                    {app.status === 'agendado' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'confirmado')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300"
                      >
                        Confirmar
                      </button>
                    )}

                    {(app.status === 'agendado' || app.status === 'confirmado') && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'presente')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-xs"
                      >
                        Chegou na Recepção
                      </button>
                    )}

                    {/* Open EHR if authorized */}
                    {!isReceptionist && onOpenMedicalRecord && (
                      <button
                        onClick={() => {
                          if (app.status === 'presente') {
                            handleStatusChange(app.id, 'em_atendimento');
                          }
                          onOpenMedicalRecord(app.patientId);
                        }}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Prontuário</span>
                      </button>
                    )}

                    {app.status === 'em_atendimento' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'concluido')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                      >
                        Concluir
                      </button>
                    )}

                    {/* Reschedule */}
                    <button
                      onClick={() => openReschedule(app)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      Remarcar
                    </button>

                    {/* Absent / Cancel */}
                    {app.status !== 'concluido' && app.status !== 'cancelado' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'falta')}
                        className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        title="Registrar falta"
                      >
                        Falta
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Novo Agendamento */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Novo Agendamento</span>
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paciente *
                </label>
                {patients.length > 0 ? (
                  <select
                    value={formPatientId}
                    onChange={e => handlePatientSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Selecione um paciente cadastrado...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} - CPF: {p.cpf}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do paciente"
                    value={formPatientName}
                    onChange={e => setFormPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              {/* Phone if manual */}
              {!formPatientId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formPatientPhone}
                    onChange={e => setFormPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Professional & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Profissional de Saúde *
                  </label>
                  <select
                    required
                    value={formProfessionalUid}
                    onChange={e => setFormProfessionalUid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Selecione o profissional...</option>
                    {members
                      .filter(m => m.role === 'health_professional' || m.role === 'student' || m.role === 'admin')
                      .map(m => (
                        <option key={m.uid} value={m.uid}>
                          {m.displayName} ({m.profession || m.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidade *
                  </label>
                  <select
                    value={formSpecialty}
                    onChange={e => setFormSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Psicologia">Psicologia</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Nutrição">Nutrição</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unidade da Clínica *
                </label>
                <select
                  required
                  value={formUnitId}
                  onChange={e => setFormUnitId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Selecione a unidade...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date, Time, Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duração
                  </label>
                  <select
                    value={formDuration}
                    onChange={e => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações de Agendamento
                </label>
                <textarea
                  rows={2}
                  placeholder="Queixa relatada, primeira consulta ou retorno..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                >
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remarcar */}
      {rescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Remarcar Atendimento
              </h2>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {selectedAppointment.patientName}
                </div>
                <div>Profissional: {selectedAppointment.professionalName}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nova Data
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Novo Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unidade
                </label>
                <select
                  value={rescheduleUnitId}
                  onChange={e => setRescheduleUnitId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                >
                  Confirmar Reagendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
