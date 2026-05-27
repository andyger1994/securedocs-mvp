import { Camera, KeyRound, RadioReceiver, Router, Server, ShieldCheck, Zap } from "lucide-react";
import type { DeviceType, LayerType } from "@/lib/types";

export const layerLabels: Record<LayerType, string> = {
  cctv: "CCTV",
  access: "Control de acceso",
  alarm: "Alarma",
  network: "Red",
  power: "Energia"
};

export const layerColors: Record<LayerType, string> = {
  cctv: "#2f6df6",
  access: "#17a673",
  alarm: "#ef4444",
  network: "#7c3aed",
  power: "#f59e0b"
};

export const deviceCatalog: Array<{
  type: DeviceType;
  label: string;
  layer: LayerType;
  icon: typeof Camera;
}> = [
  { type: "camera", label: "Camara", layer: "cctv", icon: Camera },
  { type: "reader", label: "Lector de acceso", layer: "access", icon: KeyRound },
  { type: "sensor", label: "Sensor", layer: "alarm", icon: RadioReceiver },
  { type: "rack", label: "Rack", layer: "network", icon: Server },
  { type: "switch", label: "Switch", layer: "network", icon: Router },
  { type: "ups", label: "UPS", layer: "power", icon: Zap },
  { type: "nvr", label: "NVR", layer: "cctv", icon: ShieldCheck }
];
