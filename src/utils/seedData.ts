import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Clinic, ClinicMember, ClinicUnit, Patient, Appointment, MedicalRecord, UserProfile } from '../types';

export const seedInitialClinicData = async (user: UserProfile): Promise<{ clinicId: string }> => {
  const clinicRef = doc(collection(db, 'clinics'));
  const clinicId = clinicRef.id;
  const now = new Date().toISOString();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Clinic
  const clinic: Clinic = {
    id: clinicId,
    name: 'Clinora Centro de Saúde Integrada',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 3214-5500',
    email: 'contato@clinorasaude.com.br',
    address: 'Av. Paulista, 1500 - 8º Andar, São Paulo - SP',
    specialties: 'Fisioterapia, Psicologia, Medicina, Nutrição',
    ownerUid: user.uid,
    themePalette: 'azul-saude',
    primaryColor: '#0284c7',
    accentColor: '#38bdf8',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(clinicRef, clinic);

  // 2. Units
  const unit1Ref = doc(collection(db, `clinics/${clinicId}/units`));
  const unit1: ClinicUnit = {
    id: unit1Ref.id,
    clinicId,
    name: 'Unidade Paulista (Sede)',
    address: 'Av. Paulista, 1500 - Conj. 82, Bela Vista',
    phone: '(11) 3214-5501',
    active: true,
    roomsCount: 6,
    createdAt: now,
  };
  await setDoc(unit1Ref, unit1);

  const unit2Ref = doc(collection(db, `clinics/${clinicId}/units`));
  const unit2: ClinicUnit = {
    id: unit2Ref.id,
    clinicId,
    name: 'Unidade Jardins',
    address: 'Rua Oscar Freire, 800, Jardins',
    phone: '(11) 3214-5502',
    active: true,
    roomsCount: 4,
    createdAt: now,
  };
  await setDoc(unit2Ref, unit2);

  // 3. User as Admin Member
  const memberRef = doc(db, `clinics/${clinicId}/members`, user.uid);
  const member: ClinicMember = {
    id: user.uid,
    clinicId,
    uid: user.uid,
    displayName: user.displayName || 'Dr. Carlos Silva',
    email: user.email,
    role: 'admin',
    profession: 'Fisioterapeuta',
    professionalRegister: 'CREFITO-3/184920-F',
    assignedUnitIds: 'all',
    canViewClinicalData: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(memberRef, member);

  // 4. Sample Staff Members
  const staffDoctorRef = doc(db, `clinics/${clinicId}/members`, 'demo_doc_juliana');
  await setDoc(staffDoctorRef, {
    id: 'demo_doc_juliana',
    clinicId,
    uid: 'demo_doc_juliana',
    displayName: 'Dra. Juliana Mendes',
    email: 'juliana.mendes@clinora.com',
    role: 'health_professional',
    profession: 'Psicólogo',
    professionalRegister: 'CRP-06/88492',
    assignedUnitIds: 'all',
    canViewClinicalData: true,
    status: 'active',
    createdAt: now,
  });

  const staffStudentRef = doc(db, `clinics/${clinicId}/members`, 'demo_student_mariana');
  await setDoc(staffStudentRef, {
    id: 'demo_student_mariana',
    clinicId,
    uid: 'demo_student_mariana',
    displayName: 'Mariana Souza (Aluna Estagiária)',
    email: 'mariana.souza@universidade.edu.br',
    role: 'student',
    profession: 'Estudante/Estagiário',
    professionalRegister: 'RGM-2024-5541',
    supervisorUid: user.uid,
    supervisorName: user.displayName || 'Dr. Carlos Silva',
    assignedUnitIds: [unit1.id],
    canViewClinicalData: true,
    status: 'active',
    createdAt: now,
  });

  const staffRecRef = doc(db, `clinics/${clinicId}/members`, 'demo_rec_patricia');
  await setDoc(staffRecRef, {
    id: 'demo_rec_patricia',
    clinicId,
    uid: 'demo_rec_patricia',
    displayName: 'Patrícia Lima (Recepcionista)',
    email: 'recepcao@clinora.com',
    role: 'receptionist',
    profession: 'Recepcionista',
    assignedUnitIds: 'all',
    canViewClinicalData: false, // Strict rule: No clinical records access!
    status: 'active',
    createdAt: now,
  });

  // 5. Sample Patients
  const patient1Ref = doc(collection(db, `clinics/${clinicId}/patients`));
  const patient1: Patient = {
    id: patient1Ref.id,
    clinicId,
    fullName: 'Ana Beatriz Souza',
    cpf: '123.456.789-00',
    birthDate: '1989-05-14',
    gender: 'Feminino',
    phone: '(11) 98765-4321',
    email: 'anabeatriz@exemplo.com',
    address: 'Rua Bela Cintra, 450 - Consolação, São Paulo',
    emergencyContact: 'Roberto Souza (Marido) - (11) 98765-4322',
    bloodType: 'A+',
    allergies: 'Dipirona e Penicilina',
    healthInsurance: 'Bradesco Saúde',
    insuranceNumber: '8849201948',
    notes: 'Paciente em acompanhamento fisioterapêutico para lombalgia crônica.',
    primaryUnitId: unit1.id,
    createdBy: user.uid,
    createdByName: user.displayName,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(patient1Ref, patient1);

  const patient2Ref = doc(collection(db, `clinics/${clinicId}/patients`));
  const patient2: Patient = {
    id: patient2Ref.id,
    clinicId,
    fullName: 'Marcos Vinícius de Oliveira',
    cpf: '987.654.321-11',
    birthDate: '1975-11-23',
    gender: 'Masculino',
    phone: '(11) 97654-3210',
    email: 'marcos.oliveira@empresa.com.br',
    address: 'Av. Brigadeiro Luis Antonio, 2200, SP',
    emergencyContact: 'Clara Oliveira (Filha) - (11) 97654-3219',
    bloodType: 'O+',
    allergies: 'Nenhuma conhecida',
    healthInsurance: 'SulAmérica',
    insuranceNumber: '5540192837',
    notes: 'Acompanhamento psicológico com foco em estresse ocupacional.',
    primaryUnitId: unit1.id,
    createdBy: user.uid,
    createdByName: user.displayName,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(patient2Ref, patient2);

  const patient3Ref = doc(collection(db, `clinics/${clinicId}/patients`));
  const patient3: Patient = {
    id: patient3Ref.id,
    clinicId,
    fullName: 'Camila Ferreira Ramos',
    cpf: '456.789.123-22',
    birthDate: '1998-08-30',
    gender: 'Feminino',
    phone: '(11) 96543-2109',
    email: 'camila.ferreira@gmail.com',
    address: 'Alameda Santos, 950 - Cerqueira César, SP',
    emergencyContact: 'Lúcia Ferreira (Mãe) - (11) 96543-2110',
    bloodType: 'B+',
    allergies: 'Lactose e Frutos do Mar',
    healthInsurance: 'Particular',
    notes: 'Plano nutricional para ganho de massa e performance.',
    primaryUnitId: unit2.id,
    createdBy: user.uid,
    createdByName: user.displayName,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(patient3Ref, patient3);

  // 6. Sample Appointments for Today
  const app1Ref = doc(collection(db, `clinics/${clinicId}/appointments`));
  await setDoc(app1Ref, {
    id: app1Ref.id,
    clinicId,
    patientId: patient1.id,
    patientName: patient1.fullName,
    patientPhone: patient1.phone,
    professionalUid: user.uid,
    professionalName: user.displayName || 'Dr. Carlos Silva',
    unitId: unit1.id,
    unitName: unit1.name,
    specialty: 'Fisioterapia',
    date: todayStr,
    time: '09:00',
    durationMinutes: 50,
    status: 'concluido',
    notes: 'Sessão de reabilitação postural e fortalecimento de core.',
    createdBy: user.uid,
    createdAt: now,
  });

  const app2Ref = doc(collection(db, `clinics/${clinicId}/appointments`));
  await setDoc(app2Ref, {
    id: app2Ref.id,
    clinicId,
    patientId: patient2.id,
    patientName: patient2.fullName,
    patientPhone: patient2.phone,
    professionalUid: 'demo_doc_juliana',
    professionalName: 'Dra. Juliana Mendes',
    unitId: unit1.id,
    unitName: unit1.name,
    specialty: 'Psicologia',
    date: todayStr,
    time: '11:00',
    durationMinutes: 50,
    status: 'presente',
    notes: 'Paciente na recepção aguardando chamada.',
    createdBy: user.uid,
    createdAt: now,
  });

  const app3Ref = doc(collection(db, `clinics/${clinicId}/appointments`));
  await setDoc(app3Ref, {
    id: app3Ref.id,
    clinicId,
    patientId: patient3.id,
    patientName: patient3.fullName,
    patientPhone: patient3.phone,
    professionalUid: user.uid,
    professionalName: user.displayName || 'Dr. Carlos Silva',
    unitId: unit2.id,
    unitName: unit2.name,
    specialty: 'Fisioterapia',
    date: todayStr,
    time: '14:30',
    durationMinutes: 45,
    status: 'confirmado',
    notes: 'Avaliação de marcha e estabilidade articular.',
    createdBy: user.uid,
    createdAt: now,
  });

  // 7. Sample Medical Records (EHR)
  const record1Ref = doc(collection(db, `clinics/${clinicId}/medical_records`));
  await setDoc(record1Ref, {
    id: record1Ref.id,
    clinicId,
    patientId: patient1.id,
    recordType: 'avaliacao_inicial',
    specialty: 'Fisioterapia',
    authorUid: user.uid,
    authorName: user.displayName || 'Dr. Carlos Silva',
    authorRole: 'admin',
    authorRegister: 'CREFITO-3/184920-F',
    supervisorValidationStatus: 'not_required',
    chiefComplaint: 'Dor lombar com irradiação para face posterior da coxa direita há 3 meses.',
    clinicalHistory: 'Início após esforço repetitivo no trabalho. Piora ao sentar prolongadamente e alívio moderado ao deitar.',
    physicalExamination: 'Teste de Lasègue positivo a 45 graus à direita. Contratura importante de paravertebrais lombares e piriforme direito. Amplitude de flexão lombar limitada com dor.',
    diagnosisHypothesis: 'Lombociatalgia mecânico-postural com provável protusão discal L5-S1 (M54.4).',
    treatmentPlan: '1. Termoterapia e liberação miofascial; 2. Tração lombar suave; 3. Cinesioterapia de estabilização segmentar lombo-pélvica (Core training); 4. Reavaliação em 10 sessões.',
    isFinalized: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  });

  // Add an addendum to record 1 to demonstrate legal immutability
  const addendum1Ref = doc(collection(db, `clinics/${clinicId}/medical_records/${record1Ref.id}/addendums`));
  await setDoc(addendum1Ref, {
    id: addendum1Ref.id,
    recordId: record1Ref.id,
    authorUid: user.uid,
    authorName: user.displayName || 'Dr. Carlos Silva',
    note: 'Adendo de esclarecimento: Paciente trouxe ressonância magnética realizada em 12/10 confirmando discreto abaulamento discal L5-S1 sem compressão radicular franca.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  });

  // Student evolution entry under supervision
  const record2Ref = doc(collection(db, `clinics/${clinicId}/medical_records`));
  await setDoc(record2Ref, {
    id: record2Ref.id,
    clinicId,
    patientId: patient1.id,
    recordType: 'evolucao',
    specialty: 'Fisioterapia',
    authorUid: 'demo_student_mariana',
    authorName: 'Mariana Souza (Aluna Estagiária)',
    authorRole: 'student',
    authorRegister: 'RGM-2024-5541',
    supervisorUid: user.uid,
    supervisorName: user.displayName || 'Dr. Carlos Silva',
    supervisorValidationStatus: 'approved',
    evolutionNotes: 'Sessão 03/10: Realizado aquecimento em cicloergômetro (10 min), liberação de paravertebrais com ventosa seca e exercícios de ponte bipodal e bird-dog com 3 séries de 10 repetições. Paciente referiu diminuição da dor (EVA de 7 para 3 após a sessão).',
    isFinalized: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  });

  // 8. Sample Invitation Code
  const invRef = doc(collection(db, `clinics/${clinicId}/invitations`));
  const exp = new Date();
  exp.setDate(exp.getDate() + 14);
  await setDoc(invRef, {
    id: invRef.id,
    code: 'CLN-DEMO9',
    clinicId,
    clinicName: clinic.name,
    role: 'health_professional',
    profession: 'Fisioterapeuta',
    assignedUnits: 'all',
    maxUses: 10,
    usedCount: 2,
    expiresAt: exp.toISOString(),
    isRevoked: false,
    createdBy: user.uid,
    createdAt: now,
  });

  return { clinicId };
};
