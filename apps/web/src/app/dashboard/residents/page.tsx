'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { residentsApi, invitesApi, ResidentResponse, InviteResponse, unitsApi, UnitResponse } from '@/lib/api';

type TabType = 'residents' | 'invites';

export default function ResidentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('residents');
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    unitId: '',
    name: '',
    email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [residentsData, invitesData, unitsData] = await Promise.all([
        residentsApi.list(),
        invitesApi.list(),
        unitsApi.list(),
      ]);
      setResidents(residentsData);
      setInvites(invitesData);
      setUnits(unitsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const invite = await invitesApi.create(inviteFormData);
      const link = `${window.location.origin}/register/${invite.token}`;
      setCreatedInviteLink(link);
      setInviteFormData({ unitId: '', name: '', email: '', phone: '' });
      setShowInviteForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar convite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async (link?: string) => {
    const linkToCopy = link || createdInviteLink;
    if (linkToCopy) {
      await navigator.clipboard.writeText(linkToCopy);
      alert('Link copiado para a area de transferencia!');
    }
  };

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/register/${token}`;
  };

  const handleResendInvite = async (id: string) => {
    try {
      await invitesApi.resend(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar convite');
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;
    try {
      await invitesApi.cancel(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar convite');
    }
  };

  const handleToggleResidentStatus = async (resident: ResidentResponse) => {
    try {
      if (resident.status === 'ACTIVE') {
        await residentsApi.deactivate(resident.id);
      } else {
        await residentsApi.activate(resident.id);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  const handleViewResident = async (id: string) => {
    setLoadingDetail(true);
    try {
      const resident = await residentsApi.getById(id);
      setSelectedResident(resident);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes');
    } finally {
      setLoadingDetail(false);
    }
  };

  const relationshipLabels: Record<string, string> = {
    SPOUSE: 'Conjuge',
    CHILD: 'Filho(a)',
    PARENT: 'Pai/Mae',
    SIBLING: 'Irmao(a)',
    OTHER: 'Outro',
  };

  const petTypeLabels: Record<string, string> = {
    DOG: 'Cachorro',
    CAT: 'Gato',
    BIRD: 'Passaro',
    FISH: 'Peixe',
    OTHER: 'Outro',
  };

  const getUnitIdentifier = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    return unit?.identifier || 'N/A';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
      ACCEPTED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      PENDING: 'Pendente',
      EXPIRED: 'Expirado',
      ACCEPTED: 'Aceito',
      CANCELLED: 'Cancelado',
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
          <h1 className="text-2xl font-bold text-gray-900">Moradores</h1>
          <p className="text-gray-600">Gerencie os moradores do condominio</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          {showInviteForm ? 'Cancelar' : 'Novo Convite'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            Fechar
          </button>
        </div>
      )}

      {createdInviteLink && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Convite Criado com Sucesso!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 mb-3">
              Um email de convite foi enviado para o morador. Caso precise, copie o link abaixo:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdInviteLink}
                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono"
              />
              <Button onClick={() => handleCopyLink()} variant="secondary">
                Copiar
              </Button>
              <Button onClick={() => setCreatedInviteLink(null)} variant="secondary">
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showInviteForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enviar Convite</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <select
                  value={inviteFormData.unitId}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, unitId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.identifier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={inviteFormData.name}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={inviteFormData.phone}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <Button type="submit" loading={submitting}>
                Enviar Convite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('residents')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'residents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Moradores ({residents.length})
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invites'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Convites ({invites.length})
        </button>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeTab === 'residents' ? (
          residents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum morador cadastrado
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {residents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      <button
                        onClick={() => handleViewResident(resident.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {resident.fullName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {getUnitIdentifier(resident.unitId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {resident.type === 'OWNER' ? 'Proprietario' : 'Inquilino'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      <div className="text-sm">{resident.email}</div>
                      <div className="text-xs text-gray-400">{resident.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(resident.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleToggleResidentStatus(resident)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {resident.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : invites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum convite enviado
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expira em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {invite.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {getUnitIdentifier(invite.unitId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {invite.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(invite.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invite.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                    {invite.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleCopyLink(getInviteLink(invite.token))}
                          className="text-green-600 hover:text-green-900"
                        >
                          Copiar Link
                        </button>
                        <button
                          onClick={() => handleResendInvite(invite.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Reenviar
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal de detalhes do morador */}
      {(selectedResident || loadingDetail) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
            {loadingDetail ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando detalhes...</p>
              </div>
            ) : selectedResident && (
              <>
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedResident.fullName}</h2>
                    <p className="text-sm text-gray-500">
                      Unidade {getUnitIdentifier(selectedResident.unitId)} &bull; {selectedResident.type === 'OWNER' ? 'Proprietario' : 'Inquilino'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedResident.status)}
                    <button
                      onClick={() => setSelectedResident(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Dados Pessoais */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Dados Pessoais</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Email</span>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.email || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Telefone</span>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">CPF</span>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.cpf || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">RG</span>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.rg || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Data de Mudanca</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedResident.moveInDate ? formatDate(selectedResident.moveInDate) : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Consentimento LGPD</span>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedResident.dataConsent ? 'Sim' : 'Nao'}
                          {selectedResident.dataConsentAt && ` (${formatDate(selectedResident.dataConsentAt)})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Proprietario (se inquilino) */}
                  {selectedResident.type === 'TENANT' && (selectedResident.landlordName || selectedResident.landlordPhone || selectedResident.landlordEmail) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Dados do Proprietario</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-xs text-gray-500">Nome</span>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.landlordName || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Telefone</span>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.landlordPhone || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Email</span>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.landlordEmail || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contatos de Emergencia */}
                  {selectedResident.emergencyContacts && selectedResident.emergencyContacts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Contatos de Emergencia ({selectedResident.emergencyContacts.length})
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Nome</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Telefone</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">WhatsApp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResident.emergencyContacts.map((c) => (
                            <tr key={c.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{c.name}</td>
                              <td className="py-2 text-gray-900">{c.phone}</td>
                              <td className="py-2">
                                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${c.isWhatsApp ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                  {c.isWhatsApp ? 'Sim' : 'Nao'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Membros da Familia */}
                  {selectedResident.householdMembers && selectedResident.householdMembers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Membros da Familia ({selectedResident.householdMembers.length})
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Nome</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Email</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Documento</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Parentesco</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResident.householdMembers.map((m) => (
                            <tr key={m.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{m.name}</td>
                              <td className="py-2 text-gray-900">{m.email || '-'}</td>
                              <td className="py-2 text-gray-900">{m.document || '-'}</td>
                              <td className="py-2 text-gray-900">{relationshipLabels[m.relationship] || m.relationship}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Funcionarios */}
                  {selectedResident.employees && selectedResident.employees.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Funcionarios ({selectedResident.employees.length})
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Nome</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Documento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResident.employees.map((e) => (
                            <tr key={e.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{e.name}</td>
                              <td className="py-2 text-gray-900">{e.document || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Veiculos */}
                  {selectedResident.vehicles && selectedResident.vehicles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Veiculos ({selectedResident.vehicles.length})
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Marca</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Modelo</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Cor</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Placa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResident.vehicles.map((v) => (
                            <tr key={v.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{v.brand}</td>
                              <td className="py-2 text-gray-900">{v.model}</td>
                              <td className="py-2 text-gray-900">{v.color}</td>
                              <td className="py-2 font-mono text-gray-900">{v.plate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pets */}
                  {selectedResident.pets && selectedResident.pets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Pets ({selectedResident.pets.length})
                      </h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Nome</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Tipo</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Raca</th>
                            <th className="text-left py-2 text-xs text-gray-500 font-medium">Cor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResident.pets.map((p) => (
                            <tr key={p.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{p.name}</td>
                              <td className="py-2 text-gray-900">{petTypeLabels[p.type] || p.type}</td>
                              <td className="py-2 text-gray-900">{p.breed || '-'}</td>
                              <td className="py-2 text-gray-900">{p.color || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Mensagem quando nao ha sub-entidades */}
                  {(!selectedResident.emergencyContacts || selectedResident.emergencyContacts.length === 0) &&
                   (!selectedResident.householdMembers || selectedResident.householdMembers.length === 0) &&
                   (!selectedResident.employees || selectedResident.employees.length === 0) &&
                   (!selectedResident.vehicles || selectedResident.vehicles.length === 0) &&
                   (!selectedResident.pets || selectedResident.pets.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhuma informacao adicional cadastrada (contatos, membros, veiculos, pets).
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                  <Button variant="secondary" onClick={() => setSelectedResident(null)}>
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
