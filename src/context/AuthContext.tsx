import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEMO_USER } from '../data/mockData';
import {
  clearSession,
  loadSession,
  register as registerUser,
  saveSession,
  signIn as signInUser,
} from '../services/authService';
import { loadProfile, saveProfile } from '../services/profileService';
import type { AppUser, UserProfile } from '../types';

interface AuthContextValue {
  user: AppUser | null;
  profile: UserProfile;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInWithDemo: () => Promise<void>;
  signOut: () => void;
  updateProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => loadSession());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(loadSession()));
  const ready = true;

  useEffect(() => {
    setProfile(loadProfile(user));
  }, [user]);

  const completeSignIn = useCallback((nextUser: AppUser) => {
    saveSession(nextUser);
    setUser(nextUser);
    setProfile(loadProfile(nextUser));
  }, []);

  const signIn = useCallback(
    async (email: string, _password: string) => {
      completeSignIn(await signInUser(email));
    },
    [completeSignIn],
  );

  const register = useCallback(
    async (name: string, email: string, _password: string) => {
      completeSignIn(await registerUser(name, email));
    },
    [completeSignIn],
  );

  const signInWithDemo = useCallback(async () => {
    completeSignIn(DEMO_USER);
  }, [completeSignIn]);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
    setProfile(loadProfile(null));
  }, []);

  const updateProfile = useCallback((nextProfile: UserProfile) => {
    saveProfile(nextProfile);
    setProfile(nextProfile);
  }, []);

  const value = useMemo(
    () => ({ user, profile, ready, signIn, register, signInWithDemo, signOut, updateProfile }),
    [user, profile, ready, signIn, register, signInWithDemo, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
