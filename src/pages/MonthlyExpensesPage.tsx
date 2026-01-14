import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, CreditCard, Filter, Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { CardDialog } from '@/components/cards/CardDialog';
import { MonthCellDialog } from '@/components/cards/MonthCellDialog';
import { useExpenseData } from '@/hooks/useExpenseData';
import { Transaction, Card as CardType, Group, Person } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const MonthlyExpensesPage = () => {
  const {
    cards,
    groups,
    persons,
    monthlyStatuses,
    loading,
    createCard,
    editCard,
    removeCard,
    fetchAllTransactions,
    editTransaction,
    toggleMonthlyCardStatus,
  } = useExpenseData();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ cardId: string; month: number } | null>(null);
  
  // Filters
  const [filterCardId, setFilterCardId] = useState<string>('all');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [filterPersonId, setFilterPersonId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAllTransactions().then(setTransactions);
  }, [fetchAllTransactions]);

  const refreshTransactions = async () => {
    const txs = await fetchAllTransactions();
    setTransactions(txs);
  };

  // Calculate data for the table
  const tableData = useMemo(() => {
    const data: Record<string, Record<number, { total: number; transactions: Transaction[] }>> = {};

    cards.forEach((card) => {
      data[card.id] = {};
      for (let m = 0; m < 12; m++) {
        data[card.id][m] = { total: 0, transactions: [] };
      }
    });

    // Also add a "No Card" row
    data['no-card'] = {};
    for (let m = 0; m < 12; m++) {
      data['no-card'][m] = { total: 0, transactions: [] };
    }

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() !== selectedYear) return;

      // Apply filters
      if (filterGroupId !== 'all' && tx.groupId !== filterGroupId) return;
      if (filterPersonId !== 'all' && !tx.splits.some((s) => s.personId === filterPersonId && s.isIncluded)) return;

      const month = txDate.getMonth();
      const cardId = tx.cardId || 'no-card';

      if (filterCardId !== 'all' && cardId !== filterCardId) return;

      if (!data[cardId]) {
        data[cardId] = {};
        for (let m = 0; m < 12; m++) {
          data[cardId][m] = { total: 0, transactions: [] };
        }
      }

      data[cardId][month].total += tx.totalAmount;
      data[cardId][month].transactions.push(tx);
    });

    return data;
  }, [cards, transactions, selectedYear, filterCardId, filterGroupId, filterPersonId]);

  // Calculate totals
  const monthlyTotals = useMemo(() => {
    const totals: number[] = new Array(12).fill(0);
    Object.values(tableData).forEach((cardData) => {
      for (let m = 0; m < 12; m++) {
        totals[m] += cardData[m]?.total || 0;
      }
    });
    return totals;
  }, [tableData]);

  const cardTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(tableData).forEach(([cardId, monthData]) => {
      totals[cardId] = Object.values(monthData).reduce((sum, m) => sum + m.total, 0);
    });
    return totals;
  }, [tableData]);

  const getCardStatus = (cardId: string, month: number) => {
    return monthlyStatuses.find(
      (s) => s.cardId === cardId && s.year === selectedYear && s.month === month
    );
  };

  const handleCellClick = (cardId: string, month: number) => {
    setSelectedCell({ cardId, month });
    setCellDialogOpen(true);
  };

  const handleToggleStatus = async (cardId: string, month: number) => {
    const current = getCardStatus(cardId, month);
    await toggleMonthlyCardStatus(cardId, selectedYear, month, !current?.isPaid);
  };

  const handleCreateCard = async (data: Omit<CardType, 'id' | 'createdAt'>) => {
    await createCard(data);
    setCardDialogOpen(false);
  };

  const handleEditCard = async (data: CardType) => {
    await editCard(data);
    setEditingCard(null);
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Filter visible cards based on filter
  const visibleCards = useMemo(() => {
    if (filterCardId === 'all') return cards;
    return cards.filter((c) => c.id === filterCardId);
  }, [cards, filterCardId]);

  // Check if no-card has data
  const hasNoCardData = Object.values(tableData['no-card'] || {}).some((m) => m.total > 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gastos Mensais</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie gastos por cartão/conta
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear((y) => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCardDialogOpen(true)} className="gap-2 shadow-glow ml-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Cartão</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Cartão/Conta</label>
                <Select value={filterCardId} onValueChange={setFilterCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="no-card">Sem cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Grupo</label>
                <Select value={filterGroupId} onValueChange={setFilterGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.icon} {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Pessoa</label>
                <Select value={filterPersonId} onValueChange={setFilterPersonId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {persons.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="sticky left-0 bg-secondary/50 px-4 py-3 text-left text-sm font-semibold z-10">
                    Cartão/Conta
                  </th>
                  {MONTHS.map((month, index) => (
                    <th key={month} className="px-3 py-3 text-center text-sm font-semibold min-w-[90px]">
                      {month}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-sm font-semibold bg-secondary/80">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleCards.map((card) => (
                  <tr key={card.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="sticky left-0 bg-card px-4 py-3 z-10">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                        <span className="font-medium">{card.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({card.type === 'credit' ? 'Crédito' : card.type === 'debit' ? 'Débito' : 'Conta'})
                        </span>
                      </div>
                    </td>
                    {MONTHS.map((_, monthIndex) => {
                      const cellData = tableData[card.id]?.[monthIndex];
                      const status = getCardStatus(card.id, monthIndex);
                      const isPaid = status?.isPaid || false;
                      const hasData = (cellData?.total || 0) > 0;

                      if (filterStatus !== 'all') {
                        if (filterStatus === 'paid' && !isPaid) return null;
                        if (filterStatus === 'pending' && isPaid) return null;
                      }

                      return (
                        <td key={monthIndex} className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleCellClick(card.id, monthIndex)}
                            className={cn(
                              'w-full p-2 rounded-lg transition-all text-sm font-medium',
                              hasData
                                ? isPaid
                                  ? 'bg-success/20 text-success hover:bg-success/30'
                                  : 'bg-warning/20 text-warning hover:bg-warning/30'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                            )}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{formatCurrency(cellData?.total || 0)}</span>
                              {hasData && (
                                <div className="flex items-center gap-1">
                                  {isPaid ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Clock className="h-3 w-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold bg-secondary/30">
                      {formatCurrency(cardTotals[card.id] || 0)}
                    </td>
                  </tr>
                ))}

                {/* No Card Row */}
                {(filterCardId === 'all' || filterCardId === 'no-card') && hasNoCardData && (
                  <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="sticky left-0 bg-card px-4 py-3 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Sem cartão</span>
                      </div>
                    </td>
                    {MONTHS.map((_, monthIndex) => {
                      const cellData = tableData['no-card']?.[monthIndex];
                      return (
                        <td key={monthIndex} className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleCellClick('no-card', monthIndex)}
                            className={cn(
                              'w-full p-2 rounded-lg transition-all text-sm font-medium',
                              (cellData?.total || 0) > 0
                                ? 'bg-secondary text-foreground hover:bg-secondary/80'
                                : 'bg-secondary/50 text-muted-foreground'
                            )}
                          >
                            {formatCurrency(cellData?.total || 0)}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold bg-secondary/30">
                      {formatCurrency(cardTotals['no-card'] || 0)}
                    </td>
                  </tr>
                )}

                {/* Totals Row */}
                <tr className="bg-primary/10 font-bold">
                  <td className="sticky left-0 bg-primary/10 px-4 py-3 z-10">
                    Total Mensal
                  </td>
                  {monthlyTotals.map((total, index) => (
                    <td key={index} className="px-3 py-3 text-center">
                      {formatCurrency(total)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-lg">
                    {formatCurrency(monthlyTotals.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-card">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">Nenhum cartão cadastrado</h3>
            <p className="text-muted-foreground text-center text-sm mb-4">
              Adicione seus cartões ou contas para organizar os gastos
            </p>
            <Button onClick={() => setCardDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Cartão
            </Button>
          </div>
        )}
      </div>

      <CardDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        onSubmit={handleCreateCard}
      />

      {editingCard && (
        <CardDialog
          open={true}
          onOpenChange={() => setEditingCard(null)}
          card={editingCard}
          onSubmit={handleEditCard}
        />
      )}

      {selectedCell && (
        <MonthCellDialog
          open={cellDialogOpen}
          onOpenChange={(open) => {
            setCellDialogOpen(open);
            if (!open) setSelectedCell(null);
          }}
          cardId={selectedCell.cardId}
          cardName={
            selectedCell.cardId === 'no-card'
              ? 'Sem cartão'
              : cards.find((c) => c.id === selectedCell.cardId)?.name || ''
          }
          month={selectedCell.month}
          year={selectedYear}
          transactions={tableData[selectedCell.cardId]?.[selectedCell.month]?.transactions || []}
          groups={groups}
          persons={persons}
          isPaid={getCardStatus(selectedCell.cardId, selectedCell.month)?.isPaid || false}
          onToggleStatus={() => handleToggleStatus(selectedCell.cardId, selectedCell.month)}
          onEditTransaction={editTransaction}
          onRefresh={refreshTransactions}
        />
      )}
    </Layout>
  );
};

export default MonthlyExpensesPage;
