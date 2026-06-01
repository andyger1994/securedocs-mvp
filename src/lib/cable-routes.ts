import type { CableRouteType } from "@/lib/types";

export const cableRouteLabels: Record<CableRouteType, string> = {
  underground: "Subterraneo",
  in_wall: "Embutido en pared",
  galvanized_pipe: "Caño galvanizado",
  pvc_duct: "Ducto PVC"
};

export const cableRouteStyles: Record<CableRouteType, { color: string; dash?: number[] }> = {
  underground: { color: "#8b5cf6", dash: [4, 8] },
  in_wall: { color: "#0f766e", dash: [14, 6] },
  galvanized_pipe: { color: "#64748b" },
  pvc_duct: { color: "#f97316", dash: [10, 4, 2, 4] }
};

export const junctionStyle = {
  color: "#111827",
  fill: "#ffffff"
};
