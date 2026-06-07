export type LayerType = "cctv" | "access" | "alarm" | "network" | "power";

export type DeviceType =
  | "camera"
  | "reader"
  | "face"
  | "sensor"
  | "rack"
  | "switch"
  | "ups"
  | "nvr"
  | "light"
  | "audio"
  | "siren"
  | "rtx"
  | "wireless_sensor"
  | "wireless_magnetic"
  | "wired_magnetic"
  | "mini_pc"
  | "mikrotik"
  | "antel_ont"
  | "audio_amplifier"
  | "electrical_panel"
  | "contactor"
  | "battery_bank"
  | "keypad"
  | "video_display"
  | "intercom";

export type DeviceFileType = "photo" | "document";

export type PlanDrawingTool = "select" | "wall" | "area" | "cable" | "junction";

export type PlanElementType = "wall" | "area" | "cable" | "junction";

export type CableRouteType = "underground" | "in_wall" | "galvanized_pipe" | "pvc_duct";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "technician" | "viewer";
}

export interface Project {
  id: string;
  organizationId: string;
  clientName: string;
  address: string;
  updatedAt: string;
  planId: string;
}

export interface FloorPlan {
  id: string;
  projectId: string;
  name: string;
  sourceUrl?: string;
  sourceType: "blank" | "mock" | "image" | "pdf";
}

export interface PlanElement {
  id: string;
  projectId: string;
  planId: string;
  type: PlanElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  label?: string;
  cableType?: CableRouteType;
  deviceId?: string;
}

export interface DeviceFile {
  id: string;
  deviceId: string;
  type: DeviceFileType;
  name: string;
  url: string;
}

export interface MaintenanceNote {
  id: string;
  deviceId: string;
  userId: string;
  note: string;
  createdAt: string;
}

export interface Device {
  id: string;
  projectId: string;
  planId: string;
  type: DeviceType;
  layer: LayerType;
  name: string;
  brand: string;
  model: string;
  ip: string;
  location: string;
  switchAssociated: string;
  port: string;
  power: string;
  installedAt: string;
  technician: string;
  notes: string;
  x: number;
  y: number;
  coverageAngle?: number;
  coverageDirection?: number;
  coverageRange?: number;
  markerSize?: number;
  files: DeviceFile[];
}
