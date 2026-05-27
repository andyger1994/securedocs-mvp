"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { isAuthenticated, login } from "@/lib/auth";

export function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (login(username.trim(), password)) {
      router.replace("/dashboard");
      return;
    }
    setError("Usuario o contrasena incorrectos.");
  }

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <div className="mx-auto grid min-h-screen max-w-6xl px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="hidden pr-10 lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-white">
              <ShieldCheck size={20} />
            </span>
            <span className="text-sm font-semibold tracking-wide">SecureDocs</span>
          </Link>
          <h1 className="mt-10 text-4xl font-semibold leading-tight">
            Ingreso seguro al workspace tecnico
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-ink-500">
            Accede al dashboard para crear proyectos, dibujar pisos y documentar dispositivos de seguridad electronica.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900">
            <ArrowLeft size={16} />
            Volver
          </Link>
          <div className="mb-6">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink-900 text-white">
              <LockKeyhole size={20} />
            </span>
            <h2 className="mt-5 text-2xl font-semibold">Ingresar</h2>
            <p className="mt-2 text-sm text-ink-500">Usa tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              Usuario
              <input
                className="mt-2 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-accent-500"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                autoComplete="username"
                autoFocus
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Contrasena
              <input
                className="mt-2 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-accent-500"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p> : null}
            <button className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600">
              Ingresar
              <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
