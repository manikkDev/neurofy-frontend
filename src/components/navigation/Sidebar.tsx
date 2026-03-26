import { NavLink } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
  icon: string;
}

const patientNav: NavItem[] = [
  { label: "Dashboard", to: "/patient/dashboard", icon: "📊" },
  { label: "History", to: "/patient/history", icon: "📈" },
  { label: "Reports", to: "/patient/reports", icon: "📄" },
  { label: "Notes", to: "/patient/notes", icon: "📝" },
  { label: "Appointments", to: "/patient/appointments", icon: "📅" },
  { label: "Alerts", to: "/patient/alerts", icon: "🔔" },
];

const doctorNav: NavItem[] = [
  { label: "Dashboard", to: "/doctor/dashboard", icon: "🩺" },
  { label: "Patients", to: "/doctor/patients", icon: "👥" },
  { label: "Alerts", to: "/doctor/alerts", icon: "🚨" },
  { label: "Appointments", to: "/doctor/appointments", icon: "📅" },
];

const publicNav: NavItem[] = [
  { label: "Home", to: "/", icon: "🏠" },
  { label: "Login", to: "/login", icon: "🔑" },
  { label: "Sign Up", to: "/signup", icon: "📝" },
];

interface SidebarProps {
  variant?: "public" | "patient" | "doctor";
}

export function Sidebar({ variant = "public" }: SidebarProps) {
  const navItems =
    variant === "patient"
      ? patientNav
      : variant === "doctor"
        ? doctorNav
        : publicNav;

  return (
    <aside className="w-64 bg-surface-raised border-r border-surface-border min-h-screen flex flex-col">
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Neurofy</h1>
            <p className="text-xs text-gray-500">Tremor Monitor</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-brand-600/15 text-brand-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-surface-overlay"
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-surface-border">
        <p className="text-xs text-gray-600 text-center">Neurofy v0.1.0</p>
      </div>
    </aside>
  );
}
