"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, FileUp, MapPin, Plus, Router } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { parseProjectFile } from "@/lib/project-file";
import { useProjectStore } from "@/lib/store";

export function Dashboard() {
  const router = useRouter();
  const { projects, devices, createProject, hydrate, importProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const counts = useMemo(() => {
    return devices.reduce<Record<string, number>>((acc, device) => {
      acc[device.projectId] = (acc[device.projectId] ?? 0) + 1;
      return acc;
    }, {});
  }, [devices]);

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!clientName.trim()) return;
    createProject(clientName.trim(), address.trim() || "Sin direccion");
    setClientName("");
    setAddress("");
    setIsOpen(false);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const project = importProject(parseProjectFile(await file.text()));
      setImportError("");
      router.push(`/projects/${project.id}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "No se pudo importar el proyecto.");
    }
  }

  return (
    <AppShell
      actions={
        <>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink-700">
            <FileUp size={17} />
            Importar proyecto
            <input className="sr-only" type="file" accept=".liconex,application/x-liconex-project" onChange={handleImport} />
          </label>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent-500 px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-600"
            onClick={() => setIsOpen(true)}
          >
            <Plus size={17} />
            Nuevo proyecto
          </button>
        </>
      }
    >
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-7 flex flex-col gap-2">
          <p className="text-sm font-medium text-accent-600">Workspace tecnico</p>
          <h1 className="max-w-3xl text-3xl font-semibold text-ink-900">Proyectos de clientes</h1>
          <p className="max-w-2xl text-sm leading-6 text-ink-500">
            Documenta planos, ubicacion de dispositivos y fichas tecnicas para mantenimiento.
          </p>
          {importError ? <p className="text-sm font-medium text-red-600">{importError}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-lg border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-soft"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink-100 text-ink-700">
                  <Building2 size={20} />
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-500">
                  {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: es })}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-ink-900">{project.clientName}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
                <MapPin size={15} />
                {project.address}
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-ink-700">
                <Router size={16} />
                {counts[project.id] ?? 0} dispositivos documentados
              </div>
            </Link>
          ))}
        </div>
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/30 px-5 backdrop-blur-sm">
          <form className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft" onSubmit={handleCreate}>
            <h2 className="text-lg font-semibold">Nuevo proyecto</h2>
            <label className="mt-5 block text-sm font-medium">
              Cliente
              <input
                className="mt-2 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-accent-500"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                autoFocus
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Direccion
              <input
                className="mt-2 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-accent-500"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="h-10 rounded-md border border-line px-4 text-sm" onClick={() => setIsOpen(false)}>
                Cancelar
              </button>
              <button className="h-10 rounded-md bg-ink-900 px-4 text-sm font-semibold text-white">Crear</button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
