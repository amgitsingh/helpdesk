import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserTable, type User } from "@/components/UserTable";
import { UserFormDialog } from "@/components/UserFormDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";

async function fetchUsers(): Promise<User[]> {
  const { data } = await axios.get<User[]>("/api/users", { withCredentials: true });
  return data;
}

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  function openCreate() {
    setEditingUser(undefined);
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingUser(undefined);
  }

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <Button size="sm" onClick={openCreate}>
            New User
          </Button>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            isPending={isPending}
            isError={isError}
            onEdit={openEdit}
            onDelete={setDeletingUser}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        user={editingUser}
      />
      <DeleteUserDialog user={deletingUser} onClose={() => setDeletingUser(null)} />
    </div>
  );
}
