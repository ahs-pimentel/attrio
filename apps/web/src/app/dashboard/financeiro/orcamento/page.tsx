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
import { financeApi, BudgetResponse, TransactionCategory, CreateBudgetInput } from '@/lib/api';

const categoryLabels: Record<TransactionCategory, string> = {
  COMMON_FEES: 'Taxa de Condomínio',
  MAINTENANCE: 'Manutenção',
  UTILITIES: 'Utilidades',
  SALARY: 'Salário',
  INSURANCE: 'Seguro',
  RESERVE_FUND: 'Fundo de Reserva',
  OTHER: 'Outro',
};

const MONTHS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => ({
  value: String(currentYear - 1 + i),
  label: String(currentYear - 1 + i),
}));

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function ProgressBar({ percentage }: { percentage: number }) {
  const pct = Math.min(percentage, 100);
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function OrcamentoPage() {
  const { isSyndic, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isSyndic && !isAdmin) router.replace('/dashboard');
  }, [isSyndic, isAdmin, router]);

  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterYear, setFilterYear] = useState(String(currentYear));
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState<TransactionCategory>('MAINTENANCE');
  const [formYear, setFormYear] = useState(String(currentYear));
  const [formMonth, setFormMonth] = useState(String(new Date().getMonth() + 1));
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.getBudgets(parseInt(filterYear), parseInt(filterMonth));
      setBudgets(data as BudgetResponse[]);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditingId(null);
    setFormCategory('MAINTENANCE');
    setFormYear(filterYear);
    setFormMonth(filterMonth);
    setFormAmount('');
    setFormNotes('');
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(b: BudgetResponse) {
    setEditingId(b.id);
    setFormCategory(b.category);
    setFormYear(String(b.year));
    setFormMonth(String(b.month));
    setFormAmount(String(b.amount));
    setFormNotes(b.notes || '');
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit() {
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) { setFormError('Valor deve ser maior que zero'); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        await financeApi.updateBudget(editingId, { amount, notes: formNotes.trim() || undefined });
      } else {
        const payload: CreateBudgetInput = {
          category: formCategory,
          year: parseInt(formYear),
          month: parseInt(formMonth),
          amount,
          notes: formNotes.trim() || undefined,
        };
        await financeApi.createBudget(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar orçamento');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await financeApi.deleteBudget(id);
      setDeletingId(null);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao remover orçamento');
    }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

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
            <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Planejamento de gastos por categoria</p>
          </div>
        </div>
        <Button onClick={openCreate}>+ Novo Orçamento</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end pt-1">
            <div className="w-44">
              <Select label="Mês" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} options={MONTHS} />
            </div>
            <div className="w-32">
              <Select label="Ano" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} options={YEARS} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="pt-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Orçado</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudgeted)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="pt-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Gasto</p>
                <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalSpent)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="pt-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saldo Disponível</p>
                <p className={`text-xl font-bold mt-1 ${totalBudgeted - totalSpent >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatCurrency(totalBudgeted - totalSpent)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget list */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos — {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Carregando...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">{error}</div>
          ) : budgets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Nenhum orçamento para este período</p>
              <Button className="mt-3" onClick={openCreate}>Criar primeiro orçamento</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{categoryLabels[b.category]}</p>
                      {b.notes && <p className="text-xs text-gray-500 mt-0.5">{b.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button onClick={() => setDeletingId(b.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                    <span>Gasto: <strong>{formatCurrency('spent' in b ? b.spent : 0)}</strong></span>
                    <span>Orçado: <strong>{formatCurrency(b.amount)}</strong></span>
                    <span className={`font-semibold ${'percentageUsed' in b && b.percentageUsed >= 100 ? 'text-red-600' : 'percentageUsed' in b && b.percentageUsed >= 80 ? 'text-orange-500' : 'text-gray-700'}`}>
                      {'percentageUsed' in b ? b.percentageUsed : 0}%
                    </span>
                  </div>
                  <ProgressBar percentage={'percentageUsed' in b ? b.percentageUsed : 0} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Orçamento' : 'Novo Orçamento'}>
        <div className="space-y-4">
          {!editingId && (
            <>
              <Select label="Categoria *" value={formCategory} onChange={(e) => setFormCategory(e.target.value as TransactionCategory)}
                options={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Mês *" value={formMonth} onChange={(e) => setFormMonth(e.target.value)} options={MONTHS} />
                <Select label="Ano *" value={formYear} onChange={(e) => setFormYear(e.target.value)} options={YEARS} />
              </div>
            </>
          )}
          <Input label="Valor Orçado (R$) *" type="number" min="0.01" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0,00" />
          <Input label="Observações (opcional)" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Ex: Ref. manutenção preventiva" />
          {formError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button loading={submitting} onClick={handleSubmit}>{editingId ? 'Salvar' : 'Criar Orçamento'}</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Remover Orçamento">
        <p className="text-gray-600">Tem certeza que deseja remover este orçamento?</p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeletingId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deletingId && handleDelete(deletingId)}>Remover</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
