import { useState } from 'react';
import { Check, Clock, Edit2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Transaction, Group, Person } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MonthCellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  cardName: string;
  month: number;
  year: number;
  transactions: Transaction[];
  groups: Group[];
  persons: Person[];
  isPaid: boolean;
  onToggleStatus: () => void;
  onEditTransaction: (transaction: Transaction) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthCellDialog({
  open,
  onOpenChange,
  cardId,
  cardName,
  month,
  year,
  transactions,
  groups,
  persons,
  isPaid,
  onToggleStatus,
  onEditTransaction,
  onRefresh,
}: MonthCellDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ description: string; amount: string; tags: string }>({
    description: '',
    amount: '',
    tags: '',
  });

  const total = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? `${group.icon} ${group.name}` : 'Grupo desconhecido';
  };

  const getPersonName = (personId: string) => {
    return persons.find((p) => p.id === personId)?.name || 'Desconhecido';
  };

  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditValues({
      description: tx.description,
      amount: tx.totalAmount.toString(),
      tags: tx.tags?.join(', ') || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ description: '', amount: '', tags: '' });
  };

  const saveEditing = async (tx: Transaction) => {
    const updatedTx: Transaction = {
      ...tx,
      description: editValues.description,
      totalAmount: parseFloat(editValues.amount) || tx.totalAmount,
      tags: editValues.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    // Recalculate splits proportionally
    const totalOld = tx.totalAmount;
    const totalNew = updatedTx.totalAmount;
    const ratio = totalNew / totalOld;

    updatedTx.splits = tx.splits.map((s) => ({
      ...s,
      calculatedAmount: s.calculatedAmount * ratio,
      fixedAmount: s.fixedAmount ? s.fixedAmount * ratio : undefined,
    }));

    await onEditTransaction(updatedTx);
    await onRefresh();
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{cardName} - {MONTHS_FULL[month]} {year}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-normal text-muted-foreground">
                Marcar como pago
              </span>
              <Switch checked={isPaid} onCheckedChange={onToggleStatus} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Summary */}
          <div className={cn(
            'p-4 rounded-lg flex items-center justify-between',
            isPaid ? 'bg-success/20' : 'bg-warning/20'
          )}>
            <div className="flex items-center gap-2">
              {isPaid ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Clock className="h-5 w-5 text-warning" />
              )}
              <span className={isPaid ? 'text-success' : 'text-warning'}>
                {isPaid ? 'Fatura paga' : 'Fatura pendente'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
              <div className="text-sm text-muted-foreground">
                {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
              </div>
            </div>
          </div>

          {/* Transactions list */}
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação neste período
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  {editingId === tx.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={editValues.description}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          placeholder="Descrição"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.amount}
                          onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                          placeholder="Valor"
                        />
                      </div>
                      <Input
                        value={editValues.tags}
                        onChange={(e) => setEditValues({ ...editValues, tags: e.target.value })}
                        placeholder="Tags (separadas por vírgula)"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => saveEditing(tx)}>
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{tx.description}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getGroupName(tx.groupId)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatDate(tx.date)} • Pago por {getPersonName(tx.paidByPersonId)}
                        </div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {tx.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCurrency(tx.totalAmount)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditing(tx)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
