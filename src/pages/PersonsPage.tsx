import { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonCard } from '@/components/persons/PersonCard';
import { PersonDialog } from '@/components/persons/PersonDialog';
import { Person } from '@/lib/db';
import { useExpenseData } from '@/hooks/useExpenseData';
import { Layout } from '@/components/layout/Layout';

const PersonsPage = () => {
  const { persons, groups, loading, createPerson, editPerson, removePerson } = useExpenseData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const handleCreatePerson = async (name: string) => {
    await createPerson({ name });
    setDialogOpen(false);
  };

  const handleEditPerson = async (person: Person) => {
    await editPerson(person);
    setEditingPerson(null);
  };

  const handleDeletePerson = async (id: string) => {
    await removePerson(id);
  };

  const getPersonGroups = (personId: string) => {
    return groups.filter((g) => g.personIds.includes(personId));
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

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as pessoas que participam dos seus grupos
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 shadow-glow">
            <Plus className="h-4 w-4" />
            Nova Pessoa
          </Button>
        </div>

        {persons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl bg-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma pessoa cadastrada</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Adicione pessoas para poder incluí-las em grupos de gastos
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Pessoa
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {persons.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                groups={getPersonGroups(person.id)}
                onEdit={() => setEditingPerson(person)}
                onDelete={() => handleDeletePerson(person.id)}
              />
            ))}
          </div>
        )}
      </div>

      <PersonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreatePerson}
      />

      {editingPerson && (
        <PersonDialog
          open={true}
          onOpenChange={() => setEditingPerson(null)}
          person={editingPerson}
          onSubmit={(name) => handleEditPerson({ ...editingPerson, name })}
        />
      )}
    </Layout>
  );
};

export default PersonsPage;
