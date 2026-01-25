'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { apiClient } from '@/lib/api';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

interface UserProfile {
  id: string;
  email?: string;
  isAnonymous: boolean;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading, signOut } = useAuthContext();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await apiClient.get<HealthStatus>('/health', { authenticated: false });
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const data = await apiClient.get<UserProfile>('/auth/profile');
          setProfile(data);
        } catch (err) {
          console.error('Erro ao carregar perfil:', err);
        }
      } else {
        setProfile(null);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Attrio</h1>
        <p style={styles.subtitle}>Plataforma de Gerenciamento de Condominios</p>

        {/* Auth Status */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Autenticacao</h2>
          {authLoading ? (
            <p style={styles.loading}>Verificando autenticacao...</p>
          ) : user ? (
            <div style={styles.success}>
              <p><strong>Usuario:</strong> {user.email}</p>
              {profile && (
                <p><strong>ID no sistema:</strong> {profile.id}</p>
              )}
              <button onClick={signOut} style={styles.logoutButton}>
                Sair
              </button>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>Voce nao esta autenticado</p>
              <a href="/login" style={styles.loginLink}>
                Entrar / Criar conta
              </a>
            </div>
          )}
        </div>

        {/* API Status */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Status da API</h2>

          {loading && <p style={styles.loading}>Verificando conexao...</p>}

          {error && (
            <div style={styles.error}>
              <p>Erro ao conectar com a API</p>
              <small>{error}</small>
            </div>
          )}

          {health && (
            <div style={styles.success}>
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Servico:</strong> {health.service}</p>
              <p><strong>Versao:</strong> {health.version}</p>
              <p><strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString('pt-BR')}</p>
            </div>
          )}
        </div>

        <div style={styles.links}>
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Swagger UI
          </a>
          <a
            href="http://localhost:3001/api/reference"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Scalar API Reference
          </a>
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '2rem',
  },
  container: {
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#666',
    marginBottom: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#333',
  },
  loading: {
    color: '#666',
  },
  error: {
    color: '#dc2626',
    padding: '1rem',
    background: '#fef2f2',
    borderRadius: '8px',
  },
  success: {
    color: '#166534',
    padding: '1rem',
    background: '#f0fdf4',
    borderRadius: '8px',
    textAlign: 'left',
  },
  links: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  link: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#2563eb',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'background 0.2s',
    textDecoration: 'none',
  },
  loginLink: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#2563eb',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: 500,
    textDecoration: 'none',
  },
  logoutButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
  },
};
