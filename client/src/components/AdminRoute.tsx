import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/auth";
import { Role } from "@helpdesk/core";

export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session || session.user.role !== Role.admin) return <Navigate to="/" replace />;

  return <Outlet />;
}
