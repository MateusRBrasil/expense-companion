import { MoreHorizontal, Edit2, Trash2, CreditCard, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Transaction, Person, Payment } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/format';

interface TransactionCardProps {
  transaction: Transaction;
  persons: Person[];
  payments: Payment[];
  onEdit: () => void;
  onDelete: () => void;
  onManagePayments: () => void;
}

export function TransactionCard({
  transaction,
  persons,
  payments,
  onEdit,
  onDelete,
  onManagePayments,
}: TransactionCardProps) {
  const paidByPerson = persons.find((p) => p.id === transaction.paidByPersonId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const isPaidUp = totalPaid >= transaction.totalAmount;

  const getPersonName = (personId: string) => {
    return persons.find((p) => p.id === personId)?.name || 'Desconhecido';
  };

  const includedSplits = transaction.splits.filter((s) => s.isIncluded);

  return (
    <Card className="card-hover animate-slide-up">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{transaction.description}</h3>
              <Badge variant={isPaidUp ? 'default' : 'secondary'} className={isPaidUp ? 'bg-success text-success-foreground' : ''}>
                {isPaidUp ? 'Pago' : 'Pendente'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(transaction.date)}
              </span>
              {paidByPerson && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Pago por {paidByPerson.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg font-bold">{formatCurrency(transaction.totalAmount)}</div>
              <div className="text-xs text-muted-foreground">
                {includedSplits.length} pessoa{includedSplits.length !== 1 ? 's' : ''}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onManagePayments}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gerenciar Pagamentos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Split breakdown */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {includedSplits.slice(0, 6).map((split) => (
              <div
                key={split.personId}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 text-sm"
              >
                <span className="truncate">{getPersonName(split.personId)}</span>
                <span className="font-medium">{formatCurrency(split.calculatedAmount)}</span>
              </div>
            ))}
            {includedSplits.length > 6 && (
              <div className="flex items-center justify-center p-2 rounded-md bg-secondary/50 text-sm text-muted-foreground">
                +{includedSplits.length - 6} mais
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
