'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAuthContext } from '@/components/AuthProvider';
import {
  issuesApi,
  issueCategoriesApi,
  IssueResponse,
  IssueCategoryResponse,
  unitsApi,
  UnitResponse,
} from '@/lib/api';

const statusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Resolvida',
  CLOSED: 'Fechada',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function IssuesPage() {
  const { isSyndic } = useAuthContext();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [categories, setCategories] = useState<IssueCategoryResponse[]>([]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueCategoryId, setIssueCategoryId] = useState('');
  const [issueUnitId, setIssueUnitId] = useState('');
  const [issuePriority, setIssuePriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  // Issue detail
  const [viewingIssue, setViewingIssue] = useState<IssueResponse | null>(null);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [issuesData, categoriesData, unitsData] = await Promise.all([
        issuesApi.list().catch(() => []),
        issueCategoriesApi.list().catch(() => []),
        unitsApi.list().catch(() => []),
      ]);
      setIssues(issuesData);
      setCategories(categoriesData);
      setUnits(unitsData);
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

  // Issue handlers
  const handleCreateIssue = () => {
    setEditingIssueId(null);
    setIssueTitle('');
    setIssueDescription('');
    setIssueCategoryId('');
    setIssueUnitId('');
    setIssuePriority('MEDIUM');
    setShowIssueForm(true);
  };

  const handleSubmitIssue = async () => {
    if (!issueTitle.trim() || !issueDescription.trim()) return;
    setSubmitting(true);
    try {
      if (editingIssueId) {
        await issuesApi.update(editingIssueId, {
          title: issueTitle,
          description: issueDescription,
          categoryId: issueCategoryId || undefined,
          priority: issuePriority as any,
        });
      } else {
        await issuesApi.create({
          title: issueTitle,
          description: issueDescription,
          categoryId: issueCategoryId || undefined,
          unitId: issueUnitId || undefined,
          priority: issuePriority as any,
        });
      }
      setShowIssueForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ocorrencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await issuesApi.update(id, { status: status as any });
      await loadData();
      if (viewingIssue?.id === id) {
        const updated = await issuesApi.getById(id);
        setViewingIssue(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ocorrencia?')) return;
    try {
      await issuesApi.delete(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir ocorrencia');
    }
  };

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setShowCategoryForm(true);
  };

  const handleEditCategory = (cat: IssueCategoryResponse) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setShowCategoryForm(true);
  };

  const handleSubmitCategory = async () => {
    if (!categoryName.trim()) return;
    setSubmitting(true);
    try {
      if (editingCategoryId) {
        await issueCategoriesApi.update(editingCategoryId, { name: categoryName });
      } else {
        await issueCategoriesApi.create({ name: categoryName });
      }
      setShowCategoryForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCategory = async (cat: IssueCategoryResponse) => {
    try {
      await issueCategoriesApi.update(cat.id, { active: !cat.active });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const activeCategories = categories.filter((c) => c.active);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ocorrencias</h1>
          <p className="text-gray-600">Registre e acompanhe ocorrencias do condominio</p>
        </div>
        <Button onClick={handleCreateIssue}>Nova Ocorrencia</Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            Fechar
          </button>
        </div>
      )}

      {/* Issue Form Modal */}
      <Modal
        isOpen={showIssueForm}
        onClose={() => setShowIssueForm(false)}
        title={editingIssueId ? 'Editar Ocorrencia' : 'Nova Ocorrencia'}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Titulo"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            placeholder="Descreva brevemente o problema"
            required
          />
          <Textarea
            label="Descricao"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Detalhe a ocorrencia..."
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={issueCategoryId}
              onChange={(e) => setIssueCategoryId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              label="Prioridade"
              value={issuePriority}
              onChange={(e) => setIssuePriority(e.target.value)}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </Select>
          </div>
          {!editingIssueId && units.length > 0 && (
            <Select
              label="Unidade (opcional)"
              value={issueUnitId}
              onChange={(e) => setIssueUnitId(e.target.value)}
            >
              <option value="">Nenhuma</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.identifier || `${u.block} - ${u.number}`}
                </option>
              ))}
            </Select>
          )}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowIssueForm(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitIssue} loading={submitting}>
            {editingIssueId ? 'Salvar' : 'Registrar'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Issue Detail Modal */}
      <Modal
        isOpen={!!viewingIssue}
        onClose={() => setViewingIssue(null)}
        title={viewingIssue?.title || ''}
        size="xl"
      >
        {viewingIssue && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[viewingIssue.status]}`}>
                {statusLabels[viewingIssue.status]}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[viewingIssue.priority]}`}>
                {priorityLabels[viewingIssue.priority]}
              </span>
              {viewingIssue.categoryName && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  {viewingIssue.categoryName}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Autor:</strong> {viewingIssue.createdByName}</p>
              <p><strong>Data:</strong> {formatDate(viewingIssue.createdAt)}</p>
              {viewingIssue.unitIdentifier && (
                <p><strong>Unidade:</strong> {viewingIssue.unitIdentifier}</p>
              )}
              {viewingIssue.resolvedByName && (
                <p><strong>Resolvido por:</strong> {viewingIssue.resolvedByName} em {formatDate(viewingIssue.resolvedAt!)}</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{viewingIssue.description}</p>
            </div>
            {isSyndic && viewingIssue.status !== 'CLOSED' && (
              <div className="flex gap-2 pt-2">
                {viewingIssue.status === 'OPEN' && (
                  <Button size="sm" onClick={() => handleUpdateStatus(viewingIssue.id, 'IN_PROGRESS')}>
                    Iniciar Andamento
                  </Button>
                )}
                {(viewingIssue.status === 'OPEN' || viewingIssue.status === 'IN_PROGRESS') && (
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(viewingIssue.id, 'RESOLVED')}>
                    Marcar Resolvida
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(viewingIssue.id, 'CLOSED')}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setViewingIssue(null)}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Category Form Modal */}
      <Modal
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        title={editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <div className="space-y-4">
          <Input
            label="Nome da categoria"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ex: Manutencao, Barulho, Seguranca..."
            required
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCategoryForm(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitCategory} loading={submitting}>
            {editingCategoryId ? 'Salvar' : 'Criar'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : isSyndic ? (
        <Tabs defaultValue="issues">
          <TabsList>
            <TabsTrigger value="issues">Todas as Ocorrencias</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            <Card padding="none">
              {issues.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma ocorrencia registrada</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setViewingIssue(issue)}
                            className="font-medium text-gray-900 hover:text-blue-600 text-left"
                          >
                            {issue.title}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {issue.categoryName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[issue.status]}`}>
                            {statusLabels[issue.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[issue.priority]}`}>
                            {priorityLabels[issue.priority]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {issue.createdByName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(issue.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          <button onClick={() => setViewingIssue(issue)} className="text-blue-600 hover:text-blue-900">
                            Ver
                          </button>
                          <button onClick={() => handleDeleteIssue(issue.id)} className="text-red-600 hover:text-red-900">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreateCategory}>Nova Categoria</Button>
            </div>
            <Card padding="none">
              {categories.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma categoria criada</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cat.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {cat.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                          <button onClick={() => handleEditCategory(cat)} className="text-blue-600 hover:text-blue-900">
                            Editar
                          </button>
                          <button onClick={() => handleToggleCategory(cat)} className={cat.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}>
                            {cat.active ? 'Desativar' : 'Ativar'}
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
        /* Morador: lista simples */
        <Card padding="none">
          {issues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Voce nao possui ocorrencias registradas</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setViewingIssue(issue)}
                        className="font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {issue.title}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.categoryName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[issue.status]}`}>
                        {statusLabels[issue.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[issue.priority]}`}>
                        {priorityLabels[issue.priority]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(issue.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => setViewingIssue(issue)} className="text-blue-600 hover:text-blue-900">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
