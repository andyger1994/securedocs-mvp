"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { LiconexLogo } from "@/components/liconex-logo";

export function AppShell({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <LiconexLogo href="/dashboard" subtitle="Documentacion interactiva" />
          <div className="flex items-center gap-2">
            {actions}
            <button
              className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-ink-700 transition hover:border-red-300 hover:text-red-600"
              onClick={handleLogout}
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
