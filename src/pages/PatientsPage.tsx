import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldAlert,
  FileText,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  AlertTriangle,
  X,
  Edit2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPatients, createPatient, updatePatient } from '../services/patientService';
import { getClinicUnits } from '../services/clinicService';
import { ClinicUnit, Patient } from '../types';

interface PatientsPageProps {
  onOpenMedicalRecord: (patientId: string) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({ onOpenMedicalRecord }) => {
  const { activeClinic, activeMember, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [units, setUnits] = useState<ClinicUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Não informado');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodType, setBloodType] = useState('Não informado');
  const [allergies, setAllergies] = useState('');
  const [healthInsurance, setHealthInsurance] = useState('Particular');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [primaryUnitId, setPrimaryUnitId] = useState('');
  const [formError, setFormError] = useState('');

  const isReceptionist = activeMember?.role === 'receptionist';

  const loadData = async () => {
    if (!activeClinic || isReceptionist) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [pts, u] = await Promise.all([
        getPatients(activeClinic.id, activeMember?.role || 'health_professional'),
        getClinicUnits(activeClinic.id),
      ]);
      setPatients(pts);
      setUnits(u);
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeClinic, activeMember]);

  if (isReceptionist) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100">
          Acesso Restrito: Cadastro de Pacientes
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
          Conforme as diretrizes da LGPD (Lei Geral de Proteção de Dados) e as regras de segurança da CliniOn, o perfil 
          de <strong>Recepcionista</strong> não possui autorização para consultar dados clínicos, diagnósticos ou o 
          cadastro detalhado de pacientes. Seu acesso é restrito à Agenda de Consultas e confirmações operacionais.
        </p>
      </div>
    );
  }

  const handleOpenNew = () => {
    setIsEditing(false);
    setSelectedPatient(null);
    setFullName('');
    setCpf('');
    setBirthDate('');
    setGender('Feminino');
    setPhone('');
    setEmail('');
    setAddress('');
    setEmergencyContact('');
    setBloodType('Não informado');
    setAllergies('');
    setHealthInsurance('Particular');
    setInsuranceNumber('');
    setNotes('');
    setPrimaryUnitId(units[0]?.id || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setIsEditing(true);
    setSelectedPatient(p);
    setFullName(p.fullName);
    setCpf(p.cpf);
    setBirthDate(p.birthDate || '');
    setGender(p.gender || 'Não informado');
    setPhone(p.phone);
    setEmail(p.email || '');
    setAddress(p.address || '');
    setEmergencyContact(p.emergencyContact || '');
    setBloodType(p.bloodType || 'Não informado');
    setAllergies(p.allergies || '');
    setHealthInsurance(p.healthInsurance || 'Particular');
    setInsuranceNumber(p.insuranceNumber || '');
    setNotes(p.notes || '');
    setPrimaryUnitId(p.primaryUnitId || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activeClinic || !user || !activeMember) return;
    if (!fullName || !cpf || !phone) {
      setFormError('Preencha os campos obrigatórios (Nome, CPF e Telefone).');
      return;
    }

    try {
      if (isEditing && selectedPatient) {
        await updatePatient(
          activeClinic.id,
          selectedPatient.id,
          {
            fullName,
            cpf,
            birthDate,
            gender,
            phone,
            email,
            address,
            emergencyContact,
            bloodType,
            allergies,
            healthInsurance,
            insuranceNumber,
            notes,
            primaryUnitId,
          },
          {
            uid: user.uid,
            displayName: user.displayName,
            role: activeMember.role,
          }
        );
      } else {
        await createPatient(
          activeClinic.id,
          {
            fullName,
            cpf,
            birthDate,
            gender,
            phone,
            email,
            address,
            emergencyContact,
            bloodType,
            allergies,
            healthInsurance,
            insuranceNumber,
            notes,
            primaryUnitId,
          },
          {
            uid: user.uid,
            displayName: user.displayName,
            role: activeMember.role,
          }
        );
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar paciente.');
    }
  };

  const filteredPatients = patients.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(s) ||
      p.cpf.includes(s) ||
      p.phone.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Cadastro de Pacientes</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Histórico cadastral, contatos de emergência e acesso direto ao prontuário eletrônico.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Patients Table / List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Carregando pacientes...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum paciente encontrado.
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre novos pacientes utilizando o botão acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Convênio</th>
                  <th className="py-3 px-4">Alertas Clínicos</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPatients.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Nasc: {p.birthDate ? new Date(p.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {p.cpf}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>{p.phone}</div>
                      {p.email && <div className="text-[10px] text-slate-400">{p.email}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {p.healthInsurance}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.allergies ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Alergia: {p.allergies}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Sem alertas</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPatient(p);
                            setDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          Detalhes
                        </button>
                        <button
                          onClick={() => onOpenMedicalRecord(p.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Prontuário</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Novo / Editar Paciente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>{isEditing ? 'Editar Paciente' : 'Novo Cadastro de Paciente'}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Personal Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria das Graças Oliveira"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone Celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="paciente@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Residencial
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, complemento, bairro e cidade"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contato de Emergência
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do parente / responsável e telefone"
                    value={emergencyContact}
                    onChange={e => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Health Information */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo Sanguíneo
                  </label>
                  <select
                    value={bloodType}
                    onChange={e => setBloodType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Não informado">Não informado</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Convênio / Particular
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bradesco, Unimed ou Particular"
                    value={healthInsurance}
                    onChange={e => setHealthInsurance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Carteirinha do Plano
                  </label>
                  <input
                    type="text"
                    placeholder="Número da carteirinha"
                    value={insuranceNumber}
                    onChange={e => setInsuranceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-rose-600 dark:text-rose-400">
                    Alergias Conhecidas (Medicamentos, substâncias, alimentos)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dipirona, AINES, Frutos do mar, Látex..."
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações Administrativas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Restrições de horário, indicações, observações gerais..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                >
                  {isEditing ? 'Atualizar Dados' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Paciente */}
      {detailModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-xs">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedPatient.fullName}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">CPF: {selectedPatient.cpf}</span>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-slate-400 block text-[10px]">Data de Nascimento</span>
                  <span className="font-semibold">{selectedPatient.birthDate || 'Não informada'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Gênero</span>
                  <span className="font-semibold">{selectedPatient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Telefone</span>
                  <span className="font-semibold">{selectedPatient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Convênio</span>
                  <span className="font-semibold">{selectedPatient.healthInsurance} ({selectedPatient.insuranceNumber || 'S/N'})</span>
                </div>
              </div>

              {selectedPatient.allergies && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
                  <div className="font-bold flex items-center gap-1.5 text-xs mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Alergias Registradas:</span>
                  </div>
                  <div>{selectedPatient.allergies}</div>
                </div>
              )}

              {selectedPatient.emergencyContact && (
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Contato de Emergência</div>
                  <div className="font-medium mt-0.5">{selectedPatient.emergencyContact}</div>
                </div>
              )}

              {selectedPatient.notes && (
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Observações</div>
                  <div className="mt-0.5 text-slate-600 dark:text-slate-300">{selectedPatient.notes}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEdit(selectedPatient);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Ficha</span>
              </button>

              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  onOpenMedicalRecord(selectedPatient.id);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Abrir Prontuário Clínico</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
