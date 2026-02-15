'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { authApi, UserRole, TenantInfo } from '@/lib/api';

export interface UserProfile {
  id: string;
  email?: string;
  userId?: string;
  tenantId?: string | null;
  role?: UserRole;
  availableTenants?: TenantInfo[];
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
  // Multi-tenant
  availableTenants: TenantInfo[];
  switchTenant: (tenantId: string) => Promise<void>;
  showTenantSelector: boolean;
  setShowTenantSelector: (show: boolean) => void;
  switchingTenant: boolean;
  currentTenantName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [switchingTenant, setSwitchingTenant] = useState(false);

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
        availableTenants: data.availableTenants,
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

  // Mostrar modal de selecao quando usuario tem multiplos tenants e sessao nova
  useEffect(() => {
    if (profile && !profileLoading) {
      const tenants = profile.availableTenants || [];
      if (tenants.length > 1) {
        const alreadySelected = sessionStorage.getItem('tenantSelected');
        if (!alreadySelected) {
          setShowTenantSelector(true);
        }
      }
    }
  }, [profile, profileLoading]);

  const availableTenants = profile?.availableTenants || [];
  const currentTenantName = availableTenants.find(
    t => t.id === profile?.tenantId,
  )?.name || null;

  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      setSwitchingTenant(true);
      await authApi.switchTenant(tenantId);
      await loadProfile();
      setShowTenantSelector(false);
      sessionStorage.setItem('tenantSelected', 'true');
    } catch (error) {
      console.error('Erro ao trocar condominio:', error);
      throw error;
    } finally {
      setSwitchingTenant(false);
    }
  }, [loadProfile]);

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
        availableTenants,
        switchTenant,
        showTenantSelector,
        setShowTenantSelector,
        switchingTenant,
        currentTenantName,
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
