import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation";
import { TopBar } from "@/components/navigation";

interface AppShellProps {
  variant?: "public" | "patient" | "doctor";
  title?: string;
}

export function AppShell({
  variant = "public",
  title = "Neurofy",
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar variant={variant} />
      <div className="flex-1 flex flex-col">
        <TopBar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
