import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-surface-raised border-b border-surface-border flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
      <nav aria-label="User navigation" className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-3" role="group" aria-label="User information">
          <div className="text-right">
            <p className="text-sm text-gray-200">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div 
            className="w-8 h-8 bg-brand-600 border border-brand-500 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-sm text-white font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-raised"
          aria-label="Logout from your account"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
