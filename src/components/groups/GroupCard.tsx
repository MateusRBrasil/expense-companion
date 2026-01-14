import { Link } from 'react-router-dom';
import { MoreHorizontal, Edit2, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Group, Person } from '@/lib/db';

interface GroupCardProps {
  group: Group;
  persons: Person[];
  onEdit: () => void;
  onDelete: () => void;
}

export function GroupCard({ group, persons, onEdit, onDelete }: GroupCardProps) {
  return (
    <Card className="card-hover overflow-hidden animate-slide-up">
      <Link to={`/grupo/${group.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: group.color + '20', color: group.color }}
              >
                {group.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {group.description}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onDelete(); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {persons.length === 0
                ? 'Nenhum participante'
                : `${persons.length} participante${persons.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {persons.length > 0 && (
            <div className="flex -space-x-2 mt-3">
              {persons.slice(0, 5).map((person, index) => (
                <div
                  key={person.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border-2 border-card text-xs font-medium"
                  style={{ zIndex: 5 - index }}
                  title={person.name}
                >
                  {person.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {persons.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-card text-xs font-medium">
                  +{persons.length - 5}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
