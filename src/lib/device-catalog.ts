import {
  BatteryCharging,
  BellRing,
  Camera,
  CircuitBoard,
  Contact,
  DoorOpen,
  Keyboard,
  KeyRound,
  Lightbulb,
  Monitor,
  PcCase,
  RadioReceiver,
  RadioTower,
  Router,
  ScanFace,
  Server,
  ShieldCheck,
  Speaker,
  TabletSmartphone,
  ToggleLeft,
  Volume2,
  Wifi,
  Zap
} from "lucide-react";
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
  { type: "face", label: "Face", layer: "access", icon: ScanFace },
  { type: "sensor", label: "Patrol", layer: "alarm", icon: RadioReceiver },
  { type: "rack", label: "Rack", layer: "network", icon: Server },
  { type: "switch", label: "Switch", layer: "network", icon: Router },
  { type: "ups", label: "UPS", layer: "power", icon: Zap },
  { type: "nvr", label: "NVR", layer: "cctv", icon: ShieldCheck },
  { type: "light", label: "Foco", layer: "power", icon: Lightbulb },
  { type: "audio", label: "Audio", layer: "network", icon: Volume2 },
  { type: "siren", label: "Sirena", layer: "alarm", icon: BellRing },
  { type: "rtx", label: "RTX", layer: "alarm", icon: RadioTower },
  { type: "wireless_sensor", label: "Sensor inalambrico", layer: "alarm", icon: Wifi },
  { type: "wireless_magnetic", label: "Magnetico inalambrico", layer: "alarm", icon: Contact },
  { type: "wired_magnetic", label: "Magnetico cableado", layer: "alarm", icon: DoorOpen },
  { type: "mini_pc", label: "Mini PC", layer: "network", icon: PcCase },
  { type: "mikrotik", label: "Mikrotik", layer: "network", icon: Router },
  { type: "antel_ont", label: "ONT Antel", layer: "network", icon: Wifi },
  { type: "audio_amplifier", label: "Amplificador audio", layer: "network", icon: Speaker },
  { type: "electrical_panel", label: "Tablero electrico", layer: "power", icon: CircuitBoard },
  { type: "contactor", label: "Contactora", layer: "power", icon: ToggleLeft },
  { type: "battery_bank", label: "Banco de baterias", layer: "power", icon: BatteryCharging },
  { type: "keypad", label: "Teclado", layer: "alarm", icon: Keyboard },
  { type: "video_display", label: "Videopantalla", layer: "access", icon: Monitor },
  { type: "intercom", label: "Portero", layer: "access", icon: TabletSmartphone }
];
