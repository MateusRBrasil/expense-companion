import { useState } from 'react';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction, Person, Payment } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/format';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  persons: Person[];
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onRemovePayment: (paymentId: string) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  transaction,
  persons,
  payments,
  onAddPayment,
  onRemovePayment,
}: PaymentDialogProps) {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddPayment = () => {
    if (!selectedPersonId || !amount) return;

    onAddPayment({
      transactionId: transaction.id,
      personId: selectedPersonId,
      amount: parseFloat(amount),
      paidAt: new Date(),
    });

    setAmount('');
    setSelectedPersonId('');
  };

  const getPersonName = (personId: string) => {
    return persons.find((p) => p.id === personId)?.name || 'Desconhecido';
  };

  // Calculate what each person owes
  const personDebts: Record<string, { owed: number; paid: number }> = {};
  
  transaction.splits.forEach((split) => {
    if (split.isIncluded) {
      personDebts[split.personId] = {
        owed: split.calculatedAmount,
        paid: 0,
      };
    }
  });

  payments.forEach((payment) => {
    if (personDebts[payment.personId]) {
      personDebts[payment.personId].paid += payment.amount;
    }
  });

  const totalOwed = Object.values(personDebts).reduce((sum, d) => sum + d.owed, 0);
  const totalPaid = Object.values(personDebts).reduce((sum, d) => sum + d.paid, 0);
  const isPaidUp = totalPaid >= totalOwed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Pagamentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction summary */}
          <div className="p-4 rounded-lg bg-secondary/50">
            <h3 className="font-semibold mb-1">{transaction.description}</h3>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total: {formatCurrency(transaction.totalAmount)}</span>
              <span className="flex items-center gap-1">
                {isPaidUp ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-warning" />
                )}
                {isPaidUp ? 'Totalmente pago' : `Falta ${formatCurrency(totalOwed - totalPaid)}`}
              </span>
            </div>
          </div>

          {/* Person status */}
          <div className="space-y-2">
            <Label>Status por Pessoa</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(personDebts).map(([personId, debt]) => {
                const remaining = Math.max(0, debt.owed - debt.paid);
                const isPersonPaid = remaining === 0;

                return (
                  <div
                    key={personId}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/30"
                  >
                    <span className="text-sm">{getPersonName(personId)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isPersonPaid ? 'text-success' : 'text-warning'}`}>
                        {isPersonPaid ? (
                          <span className="flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Pago
                          </span>
                        ) : (
                          `Deve ${formatCurrency(remaining)}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add payment */}
          <div className="space-y-2">
            <Label>Registrar Pagamento</Label>
            <div className="flex gap-2">
              <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {persons
                    .filter((p) => personDebts[p.id])
                    .map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor"
                className="w-28"
              />
              <Button onClick={handleAddPayment} size="icon" disabled={!selectedPersonId || !amount}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Payment history */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label>Histórico de Pagamentos</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/30"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium">{getPersonName(payment.personId)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-success">
                        +{formatCurrency(payment.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onRemovePayment(payment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
