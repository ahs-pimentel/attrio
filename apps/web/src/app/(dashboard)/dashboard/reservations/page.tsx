'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAuthContext } from '@/components/AuthProvider';
import {
  reservationsApi,
  commonAreasApi,
  ReservationResponse,
  CommonAreaResponse,
} from '@/lib/api';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function ReservationsPage() {
  const { isSyndic } = useAuthContext();
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [areas, setAreas] = useState<CommonAreaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reservation form
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationAreaId, setReservationAreaId] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Area form
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [areaRules, setAreaRules] = useState('');
  const [areaCapacity, setAreaCapacity] = useState('');

  // Calendar state
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [areaReservations, setAreaReservations] = useState<ReservationResponse[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reservationsData, areasData] = await Promise.all([
        reservationsApi.list().catch(() => []),
        commonAreasApi.list().catch(() => []),
      ]);
      setReservations(reservationsData);
      setAreas(areasData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load area reservations when area or month changes
  useEffect(() => {
    if (!selectedAreaId) return;
    reservationsApi
      .getByArea(selectedAreaId, currentMonth)
      .then(setAreaReservations)
      .catch(() => setAreaReservations([]));
  }, [selectedAreaId, currentMonth]);

  // Reservation handlers
  const handleCreateReservation = () => {
    setReservationAreaId(selectedAreaId || '');
    setReservationDate('');
    setReservationNotes('');
    setShowReservationForm(true);
  };

  const handleCreateReservationForDate = (date: string) => {
    setReservationAreaId(selectedAreaId);
    setReservationDate(date);
    setReservationNotes('');
    setShowReservationForm(true);
  };

  const handleSubmitReservation = async () => {
    if (!reservationAreaId || !reservationDate) return;
    setSubmitting(true);
    try {
      await reservationsApi.create({
        commonAreaId: reservationAreaId,
        reservationDate,
        notes: reservationNotes || undefined,
      });
      setShowReservationForm(false);
      await loadData();
      // Reload area reservations
      if (selectedAreaId) {
        const updated = await reservationsApi.getByArea(selectedAreaId, currentMonth);
        setAreaReservations(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await reservationsApi.updateStatus(id, { status: 'APPROVED' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar reserva');
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) return;
    try {
      await reservationsApi.updateStatus(rejectingId, {
        status: 'REJECTED',
        rejectionReason,
      });
      setRejectingId(null);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar reserva');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    try {
      await reservationsApi.updateStatus(id, { status: 'CANCELLED' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar reserva');
    }
  };

  // Area handlers
  const handleCreateArea = () => {
    setEditingAreaId(null);
    setAreaName('');
    setAreaDescription('');
    setAreaRules('');
    setAreaCapacity('');
    setShowAreaForm(true);
  };

  const handleEditArea = (area: CommonAreaResponse) => {
    setEditingAreaId(area.id);
    setAreaName(area.name);
    setAreaDescription(area.description || '');
    setAreaRules(area.rules || '');
    setAreaCapacity(area.maxCapacity ? String(area.maxCapacity) : '');
    setShowAreaForm(true);
  };

  const handleSubmitArea = async () => {
    if (!areaName.trim()) return;
    setSubmitting(true);
    try {
      const data = {
        name: areaName,
        description: areaDescription || undefined,
        rules: areaRules || undefined,
        maxCapacity: areaCapacity ? parseInt(areaCapacity) : undefined,
      };
      if (editingAreaId) {
        await commonAreasApi.update(editingAreaId, data);
      } else {
        await commonAreasApi.create(data);
      }
      setShowAreaForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar area');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArea = async (area: CommonAreaResponse) => {
    try {
      await commonAreasApi.update(area.id, { active: !area.active });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar area');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const pendingReservations = reservations.filter((r) => r.status === 'PENDING');
  const activeAreas = areas.filter((a) => a.active);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Padding days from previous month
    for (let i = 0; i < startPad; i++) {
      days.push({ date: '', day: 0, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, day: d, isCurrentMonth: true });
    }

    return days;
  }, [currentMonth]);

  const reservedDates = useMemo(() => {
    const map: Record<string, string> = {};
    areaReservations.forEach((r) => {
      map[r.reservationDate] = r.status;
    });
    return map;
  }, [areaReservations]);

  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600">Gerencie reservas de areas comuns do condominio</p>
        </div>
        <Button onClick={handleCreateReservation}>Nova Reserva</Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            Fechar
          </button>
        </div>
      )}

      {/* Reservation Form Modal */}
      <Modal
        isOpen={showReservationForm}
        onClose={() => setShowReservationForm(false)}
        title="Nova Reserva"
      >
        <div className="space-y-4">
          <Select
            label="Area Comum"
            value={reservationAreaId}
            onChange={(e) => setReservationAreaId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {activeAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Input
            label="Data"
            type="date"
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            min={today}
            required
          />
          <Textarea
            label="Observacoes (opcional)"
            value={reservationNotes}
            onChange={(e) => setReservationNotes(e.target.value)}
            placeholder="Alguma observacao..."
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowReservationForm(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitReservation} loading={submitting}>
            Solicitar Reserva
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingId}
        onClose={() => { setRejectingId(null); setRejectionReason(''); }}
        title="Rejeitar Reserva"
      >
        <div className="space-y-4">
          <Textarea
            label="Motivo da rejeicao"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Informe o motivo..."
            required
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleReject} loading={submitting}>
            Rejeitar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Area Form Modal */}
      <Modal
        isOpen={showAreaForm}
        onClose={() => setShowAreaForm(false)}
        title={editingAreaId ? 'Editar Area Comum' : 'Nova Area Comum'}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="Ex: Churrasqueira, Salao de Festas..."
            required
          />
          <Textarea
            label="Descricao (opcional)"
            value={areaDescription}
            onChange={(e) => setAreaDescription(e.target.value)}
            placeholder="Descreva a area..."
          />
          <Textarea
            label="Regras de uso (opcional)"
            value={areaRules}
            onChange={(e) => setAreaRules(e.target.value)}
            placeholder="Regras para uso da area..."
          />
          <Input
            label="Capacidade maxima (opcional)"
            type="number"
            value={areaCapacity}
            onChange={(e) => setAreaCapacity(e.target.value)}
            placeholder="Numero de pessoas"
            min="1"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAreaForm(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitArea} loading={submitting}>
            {editingAreaId ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : isSyndic ? (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes {pendingReservations.length > 0 && `(${pendingReservations.length})`}
            </TabsTrigger>
            <TabsTrigger value="all">Todas as Reservas</TabsTrigger>
            <TabsTrigger value="areas">Areas Comuns</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card padding="none">
              {pendingReservations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma reserva pendente</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obs.</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingReservations.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.commonAreaName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.reservedByName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(r.reservationDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{r.notes || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-900 font-medium">
                            Aprovar
                          </button>
                          <button onClick={() => { setRejectingId(r.id); setRejectionReason(''); }} className="text-red-600 hover:text-red-900 font-medium">
                            Rejeitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card padding="none">
              {reservations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma reserva registrada</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.commonAreaName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.reservedByName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(r.reservationDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[r.status]}`}>
                            {statusLabels[r.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          {r.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-900">
                                Aprovar
                              </button>
                              <button onClick={() => { setRejectingId(r.id); setRejectionReason(''); }} className="text-red-600 hover:text-red-900">
                                Rejeitar
                              </button>
                            </>
                          )}
                          {r.status === 'APPROVED' && (
                            <button onClick={() => handleCancel(r.id)} className="text-yellow-600 hover:text-yellow-900">
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="areas">
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreateArea}>Nova Area Comum</Button>
            </div>
            <Card padding="none">
              {areas.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma area comum cadastrada</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {areas.map((area) => (
                      <tr key={area.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{area.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {area.maxCapacity ? `${area.maxCapacity} pessoas` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${area.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {area.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          <button onClick={() => handleEditArea(area)} className="text-blue-600 hover:text-blue-900">
                            Editar
                          </button>
                          <button onClick={() => handleToggleArea(area)} className={area.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}>
                            {area.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Morador: calendario + minhas reservas */
        <div className="space-y-6">
          {/* Area selector + Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Selecione a area"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
              >
                <option value="">Selecione uma area...</option>
                {activeAreas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>

              {selectedAreaId && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <span className="text-lg font-medium capitalize">{monthLabel}</span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
                      <div key={d} className="text-xs font-medium text-gray-500 py-2">{d}</div>
                    ))}
                    {calendarDays.map((d, i) => {
                      if (!d.isCurrentMonth) {
                        return <div key={i} className="py-2" />;
                      }
                      const status = reservedDates[d.date];
                      const isPast = d.date < today;
                      const isOccupied = status === 'APPROVED';
                      const isPending = status === 'PENDING';
                      const isFree = !status && !isPast;

                      let bgClass = 'bg-gray-50 text-gray-300'; // past
                      if (isFree) bgClass = 'bg-green-50 text-green-800 hover:bg-green-100 cursor-pointer';
                      if (isPending) bgClass = 'bg-yellow-50 text-yellow-800';
                      if (isOccupied) bgClass = 'bg-red-50 text-red-800';

                      return (
                        <button
                          key={i}
                          disabled={!isFree}
                          onClick={() => isFree && handleCreateReservationForDate(d.date)}
                          className={`py-2 rounded text-sm font-medium ${bgClass}`}
                        >
                          {d.day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Livre
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-yellow-200 inline-block" /> Pendente
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Ocupado
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My reservations */}
          <Card>
            <CardHeader>
              <CardTitle>Minhas Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Voce nao possui reservas</p>
              ) : (
                <div className="space-y-3">
                  {reservations.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{r.commonAreaName}</p>
                        <p className="text-sm text-gray-500">{formatDate(r.reservationDate)}</p>
                        {r.rejectionReason && (
                          <p className="text-sm text-red-500 mt-1">Motivo: {r.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[r.status]}`}>
                          {statusLabels[r.status]}
                        </span>
                        {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                          <button
                            onClick={() => handleCancel(r.id)}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
