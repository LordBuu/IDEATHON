import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Patient, UserRole } from '../types';
import { logAuditAction } from './auditService';

export const getPatients = async (
  clinicId: string,
  userRole: UserRole
): Promise<Patient[]> => {
  if (userRole === 'receptionist') {
    throw new Error('Acesso negado: Recepcionistas não possuem permissão para acessar o cadastro clínico de pacientes.');
  }

  const path = `clinics/${clinicId}/patients`;
  try {
    const q = query(collection(db, path), orderBy('fullName', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getPatientById = async (
  clinicId: string,
  patientId: string,
  userRole: UserRole,
  actingUser?: { uid: string; displayName: string }
): Promise<Patient | null> => {
  if (userRole === 'receptionist') {
    throw new Error('Acesso negado: Recepcionistas não possuem permissão para acessar o prontuário ou cadastro de pacientes.');
  }

  const path = `clinics/${clinicId}/patients/${patientId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (!snap.exists()) return null;

    if (actingUser) {
      await logAuditAction(
        clinicId,
        actingUser.uid,
        actingUser.displayName,
        userRole,
        'Consulta de Prontuário/Ficha de Paciente',
        'Patient',
        patientId
      );
    }

    return { id: snap.id, ...snap.data() } as Patient;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const createPatient = async (
  clinicId: string,
  patientData: Omit<Patient, 'id' | 'clinicId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName'>,
  author: { uid: string; displayName: string; role: UserRole }
): Promise<Patient> => {
  if (author.role === 'receptionist') {
    throw new Error('Recepcionistas não possuem autorização para cadastrar pacientes.');
  }

  const path = `clinics/${clinicId}/patients`;
  const patientRef = doc(collection(db, path));
  const now = new Date().toISOString();

  const newPatient: Patient = {
    ...patientData,
    id: patientRef.id,
    clinicId,
    createdBy: author.uid,
    createdByName: author.displayName,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(patientRef, newPatient);
    await logAuditAction(
      clinicId,
      author.uid,
      author.displayName,
      author.role,
      'Cadastro de Paciente',
      'Patient',
      newPatient.id,
      `Paciente ${newPatient.fullName} cadastrado.`
    );
    return newPatient;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updatePatient = async (
  clinicId: string,
  patientId: string,
  patientData: Partial<Patient>,
  author: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  if (author.role === 'receptionist') {
    throw new Error('Recepcionistas não possuem autorização para editar pacientes.');
  }

  const path = `clinics/${clinicId}/patients/${patientId}`;
  try {
    await updateDoc(doc(db, path), {
      ...patientData,
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      clinicId,
      author.uid,
      author.displayName,
      author.role,
      'Edição de Cadastro de Paciente',
      'Patient',
      patientId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
