import { Outlet, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth";

export default function Layout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">Helpdesk</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">{session?.user.name}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
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
