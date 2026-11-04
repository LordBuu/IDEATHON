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
import { MedicalRecord, MedicalRecordAddendum, RecordType, SupervisorValidationStatus, UserRole } from '../types';
import { logAuditAction } from './auditService';

export const getPatientMedicalRecords = async (
  clinicId: string,
  patientId: string,
  userRole: UserRole
): Promise<MedicalRecord[]> => {
  if (userRole === 'receptionist') {
    throw new Error('Acesso restrito: Recepcionistas não possuem acesso a prontuários clínicos.');
  }

  const path = `clinics/${clinicId}/medical_records`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const records: MedicalRecord[] = [];

    for (const d of snap.docs) {
      const data = d.data() as MedicalRecord;
      if (data.patientId === patientId) {
        // Fetch addendums
        const addendumsSnap = await getDocs(
          collection(db, `clinics/${clinicId}/medical_records/${d.id}/addendums`)
        );
        const addendums = addendumsSnap.docs.map(ad => ({
          id: ad.id,
          ...ad.data()
        } as MedicalRecordAddendum));
        
        records.push({
          ...data,
          id: d.id,
          addendums
        });
      }
    }

    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createMedicalRecord = async (
  clinicId: string,
  recordData: Omit<MedicalRecord, 'id' | 'clinicId' | 'createdAt' | 'updatedAt' | 'addendums'>,
  author: { uid: string; displayName: string; role: UserRole }
): Promise<MedicalRecord> => {
  if (author.role === 'receptionist') {
    throw new Error('Acesso negado: Recepcionistas não podem criar prontuários.');
  }

  const path = `clinics/${clinicId}/medical_records`;
  const recordRef = doc(collection(db, path));
  const now = new Date().toISOString();

  const newRecord: MedicalRecord = {
    ...recordData,
    id: recordRef.id,
    clinicId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(recordRef, newRecord);
    await logAuditAction(
      clinicId,
      author.uid,
      author.displayName,
      author.role,
      `Criação de Registro Clínico (${recordData.recordType})`,
      'MedicalRecord',
      newRecord.id,
      `Prontuário preenchido por ${author.displayName} (${author.role}) para o paciente ${recordData.patientId}`
    );
    return newRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const addRecordAddendum = async (
  clinicId: string,
  recordId: string,
  note: string,
  author: { uid: string; displayName: string; role: UserRole }
): Promise<MedicalRecordAddendum> => {
  if (author.role === 'receptionist') {
    throw new Error('Acesso negado: Recepcionistas não podem emitir adendos clínicos.');
  }

  const path = `clinics/${clinicId}/medical_records/${recordId}/addendums`;
  const addendumRef = doc(collection(db, path));
  const now = new Date().toISOString();

  const addendum: MedicalRecordAddendum = {
    id: addendumRef.id,
    recordId,
    authorUid: author.uid,
    authorName: author.displayName,
    note,
    createdAt: now,
  };

  try {
    await setDoc(addendumRef, addendum);
    await logAuditAction(
      clinicId,
      author.uid,
      author.displayName,
      author.role,
      'Adendo Adicionado ao Prontuário',
      'MedicalRecordAddendum',
      addendum.id,
      `Adendo registrado para o registro ${recordId}`
    );
    return addendum;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateSupervisorStatus = async (
  clinicId: string,
  recordId: string,
  status: SupervisorValidationStatus,
  supervisor: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  const path = `clinics/${clinicId}/medical_records/${recordId}`;
  try {
    await updateDoc(doc(db, path), {
      supervisorValidationStatus: status,
      supervisorUid: supervisor.uid,
      supervisorName: supervisor.displayName,
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      clinicId,
      supervisor.uid,
      supervisor.displayName,
      supervisor.role,
      `Supervisão de Prontuário: ${status}`,
      'MedicalRecord',
      recordId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
