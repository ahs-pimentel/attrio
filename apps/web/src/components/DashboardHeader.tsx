'use client';

import Link from 'next/link';
import { useAuthContext } from './AuthProvider';

export function DashboardHeader() {
  const { user, profile, signOut } = useAuthContext();

  const getRoleBadge = () => {
    if (!profile?.role) return null;
    const labels: Record<string, string> = {
      SAAS_ADMIN: 'Admin',
      SYNDIC: 'Síndico',
      DOORMAN: 'Porteiro',
      RESIDENT: 'Morador',
    };
    return labels[profile.role] || profile.role;
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="bg-white border-b border-gray-200 px-8 h-16 flex items-center justify-end sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-attrio-green flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user?.email || 'Usuario'}
            </p>
            {roleBadge && (
              <span className="text-xs px-2 py-0.5 bg-attrio-green rounded text-white font-medium">
                {roleBadge}
              </span>
            )}
          </div>
        </Link>

        <div className="h-6 w-px bg-gray-200" />

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          Sair
        </button>
      </div>
    </header>
  );
}
