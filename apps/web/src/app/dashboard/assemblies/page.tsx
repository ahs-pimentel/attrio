'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthContext } from '@/components/AuthProvider';
import { assembliesApi, AssemblyResponse } from '@/lib/api';

export default function AssembliesPage() {
  const router = useRouter();
  const { isSyndic } = useAuthContext();
  const [assemblies, setAssemblies] = useState<AssemblyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    meetingUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAssemblies = async () => {
    try {
      setLoading(true);
      const data = await assembliesApi.list();
      setAssemblies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assembleias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssemblies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assembliesApi.create({
        title: formData.title,
        description: formData.description || undefined,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        meetingUrl: formData.meetingUrl || undefined,
      });
      setFormData({ title: '', description: '', scheduledAt: '', meetingUrl: '' });
      setShowForm(false);
      await loadAssemblies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar assembleia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await assembliesApi.start(id);
      await loadAssemblies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar assembleia');
    }
  };

  const handleFinish = async (id: string) => {
    if (!confirm('Tem certeza que deseja encerrar esta assembleia?')) return;
    try {
      await assembliesApi.finish(id);
      await loadAssemblies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar assembleia');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assembleia?')) return;
    try {
      await assembliesApi.cancel(id);
      await loadAssemblies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assembleia');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta assembleia?')) return;
    try {
      await assembliesApi.delete(id);
      await loadAssemblies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir assembleia');
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      FINISHED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendada',
      IN_PROGRESS: 'Em Andamento',
      FINISHED: 'Encerrada',
      CANCELLED: 'Cancelada',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assembleias</h1>
          <p className="text-gray-600">
            {isSyndic ? 'Gerencie as assembleias do condominio' : 'Acompanhe as assembleias do condominio'}
          </p>
        </div>
        {isSyndic && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Nova Assembleia'}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {isSyndic && showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nova Assembleia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titulo
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Assembleia Geral Ordinaria"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data e Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descricao da assembleia..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link da Reuniao (opcional)
                </label>
                <input
                  type="url"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={submitting}>
                  Criar Assembleia
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : assemblies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma assembleia cadastrada
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assemblies.map((assembly) => (
              <div
                key={assembly.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/dashboard/assemblies/${assembly.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {assembly.title}
                      </h3>
                      {getStatusBadge(assembly.status)}
                    </div>
                    {assembly.description && (
                      <p className="text-gray-600 mb-2">{assembly.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        {formatDateTime(assembly.scheduledAt)}
                      </div>
                      {assembly.participantsCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                          </svg>
                          {assembly.participantsCount} participantes
                        </div>
                      )}
                      {assembly.agendaItemsCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                          {assembly.agendaItemsCount} pautas
                        </div>
                      )}
                      {assembly.meetingUrl && (
                        <a
                          href={assembly.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                          Link da reuniao
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {/* Botao de detalhes sempre visivel */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/dashboard/assemblies/${assembly.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                    {isSyndic && (
                      <>
                        {assembly.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStart(assembly.id)}
                            >
                              Iniciar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(assembly.id)}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        {assembly.status === 'IN_PROGRESS' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleFinish(assembly.id)}
                          >
                            Encerrar
                          </Button>
                        )}
                        {(assembly.status === 'CANCELLED' || assembly.status === 'FINISHED') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assembly.id)}
                          >
                            Excluir
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
