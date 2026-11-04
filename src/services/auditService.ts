import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { AuditLog, UserRole } from '../types';

export const logAuditAction = async (
  clinicId: string,
  userUid: string,
  userName: string,
  userRole: UserRole,
  action: string,
  entity: string,
  entityId: string,
  details?: string
): Promise<void> => {
  const path = `clinics/${clinicId}/audit_logs`;
  try {
    await addDoc(collection(db, path), {
      clinicId,
      userUid,
      userName,
      userRole,
      action,
      entity,
      entityId,
      details: details || '',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Non-blocking for UI, but properly logged
    console.error('Audit Log Error:', error);
  }
};

export const getAuditLogs = async (clinicId: string, maxResults: number = 50): Promise<AuditLog[]> => {
  const path = `clinics/${clinicId}/audit_logs`;
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
