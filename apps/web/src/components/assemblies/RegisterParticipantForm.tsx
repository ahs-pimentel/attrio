'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { unitsApi, residentsApi, RegisterParticipantDto, UnitResponse, ResidentResponse } from '@/lib/api';

interface RegisterParticipantFormProps {
  assemblyId: string;
  onSubmit: (data: RegisterParticipantDto) => Promise<void>;
  onCancel: () => void;
}

/**
 * RegisterParticipantForm - Formulario para registrar participante na assembleia
 */
export function RegisterParticipantForm({
  assemblyId,
  onSubmit,
  onCancel,
}: RegisterParticipantFormProps) {
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    unitId: '',
    residentId: '',
    isProxy: false,
    proxyName: '',
    proxyDocument: '',
    votingWeight: 1,
  });

  // Carrega lista de unidades
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await unitsApi.list();
        // Filtra apenas unidades ativas
        setUnits(data.filter((u) => u.status === 'ACTIVE'));
      } catch (err) {
        setError('Erro ao carregar unidades');
      } finally {
        setLoadingUnits(false);
      }
    };
    loadUnits();
  }, []);

  // Carrega moradores da unidade selecionada
  useEffect(() => {
    const loadResidents = async () => {
      if (!formData.unitId) {
        setResidents([]);
        return;
      }

      try {
        setLoadingResidents(true);
        const data = await residentsApi.getByUnit(formData.unitId);
        // Filtra apenas moradores ativos
        setResidents(data.filter((r) => r.status === 'ACTIVE'));
      } catch (err) {
        console.error('Erro ao carregar moradores:', err);
        setResidents([]);
      } finally {
        setLoadingResidents(false);
      }
    };
    loadResidents();
  }, [formData.unitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unitId) {
      setError('Selecione uma unidade');
      return;
    }

    if (formData.isProxy && !formData.proxyName.trim()) {
      setError('Informe o nome do procurador');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const data: RegisterParticipantDto = {
        unitId: formData.unitId,
        residentId: formData.residentId || undefined,
        proxyName: formData.isProxy ? formData.proxyName.trim() : undefined,
        proxyDocument: formData.isProxy ? formData.proxyDocument.trim() : undefined,
        votingWeight: formData.votingWeight,
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar participante');
    } finally {
      setSubmitting(false);
    }
  };

  const unitOptions = units.map((unit) => ({
    value: unit.id,
    label: unit.identifier || `${unit.block || ''} ${unit.number}`.trim(),
  }));

  const residentOptions = [
    { value: '', label: 'Nenhum (somente unidade)' },
    ...residents.map((resident) => ({
      value: resident.id,
      label: resident.fullName,
    })),
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-4">Registrar Participante</h4>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Unidade"
          value={formData.unitId}
          onChange={(e) =>
            setFormData({ ...formData, unitId: e.target.value, residentId: '' })
          }
          options={unitOptions}
          placeholder="Selecione a unidade"
          disabled={loadingUnits}
          required
        />

        {formData.unitId && (
          <Select
            label="Morador"
            value={formData.residentId}
            onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
            options={residentOptions}
            disabled={loadingResidents}
            helperText="Opcional - selecione se o morador ja esta cadastrado"
          />
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isProxy"
            checked={formData.isProxy}
            onChange={(e) => setFormData({ ...formData, isProxy: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isProxy" className="text-sm text-gray-700">
            Representado por procurador
          </label>
        </div>

        {formData.isProxy && (
          <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
            <Input
              label="Nome do Procurador"
              value={formData.proxyName}
              onChange={(e) => setFormData({ ...formData, proxyName: e.target.value })}
              placeholder="Nome completo"
              required={formData.isProxy}
            />
            <Input
              label="Documento do Procurador"
              value={formData.proxyDocument}
              onChange={(e) =>
                setFormData({ ...formData, proxyDocument: e.target.value })
              }
              placeholder="CPF ou RG"
              helperText="Opcional"
            />
          </div>
        )}

        <Input
          type="number"
          label="Peso do Voto"
          value={formData.votingWeight.toString()}
          onChange={(e) =>
            setFormData({ ...formData, votingWeight: parseInt(e.target.value) || 1 })
          }
          min={1}
          helperText="Normalmente 1. Use maior valor para unidades com fracao ideal maior."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Registrar
          </Button>
        </div>
      </form>
    </div>
  );
}
