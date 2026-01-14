import { Check, AlertCircle } from 'lucide-react';
import { Person } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
import { Progress } from '@/components/ui/progress';

interface PersonBalanceCardProps {
  person: Person;
  owed: number;
  paid: number;
}

export function PersonBalanceCard({ person, owed, paid }: PersonBalanceCardProps) {
  const remaining = Math.max(0, owed - paid);
  const progress = owed > 0 ? (paid / owed) * 100 : 100;
  const isPaidUp = remaining === 0 && owed > 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium">
        {person.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium truncate">{person.name}</span>
          <div className="flex items-center gap-1">
            {isPaidUp ? (
              <Check className="h-4 w-4 text-success" />
            ) : remaining > 0 ? (
              <AlertCircle className="h-4 w-4 text-warning" />
            ) : null}
            <span className={`text-sm font-medium ${isPaidUp ? 'text-success' : remaining > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
              {remaining > 0 ? `Deve ${formatCurrency(remaining)}` : owed > 0 ? 'Pago' : 'R$ 0,00'}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Pago: {formatCurrency(paid)}</span>
          <span>Total: {formatCurrency(owed)}</span>
        </div>
      </div>
    </div>
  );
}
