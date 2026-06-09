"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void isAuthenticated().then((authenticated) => {
      if (!active) return;
      if (!authenticated) {
        router.replace("/login");
        return;
      }
      setAllowed(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink-50 text-sm font-medium text-ink-500">
        Verificando acceso...
      </main>
    );
  }

  return <>{children}</>;
}
