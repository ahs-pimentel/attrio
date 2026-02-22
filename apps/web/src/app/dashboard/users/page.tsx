'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usersApi, tenantsApi, UserResponse, TenantResponse } from '@/lib/api';
import { UserRole } from '@attrio/contracts';

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserResponse | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.RESIDENT,
    tenantIds: [] as string[],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, tenantsData] = await Promise.all([
        usersApi.list(),
        tenantsApi.list(),
      ]);
      setUsers(usersData);
      setTenants(tenantsData);
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

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user);
    setError(null);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      tenantIds: user.tenants?.length > 0
        ? user.tenants.map(t => t.id)
        : (user.tenantId ? [user.tenantId] : []),
    });
    setEditModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      tenantIds: role === UserRole.SAAS_ADMIN ? [] : prev.tenantIds,
    }));
  };

  const toggleTenant = (tenantId: string) => {
    setFormData(prev => ({
      ...prev,
      tenantIds: prev.tenantIds.includes(tenantId)
        ? prev.tenantIds.filter(id => id !== tenantId)
        : [...prev.tenantIds, tenantId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Validate: non-admin roles should have at least one condominium
    if (formData.role !== UserRole.SAAS_ADMIN && formData.tenantIds.length === 0) {
      setError('Selecione pelo menos um condominio para este usuario');
      return;
    }

    setSubmitting(true);
    try {
      // For SAAS_ADMIN, always send empty tenantIds
      const tenantIds = formData.role === UserRole.SAAS_ADMIN ? [] : formData.tenantIds;

      await usersApi.update(editingUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        tenantIds,
      });
      setEditModalOpen(false);
      setEditingUser(null);
      await loadData();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = (user: UserResponse) => {
    setResetUser(user);
    setNewPassword('');
    setResetSuccess(null);
    setResetModalOpen(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;

    setResetSubmitting(true);
    try {
      await usersApi.resetPassword(resetUser.id, newPassword);
      setResetSuccess(`Senha de ${resetUser.name} redefinida com sucesso`);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setResetSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      [UserRole.SAAS_ADMIN]: 'bg-purple-100 text-purple-800',
      [UserRole.SYNDIC]: 'bg-blue-100 text-blue-800',
      [UserRole.DOORMAN]: 'bg-green-100 text-green-800',
      [UserRole.RESIDENT]: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<UserRole, string> = {
      [UserRole.SAAS_ADMIN]: 'Admin Sistema',
      [UserRole.SYNDIC]: 'Sindico',
      [UserRole.DOORMAN]: 'Porteiro',
      [UserRole.RESIDENT]: 'Morador',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gerencie os usuarios do sistema</p>
        </div>
      </div>

      {error && !editModalOpen && !resetModalOpen && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condominio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.tenants?.length > 0
                        ? user.tenants.map(t => t.name).join(', ')
                        : user.tenant?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                        >
                          Redefinir Senha
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
      {resetModalOpen && resetUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Redefinir Senha</h2>
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setResetUser(null);
                  setResetSuccess(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Definir nova senha para <strong>{resetUser.name}</strong> ({resetUser.email})
            </p>

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{resetSuccess}</p>
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a nova senha"
                  minLength={6}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimo 6 caracteres. Comunique a nova senha ao usuario.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setResetModalOpen(false);
                    setResetUser(null);
                    setResetSuccess(null);
                  }}
                  disabled={resetSubmitting}
                >
                  Fechar
                </Button>
                <Button type="submit" disabled={resetSubmitting || !newPassword}>
                  {resetSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Usuario</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingUser(null);
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                <p className="text-red-800 text-sm">{error}</p>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 ml-2">✕</button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={UserRole.SAAS_ADMIN}>Admin Sistema</option>
                    <option value={UserRole.SYNDIC}>Sindico</option>
                    <option value={UserRole.DOORMAN}>Porteiro</option>
                    <option value={UserRole.RESIDENT}>Morador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condominios
                  </label>
                  <div className={`border border-gray-300 rounded-md p-2 space-y-2 max-h-40 overflow-y-auto ${formData.role === UserRole.SAAS_ADMIN ? 'opacity-50 pointer-events-none' : ''}`}>
                    {tenants.length === 0 ? (
                      <p className="text-sm text-gray-400 px-1">Nenhum condominio cadastrado</p>
                    ) : (
                      tenants.map((tenant) => (
                        <label key={tenant.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.tenantIds.includes(tenant.id)}
                            onChange={() => toggleTenant(tenant.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{tenant.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.role === UserRole.SAAS_ADMIN ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Admin Sistema nao pode ter condominio associado
                    </p>
                  ) : formData.tenantIds.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-600 font-medium">
                      Selecione ao menos um condominio para este usuario
                    </p>
                  ) : formData.tenantIds.length > 1 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.tenantIds.length} condominios selecionados
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingUser(null);
                    setError(null);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
