import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction, Person, PersonSplit, Card } from '@/lib/db';
import { formatCurrency } from '@/lib/format';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  persons: Person[];
  cards?: Card[];
  transaction?: Transaction;
  onSubmit: (data: any) => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  groupId,
  persons,
  cards = [],
  transaction,
  onSubmit,
}: TransactionDialogProps) {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidByPersonId, setPaidByPersonId] = useState('');
  const [cardId, setCardId] = useState<string>('');
  const [splits, setSplits] = useState<Record<string, { isIncluded: boolean; fixedAmount: string }>>({});

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setTotalAmount(transaction.totalAmount.toString());
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
      setPaidByPersonId(transaction.paidByPersonId);
      setCardId(transaction.cardId || '');
      
      const splitMap: Record<string, { isIncluded: boolean; fixedAmount: string }> = {};
      transaction.splits.forEach((s) => {
        splitMap[s.personId] = {
          isIncluded: s.isIncluded,
          fixedAmount: s.fixedAmount?.toString() || '',
        };
      });
      setSplits(splitMap);
    } else {
      setDescription('');
      setTotalAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaidByPersonId(persons[0]?.id || '');
      setCardId('');
      
      const initialSplits: Record<string, { isIncluded: boolean; fixedAmount: string }> = {};
      persons.forEach((p) => {
        initialSplits[p.id] = { isIncluded: true, fixedAmount: '' };
      });
      setSplits(initialSplits);
    }
  }, [transaction, open, persons]);

  const calculatedSplits = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    const result: PersonSplit[] = [];

    // Calculate fixed amounts total
    let fixedTotal = 0;
    const includedPersons: string[] = [];

    persons.forEach((p) => {
      const split = splits[p.id];
      if (split?.isIncluded) {
        const fixed = parseFloat(split.fixedAmount) || 0;
        fixedTotal += fixed;
        includedPersons.push(p.id);
      }
    });

    // Remaining amount to split equally
    const remainingAmount = Math.max(0, total - fixedTotal);
    const equalShare = includedPersons.length > 0 ? remainingAmount / includedPersons.length : 0;

    persons.forEach((p) => {
      const split = splits[p.id];
      const isIncluded = split?.isIncluded || false;
      const fixedAmount = parseFloat(split?.fixedAmount || '') || 0;
      
      let calculatedAmount = 0;
      if (isIncluded) {
        calculatedAmount = fixedAmount + equalShare;
      }

      result.push({
        personId: p.id,
        isIncluded,
        fixedAmount: fixedAmount > 0 ? fixedAmount : undefined,
        calculatedAmount,
      });
    });

    return result;
  }, [totalAmount, splits, persons]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !totalAmount || !paidByPersonId) return;

    const data = {
      ...(transaction && { id: transaction.id, createdAt: transaction.createdAt }),
      groupId,
      cardId: cardId || undefined,
      description: description.trim(),
      totalAmount: parseFloat(totalAmount),
      date: new Date(date),
      paidByPersonId,
      splits: calculatedSplits,
    };

    onSubmit(data);
  };

  const togglePerson = (personId: string) => {
    setSplits((prev) => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        isIncluded: !prev[personId]?.isIncluded,
      },
    }));
  };

  const updateFixedAmount = (personId: string, value: string) => {
    setSplits((prev) => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        fixedAmount: value,
      },
    }));
  };

  const getPersonName = (personId: string) => {
    return persons.find((p) => p.id === personId)?.name || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Almoço, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Total (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Pago por</Label>
            <Select value={paidByPersonId} onValueChange={setPaidByPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione quem pagou" />
              </SelectTrigger>
              <SelectContent>
                {persons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="card">Cartão/Conta (opcional)</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Divisão por Pessoa</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Marque quem participa da divisão. Valores fixos são descontados antes da divisão igual.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-border p-3">
              {persons.map((person) => {
                const split = splits[person.id];
                const calculatedSplit = calculatedSplits.find((s) => s.personId === person.id);

                return (
                  <div key={person.id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
                    <Checkbox
                      id={`split-${person.id}`}
                      checked={split?.isIncluded || false}
                      onCheckedChange={() => togglePerson(person.id)}
                    />
                    <label
                      htmlFor={`split-${person.id}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      {person.name}
                    </label>
                    {split?.isIncluded && (
                      <>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={split.fixedAmount}
                          onChange={(e) => updateFixedAmount(person.id, e.target.value)}
                          placeholder="Fixo"
                          className="w-24 h-8 text-sm"
                        />
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(calculatedSplit?.calculatedAmount || 0)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {transaction ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
