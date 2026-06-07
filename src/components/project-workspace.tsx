"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Cable, Check, ExternalLink, Eye, EyeOff, ImageOff, Layers, MapPin, MousePointer2, Pencil, PencilLine, Plus, Settings2, Square, Trash2, Undo2, Upload, X } from "lucide-react";
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
    history,
    hydrate,
    addDevice,
    addFloorPlan,
    addPlanElement,
    clearPlanElements,
    moveDevice,
    removePlanElement,
    selectFloorPlan,
    updateDevice,
    updateFloorPlanName,
    updatePlanElement,
    updatePlanSource,
    undo
  } = useProjectStore();
  const [visibleLayers, setVisibleLayers] = useState(initialLayers);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [visibleCoverageDeviceIds, setVisibleCoverageDeviceIds] = useState<string[]>([]);
  const [selectedPlanElementId, setSelectedPlanElementId] = useState<string>();
  const [showJunctions, setShowJunctions] = useState(true);
  const [drawingTool, setDrawingTool] = useState<PlanDrawingTool>("select");
  const [cableType, setCableType] = useState<CableRouteType>("underground");
  const [mobilePanel, setMobilePanel] = useState<"devices" | "details" | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<string>();
  const [floorName, setFloorName] = useState("");

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
  const selectedPlanElement = projectPlanElements.find((element) => element.id === selectedPlanElementId);

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
      <section className="relative flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{mode === "edit" ? "Editor" : "Vista compartida"}</p>
            <h1 className="truncate text-base font-semibold lg:text-lg">{project.clientName}</h1>
            <p className="truncate text-sm text-ink-500">{project.address}</p>
          </div>
          <div className="-mx-1 overflow-x-auto px-1">
            <LayerControls
              visibleLayers={visibleLayers}
              onToggle={(layer) => setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }))}
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:flex-wrap lg:items-center lg:justify-between lg:px-5">
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-9 items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <Layers size={15} />
              Pisos
            </span>
            {projectPlans.map((floorPlan) => {
              const active = floorPlan.id === plan.id;
              const editing = editingFloorId === floorPlan.id;

              if (editing) {
                return (
                  <form
                    key={floorPlan.id}
                    className="flex h-9 items-center overflow-hidden rounded-md border border-accent-500 bg-white"
                    onSubmit={(event) => {
                      event.preventDefault();
                      updateFloorPlanName(floorPlan.id, floorName);
                      setEditingFloorId(undefined);
                    }}
                  >
                    <input
                      className="h-full w-32 px-3 text-xs font-semibold text-ink-900 outline-none"
                      value={floorName}
                      onChange={(event) => setFloorName(event.target.value)}
                      autoFocus
                      onBlur={() => {
                        updateFloorPlanName(floorPlan.id, floorName);
                        setEditingFloorId(undefined);
                      }}
                    />
                    <button className="grid h-full w-9 place-items-center bg-accent-500 text-white" aria-label="Guardar nombre">
                      <Check size={15} />
                    </button>
                  </form>
                );
              }

              return (
                <span key={floorPlan.id} className="flex h-9 overflow-hidden rounded-md border border-line bg-white">
                  <button
                    className={`px-3 text-xs font-semibold transition ${
                      active ? "bg-accent-500 text-white" : "text-ink-700 hover:bg-ink-50"
                    }`}
                    onClick={() => {
                      setSelectedDeviceId(undefined);
                      selectFloorPlan(project.id, floorPlan.id);
                    }}
                  >
                    {floorPlan.name}
                  </button>
                  {mode === "edit" && active ? (
                    <button
                      className="grid w-9 place-items-center border-l border-line text-ink-500 transition hover:text-accent-600"
                      onClick={() => {
                        setFloorName(floorPlan.name);
                        setEditingFloorId(floorPlan.id);
                      }}
                      aria-label={`Renombrar ${floorPlan.name}`}
                      title="Renombrar piso"
                    >
                      <Pencil size={14} />
                    </button>
                  ) : null}
                </span>
              );
            })}
          </div>
          {mode === "edit" ? (
            <button
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:border-accent-500/50"
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
          <div className="flex gap-3 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:flex-wrap lg:items-center lg:justify-between lg:px-5">
            <div className="flex shrink-0 items-center gap-2">
              <ToolButton
                active={drawingTool === "select"}
                icon={<MousePointer2 size={16} />}
                label="Seleccionar"
                onClick={() => {
                  setDrawingTool("select");
                  setSelectedDeviceId(undefined);
                }}
              />
              <ToolButton active={drawingTool === "wall"} icon={<PencilLine size={16} />} label="Pared" onClick={() => setDrawingTool("wall")} />
              <ToolButton active={drawingTool === "area"} icon={<Square size={16} />} label="Ambiente" onClick={() => setDrawingTool("area")} />
              <ToolButton active={drawingTool === "cable"} icon={<Cable size={16} />} label="Cableado" onClick={() => setDrawingTool("cable")} />
              <ToolButton active={drawingTool === "junction"} icon={<MapPin size={16} />} label="Registro" onClick={() => setDrawingTool("junction")} />
              <button
                className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                  showJunctions ? "border-line bg-white text-ink-700" : "border-ink-200 bg-ink-100 text-ink-500"
                }`}
                onClick={() => {
                  setShowJunctions((current) => !current);
                  setSelectedPlanElementId(undefined);
                }}
                title={showJunctions ? "Ocultar registros" : "Mostrar registros"}
              >
                {showJunctions ? <Eye size={15} /> : <EyeOff size={15} />}
                Registros
              </button>
              {selectedPlanElementId ? (
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    removePlanElement(selectedPlanElementId);
                    setSelectedPlanElementId(undefined);
                  }}
                >
                  <Trash2 size={15} />
                  {selectedPlanElement?.type === "cable" ? "Eliminar canalizado" : "Eliminar registro"}
                </button>
              ) : null}
              {visibleCoverageDeviceIds.length > 0 ? (
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:border-accent-500/50"
                  onClick={() => setVisibleCoverageDeviceIds([])}
                >
                  <EyeOff size={15} />
                  Ocultar alcances ({visibleCoverageDeviceIds.length})
                </button>
              ) : null}
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
            <div className="flex shrink-0 items-center gap-2">
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:border-accent-500/50 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  undo();
                  setSelectedDeviceId(undefined);
                  setSelectedPlanElementId(undefined);
                }}
                disabled={history.length === 0}
                title="Deshacer ultima accion"
              >
                <Undo2 size={15} />
                Deshacer
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-medium text-ink-700 transition hover:border-red-300 hover:text-red-600"
                onClick={() => clearPlanElements(plan.id)}
              >
                <Trash2 size={15} />
                Limpiar dibujo
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          {mode === "edit" ? <DevicePalette className="hidden lg:block" /> : null}
          <div className="min-w-0 flex-1">
            <PlanCanvas
              plan={plan}
              devices={projectDevices}
              planElements={projectPlanElements}
              drawingTool={mode === "edit" ? drawingTool : "select"}
              cableType={cableType}
              activeDeviceId={selectedDeviceId}
              visibleLayers={visibleLayers}
              showJunctions={showJunctions}
              visibleCoverageDeviceIds={visibleCoverageDeviceIds}
              selectedDeviceId={selectedDeviceId}
              selectedPlanElementId={selectedPlanElementId}
              readonly={mode === "view"}
              onAddDevice={(type: DeviceType, x, y) => {
                const created = addDevice(project.id, plan.id, type, x, y);
                setVisibleLayers((current) => ({ ...current, [created.layer]: true }));
                setSelectedDeviceId(created.id);
                if (created.type === "camera" || created.type === "light" || created.type === "sensor") {
                  setVisibleCoverageDeviceIds((current) => [...new Set([...current, created.id])]);
                }
              }}
              onAddPlanElement={(type, element) => addPlanElement(project.id, plan.id, type, element)}
              onMoveDevice={moveDevice}
              onMovePlanElement={(elementId, x, y) => updatePlanElement(elementId, { x, y })}
              onRemovePlanElement={(elementId) => {
                removePlanElement(elementId);
                setSelectedPlanElementId(undefined);
              }}
              onRotateDevice={(deviceId, direction) => updateDevice(deviceId, { coverageDirection: direction })}
              onSelectDevice={(deviceId) => {
                setSelectedPlanElementId(undefined);
                setSelectedDeviceId(deviceId);
                const device = projectDevices.find((item) => item.id === deviceId);
                if (device && (device.type === "camera" || device.type === "light" || device.type === "sensor")) {
                  setVisibleCoverageDeviceIds((current) => [...new Set([...current, deviceId])]);
                }
              }}
              onSelectPlanElement={(elementId) => {
                setSelectedDeviceId(undefined);
                setSelectedPlanElementId(elementId);
              }}
            />
          </div>
          <DeviceDetailsPanel
            device={selectedDevice}
            readonly={mode === "view"}
            onClose={() => setSelectedDeviceId(undefined)}
            className="hidden lg:block"
          />
        </div>
        <CableLegend />

        {mode === "edit" ? (
          <div className="flex items-center gap-2 border-t border-line bg-white p-2 lg:hidden">
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-ink-900 px-3 text-sm font-semibold text-white"
              onClick={() => setMobilePanel("devices")}
            >
              <Plus size={17} />
              Dispositivos
            </button>
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink-800"
              onClick={() => setMobilePanel("details")}
            >
              <Settings2 size={17} />
              Ficha
            </button>
          </div>
        ) : null}

        {mobilePanel ? (
          <MobileSheet title={mobilePanel === "devices" ? "Dispositivos" : "Ficha tecnica"} onClose={() => setMobilePanel(null)}>
            {mobilePanel === "devices" ? (
              <DevicePalette className="h-full w-full border-r-0 p-0" />
            ) : (
              <DeviceDetailsPanel
                device={selectedDevice}
                readonly={mode === "view"}
                onClose={() => {
                  setSelectedDeviceId(undefined);
                  setMobilePanel(null);
                }}
                className="h-full w-full border-l-0"
              />
            )}
          </MobileSheet>
        ) : null}
      </section>
    </AppShell>
  );
}

function MobileSheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm lg:hidden">
      <div className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-lg border border-line bg-white shadow-soft">
        <div className="flex h-12 items-center justify-between border-b border-line px-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-line" onClick={onClose} aria-label="Cerrar panel">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function CableLegend() {
  return (
    <div className="hidden border-t border-line bg-white px-5 py-2 sm:block">
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
