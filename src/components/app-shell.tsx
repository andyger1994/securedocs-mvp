"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

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
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white">
              <ShieldCheck size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">SecureDocs</span>
              <span className="block text-xs text-ink-500">Documentacion interactiva</span>
            </span>
          </Link>
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
