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
import {
  financeApi,
  TransactionResponse,
  FinanceOverview,
  CreateTransactionInput,
  TransactionType,
  TransactionCategory,
} from '@/lib/api';

// ─── Labels ────────────────────────────────────────────────────────────────

const typeLabels: Record<TransactionType, string> = { INCOME: 'Entrada', EXPENSE: 'Saída' };

const categoryLabels: Record<TransactionCategory, string> = {
  COMMON_FEES: 'Taxa Cond.',
  MAINTENANCE: 'Manutenção',
  UTILITIES: 'Utilidades',
  SALARY: 'Salário',
  INSURANCE: 'Seguro',
  RESERVE_FUND: 'Fundo de Reserva',
  OTHER: 'Outro',
};

const categoryColors: Record<TransactionCategory, string> = {
  COMMON_FEES: '#3b82f6',
  MAINTENANCE: '#f97316',
  UTILITIES: '#8b5cf6',
  SALARY: '#ec4899',
  INSURANCE: '#14b8a6',
  RESERVE_FUND: '#f59e0b',
  OTHER: '#6b7280',
};

const MONTHS = [
  { value: '', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - 2 + i),
  label: String(currentYear - 2 + i),
}));

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Simple bar chart (SVG) ───────────────────────────────────────────────

function CashflowChart({ data }: { data: FinanceOverview['cashflow'] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1);
  const barW = 18;
  const gap = 6;
  const groupW = barW * 2 + gap + 16;
  const h = 120;

  return (
    <svg width="100%" viewBox={`0 0 ${groupW * 12} ${h + 24}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
      {data.map((d, i) => {
        const x = i * groupW;
        const incomeH = (d.income / maxVal) * h;
        const expH = (d.expenses / maxVal) * h;
        return (
          <g key={d.month}>
            <rect x={x} y={h - incomeH} width={barW} height={incomeH} fill="#22c55e" rx={2} opacity={0.85} />
            <rect x={x + barW + gap} y={h - expH} width={barW} height={expH} fill="#ef4444" rx={2} opacity={0.85} />
            <text x={x + barW + gap / 2} y={h + 16} textAnchor="middle" fontSize={9} fill="#6b7280">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut chart (SVG) ───────────────────────────────────────────────────

function DonutChart({ data }: { data: FinanceOverview['expensesByCategory'] }) {
  if (data.length === 0) return <div className="text-center text-gray-400 text-sm py-8">Sem dados</div>;

  const r = 60;
  const cx = 80;
  const cy = 75;
  let cumulative = 0;

  const slices = data.map((d) => {
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += d.percentage / 100;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = d.percentage > 50 ? 1 : 0;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: categoryColors[d.category] || '#6b7280', ...d };
  });

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={160} height={150} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth={1.5} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.slice(0, 6).map((d) => (
          <div key={d.category} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: categoryColors[d.category] || '#6b7280' }} />
            <span className="text-gray-600 truncate">{d.label}</span>
            <span className="ml-auto text-gray-900 font-medium whitespace-nowrap">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const { isSyndic, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isSyndic && !isAdmin) router.replace('/dashboard');
  }, [isSyndic, isAdmin, router]);

  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(currentYear));
  const [filterType, setFilterType] = useState<'' | TransactionType>('');
  const [page, setPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formType, setFormType] = useState<TransactionType>('INCOME');
  const [formCategory, setFormCategory] = useState<TransactionCategory>('OTHER');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formReference, setFormReference] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const month = filterMonth ? parseInt(filterMonth) : undefined;
      const year = filterYear ? parseInt(filterYear) : undefined;
      const type = filterType || undefined;

      const [txResult, ov] = await Promise.all([
        financeApi.list({ month, year, type: type as TransactionType | undefined, page, perPage: 30 }),
        financeApi.getOverview(year || currentYear),
      ]);

      setTransactions(txResult.data);
      setTotal(txResult.total);
      setOverview(ov);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterType, page]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [filterMonth, filterYear, filterType]);

  function openCreate() {
    setEditingId(null);
    setFormType('INCOME');
    setFormCategory('OTHER');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReference('');
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(tx: TransactionResponse) {
    setEditingId(tx.id);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormDescription(tx.description);
    setFormAmount(String(tx.amount));
    setFormDate(tx.date);
    setFormReference(tx.reference || '');
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formDescription.trim() || !formAmount || !formDate) {
      setFormError('Preencha todos os campos obrigatórios');
      return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) { setFormError('Valor deve ser maior que zero'); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CreateTransactionInput = {
        type: formType, category: formCategory,
        description: formDescription.trim(), amount, date: formDate,
        reference: formReference.trim() || undefined,
      };
      if (editingId) await financeApi.update(editingId, payload);
      else await financeApi.create(payload);
      setShowModal(false);
      await loadData();
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar transação');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await financeApi.delete(id);
      setDeletingId(null);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao remover transação');
    }
  }

  const totalPages = Math.ceil(total / 30);

  if (!isSyndic && !isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de entradas e saídas do condomínio</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/financeiro/orcamento">
            <Button variant="secondary">Orçamentos</Button>
          </Link>
          <Link href="/dashboard/financeiro/recorrentes">
            <Button variant="secondary">Recorrentes</Button>
          </Link>
          <Button onClick={openCreate}>+ Nova Transação</Button>
        </div>
      </div>

      {/* Summary cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.281-2.28 5.941" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Entradas</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(overview.totalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Saídas</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(overview.totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-3 pt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${overview.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <svg className={`w-5 h-5 ${overview.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saldo {filterYear}</p>
                  <p className={`text-xl font-bold ${overview.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(overview.balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fluxo de Caixa {filterYear}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Entradas</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" />Saídas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CashflowChart data={overview.cashflow} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Saídas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={overview.expensesByCategory} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters + Export */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end pt-1">
            <div className="w-44">
              <Select label="Mês" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} options={MONTHS} />
            </div>
            <div className="w-32">
              <Select label="Ano" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} options={YEARS} />
            </div>
            <div className="w-44">
              <Select label="Tipo" value={filterType} onChange={(e) => setFilterType(e.target.value as '' | TransactionType)}
                options={[{ value: '', label: 'Todos' }, { value: 'INCOME', label: 'Entradas' }, { value: 'EXPENSE', label: 'Saídas' }]} />
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${financeApi.exportCsvUrl(filterMonth ? parseInt(filterMonth) : undefined, filterYear ? parseInt(filterYear) : undefined)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar CSV
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações ({total})</CardTitle>
            <Button onClick={openCreate} variant="secondary">+ Nova</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Carregando...</div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-600">{error}</p>
              <Button className="mt-4" onClick={loadData}>Tentar novamente</Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Nenhuma transação encontrada</p>
              <Button className="mt-3" onClick={openCreate}>Registrar primeira transação</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Data</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Tipo</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Categoria</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Descrição</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600">Valor</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Ref.</th>
                      <th className="py-3 px-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{formatDate(tx.date)}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {typeLabels[tx.type]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-xs">{categoryLabels[tx.category]}</td>
                        <td className="py-3 px-3 text-gray-900 max-w-[200px] truncate">{tx.description}</td>
                        <td className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'EXPENSE' ? '- ' : '+ '}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{tx.reference || '-'}</td>
                        <td className="py-3 px-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(tx)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button onClick={() => setDeletingId(tx.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Remover">
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
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                  <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                    <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Transação' : 'Nova Transação'}>
        <div className="space-y-4">
          <Select label="Tipo *" value={formType} onChange={(e) => setFormType(e.target.value as TransactionType)}
            options={[{ value: 'INCOME', label: 'Entrada' }, { value: 'EXPENSE', label: 'Saída' }]} />
          <Select label="Categoria" value={formCategory} onChange={(e) => setFormCategory(e.target.value as TransactionCategory)}
            options={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))} />
          <Input label="Descrição *" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Ex: Taxa de condomínio - Bloco A" />
          <Input label="Valor (R$) *" type="number" min="0.01" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0,00" />
          <Input label="Data *" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          <Input label="Referência (opcional)" value={formReference} onChange={(e) => setFormReference(e.target.value)} placeholder="Ex: NF-1234" />
          {formError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button loading={submitting} onClick={handleSubmit}>{editingId ? 'Salvar Alterações' : 'Registrar'}</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Confirmar Exclusão">
        <p className="text-gray-600">Tem certeza que deseja remover esta transação? Esta ação não pode ser desfeita.</p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeletingId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deletingId && handleDelete(deletingId)}>Remover</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
