'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AgendaItemResponse } from '@/lib/api';

type QuorumType = 'simple' | 'qualified' | 'unanimous';

interface AgendaItemFormProps {
  initialData?: AgendaItemResponse;
  onSubmit: (data: {
    title: string;
    description?: string;
    requiresQuorum?: boolean;
    quorumType?: QuorumType;
  }) => Promise<unknown>;
  onCancel: () => void;
}

/**
 * AgendaItemForm - Formulario para criar/editar pautas
 */
export function AgendaItemForm({ initialData, onSubmit, onCancel }: AgendaItemFormProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    requiresQuorum: boolean;
    quorumType: QuorumType;
  }>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    requiresQuorum: initialData?.requiresQuorum ?? true,
    quorumType: (initialData?.quorumType as QuorumType) || 'simple',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('O titulo e obrigatorio');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        requiresQuorum: formData.requiresQuorum,
        quorumType: formData.quorumType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pauta');
    } finally {
      setSubmitting(false);
    }
  };

  const quorumOptions = [
    { value: 'simple', label: 'Maioria Simples (50% + 1)' },
    { value: 'qualified', label: 'Maioria Qualificada (2/3)' },
    { value: 'unanimous', label: 'Unanimidade (100%)' },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-4">
        {initialData ? 'Editar Pauta' : 'Nova Pauta'}
      </h4>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titulo"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Aprovacao das contas de 2024"
          required
        />

        <Textarea
          label="Descricao"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva os detalhes da pauta..."
          rows={3}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requiresQuorum"
            checked={formData.requiresQuorum}
            onChange={(e) =>
              setFormData({ ...formData, requiresQuorum: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="requiresQuorum" className="text-sm text-gray-700">
            Requer quorum minimo
          </label>
        </div>

        {formData.requiresQuorum && (
          <Select
            label="Tipo de Quorum"
            value={formData.quorumType}
            onChange={(e) => setFormData({ ...formData, quorumType: e.target.value as QuorumType })}
            options={quorumOptions}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {initialData ? 'Salvar' : 'Criar Pauta'}
          </Button>
        </div>
      </form>
    </div>
  );
}
