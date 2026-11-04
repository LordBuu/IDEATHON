import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Appointment, AppointmentStatus, UserRole } from '../types';
import { logAuditAction } from './auditService';

export const getAppointments = async (
  clinicId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    professionalUid?: string;
    unitId?: string;
  }
): Promise<Appointment[]> => {
  const path = `clinics/${clinicId}/appointments`;
  try {
    let q = query(collection(db, path), orderBy('date', 'asc'), orderBy('time', 'asc'));

    if (filters?.professionalUid && filters.professionalUid !== 'all') {
      q = query(collection(db, path), where('professionalUid', '==', filters.professionalUid));
    }

    const snap = await getDocs(q);
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));

    if (filters?.unitId && filters.unitId !== 'all') {
      results = results.filter(a => a.unitId === filters.unitId);
    }
    if (filters?.startDate) {
      results = results.filter(a => a.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter(a => a.date <= filters.endDate!);
    }

    // Sort by date then time
    results.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createAppointment = async (
  clinicId: string,
  appointmentData: Omit<Appointment, 'id' | 'clinicId' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  author: { uid: string; displayName: string; role: UserRole }
): Promise<Appointment> => {
  const path = `clinics/${clinicId}/appointments`;

  // 1. Conflict Prevention Check
  const existingSameDay = await getAppointments(clinicId, {
    startDate: appointmentData.date,
    endDate: appointmentData.date,
    professionalUid: appointmentData.professionalUid,
  });

  const hasConflict = existingSameDay.some(app => {
    if (app.status === 'cancelado') return false;
    // Simple check: exactly matching time or within duration
    return app.time === appointmentData.time;
  });

  if (hasConflict) {
    throw new Error(
      `Conflito de horário: O profissional já possui atendimento agendado para ${appointmentData.date} às ${appointmentData.time}.`
    );
  }

  const appRef = doc(collection(db, path));
  const now = new Date().toISOString();

  const newAppointment: Appointment = {
    ...appointmentData,
    id: appRef.id,
    clinicId,
    createdBy: author.uid,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(appRef, newAppointment);
    await logAuditAction(
      clinicId,
      author.uid,
      author.displayName,
      author.role,
      'Agendamento de Consulta',
      'Appointment',
      newAppointment.id,
      `Consulta agendada para ${newAppointment.patientName} em ${newAppointment.date} às ${newAppointment.time}`
    );
    return newAppointment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateAppointmentStatus = async (
  clinicId: string,
  appointmentId: string,
  status: AppointmentStatus,
  author: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  const path = `clinics/${clinicId}/appointments/${appointmentId}`;
  try {
    await updateDoc(doc(db, path), {
      status,
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      clinicId,
      author.uid,
      author.displayName,
      author.role,
      `Status da Consulta alterado para ${status}`,
      'Appointment',
      appointmentId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const rescheduleAppointment = async (
  clinicId: string,
  appointmentId: string,
  newDate: string,
  newTime: string,
  newUnitId?: string,
  newUnitName?: string,
  author?: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  const path = `clinics/${clinicId}/appointments/${appointmentId}`;
  try {
    const payload: Partial<Appointment> = {
      date: newDate,
      time: newTime,
      status: 'reagendado',
      updatedAt: new Date().toISOString(),
    };
    if (newUnitId) payload.unitId = newUnitId;
    if (newUnitName) payload.unitName = newUnitName;

    await updateDoc(doc(db, path), payload);

    if (author) {
      await logAuditAction(
        clinicId,
        author.uid,
        author.displayName,
        author.role,
        'Reagendamento de Consulta',
        'Appointment',
        appointmentId,
        `Reagendado para ${newDate} às ${newTime}`
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
