'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { authApi, UserRole } from '@/lib/api';

export interface UserProfile {
  id: string;
  email?: string;
  userId?: string;
  tenantId?: string | null;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isAdmin: boolean;
  isSyndic: boolean;
  isResident: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!auth.session) {
      setProfile(null);
      return;
    }

    try {
      setProfileLoading(true);
      const data = await authApi.getProfile();
      setProfile({
        id: data.id,
        email: data.email,
        userId: data.userId,
        tenantId: data.tenantId,
        role: data.role,
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [auth.session]);

  useEffect(() => {
    if (auth.session && !auth.loading) {
      loadProfile();
    } else if (!auth.session) {
      setProfile(null);
    }
  }, [auth.session, auth.loading, loadProfile]);

  const isAdmin = profile?.role === 'SAAS_ADMIN';
  const isSyndic = profile?.role === 'SYNDIC' || isAdmin;
  const isResident = profile?.role === 'RESIDENT';

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        profile,
        loading: auth.loading || profileLoading,
        isAdmin,
        isSyndic,
        isResident,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
