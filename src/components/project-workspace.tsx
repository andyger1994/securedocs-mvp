"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Cable, ExternalLink, ImageOff, Layers, MapPin, MousePointer2, PencilLine, Plus, Square, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DeviceDetailsPanel } from "@/components/device-details-panel";
import { DevicePalette } from "@/components/device-palette";
import { LayerControls } from "@/components/layer-controls";
import { cableRouteLabels, cableRouteStyles } from "@/lib/cable-routes";
import { useProjectStore } from "@/lib/store";
import type { CableRouteType, DeviceType, LayerType, PlanDrawingTool } from "@/lib/types";

const PlanCanvas = dynamic(() => import("@/components/plan-canvas").then((mod) => mod.PlanCanvas), {
  ssr: false
});

const initialLayers: Record<LayerType, boolean> = {
  cctv: true,
  access: true,
  alarm: true,
  network: true,
  power: true
};

export function ProjectWorkspace({ projectId, mode }: { projectId: string; mode: "edit" | "view" }) {
  const {
    projects,
    plans,
    devices,
    planElements,
    hydrate,
    addDevice,
    addFloorPlan,
    addPlanElement,
    clearPlanElements,
    moveDevice,
    selectFloorPlan,
    updatePlanSource
  } = useProjectStore();
  const [visibleLayers, setVisibleLayers] = useState(initialLayers);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [drawingTool, setDrawingTool] = useState<PlanDrawingTool>("select");
  const [cableType, setCableType] = useState<CableRouteType>("underground");

  useEffect(() => hydrate(), [hydrate]);

  const project = projects.find((item) => item.id === projectId);
  const plan = plans.find((item) => item.id === project?.planId);
  const projectPlans = useMemo(() => plans.filter((item) => item.projectId === projectId), [plans, projectId]);
  const projectDevices = useMemo(
    () => devices.filter((device) => device.projectId === projectId && device.planId === project?.planId),
    [devices, project?.planId, projectId]
  );
  const projectPlanElements = useMemo(() => planElements.filter((element) => element.planId === project?.planId), [planElements, project?.planId]);
  const selectedDevice = projectDevices.find((device) => device.id === selectedDeviceId);

  if (!project || !plan) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-5 py-10">
          <Link href="/dashboard" className="text-sm font-medium text-accent-600">Volver al dashboard</Link>
          <h1 className="mt-6 text-2xl font-semibold">Proyecto no encontrado</h1>
        </div>
      </AppShell>
    );
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !plan) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        updatePlanSource(plan.id, typeof reader.result === "string" ? reader.result : undefined, "image");
      };
      reader.readAsDataURL(file);
      return;
    }
    if (file.type === "application/pdf") {
      updatePlanSource(plan.id, undefined, "pdf");
    }
  }

  return (
    <AppShell
      actions={
        <>
          <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          {mode === "edit" ? (
            <>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium">
                <Upload size={16} />
                Subir plano
                <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={handleUpload} />
              </label>
              <Link
                href={`/share/${project.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-900 px-3 text-sm font-semibold text-white"
              >
                <ExternalLink size={16} />
                Link cliente
              </Link>
            </>
          ) : null}
        </>
      }
    >
      <section className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{mode === "edit" ? "Editor" : "Vista compartida"}</p>
            <h1 className="text-lg font-semibold">{project.clientName}</h1>
            <p className="text-sm text-ink-500">{project.address}</p>
          </div>
          <LayerControls
            visibleLayers={visibleLayers}
            onToggle={(layer) => setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <Layers size={15} />
              Pisos
            </span>
            {projectPlans.map((floorPlan) => (
              <button
                key={floorPlan.id}
                className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${
                  floorPlan.id === plan.id ? "border-accent-500 bg-accent-500 text-white" : "border-line bg-white text-ink-700 hover:border-accent-500/50"
                }`}
                onClick={() => {
                  setSelectedDeviceId(undefined);
                  selectFloorPlan(project.id, floorPlan.id);
                }}
              >
                {floorPlan.name}
              </button>
            ))}
          </div>
          {mode === "edit" ? (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:border-accent-500/50"
              onClick={() => {
                setSelectedDeviceId(undefined);
                addFloorPlan(project.id);
              }}
            >
              <Plus size={15} />
              Agregar piso
            </button>
          ) : null}
        </div>

        {mode === "edit" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton active={drawingTool === "select"} icon={<MousePointer2 size={16} />} label="Seleccionar" onClick={() => setDrawingTool("select")} />
              <ToolButton active={drawingTool === "wall"} icon={<PencilLine size={16} />} label="Pared" onClick={() => setDrawingTool("wall")} />
              <ToolButton active={drawingTool === "area"} icon={<Square size={16} />} label="Ambiente" onClick={() => setDrawingTool("area")} />
              <ToolButton active={drawingTool === "cable"} icon={<Cable size={16} />} label="Cableado" onClick={() => setDrawingTool("cable")} />
              <ToolButton active={drawingTool === "junction"} icon={<MapPin size={16} />} label="Registro" onClick={() => setDrawingTool("junction")} />
              {drawingTool === "cable" ? (
                <>
                  <select
                    className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink-700 outline-none focus:border-accent-500"
                    value={cableType}
                    onChange={(event) => setCableType(event.target.value as CableRouteType)}
                  >
                    {Object.entries(cableRouteLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-medium text-ink-500">
                    {selectedDevice ? `Vinculando a ${selectedDevice.name}` : "Selecciona un dispositivo para vincular el recorrido"}
                  </span>
                </>
              ) : null}
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:border-accent-500/50"
                onClick={() => updatePlanSource(plan.id, undefined, "blank")}
              >
                <ImageOff size={15} />
                Blanco
              </button>
            </div>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-medium text-ink-700 transition hover:border-red-300 hover:text-red-600"
              onClick={() => clearPlanElements(plan.id)}
            >
              <Trash2 size={15} />
              Limpiar dibujo
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          {mode === "edit" ? <DevicePalette /> : null}
          <div className="min-w-0 flex-1">
            <PlanCanvas
              plan={plan}
              devices={projectDevices}
              planElements={projectPlanElements}
              drawingTool={mode === "edit" ? drawingTool : "select"}
              cableType={cableType}
              activeDeviceId={selectedDeviceId}
              visibleLayers={visibleLayers}
              selectedDeviceId={selectedDeviceId}
              readonly={mode === "view"}
              onAddDevice={(type: DeviceType, x, y) => {
                const created = addDevice(project.id, plan.id, type, x, y);
                setSelectedDeviceId(created.id);
              }}
              onAddPlanElement={(type, element) => addPlanElement(project.id, plan.id, type, element)}
              onMoveDevice={moveDevice}
              onSelectDevice={setSelectedDeviceId}
            />
          </div>
          <DeviceDetailsPanel device={selectedDevice} readonly={mode === "view"} onClose={() => setSelectedDeviceId(undefined)} />
        </div>
        <CableLegend />
      </section>
    </AppShell>
  );
}

function CableLegend() {
  return (
    <div className="border-t border-line bg-white px-5 py-2">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Cableado</span>
        {Object.entries(cableRouteLabels).map(([type, label]) => {
          const style = cableRouteStyles[type as CableRouteType];
          return (
            <span key={type} className="inline-flex items-center gap-2 text-xs font-medium text-ink-600">
              <span
                className="h-0.5 w-10 rounded-full"
                style={{
                  backgroundColor: style.color,
                  borderTop: style.dash ? `2px dashed ${style.color}` : undefined,
                  backgroundClip: "padding-box"
                }}
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ToolButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
        active ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-ink-700 hover:border-accent-500/50"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
