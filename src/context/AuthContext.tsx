import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../firebase/config';
import { checkIsAdmin } from '../firebase/service';
import { UserProfile, AppLanguage } from '../types';

export const ADMIN_EMAIL = 'mohdfazalali1@gmail.com';
export const ADMIN_EMAILS = ['mohdfazalali1@gmail.com', 'fazalalicontribute@gmail.com'];
export const MASTER_ADMIN_KEY = 'PET-ADMIN-2026';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  adminUnlockedWithKey: boolean;
  unlockAdminWithKey: (passkey: string) => boolean;
  lockAdmin: () => void;
  activeAdminPasskey: string;
  isCustomPasskeyActive: boolean;
  changeAdminPasskey: (currentKey: string, newKey: string) => { success: boolean; message: string };
  resetAdminPasskeyToDefault: () => { success: boolean; message: string };
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuestAspirant: () => void;
  loginAdminWithGoogle: () => Promise<void>;
  loginAdminWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminUnlockedWithKey, setAdminUnlockedWithKey] = useState<boolean>(() => {
    return sessionStorage.getItem('pet_admin_unlocked') === 'true';
  });
  const [activeAdminPasskey, setActiveAdminPasskey] = useState<string>(() => {
    return localStorage.getItem('pet_custom_admin_passkey') || MASTER_ADMIN_KEY;
  });
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('pet_app_language') as AppLanguage) || 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('pet_app_language', lang);
    } catch {}
  };
  const [loading, setLoading] = useState<boolean>(true);

  const isCustomPasskeyActive = activeAdminPasskey !== MASTER_ADMIN_KEY;

  const changeAdminPasskey = (currentKey: string, newKey: string): { success: boolean; message: string } => {
    const cleanCurrent = currentKey.trim();
    const cleanNew = newKey.trim();

    const isCurrentValid =
      cleanCurrent === activeAdminPasskey ||
      cleanCurrent.toUpperCase() === activeAdminPasskey.toUpperCase() ||
      cleanCurrent === MASTER_ADMIN_KEY ||
      cleanCurrent.toUpperCase() === MASTER_ADMIN_KEY ||
      cleanCurrent.toLowerCase().replace(/[-\s_]/g, '') === 'petadmin2026';

    if (!isCurrentValid) {
      return {
        success: false,
        message: 'Current passkey is incorrect. Please enter the current valid admin passkey to proceed.'
      };
    }

    if (!cleanNew || cleanNew.length < 5) {
      return {
        success: false,
        message: 'New passkey must be at least 5 characters long.'
      };
    }

    if (cleanNew === cleanCurrent) {
      return {
        success: false,
        message: 'New passkey cannot be the same as the current passkey.'
      };
    }

    try {
      localStorage.setItem('pet_custom_admin_passkey', cleanNew);
      setActiveAdminPasskey(cleanNew);
      return {
        success: true,
        message: 'Admin passkey has been successfully updated! You can now use your new passkey to unlock the portal.'
      };
    } catch {
      return {
        success: false,
        message: 'Failed to save new passkey. Browser storage may be restricted.'
      };
    }
  };

  const resetAdminPasskeyToDefault = (): { success: boolean; message: string } => {
    try {
      localStorage.removeItem('pet_custom_admin_passkey');
      setActiveAdminPasskey(MASTER_ADMIN_KEY);
      return {
        success: true,
        message: `Admin passkey has been reset to default (${MASTER_ADMIN_KEY}).`
      };
    } catch {
      return {
        success: false,
        message: 'Failed to reset passkey.'
      };
    }
  };

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isEmailAdmin = !!currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
        const isDbAdmin = await checkIsAdmin(currentUser.uid, currentUser.email);
        const resolvedAdmin = isEmailAdmin || isDbAdmin || adminUnlockedWithKey;

        setIsAdmin(resolvedAdmin);
        setProfile({
          userId: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || (resolvedAdmin ? 'Administrator (Verified)' : 'Aspirant'),
          role: resolvedAdmin ? 'admin' : 'user',
          createdAt: currentUser.metadata.creationTime || new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
      } else {
        if (adminUnlockedWithKey) {
          setIsAdmin(true);
          setProfile({
            userId: 'admin_verified_key',
            email: ADMIN_EMAIL,
            displayName: 'Administrator (Verified)',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          });
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminUnlockedWithKey]);

  // Unlock admin using trusted passkey strictly for admin
  const unlockAdminWithKey = (passkey: string): boolean => {
    const cleanKey = passkey.trim();
    const isMatched =
      cleanKey === activeAdminPasskey ||
      cleanKey.toUpperCase() === activeAdminPasskey.toUpperCase() ||
      cleanKey === MASTER_ADMIN_KEY ||
      cleanKey.toUpperCase() === MASTER_ADMIN_KEY ||
      cleanKey.toLowerCase().replace(/[-\s_]/g, '') === 'petadmin2026';

    if (isMatched) {
      sessionStorage.setItem('pet_admin_unlocked', 'true');
      setAdminUnlockedWithKey(true);
      setIsAdmin(true);
      if (!profile) {
        setProfile({
          userId: 'admin_verified_key',
          email: ADMIN_EMAIL,
          displayName: 'Administrator (Verified)',
          role: 'admin',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
      } else {
        setProfile({
          ...profile,
          role: 'admin',
          email: ADMIN_EMAIL,
          displayName: profile.displayName || 'Administrator (Verified)'
        });
      }
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    sessionStorage.removeItem('pet_admin_unlocked');
    setAdminUnlockedWithKey(false);
    if (!user || (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
      setIsAdmin(false);
      if (profile) {
        setProfile({
          ...profile,
          role: 'user'
        });
      }
    }
  };

  // Standard Candidate / Aspirant Google Sign-In
  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  // Standard Candidate Email/Password Sign-In
  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  // Standard Candidate Registration
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  // Dedicated Admin Google Sign-In with strict email verification
  const loginAdminWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const userEmail = cred.user.email?.toLowerCase() || '';
    const isDbAdmin = await checkIsAdmin(cred.user.uid, userEmail);
    const isAuthorized = ADMIN_EMAILS.includes(userEmail) || isDbAdmin;

    if (!isAuthorized) {
      // Immediately sign out unauthorized user
      await signOut(auth);
      setIsAdmin(false);
      setUser(null);
      setProfile(null);
      throw new Error(
        'Access Denied: You are not an authorized administrator.'
      );
    }
  };

  // Dedicated Admin Email & Password Sign-In with strict email verification
  const loginAdminWithEmail = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(trimmedEmail)) {
      throw new Error(
        'Invalid Admin Email: Only the authorized administrator is permitted.'
      );
    }

    const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    const userEmail = cred.user.email?.toLowerCase() || '';
    const isDbAdmin = await checkIsAdmin(cred.user.uid, userEmail);
    const isAuthorized = ADMIN_EMAILS.includes(userEmail) || isDbAdmin;

    if (!isAuthorized) {
      await signOut(auth);
      setIsAdmin(false);
      setUser(null);
      setProfile(null);
      throw new Error(
        'Access Denied: This account does not possess administrator privileges.'
      );
    }
  };

  // Only allowed for student / candidate practice
  const loginAsGuestAspirant = () => {
    sessionStorage.removeItem('pet_admin_unlocked');
    setAdminUnlockedWithKey(false);
    setIsAdmin(false);
    setProfile({
      userId: `guest_${Date.now()}`,
      email: 'aspirant@petprep.in',
      displayName: 'Rahul Sharma (Aspirant)',
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
  };

  const logout = async () => {
    sessionStorage.removeItem('pet_admin_unlocked');
    setAdminUnlockedWithKey(false);
    try {
      await signOut(auth);
    } catch {}
    setProfile(null);
    setUser(null);
    setIsAdmin(false);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        adminUnlockedWithKey,
        unlockAdminWithKey,
        lockAdmin,
        activeAdminPasskey,
        isCustomPasskeyActive,
        changeAdminPasskey,
        resetAdminPasskeyToDefault,
        language,
        setLanguage,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsGuestAspirant,
        loginAdminWithGoogle,
        loginAdminWithEmail,
        logout,
        sendPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
