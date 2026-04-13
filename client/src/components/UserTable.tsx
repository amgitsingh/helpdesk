import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt: string;
};

type Props = {
  users: User[];
  isPending: boolean;
  isError: boolean;
  onEdit: (user: User) => void;
};

export function UserTable({ users, isPending, isError, onEdit }: Props) {
  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-1/4 h-5" />
            <Skeleton className="w-1/3 h-5" />
            <Skeleton className="w-16 h-5" />
            <Skeleton className="w-20 h-5" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load users.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
              No users found.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <span
                  className={
                    user.role === "admin"
                      ? "inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      : "inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {user.role}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(user)}
                  aria-label={`Edit ${user.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
