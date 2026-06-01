"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { deviceCatalog, layerColors, layerLabels } from "@/lib/device-catalog";
import type { LayerType } from "@/lib/types";

const layerOrder: LayerType[] = ["cctv", "access", "alarm", "network", "power"];

export function DevicePalette() {
  const [openLayers, setOpenLayers] = useState<Record<LayerType, boolean>>({
    cctv: true,
    access: true,
    alarm: true,
    network: true,
    power: true
  });

  const groupedDevices = useMemo(() => {
    return layerOrder.map((layer) => ({
      layer,
      items: deviceCatalog.filter((item) => item.layer === layer)
    }));
  }, []);

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-line bg-white p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink-900">Dispositivos</h2>
        <p className="mt-1 text-xs leading-5 text-ink-500">Arrastra un elemento al plano.</p>
      </div>

      <div className="space-y-3">
        {groupedDevices.map(({ layer, items }) => {
          const isOpen = openLayers[layer];
          return (
            <section key={layer} className="rounded-lg border border-line bg-ink-50/70">
              <button
                className="flex h-11 w-full items-center justify-between px-3 text-left"
                onClick={() => setOpenLayers((current) => ({ ...current, [layer]: !current[layer] }))}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layerColors[layer] }} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-700">{layerLabels[layer]}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-500">{items.length}</span>
                </span>
                <ChevronDown size={15} className={`text-ink-500 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen ? (
                <div className="space-y-2 border-t border-line p-2">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("device/type", item.type)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-md border border-line bg-white px-3 py-2 text-left text-sm font-medium leading-5 transition hover:border-accent-500/60 hover:bg-white"
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white"
                          style={{ backgroundColor: layerColors[item.layer] }}
                        >
                          <Icon size={16} />
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
