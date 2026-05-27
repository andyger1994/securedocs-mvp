"use client";

import { deviceCatalog, layerColors } from "@/lib/device-catalog";

export function DevicePalette() {
  return (
    <aside className="w-64 shrink-0 border-r border-line bg-white p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink-900">Dispositivos</h2>
        <p className="mt-1 text-xs leading-5 text-ink-500">Arrastra un elemento al plano.</p>
      </div>
      <div className="space-y-2">
        {deviceCatalog.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("device/type", item.type)}
              className="flex h-12 w-full items-center gap-3 rounded-md border border-line bg-white px-3 text-left text-sm font-medium transition hover:border-accent-500/60 hover:bg-ink-50"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-md text-white"
                style={{ backgroundColor: layerColors[item.layer] }}
              >
                <Icon size={16} />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
