import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Clinic, ClinicMember, ClinicUnit, InvitationCode, PresetPaletteId, UserProfile, UserRole } from '../types';
import { logAuditAction } from './auditService';

export const createClinic = async (
  name: string,
  specialties: string,
  ownerUser: UserProfile,
  themePalette: PresetPaletteId = 'azul-saude',
  initialUnitName: string = 'Unidade Principal'
): Promise<{ clinic: Clinic; unit: ClinicUnit; member: ClinicMember }> => {
  const clinicRef = doc(collection(db, 'clinics'));
  const clinicId = clinicRef.id;
  const now = new Date().toISOString();

  const clinicData: Clinic = {
    id: clinicId,
    name,
    specialties,
    ownerUid: ownerUser.uid,
    themePalette,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(clinicRef, clinicData);

    // Create default unit
    const unitRef = doc(collection(db, `clinics/${clinicId}/units`));
    const unitData: ClinicUnit = {
      id: unitRef.id,
      clinicId,
      name: initialUnitName,
      address: 'Endereço da Unidade Sede',
      phone: ownerUser.phoneNumber || '(11) 99999-0000',
      active: true,
      roomsCount: 4,
      createdAt: now,
    };
    await setDoc(unitRef, unitData);

    // Create owner member as Admin
    const memberRef = doc(db, `clinics/${clinicId}/members`, ownerUser.uid);
    const memberData: ClinicMember = {
      id: ownerUser.uid,
      clinicId,
      uid: ownerUser.uid,
      displayName: ownerUser.displayName,
      email: ownerUser.email,
      role: 'admin',
      profession: ownerUser.profession,
      professionalRegister: ownerUser.professionalRegister,
      assignedUnitIds: 'all',
      canViewClinicalData: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(memberRef, memberData);

    await logAuditAction(
      clinicId,
      ownerUser.uid,
      ownerUser.displayName,
      'admin',
      'Criação de Clínica',
      'Clinic',
      clinicId,
      `Clínica ${name} criada com sucesso.`
    );

    return { clinic: clinicData, unit: unitData, member: memberData };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `clinics/${clinicId}`);
  }
};

export const getClinic = async (clinicId: string): Promise<Clinic | null> => {
  const path = `clinics/${clinicId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Clinic;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const updateClinicTheme = async (
  clinicId: string,
  themePalette: PresetPaletteId,
  primaryColor?: string,
  accentColor?: string,
  actingUser?: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  const path = `clinics/${clinicId}`;
  try {
    const updatePayload: Partial<Clinic> = {
      themePalette,
      updatedAt: new Date().toISOString(),
    };
    if (primaryColor) updatePayload.primaryColor = primaryColor;
    if (accentColor) updatePayload.accentColor = accentColor;

    await updateDoc(doc(db, path), updatePayload);

    if (actingUser) {
      await logAuditAction(
        clinicId,
        actingUser.uid,
        actingUser.displayName,
        actingUser.role,
        'Personalização de Identidade Visual',
        'Clinic',
        clinicId,
        `Paleta alterada para ${themePalette}`
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// UNITS
export const getClinicUnits = async (clinicId: string): Promise<ClinicUnit[]> => {
  const path = `clinics/${clinicId}/units`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicUnit));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createClinicUnit = async (
  clinicId: string,
  unitData: Omit<ClinicUnit, 'id' | 'clinicId' | 'createdAt'>,
  actingUser: { uid: string; displayName: string; role: UserRole }
): Promise<ClinicUnit> => {
  const path = `clinics/${clinicId}/units`;
  const unitRef = doc(collection(db, path));
  const newUnit: ClinicUnit = {
    ...unitData,
    id: unitRef.id,
    clinicId,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(unitRef, newUnit);
    await logAuditAction(
      clinicId,
      actingUser.uid,
      actingUser.displayName,
      actingUser.role,
      'Criação de Unidade',
      'ClinicUnit',
      newUnit.id,
      `Unidade ${newUnit.name} adicionada.`
    );
    return newUnit;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// MEMBERS
export const getClinicMembers = async (clinicId: string): Promise<ClinicMember[]> => {
  const path = `clinics/${clinicId}/members`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicMember));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const updateClinicMember = async (
  clinicId: string,
  memberId: string,
  updates: Partial<ClinicMember>,
  actingUser: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  const path = `clinics/${clinicId}/members/${memberId}`;
  try {
    await updateDoc(doc(db, path), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction(
      clinicId,
      actingUser.uid,
      actingUser.displayName,
      actingUser.role,
      'Atualização de Membro/Permissões',
      'ClinicMember',
      memberId,
      `Função ou permissões atualizadas.`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// INVITATIONS
export const generateInvitationCode = async (
  clinicId: string,
  clinicName: string,
  role: UserRole,
  profession: string,
  assignedUnits: string[] | 'all',
  maxUses: number = 5,
  expiresInDays: number = 7,
  actingUser: { uid: string; displayName: string; role: UserRole }
): Promise<InvitationCode> => {
  const path = `clinics/${clinicId}/invitations`;
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const code = `CLN-${randomSuffix}`;
  const invRef = doc(collection(db, path));
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const invitation: InvitationCode = {
    id: invRef.id,
    code,
    clinicId,
    clinicName,
    role,
    profession: profession as any,
    assignedUnits,
    maxUses,
    usedCount: 0,
    expiresAt: expiresAt.toISOString(),
    isRevoked: false,
    createdBy: actingUser.uid,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(invRef, invitation);
    await logAuditAction(
      clinicId,
      actingUser.uid,
      actingUser.displayName,
      actingUser.role,
      'Geração de Código de Vínculo',
      'InvitationCode',
      invitation.id,
      `Código ${code} gerado para perfil ${role}.`
    );
    return invitation;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getClinicInvitations = async (clinicId: string): Promise<InvitationCode[]> => {
  const path = `clinics/${clinicId}/invitations`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InvitationCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const revokeInvitation = async (
  clinicId: string,
  invitationId: string,
  actingUser: { uid: string; displayName: string; role: UserRole }
): Promise<void> => {
  const path = `clinics/${clinicId}/invitations/${invitationId}`;
  try {
    await updateDoc(doc(db, path), { isRevoked: true });
    await logAuditAction(
      clinicId,
      actingUser.uid,
      actingUser.displayName,
      actingUser.role,
      'Revogação de Código de Vínculo',
      'InvitationCode',
      invitationId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Redeem an invitation code
export const redeemInvitationCode = async (
  code: string,
  user: UserProfile
): Promise<{ clinicId: string; role: UserRole }> => {
  const cleanCode = code.trim().toUpperCase();
  
  // Find invitation across clinics collectionGroup or scan
  // Since we query by invitation, let's find the matching invitation
  try {
    // 1. Look in active clinics
    const clinicsSnap = await getDocs(collection(db, 'clinics'));
    let targetInvitation: InvitationCode | null = null;

    for (const clinicDoc of clinicsSnap.docs) {
      const invQuery = query(
        collection(db, `clinics/${clinicDoc.id}/invitations`),
        where('code', '==', cleanCode),
        where('isRevoked', '==', false)
      );
      const invSnap = await getDocs(invQuery);
      if (!invSnap.empty) {
        targetInvitation = { id: invSnap.docs[0].id, ...invSnap.docs[0].data() } as InvitationCode;
        break;
      }
    }

    if (!targetInvitation) {
      throw new Error('Código de vinculação inválido ou revogado.');
    }

    if (new Date(targetInvitation.expiresAt) < new Date()) {
      throw new Error('Este código de vinculação expirou.');
    }

    if (targetInvitation.usedCount >= targetInvitation.maxUses) {
      throw new Error('Este código de vinculação atingiu o limite máximo de utilizações.');
    }

    const { clinicId, role, profession, assignedUnits } = targetInvitation;

    // Check if user is already a member
    const existingMemberSnap = await getDoc(doc(db, `clinics/${clinicId}/members`, user.uid));
    if (existingMemberSnap.exists()) {
      throw new Error('Você já possui vínculo ativo com esta clínica.');
    }

    // Add member
    const memberData: ClinicMember = {
      id: user.uid,
      clinicId,
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role,
      profession: profession || user.profession,
      professionalRegister: user.professionalRegister,
      assignedUnitIds: assignedUnits,
      canViewClinicalData: role !== 'receptionist',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, `clinics/${clinicId}/members`, user.uid), memberData);

    // Increment usedCount
    await updateDoc(doc(db, `clinics/${clinicId}/invitations`, targetInvitation.id), {
      usedCount: targetInvitation.usedCount + 1,
    });

    await logAuditAction(
      clinicId,
      user.uid,
      user.displayName,
      role,
      'Vinculação de Funcionário',
      'ClinicMember',
      user.uid,
      `Vínculo ativado através do código ${cleanCode} como ${role}.`
    );

    return { clinicId, role };
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao resgatar código de vinculação.');
  }
};
