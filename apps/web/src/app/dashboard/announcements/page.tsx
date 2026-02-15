'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { useAuthContext } from '@/components/AuthProvider';
import { announcementsApi, AnnouncementResponse } from '@/lib/api';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

export default function AnnouncementsPage() {
  const { isSyndic } = useAuthContext();
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View modal
  const [viewingAnnouncement, setViewingAnnouncement] = useState<AnnouncementResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await announcementsApi.list();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar comunicados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setShowForm(true);
  };

  const handleEdit = (announcement: AnnouncementResponse) => {
    setEditingId(announcement.id);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await announcementsApi.update(editingId, {
          title: formTitle,
          content: formContent,
        });
      } else {
        await announcementsApi.create({
          title: formTitle,
          content: formContent,
        });
      }
      setShowForm(false);
      setFormTitle('');
      setFormContent('');
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar comunicado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comunicado?')) return;
    try {
      await announcementsApi.delete(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir comunicado');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = (type: string) => {
    if (type === 'ASSEMBLY') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Assembleia
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        Geral
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>
          <p className="text-gray-600">Gerencie os comunicados do condominio</p>
        </div>
        {isSyndic && (
          <Button onClick={handleCreate}>Novo Comunicado</Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            Fechar
          </button>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Editar Comunicado' : 'Novo Comunicado'}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Titulo do comunicado"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conteudo</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={formContent}
                onChange={setFormContent}
                modules={quillModules}
                placeholder="Escreva o comunicado..."
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {editingId ? 'Salvar' : 'Publicar'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewingAnnouncement}
        onClose={() => setViewingAnnouncement(null)}
        title={viewingAnnouncement?.title || ''}
        size="xl"
      >
        {viewingAnnouncement && (
          <div>
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
              {getTypeBadge(viewingAnnouncement.type)}
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
        <ModalFooter>
          <Button variant="secondary" onClick={() => setViewingAnnouncement(null)}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>

      {/* List */}
      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum comunicado publicado
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    <button
                      onClick={() => setViewingAnnouncement(announcement)}
                      className="text-left hover:text-blue-600 transition-colors"
                    >
                      {announcement.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(announcement.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {formatDate(announcement.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {announcement.createdByName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                    <button
                      onClick={() => setViewingAnnouncement(announcement)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </button>
                    {isSyndic && announcement.type !== 'ASSEMBLY' && (
                      <>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
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
    </div>
  );
}
