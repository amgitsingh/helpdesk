import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Headphones, Moon, Sun, LogOut } from "lucide-react";
import { authClient } from "../lib/auth";
import { Role } from "@helpdesk/core";
import { useTheme } from "../hooks/useTheme";
import { cn } from "@/lib/utils";

export default function Layout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const { theme, toggle } = useTheme();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-sm px-3 py-1.5 rounded-lg transition-all duration-150 font-medium",
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    );

  const userInitial = session?.user.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          {/* Left: logo + nav links */}
          <div className="flex items-center gap-5">
            <NavLink
              to="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="Helpdesk home"
            >
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Headphones size={14} className="text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Helpdesk
              </span>
            </NavLink>

            <div className="flex items-center gap-0.5">
              <NavLink to="/tickets" className={navLinkClass}>
                Tickets
              </NavLink>
              {session?.user.role === Role.admin && (
                <NavLink to="/users" className={navLinkClass}>
                  Users
                </NavLink>
              )}
            </div>
          </div>

          {/* Right: theme toggle + user */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-150"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0"
                aria-hidden
              >
                {userInitial}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block max-w-[140px] truncate">
                {session?.user.name}
              </span>
              <button
                onClick={handleSignOut}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
