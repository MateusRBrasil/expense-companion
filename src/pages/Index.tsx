import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { Group } from '@/lib/db';
import { useExpenseData } from '@/hooks/useExpenseData';
import { Layout } from '@/components/layout/Layout';

const Index = () => {
  const { groups, persons, loading, createGroup, editGroup, removeGroup } = useExpenseData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const handleCreateGroup = async (data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createGroup(data);
    setDialogOpen(false);
  };

  const handleEditGroup = async (data: Group) => {
    await editGroup(data);
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (id: string) => {
    await removeGroup(id);
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
            <h1 className="text-3xl font-bold tracking-tight">Meus Grupos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus grupos de gastos compartilhados
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 shadow-glow">
            <Plus className="h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl bg-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhum grupo criado</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Crie seu primeiro grupo para começar a gerenciar gastos compartilhados
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Grupo
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                persons={persons.filter((p) => group.personIds.includes(p.id))}
                onEdit={() => setEditingGroup(group)}
                onDelete={() => handleDeleteGroup(group.id)}
              />
            ))}
          </div>
        )}
      </div>

      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        persons={persons}
        onSubmit={handleCreateGroup}
      />

      {editingGroup && (
        <GroupDialog
          open={true}
          onOpenChange={() => setEditingGroup(null)}
          group={editingGroup}
          persons={persons}
          onSubmit={handleEditGroup}
        />
      )}
    </Layout>
  );
};

export default Index;
