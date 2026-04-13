import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, editUserSchema, type EditUserInput } from "@helpdesk/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { User } from "@/components/UserTable";

async function submitUser(user: User | undefined, values: EditUserInput): Promise<User> {
  if (user) {
    const { data } = await axios.patch<User>(`/api/users/${user.id}`, values, {
      withCredentials: true,
    });
    return data;
  }
  const { data } = await axios.post<User>("/api/users", values, { withCredentials: true });
  return data;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User; // undefined = create mode, User = edit mode
};

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const isEditing = user !== undefined;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserInput>({
    resolver: zodResolver(isEditing ? editUserSchema : createUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        isEditing
          ? { name: user.name, email: user.email, password: "" }
          : { name: "", email: "", password: "" },
      );
    }
  }, [open, user, isEditing, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditUserInput) => submitUser(user, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) mutation.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="pt-2 space-y-4"
          noValidate
        >
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Jane Smith"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              autoComplete="off"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">
              Password{" "}
              {isEditing && (
                <span className="text-muted-foreground font-normal">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ??
                (isEditing
                  ? "Failed to update user. Please try again."
                  : "Failed to create user. Please try again.")}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? isEditing ? "Saving..." : "Creating..."
                : isEditing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
