import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Receipt, TrendingUp, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionDialog } from '@/components/transactions/TransactionDialog';
import { PaymentDialog } from '@/components/transactions/PaymentDialog';
import { GroupChart } from '@/components/groups/GroupChart';
import { PersonBalanceCard } from '@/components/groups/PersonBalanceCard';
import { useExpenseData } from '@/hooks/useExpenseData';
import { Group, Transaction, Person, Payment, Card as CardType } from '@/lib/db';
import { formatCurrency } from '@/lib/format';

const GroupDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const {
    groups,
    persons,
    cards,
    payments,
    loading,
    getGroupTransactions,
    createTransaction,
    editTransaction,
    removeTransaction,
    createPayment,
    removePayment,
  } = useExpenseData();

  const [group, setGroup] = useState<Group | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (id && !loading) {
      const foundGroup = groups.find((g) => g.id === id);
      setGroup(foundGroup || null);
      
      if (foundGroup) {
        getGroupTransactions(id).then(setTransactions);
      }
    }
  }, [id, groups, loading, getGroupTransactions]);

  const refreshTransactions = async () => {
    if (id) {
      const txs = await getGroupTransactions(id);
      setTransactions(txs);
    }
  };

  const handleCreateTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTransaction(data);
    await refreshTransactions();
    setTransactionDialogOpen(false);
  };

  const handleEditTransaction = async (data: Transaction) => {
    await editTransaction(data);
    await refreshTransactions();
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (txId: string) => {
    await removeTransaction(txId);
    await refreshTransactions();
  };

  const handleAddPayment = async (payment: Omit<Payment, 'id'>) => {
    await createPayment(payment);
    setPaymentDialogOpen(false);
    setPaymentTransaction(null);
  };

  const handleRemovePayment = async (paymentId: string) => {
    await removePayment(paymentId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Grupo não encontrado</h2>
          <Link to="/">
            <Button variant="outline">Voltar para grupos</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const groupPersons = persons.filter((p) => group.personIds.includes(p.id));
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const transactionCount = transactions.length;

  // Calculate balances per person
  const calculatePersonBalances = () => {
    const balances: Record<string, { owed: number; paid: number }> = {};
    
    groupPersons.forEach((p) => {
      balances[p.id] = { owed: 0, paid: 0 };
    });

    transactions.forEach((tx) => {
      tx.splits.forEach((split) => {
        if (split.isIncluded && balances[split.personId]) {
          balances[split.personId].owed += split.calculatedAmount;
        }
      });
    });

    payments.forEach((payment) => {
      if (balances[payment.personId]) {
        balances[payment.personId].paid += payment.amount;
      }
    });

    return balances;
  };

  const balances = calculatePersonBalances();

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: group.color + '20', color: group.color }}
              >
                {group.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground text-sm">{group.description}</p>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={() => setTransactionDialogOpen(true)}
            className="gap-2 shadow-glow"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Transação</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gasto
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transações
              </CardTitle>
              <Receipt className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionCount}</div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participantes
              </CardTitle>
              <Users className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupPersons.length}</div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média por Pessoa
              </CardTitle>
              <CreditCard className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(groupPersons.length > 0 ? totalAmount / groupPersons.length : 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupChart transactions={transactions} />
            </CardContent>
          </Card>

          {/* Person Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saldo por Pessoa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupPersons.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhum participante neste grupo
                </p>
              ) : (
                groupPersons.map((person) => (
                  <PersonBalanceCard
                    key={person.id}
                    person={person}
                    owed={balances[person.id]?.owed || 0}
                    paid={balances[person.id]?.paid || 0}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Transações</h2>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-card">
              <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">Nenhuma transação</h3>
              <p className="text-muted-foreground text-center text-sm mb-4">
                Adicione a primeira transação deste grupo
              </p>
              <Button onClick={() => setTransactionDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Transação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    persons={groupPersons}
                    payments={payments.filter((p) => p.transactionId === tx.id)}
                    onEdit={() => setEditingTransaction(tx)}
                    onDelete={() => handleDeleteTransaction(tx.id)}
                    onManagePayments={() => {
                      setPaymentTransaction(tx);
                      setPaymentDialogOpen(true);
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        groupId={group.id}
        persons={groupPersons}
        cards={cards}
        onSubmit={handleCreateTransaction}
      />

      {editingTransaction && (
        <TransactionDialog
          open={true}
          onOpenChange={() => setEditingTransaction(null)}
          groupId={group.id}
          persons={groupPersons}
          cards={cards}
          transaction={editingTransaction}
          onSubmit={handleEditTransaction}
        />
      )}

      {paymentTransaction && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={(open) => {
            setPaymentDialogOpen(open);
            if (!open) setPaymentTransaction(null);
          }}
          transaction={paymentTransaction}
          persons={groupPersons}
          payments={payments.filter((p) => p.transactionId === paymentTransaction.id)}
          onAddPayment={handleAddPayment}
          onRemovePayment={handleRemovePayment}
        />
      )}
    </Layout>
  );
};

export default GroupDashboard;
