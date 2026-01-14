import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Person, Group } from '@/lib/db';

interface PersonCardProps {
  person: Person;
  groups: Group[];
  onEdit: () => void;
  onDelete: () => void;
}

export function PersonCard({ person, groups, onEdit, onDelete }: PersonCardProps) {
  return (
    <Card className="card-hover animate-slide-up">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{person.name}</h3>
              <p className="text-sm text-muted-foreground">
                {groups.length === 0
                  ? 'Nenhum grupo'
                  : `${groups.length} grupo${groups.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {groups.slice(0, 3).map((group) => (
              <Badge
                key={group.id}
                variant="secondary"
                className="gap-1"
                style={{ backgroundColor: group.color + '20', color: group.color }}
              >
                {group.icon} {group.name}
              </Badge>
            ))}
            {groups.length > 3 && (
              <Badge variant="secondary">+{groups.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
