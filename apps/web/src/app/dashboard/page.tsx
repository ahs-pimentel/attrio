'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuthContext } from '@/components/AuthProvider';
import { unitsApi, residentsApi, assembliesApi, announcementsApi, AnnouncementResponse } from '@/lib/api';

interface DashboardStats {
  totalUnits: number;
  totalResidents: number;
  upcomingAssemblies: number;
  activeResidents: number;
}

export default function DashboardPage() {
  const { isSyndic } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalUnits: 0,
    totalResidents: 0,
    upcomingAssemblies: 0,
    activeResidents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<AnnouncementResponse | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [units, residents, assemblies, announcementsData] = await Promise.all([
          unitsApi.list().catch(() => []),
          residentsApi.list().catch(() => []),
          assembliesApi.listUpcoming().catch(() => []),
          announcementsApi.list().catch(() => []),
        ]);

        setStats({
          totalUnits: units.length,
          totalResidents: residents.length,
          upcomingAssemblies: assemblies.length,
          activeResidents: residents.filter((r) => r.status === 'ACTIVE').length,
        });
        setAnnouncements(announcementsData.slice(0, 5));
      } catch (error) {
        console.error('Erro ao carregar estatisticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = isSyndic
    ? [
        { title: 'Total de Unidades', value: stats.totalUnits, color: 'bg-blue-500' },
        { title: 'Moradores Ativos', value: stats.activeResidents, color: 'bg-green-500' },
        { title: 'Total de Moradores', value: stats.totalResidents, color: 'bg-purple-500' },
        { title: 'Assembleias Proximas', value: stats.upcomingAssemblies, color: 'bg-orange-500' },
      ]
    : [
        { title: 'Assembleias Proximas', value: stats.upcomingAssemblies, color: 'bg-orange-500' },
      ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visao geral do condominio</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mr-4`}>
                  <span className="text-white text-xl font-bold">{stat.value}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className={`mt-8 grid grid-cols-1 ${isSyndic ? 'lg:grid-cols-2' : ''} gap-6`}>
        {isSyndic && (
          <Card>
            <CardHeader>
              <CardTitle>Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="/dashboard/units"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Cadastrar Unidade</p>
                    <p className="text-sm text-gray-500">Adicionar nova unidade ao condominio</p>
                  </div>
                </a>
                <a
                  href="/dashboard/assemblies"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Agendar Assembleia</p>
                    <p className="text-sm text-gray-500">Criar nova assembleia</p>
                  </div>
                </a>
                <a
                  href="/dashboard/residents"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Enviar Convite</p>
                    <p className="text-sm text-gray-500">Convidar novo morador</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Comunicados</CardTitle>
              {announcements.length > 0 && (
                <a href="/dashboard/announcements" className="text-sm text-blue-600 hover:text-blue-800">
                  Ver todos
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                </svg>
                <p className="text-sm">Nenhum comunicado no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setViewingAnnouncement(a)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm truncate">{a.title}</p>
                      {a.type === 'ASSEMBLY' && (
                        <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
                          Assembleia
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(a.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de visualizacao */}
      <Modal
        isOpen={!!viewingAnnouncement}
        onClose={() => setViewingAnnouncement(null)}
        title={viewingAnnouncement?.title || ''}
        size="xl"
      >
        {viewingAnnouncement && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
              {viewingAnnouncement.type === 'ASSEMBLY' ? (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Assembleia
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Geral
                </span>
              )}
              <span>{formatDate(viewingAnnouncement.createdAt)}</span>
              {viewingAnnouncement.createdByName && (
                <span>por {viewingAnnouncement.createdByName}</span>
              )}
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: viewingAnnouncement.content }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
