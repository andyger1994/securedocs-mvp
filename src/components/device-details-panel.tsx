"use client";

import { FileText, ImagePlus, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { deviceCatalog, layerLabels } from "@/lib/device-catalog";
import { useProjectStore } from "@/lib/store";
import type { Device } from "@/lib/types";

const editableFields: Array<{ key: keyof Device; label: string; type?: string }> = [
  { key: "name", label: "Nombre" },
  { key: "brand", label: "Marca" },
  { key: "model", label: "Modelo" },
  { key: "ip", label: "IP" },
  { key: "location", label: "Ubicacion" },
  { key: "switchAssociated", label: "Switch asociado" },
  { key: "port", label: "Puerto" },
  { key: "power", label: "Alimentacion" },
  { key: "installedAt", label: "Fecha de instalacion", type: "date" },
  { key: "technician", label: "Tecnico responsable" }
];

const coverageDeviceTypes = new Set(["camera", "light", "sensor"]);

export function DeviceDetailsPanel({
  device,
  readonly,
  onClose,
  className = ""
}: {
  device?: Device;
  readonly?: boolean;
  onClose: () => void;
  className?: string;
}) {
  const updateDevice = useProjectStore((state) => state.updateDevice);
  const removeDevice = useProjectStore((state) => state.removeDevice);
  const catalogItem = useMemo(() => deviceCatalog.find((item) => item.type === device?.type), [device?.type]);

  if (!device) {
    return (
      <aside className={`w-80 shrink-0 border-l border-line bg-white p-5 ${className}`}>
        <h2 className="text-sm font-semibold">Ficha tecnica</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Selecciona un dispositivo para ver y editar su informacion.</p>
      </aside>
    );
  }

  const Icon = catalogItem?.icon;
  const hasCoverage = coverageDeviceTypes.has(device.type);

  return (
    <aside className={`w-96 shrink-0 overflow-y-auto border-l border-line bg-white ${className}`}>
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white p-5">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-white">{Icon ? <Icon size={18} /> : null}</div>
          <div>
            <h2 className="text-sm font-semibold">{device.name}</h2>
            <p className="mt-1 text-xs text-ink-500">
              {catalogItem?.label} · {layerLabels[device.layer]}
            </p>
          </div>
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-md border border-line" onClick={onClose} aria-label="Cerrar panel">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {editableFields.map((field) => (
          <label key={String(field.key)} className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
            {field.label}
            <input
              type={field.type ?? "text"}
              value={String(device[field.key] ?? "")}
              readOnly={readonly}
              onChange={(event) => updateDevice(device.id, { [field.key]: event.target.value } as Partial<Device>)}
              className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm normal-case tracking-normal text-ink-900 outline-none focus:border-accent-500 disabled:bg-ink-50"
            />
          </label>
        ))}

        {hasCoverage ? (
          <div className="rounded-lg border border-line bg-ink-50 p-4">
            <h3 className="text-sm font-semibold text-ink-900">
              {device.type === "camera" ? "Vision" : device.type === "light" ? "Iluminacion" : "Cortina"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Angulo horizontal y direccion del cono mostrado sobre el plano.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <NumberField
                label="Angulo"
                value={device.coverageAngle ?? getDefaultCoverageAngle(device.type)}
                readonly={readonly}
                suffix="deg"
                min={10}
                max={180}
                onChange={(value) => updateDevice(device.id, { coverageAngle: value })}
              />
              <NumberField
                label="Direccion"
                value={device.coverageDirection ?? 0}
                readonly={readonly}
                suffix="deg"
                min={0}
                max={359}
                onChange={(value) => updateDevice(device.id, { coverageDirection: value })}
              />
              <NumberField
                label="Alcance"
                value={device.coverageRange ?? getDefaultCoverageRange(device.type)}
                readonly={readonly}
                suffix="px"
                min={40}
                max={420}
                onChange={(value) => updateDevice(device.id, { coverageRange: value })}
              />
            </div>
          </div>
        ) : null}

        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500">
          Notas
          <textarea
            value={device.notes}
            readOnly={readonly}
            onChange={(event) => updateDevice(device.id, { notes: event.target.value })}
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-line bg-white p-3 text-sm normal-case tracking-normal text-ink-900 outline-none focus:border-accent-500"
          />
        </label>

        <div className="rounded-lg border border-dashed border-line p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ImagePlus size={17} />
            Fotos
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-500">TODO: conectar subida a Supabase Storage y tabla device_files.</p>
        </div>

        <div className="rounded-lg border border-dashed border-line p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText size={17} />
            Documentos/manuales
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-500">TODO: guardar manuales, certificados y PDFs asociados al dispositivo.</p>
        </div>

        {!readonly ? (
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            onClick={() => {
              if (!window.confirm(`Eliminar "${device.name}" y sus recorridos vinculados?`)) return;
              removeDevice(device.id);
              onClose();
            }}
          >
            <Trash2 size={16} />
            Eliminar dispositivo
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function getDefaultCoverageAngle(type: Device["type"]) {
  if (type === "camera") return 105;
  if (type === "light") return 120;
  if (type === "sensor") return 8;
  return 90;
}

function getDefaultCoverageRange(type: Device["type"]) {
  if (type === "camera") return 190;
  if (type === "light") return 160;
  if (type === "sensor") return 220;
  return 160;
}

function NumberField({
  label,
  value,
  readonly,
  suffix,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  readonly?: boolean;
  suffix: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-ink-500">
      {label}
      <div className="mt-2 flex h-10 overflow-hidden rounded-md border border-line bg-white">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          readOnly={readonly}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            if (Number.isFinite(nextValue)) {
              onChange(Math.min(Math.max(nextValue, min), max));
            }
          }}
          className="min-w-0 flex-1 px-2 text-sm text-ink-900 outline-none"
        />
        <span className="grid w-10 place-items-center border-l border-line bg-ink-50 text-xs text-ink-500">
          {suffix}
        </span>
      </div>
    </label>
  );
}
