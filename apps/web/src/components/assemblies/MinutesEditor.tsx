'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import type { MinutesResponse, UpdateMinutesDto } from '@/lib/api';

interface MinutesEditorProps {
  minutes: MinutesResponse;
  onSave: (data: UpdateMinutesDto) => Promise<void>;
  onCancel: () => void;
}

/**
 * MinutesEditor - Editor de ata da assembleia
 */
export function MinutesEditor({ minutes, onSave, onCancel }: MinutesEditorProps) {
  const [content, setContent] = useState(minutes.content || '');
  const [summary, setSummary] = useState(minutes.summary || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave({
        content: content.trim(),
        summary: summary.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ata');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = content !== (minutes.content || '') || summary !== (minutes.summary || '');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Editar Ata</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
              Salvar Alteracoes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Resumo */}
          <Textarea
            label="Resumo"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Resumo executivo da assembleia..."
            rows={3}
            helperText="Opcional. Um breve resumo dos principais pontos discutidos."
          />

          {/* Conteudo principal */}
          <Textarea
            label="Conteudo da Ata"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteudo completo da ata..."
            rows={20}
            className="font-mono text-sm"
            helperText="Digite ou edite o conteudo completo da ata da assembleia."
          />

          {/* Dicas */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Dicas para a Ata</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>- Inclua data, hora e local da assembleia</li>
              <li>- Liste os participantes presentes</li>
              <li>- Descreva cada pauta discutida</li>
              <li>- Registre os resultados das votacoes</li>
              <li>- Anote decisoes e encaminhamentos</li>
              <li>- Mencione horario de encerramento</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
