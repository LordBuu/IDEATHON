import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  User,
  ShieldCheck,
  Lock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  X,
  Stethoscope,
  ChevronDown,
  Building,
  HeartPulse,
  Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getPatientMedicalRecords,
  createMedicalRecord,
  addRecordAddendum,
  updateSupervisorStatus
} from '../services/medicalRecordService';
import { getPatients, getPatientById } from '../services/patientService';
import { MedicalRecord, Patient, RecordType, SupervisorValidationStatus } from '../types';

interface MedicalRecordPageProps {
  initialPatientId?: string;
  onBackToPatients: () => void;
}

export const MedicalRecordPage: React.FC<MedicalRecordPageProps> = ({ initialPatientId, onBackToPatients }) => {
  const { activeClinic, activeMember, user } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New Record Form State
  const [formOpen, setFormOpen] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>('evolucao');
  const [specialty, setSpecialty] = useState<string>('Fisioterapia');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [diagnosisHypothesis, setDiagnosisHypothesis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [evolutionNotes, setEvolutionNotes] = useState('');
  const [isFinalized, setIsFinalized] = useState(true);

  // Specialty specific metrics
  // Fisioterapia
  const [evaPainScale, setEvaPainScale] = useState(4); // 0-10
  const [mobilityRange, setMobilityRange] = useState('Mobilidade articular preservada com leve restrição');
  // Nutricao
  const [weightKg, setWeightKg] = useState('70');
  const [heightM, setHeightM] = useState('1.75');
  // Psicologia
  const [mentalState, setMentalState] = useState('Lúcido, orientado no tempo e espaço, afeto congruente');

  // Addendum Modal State
  const [addendumModalOpen, setAddendumModalOpen] = useState(false);
  const [selectedRecordForAddendum, setSelectedRecordForAddendum] = useState<MedicalRecord | null>(null);
  const [addendumText, setAddendumText] = useState('');

  const isReceptionist = activeMember?.role === 'receptionist';
  const isStudent = activeMember?.role === 'student';
  const isSupervisorOrAdmin = activeMember?.role === 'admin' || activeMember?.role === 'health_professional';

  // Load patient list and selected patient
  useEffect(() => {
    if (!activeClinic || isReceptionist) return;

    const init = async () => {
      setLoading(true);
      try {
        const pts = await getPatients(activeClinic.id, activeMember?.role || 'health_professional');
        setPatients(pts);

        const targetId = selectedPatientId || (pts[0] ? pts[0].id : '');
        if (targetId) {
          setSelectedPatientId(targetId);
          const p = await getPatientById(activeClinic.id, targetId, activeMember?.role || 'health_professional', {
            uid: user?.uid || '',
            displayName: user?.displayName || '',
          });
          setPatient(p);

          const recs = await getPatientMedicalRecords(
            activeClinic.id,
            targetId,
            activeMember?.role || 'health_professional'
          );
          setRecords(recs);
        }
      } catch (err) {
        console.error('Error loading medical records:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [activeClinic, selectedPatientId, activeMember]);

  const handleSelectPatient = async (pId: string) => {
    setSelectedPatientId(pId);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic || !user || !activeMember || !patient) return;

    // Specialty data payload
    let specialtyData: any = {};
    if (specialty === 'Fisioterapia') {
      specialtyData = { evaPainScale, mobilityRange };
    } else if (specialty === 'Nutrição') {
      const w = parseFloat(weightKg) || 0;
      const h = parseFloat(heightM) || 1;
      const imc = (w / (h * h)).toFixed(2);
      specialtyData = { weightKg, heightM, imc };
    } else if (specialty === 'Psicologia') {
      specialtyData = { mentalState };
    }

    try {
      await createMedicalRecord(
        activeClinic.id,
        {
          patientId: patient.id,
          recordType,
          specialty,
          authorUid: user.uid,
          authorName: user.displayName || 'Profissional',
          authorRole: activeMember.role,
          authorRegister: user.professionalRegister || activeMember.professionalRegister,
          supervisorUid: isStudent ? (activeMember.supervisorUid || 'supervisor_pendente') : undefined,
          supervisorName: isStudent ? (activeMember.supervisorName || user.supervisorName || 'Supervisor Responsável') : undefined,
          supervisorValidationStatus: isStudent ? 'pending_review' : 'not_required',
          chiefComplaint,
          clinicalHistory,
          physicalExamination,
          diagnosisHypothesis,
          treatmentPlan,
          evolutionNotes,
          specialtyData,
          isFinalized,
        },
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );

      // Reset form
      setFormOpen(false);
      setChiefComplaint('');
      setClinicalHistory('');
      setPhysicalExamination('');
      setDiagnosisHypothesis('');
      setTreatmentPlan('');
      setEvolutionNotes('');

      // Refresh records
      const updated = await getPatientMedicalRecords(
        activeClinic.id,
        patient.id,
        activeMember.role
      );
      setRecords(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar prontuário.');
    }
  };

  const handleAddAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic || !selectedRecordForAddendum || !user || !activeMember || !patient) return;
    if (!addendumText.trim()) return;

    try {
      await addRecordAddendum(
        activeClinic.id,
        selectedRecordForAddendum.id,
        addendumText,
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );

      setAddendumModalOpen(false);
      setAddendumText('');
      const updated = await getPatientMedicalRecords(
        activeClinic.id,
        patient.id,
        activeMember.role
      );
      setRecords(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao emitir adendo.');
    }
  };

  const handleSupervisorReview = async (recordId: string, status: SupervisorValidationStatus) => {
    if (!activeClinic || !user || !activeMember || !patient) return;
    try {
      await updateSupervisorStatus(activeClinic.id, recordId, status, {
        uid: user.uid,
        displayName: user.displayName,
        role: activeMember.role,
      });

      const updated = await getPatientMedicalRecords(
        activeClinic.id,
        patient.id,
        activeMember.role
      );
      setRecords(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar validação do supervisor.');
    }
  };

  if (isReceptionist) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100">
          Acesso Estritamente Restrito
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
          O Prontuário Eletrônico do Paciente é protegido por sigilo profissional e pela legislação de saúde. 
          O perfil de <strong>Recepcionista</strong> não tem permissão para visualizar, registrar ou editar evoluções 
          clínicas, laudos ou anamneses na plataforma CliniOn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Bar with Patient Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            <span>Prontuário Eletrônico do Paciente (PEP)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Anamneses, evoluções clínicas, histórico de procedimentos e adendos imutáveis com rastreabilidade legal.
          </p>
        </div>

        {/* Patient selector & New Record button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={e => handleSelectPatient(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} (CPF: {p.cpf})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro Clínico</span>
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      {patient && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Patient info */}
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-lg shadow-inner shrink-0">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {patient.fullName}
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    CPF: {patient.cpf}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Nascimento: {patient.birthDate ? new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                  <span>&bull;</span>
                  <span>Gênero: {patient.gender}</span>
                  <span>&bull;</span>
                  <span>Telefone: {patient.phone}</span>
                  <span>&bull;</span>
                  <span>Convênio: {patient.healthInsurance}</span>
                </div>
              </div>
            </div>

            {/* Right: Clinical Alert Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Tipo: {patient.bloodType || 'N/I'}
              </span>

              {patient.allergies ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Alergia: {patient.allergies}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
                  Sem alergias relatadas
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* New Medical Record Drawer / Modal */}
      {formOpen && patient && (
        <div className="p-6 rounded-2xl border-2 border-sky-400/40 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Preenchimento de Registro Clínico</span>
              </h3>
              <p className="text-xs text-slate-500">
                Autor: {user?.displayName} ({activeMember?.role}) &bull; Reg: {user?.professionalRegister || 'Não informado'}
                {isStudent && ` | Supervisor: ${activeMember?.supervisorName || 'Sob Supervisão'}`}
              </p>
            </div>
            <button
              onClick={() => setFormOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveRecord} className="space-y-4">
            
            {/* Record Type & Specialty Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Documento Clínico *
                </label>
                <select
                  value={recordType}
                  onChange={e => setRecordType(e.target.value as RecordType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="evolucao">Evolução Clínica de Sessão</option>
                  <option value="avaliacao_inicial">Avaliação Inicial / Anamnese</option>
                  <option value="procedimento">Procedimento / Conduta Específica</option>
                  <option value="prescricao">Prescrição Terapêutica / Recomendações</option>
                  <option value="atestado">Declaração / Atestado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Especialidade Médica / Saúde *
                </label>
                <select
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Psicologia">Psicologia</option>
                  <option value="Medicina">Medicina</option>
                  <option value="Nutrição">Nutrição</option>
                  <option value="Geral">Clínica Geral</option>
                </select>
              </div>
            </div>

            {/* Specialty Specific Fields */}
            {specialty === 'Fisioterapia' && (
              <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900 space-y-3">
                <div className="font-semibold text-xs text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-sky-600" />
                  <span>Módulo Especializado: Fisioterapia e Reabilitação</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Escala Visual Analógica de Dor (EVA: {evaPainScale}/10)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={evaPainScale}
                      onChange={e => setEvaPainScale(Number(e.target.value))}
                      className="w-full accent-sky-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0 (Sem dor)</span>
                      <span>5 (Moderada)</span>
                      <span>10 (Insuportável)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Amplitude de Movimento (ADM) / Testes Ortopédicos
                    </label>
                    <input
                      type="text"
                      value={mobilityRange}
                      onChange={e => setMobilityRange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {specialty === 'Nutrição' && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 space-y-3">
                <div className="font-semibold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Módulo Especializado: Nutrição e Antropometria</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Peso Atual (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Altura (m)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={heightM}
                      onChange={e => setHeightM(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      IMC Calculado
                    </label>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      {((parseFloat(weightKg) || 0) / ((parseFloat(heightM) || 1) ** 2)).toFixed(2)} kg/m²
                    </div>
                  </div>
                </div>
              </div>
            )}

            {specialty === 'Psicologia' && (
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 space-y-2">
                <div className="font-semibold text-xs text-purple-800 dark:text-purple-300">
                  Módulo Especializado: Psicologia Clínica e Estado Mental
                </div>
                <input
                  type="text"
                  placeholder="Exame das funções psíquicas (atenção, memória, humor, pensamento)..."
                  value={mentalState}
                  onChange={e => setMentalState(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                />
              </div>
            )}

            {/* Core Fields: Anamnese or Evolution */}
            {recordType === 'avaliacao_inicial' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Queixa Principal (QP)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Motivo central da consulta nas palavras do paciente..."
                    value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Histórico da Moléstia Atual (HMA) e Antecedentes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Evolução temporal dos sintomas, tratamentos prévios, fatores de melhora e piora..."
                    value={clinicalHistory}
                    onChange={e => setClinicalHistory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Exame Físico / Avaliação
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Achados objetivos, palpação, inspeção..."
                      value={physicalExamination}
                      onChange={e => setPhysicalExamination(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hipótese Diagnóstica (CID/CIF)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Conclusão clínica e hipóteses diagnósticas..."
                      value={diagnosisHypothesis}
                      onChange={e => setDiagnosisHypothesis(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Conduta e Plano Terapêutico
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Procedimentos indicados, frequência semanal, metas..."
                    value={treatmentPlan}
                    onChange={e => setTreatmentPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Evolution Notes */}
            {recordType !== 'avaliacao_inicial' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anotações da Evolução Clínica / Procedimento Realizado *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Relato detalhado da sessão, exercícios executados, resposta do paciente, orientações fornecidas..."
                  value={evolutionNotes}
                  onChange={e => setEvolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {/* Seal and Finalization Notice */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFinalized}
                  onChange={e => setIsFinalized(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Finalizar e Assinar Registro (Inalterável após confirmação)
                </span>
              </label>
              <div className="text-[11px] text-slate-400">
                Correções posteriores exigem emissão de Adendo.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Gravar Registro no Prontuário</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Timeline of Clinical Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Linha do Tempo de Atendimentos ({records.length} registros)</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Carregando prontuário...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum registro clínico cadastrado para este paciente.
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clique em "+ Novo Registro Clínico" para iniciar o prontuário.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => {
              const isRecordStudent = record.authorRole === 'student';

              return (
                <div
                  key={record.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                >
                  {/* Record Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                        {record.recordType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {record.specialty}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-500">
                        {new Date(record.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Finalized seal & Supervisor Badge */}
                    <div className="flex items-center gap-2">
                      {record.isFinalized && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <Lock className="w-3 h-3" />
                          <span>Finalizado & Assinado</span>
                        </span>
                      )}

                      {isRecordStudent && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            record.supervisorValidationStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {record.supervisorValidationStatus === 'approved' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Supervisão Aprovada</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Aguardando Validação do Supervisor</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Author identification */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <div>
                      <strong>Profissional:</strong> {record.authorName} ({record.authorRole}) 
                      {record.authorRegister && ` &bull; ${record.authorRegister}`}
                      {record.supervisorName && (
                        <span className="text-slate-500 italic ml-2">
                          (Supervisor: {record.supervisorName})
                        </span>
                      )}
                    </div>

                    {/* Supervisor Review action if active user is supervisor */}
                    {isSupervisorOrAdmin && isRecordStudent && record.supervisorValidationStatus !== 'approved' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSupervisorReview(record.id, 'approved')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Aprovar Registro
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content details */}
                  <div className="text-xs text-slate-800 dark:text-slate-200 space-y-2 pt-1">
                    {record.chiefComplaint && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Queixa Principal: </span>
                        <span>{record.chiefComplaint}</span>
                      </div>
                    )}

                    {record.clinicalHistory && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Histórico Clínico: </span>
                        <span>{record.clinicalHistory}</span>
                      </div>
                    )}

                    {record.physicalExamination && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Exame Físico: </span>
                        <span>{record.physicalExamination}</span>
                      </div>
                    )}

                    {record.diagnosisHypothesis && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Hipótese Diagnóstica: </span>
                        <span>{record.diagnosisHypothesis}</span>
                      </div>
                    )}

                    {record.treatmentPlan && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Conduta / Plano: </span>
                        <span>{record.treatmentPlan}</span>
                      </div>
                    )}

                    {record.evolutionNotes && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 leading-relaxed">
                        {record.evolutionNotes}
                      </div>
                    )}

                    {/* Specialty Data tags */}
                    {record.specialtyData && Object.keys(record.specialtyData).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {record.specialtyData.evaPainScale !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold text-[10px]">
                            Dor EVA: {record.specialtyData.evaPainScale}/10
                          </span>
                        )}
                        {record.specialtyData.imc && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            IMC: {record.specialtyData.imc} kg/m² ({record.specialtyData.weightKg}kg / {record.specialtyData.heightM}m)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Addendums List */}
                  {record.addendums && record.addendums.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Adendos Retificadores (Inalteráveis)
                      </div>
                      {record.addendums.map(ad => (
                        <div
                          key={ad.id}
                          className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 text-xs"
                        >
                          <div className="font-semibold text-amber-900 dark:text-amber-300 text-[11px] mb-1">
                            Emitido por {ad.authorName} em {new Date(ad.createdAt).toLocaleString('pt-BR')}
                          </div>
                          <div className="text-slate-800 dark:text-slate-200">{ad.note}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer Action: Add Addendum */}
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedRecordForAddendum(record);
                        setAddendumModalOpen(true);
                      }}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Emitir Adendo Retificador</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Adendo Retificador */}
      {addendumModalOpen && selectedRecordForAddendum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Emitir Adendo Retificador</span>
              </h2>
              <button
                onClick={() => setAddendumModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Conforme as normas dos conselhos de saúde (CFM, CREFITO, CRP), registros clínicos finalizados não podem 
              ser alterados ou apagados. Qualquer correção ou nota suplementar é anexada como adendo com registro do autor e data.
            </p>

            <form onSubmit={handleAddAddendum} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Texto do Adendo / Retificação *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Esclarecimento sobre a conduta, correção de termo, anexo de novos laudos de exames..."
                  value={addendumText}
                  onChange={e => setAddendumText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddendumModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  Gravar Adendo Imutável
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
