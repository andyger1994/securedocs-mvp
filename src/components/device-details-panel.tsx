"use client";

import { FileText, ImagePlus, X } from "lucide-react";
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

export function DeviceDetailsPanel({
  device,
  readonly,
  onClose
}: {
  device?: Device;
  readonly?: boolean;
  onClose: () => void;
}) {
  const updateDevice = useProjectStore((state) => state.updateDevice);
  const catalogItem = useMemo(() => deviceCatalog.find((item) => item.type === device?.type), [device?.type]);

  if (!device) {
    return (
      <aside className="w-80 shrink-0 border-l border-line bg-white p-5">
        <h2 className="text-sm font-semibold">Ficha tecnica</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Selecciona un dispositivo para ver y editar su informacion.</p>
      </aside>
    );
  }

  const Icon = catalogItem?.icon;

  return (
    <aside className="w-96 shrink-0 overflow-y-auto border-l border-line bg-white">
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
      </div>
    </aside>
  );
}
