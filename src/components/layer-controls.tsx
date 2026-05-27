"use client";

import { Eye, EyeOff } from "lucide-react";
import { layerColors, layerLabels } from "@/lib/device-catalog";
import type { LayerType } from "@/lib/types";

const layers: LayerType[] = ["cctv", "access", "alarm", "network", "power"];

export function LayerControls({
  visibleLayers,
  onToggle
}: {
  visibleLayers: Record<LayerType, boolean>;
  onToggle: (layer: LayerType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {layers.map((layer) => (
        <button
          key={layer}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-medium text-ink-700 transition hover:border-accent-500/50"
          onClick={() => onToggle(layer)}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layerColors[layer] }} />
          {layerLabels[layer]}
          {visibleLayers[layer] ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      ))}
    </div>
  );
}
