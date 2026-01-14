import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Group, Person } from '@/lib/db';

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group;
  persons: Person[];
  onSubmit: (data: any) => void;
}

const ICONS = ['🏖️', '🛒', '🎉', '🍕', '✈️', '🏠', '🎮', '💼', '🎁', '🚗'];
const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#06b6d4',
];

export function GroupDialog({ open, onOpenChange, group, persons, onSubmit }: GroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setIcon(group.icon);
      setColor(group.color);
      setSelectedPersonIds(group.personIds);
    } else {
      setName('');
      setDescription('');
      setIcon(ICONS[0]);
      setColor(COLORS[0]);
      setSelectedPersonIds([]);
    }
  }, [group, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      ...(group && { id: group.id, createdAt: group.createdAt }),
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      personIds: selectedPersonIds,
    };

    onSubmit(data);
  };

  const togglePerson = (personId: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do grupo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem SP"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do grupo"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all ${
                    icon === i
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>

          {persons.length > 0 && (
            <div className="space-y-2">
              <Label>Participantes</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                {persons.map((person) => (
                  <div key={person.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`person-${person.id}`}
                      checked={selectedPersonIds.includes(person.id)}
                      onCheckedChange={() => togglePerson(person.id)}
                    />
                    <label
                      htmlFor={`person-${person.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {person.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {group ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
