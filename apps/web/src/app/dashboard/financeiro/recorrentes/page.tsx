'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuthContext } from '@/components/AuthProvider';
import { financeApi, RecurringResponse, TransactionType, TransactionCategory, RecurringFrequency, CreateRecurringInput } from '@/lib/api';

const typeLabels: Record<TransactionType, string> = { INCOME: 'Entrada', EXPENSE: 'Saída' };

const categoryLabels: Record<TransactionCategory, string> = {
  COMMON_FEES: 'Taxa de Condomínio',
  MAINTENANCE: 'Manutenção',
  UTILITIES: 'Utilidades',
  SALARY: 'Salário',
  INSURANCE: 'Seguro',
  RESERVE_FUND: 'Fundo de Reserva',
  OTHER: 'Outro',
};

const frequencyLabels: Record<RecurringFrequency, string> = {
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDate(date: string | null) {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

export default function RecorrentesPage() {
  const { isSyndic, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isSyndic && !isAdmin) router.replace('/dashboard');
  }, [isSyndic, isAdmin, router]);

  const [items, setItems] = useState<RecurringResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Apply modal
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyDate, setApplyDate] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Form
  const [formType, setFormType] = useState<TransactionType>('EXPENSE');
  const [formCategory, setFormCategory] = useState<TransactionCategory>('OTHER');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReference, setFormReference] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.getRecurring(!showAll ? true : undefined);
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar recorrentes');
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditingId(null);
    setFormType('EXPENSE');
    setFormCategory('OTHER');
    setFormDescription('');
    setFormAmount('');
    setFormFrequency('MONTHLY');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormReference('');
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(r: RecurringResponse) {
    setEditingId(r.id);
    setFormType(r.type);
    setFormCategory(r.category);
    setFormDescription(r.description);
    setFormAmount(String(r.amount));
    setFormFrequency(r.frequency);
    setFormStartDate(r.startDate);
    setFormEndDate(r.endDate || '');
    setFormReference(r.reference || '');
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formDescription.trim() || !formAmount || !formStartDate) {
      setFormError('Preencha todos os campos obrigatórios'); return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) { setFormError('Valor deve ser maior que zero'); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CreateRecurringInput = {
        type: formType, category: formCategory, description: formDescription.trim(),
        amount, frequency: formFrequency, startDate: formStartDate,
        endDate: formEndDate || undefined, reference: formReference.trim() || undefined,
      };
      if (editingId) await financeApi.updateRecurring(editingId, payload);
      else await financeApi.createRecurring(payload);
      setShowModal(false);
      await loadData();
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await financeApi.toggleRecurring(id);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao alternar status');
    }
  }

  async function handleDelete(id: string) {
    try {
      await financeApi.deleteRecurring(id);
      setDeletingId(null);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao remover');
    }
  }

  async function handleApply() {
    if (!applyingId || !applyDate) { setApplyError('Selecione uma data'); return; }
    setApplySubmitting(true);
    setApplyError(null);
    try {
      await financeApi.applyRecurring(applyingId, applyDate);
      setApplyingId(null);
    } catch (e: any) {
      setApplyError(e.message || 'Erro ao gerar transação');
    } finally {
      setApplySubmitting(false);
    }
  }

  if (!isSyndic && !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/financeiro">
            <button className="text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transações Recorrentes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Despesas e receitas periódicas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Só ativas' : 'Ver todas'}
          </Button>
          <Button onClick={openCreate}>+ Nova Recorrência</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorrências {showAll ? '(todas)' : '(ativas)'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Carregando...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Nenhuma recorrência{!showAll ? ' ativa' : ''} encontrada</p>
              <Button className="mt-3" onClick={openCreate}>Criar primeira recorrência</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Descrição</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Frequência</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Valor</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Próx. venc.</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Status</th>
                    <th className="py-3 px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((r) => (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${!r.active ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900">{r.description}</p>
                        <p className="text-xs text-gray-400">{categoryLabels[r.category]}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {typeLabels[r.type]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 text-xs">{frequencyLabels[r.frequency]}</td>
                      <td className={`py-3 px-3 text-right font-semibold ${r.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="py-3 px-3 text-gray-600 text-xs">{formatDate(r.nextDueDate)}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 justify-end">
                          {r.active && (
                            <button
                              onClick={() => { setApplyingId(r.id); setApplyDate(new Date().toISOString().split('T')[0]); setApplyError(null); }}
                              className="text-gray-400 hover:text-green-600 transition-colors" title="Gerar transação"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button onClick={() => handleToggle(r.id)} className="text-gray-400 hover:text-orange-500 transition-colors" title={r.active ? 'Desativar' : 'Ativar'}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 12.728M12 3v9" />
                            </svg>
                          </button>
                          <button onClick={() => setDeletingId(r.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Remover">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Recorrência' : 'Nova Recorrência'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo *" value={formType} onChange={(e) => setFormType(e.target.value as TransactionType)}
              options={[{ value: 'INCOME', label: 'Entrada' }, { value: 'EXPENSE', label: 'Saída' }]} />
            <Select label="Categoria" value={formCategory} onChange={(e) => setFormCategory(e.target.value as TransactionCategory)}
              options={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </div>
          <Input label="Descrição *" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Ex: Conta de luz" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$) *" type="number" min="0.01" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0,00" />
            <Select label="Frequência *" value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
              options={Object.entries(frequencyLabels).map(([v, l]) => ({ value: v, label: l }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data inicial *" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
            <Input label="Data final (opcional)" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
          </div>
          <Input label="Referência (opcional)" value={formReference} onChange={(e) => setFormReference(e.target.value)} placeholder="Ex: Contrato #123" />
          {formError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button loading={submitting} onClick={handleSubmit}>{editingId ? 'Salvar' : 'Criar Recorrência'}</Button>
        </ModalFooter>
      </Modal>

      {/* Apply Modal */}
      <Modal isOpen={!!applyingId} onClose={() => setApplyingId(null)} title="Gerar Transação">
        <p className="text-gray-600 text-sm mb-4">Selecione a data para registrar esta transação recorrente:</p>
        <Input label="Data *" type="date" value={applyDate} onChange={(e) => setApplyDate(e.target.value)} />
        {applyError && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{applyError}</div>}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setApplyingId(null)}>Cancelar</Button>
          <Button loading={applySubmitting} onClick={handleApply}>Gerar Transação</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Remover Recorrência">
        <p className="text-gray-600">Tem certeza que deseja remover esta recorrência? As transações geradas não serão afetadas.</p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeletingId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deletingId && handleDelete(deletingId)}>Remover</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
