import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserTable, type User } from "@/components/UserTable";
import { CreateUserDialog } from "@/components/CreateUserDialog";

async function fetchUsers(): Promise<User[]> {
  const { data } = await axios.get<User[]>("/api/users", { withCredentials: true });
  return data;
}

export default function UsersPage() {
  const [open, setOpen] = useState(false);

  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            New User
          </Button>
        </CardHeader>
        <CardContent>
          <UserTable users={users} isPending={isPending} isError={isError} />
        </CardContent>
      </Card>

      <CreateUserDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
