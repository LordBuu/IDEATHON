import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Clinic, ClinicMember, UserProfile, UserRole } from '../types';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  activeClinic: Clinic | null;
  activeMember: ClinicMember | null;
  userClinics: { clinic: Clinic; member: ClinicMember }[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    profession?: string,
    register?: string,
    institution?: string,
    supervisorName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  switchClinic: (clinicId: string) => void;
  refreshClinicData: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  switchDemoPersona: (persona: 'admin' | 'doctor' | 'student' | 'receptionist') => Promise<void>;
  loginAsAdminDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
  const [activeMember, setActiveMember] = useState<ClinicMember | null>(null);
  const [userClinics, setUserClinics] = useState<{ clinic: Clinic; member: ClinicMember }[]>([]);
  const [loading, setLoading] = useState(true);

  const { setClinicTheme } = useTheme();

  // Load user data and their clinics
  const loadUserData = async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      setUser(null);
      setActiveClinic(null);
      setActiveMember(null);
      setUserClinics([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch or create user profile
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      let profileData: UserProfile;
      if (userSnap.exists()) {
        profileData = { uid: fbUser.uid, ...userSnap.data() } as UserProfile;
      } else {
        profileData = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Usuário Clinora',
          photoURL: fbUser.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, profileData);
      }
      setUser(profileData);

      // 2. Discover user clinics
      const clinicsSnap = await getDocs(collection(db, 'clinics'));
      const foundClinics: { clinic: Clinic; member: ClinicMember }[] = [];

      for (const clinicDoc of clinicsSnap.docs) {
        const memberRef = doc(db, `clinics/${clinicDoc.id}/members`, fbUser.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          foundClinics.push({
            clinic: { id: clinicDoc.id, ...clinicDoc.data() } as Clinic,
            member: { id: memberSnap.id, ...memberSnap.data() } as ClinicMember,
          });
        }
      }

      setUserClinics(foundClinics);

      if (foundClinics.length > 0) {
        // Restore last chosen or first clinic
        const savedClinicId = localStorage.getItem('clinora_active_clinic_id');
        const chosen = foundClinics.find(c => c.clinic.id === savedClinicId) || foundClinics[0];
        setActiveClinic(chosen.clinic);
        setActiveMember(chosen.member);

        // Apply clinic theme
        setClinicTheme(
          chosen.clinic.themePalette || 'azul-saude',
          chosen.clinic.primaryColor,
          chosen.clinic.accentColor
        );
      } else {
        setActiveClinic(null);
        setActiveMember(null);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setFirebaseUser(currentUser);
      await loadUserData(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    profession?: string,
    register?: string,
    institution?: string,
    supervisorName?: string
  ) => {
    setLoading(true);
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: name,
      profession: profession as any,
      professionalRegister: register,
      institution,
      supervisorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setUser(newProfile);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    localStorage.removeItem('clinora_active_clinic_id');
  };

  const switchClinic = (clinicId: string) => {
    const found = userClinics.find(c => c.clinic.id === clinicId);
    if (found) {
      setActiveClinic(found.clinic);
      setActiveMember(found.member);
      localStorage.setItem('clinora_active_clinic_id', clinicId);
      setClinicTheme(
        found.clinic.themePalette || 'azul-saude',
        found.clinic.primaryColor,
        found.clinic.accentColor
      );
    }
  };

  const refreshClinicData = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser);
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(userRef, updated);
    setUser(updated);
  };

  // Switch demo persona for testing roles easily
  const switchDemoPersona = async (persona: 'admin' | 'doctor' | 'student' | 'receptionist') => {
    if (!activeClinic) return;

    const personasConfig = {
      admin: {
        role: 'admin' as UserRole,
        profession: 'Fisioterapeuta' as any,
        displayName: 'Dr. Carlos Silva (Administrador)',
        professionalRegister: 'CREFITO-3/123456-F',
        canViewClinicalData: true,
      },
      doctor: {
        role: 'health_professional' as UserRole,
        profession: 'Psicólogo' as any,
        displayName: 'Dra. Juliana Mendes (Profissional)',
        professionalRegister: 'CRP-06/98765',
        canViewClinicalData: true,
      },
      student: {
        role: 'student' as UserRole,
        profession: 'Estudante/Estagiário' as any,
        displayName: 'Mariana Souza (Aluna/Estagiária)',
        professionalRegister: 'RGM-2024-5541',
        institution: 'Universidade de Saúde Integrada',
        supervisorName: 'Dr. Carlos Silva',
        canViewClinicalData: true,
      },
      receptionist: {
        role: 'receptionist' as UserRole,
        profession: 'Recepcionista' as any,
        displayName: 'Patrícia Lima (Recepcionista)',
        professionalRegister: 'MAT-9921',
        canViewClinicalData: false,
      },
    };

    const target = personasConfig[persona];
    if (user && activeMember) {
      const updatedMember: ClinicMember = {
        ...activeMember,
        role: target.role,
        displayName: target.displayName,
        profession: target.profession,
        professionalRegister: target.professionalRegister,
        canViewClinicalData: target.canViewClinicalData,
        supervisorName: (target as any).supervisorName,
      };
      await updateDoc(doc(db, `clinics/${activeClinic.id}/members`, user.uid), updatedMember as any);
      setActiveMember(updatedMember);
    }
  };

  const loginAsAdminDemo = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, 'admin@clinora.com', 'clinora123');
    } catch (err: any) {
      console.warn('Sign-in fallback, creating admin user:', err);
      try {
        await createUserWithEmailAndPassword(auth, 'admin@clinora.com', 'clinora123');
      } catch (createErr) {
        console.error('Could not create admin user:', createErr);
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        activeClinic,
        activeMember,
        userClinics,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        switchClinic,
        refreshClinicData,
        updateProfileData,
        switchDemoPersona,
        loginAsAdminDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
