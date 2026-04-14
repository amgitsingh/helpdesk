import { Link, Outlet, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth";
import { Role } from "@helpdesk/core";

export default function Layout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-base font-semibold text-foreground">Helpdesk</Link>
          <Link to="/tickets" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Tickets
          </Link>
          {session?.user.role === Role.admin && (
            <Link to="/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Users
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session?.user.name}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
