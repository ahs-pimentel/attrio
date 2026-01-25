'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error('API nao esta respondendo');
        }

        const data = await response.json();
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Attrio</h1>
        <p style={styles.subtitle}>Plataforma de Gerenciamento de Condominios</p>

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
  },
};
