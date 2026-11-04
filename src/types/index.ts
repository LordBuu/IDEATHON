export type UserRole = 'admin' | 'health_professional' | 'student' | 'receptionist';

export type Profession = 
  | 'Fisioterapeuta'
  | 'Psicólogo'
  | 'Médico'
  | 'Nutricionista'
  | 'Enfermeiro'
  | 'Terapeuta Ocupacional'
  | 'Estudante/Estagiário'
  | 'Recepcionista'
  | 'Outro';

export type ThemeMode = 'light' | 'dark' | 'system';

export type PresetPaletteId = 
  | 'azul-saude'
  | 'verde-saude'
  | 'turquesa'
  | 'lavanda'
  | 'grafite'
  | 'azul-premium'
  | 'esmeralda'
  | 'custom';

export interface PaletteDefinition {
  id: PresetPaletteId;
  name: string;
  description: string;
  primaryLight: string;
  accentLight: string;
  primaryDark: string;
  accentDark: string;
  sampleBgLight: string;
  sampleBgDark: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  profession?: Profession;
  professionalRegister?: string; // CREFITO, CRM, CRP, COREN, CRN, etc.
  institution?: string; // Para aluno/estagiário
  course?: string;
  academicId?: string; // RGM
  supervisorName?: string;
  themePreference?: ThemeMode;
  createdAt?: string;
  updatedAt?: string;
}

export interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  specialties?: string;
  ownerUid: string;
  themePalette: PresetPaletteId;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClinicMember {
  id: string; // usually user uid
  clinicId: string;
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  profession?: Profession;
  professionalRegister?: string;
  supervisorUid?: string;
  supervisorName?: string;
  assignedUnitIds: string[] | 'all';
  canViewClinicalData: boolean;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

export interface ClinicUnit {
  id: string;
  clinicId: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  roomsCount?: number;
  createdAt: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string;
  healthInsurance?: string;
  insuranceNumber?: string;
  notes?: string;
  primaryUnitId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'presente'
  | 'em_atendimento'
  | 'concluido'
  | 'falta'
  | 'cancelado'
  | 'reagendado';

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  professionalUid: string;
  professionalName: string;
  unitId: string;
  unitName: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export type RecordType = 
  | 'avaliacao_inicial'
  | 'evolucao'
  | 'procedimento'
  | 'prescricao'
  | 'atestado'
  | 'orientacao';

export type SupervisorValidationStatus = 
  | 'not_required'
  | 'pending_review'
  | 'approved'
  | 'requested_changes';

export interface MedicalRecordAddendum {
  id: string;
  recordId: string;
  authorUid: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  recordType: RecordType;
  specialty: string;
  authorUid: string;
  authorName: string;
  authorRole: UserRole;
  authorRegister?: string;
  supervisorUid?: string;
  supervisorName?: string;
  supervisorValidationStatus: SupervisorValidationStatus;
  chiefComplaint?: string;
  clinicalHistory?: string;
  physicalExamination?: string;
  diagnosisHypothesis?: string;
  treatmentPlan?: string;
  evolutionNotes?: string;
  specialtyData?: Record<string, any>;
  attachments?: { name: string; url: string; size?: string; date: string }[];
  isFinalized: boolean;
  addendums?: MedicalRecordAddendum[];
  createdAt: string;
  updatedAt?: string;
}

export interface InvitationCode {
  id: string;
  code: string;
  clinicId: string;
  clinicName: string;
  role: UserRole;
  profession?: Profession;
  assignedUnits: string[] | 'all';
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isRevoked: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  clinicId: string;
  userUid: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  timestamp: string;
}
