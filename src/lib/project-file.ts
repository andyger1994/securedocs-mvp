import type { Device, FloorPlan, PlanElement, Project } from "@/lib/types";

const FILE_HEADER = "LICONEX-PROJECT-V1";

export interface LiconexProjectFile {
  format: "liconex-project";
  version: 1;
  exportedAt: string;
  project: Project;
  plans: FloorPlan[];
  devices: Device[];
  planElements: PlanElement[];
}

export function downloadProjectFile(data: Omit<LiconexProjectFile, "format" | "version" | "exportedAt">) {
  const payload: LiconexProjectFile = {
    format: "liconex-project",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data
  };
  const encoded = encodeBase64(JSON.stringify(payload));
  const blob = new Blob([`${FILE_HEADER}\n${encoded}`], { type: "application/x-liconex-project" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFileName(data.project.clientName)}.liconex`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseProjectFile(contents: string): LiconexProjectFile {
  const [header, encoded] = contents.trim().split(/\r?\n/, 2);
  if (header !== FILE_HEADER || !encoded) {
    throw new Error("El archivo no pertenece a Liconex.");
  }

  const parsed = JSON.parse(decodeBase64(encoded)) as Partial<LiconexProjectFile>;
  if (
    parsed.format !== "liconex-project" ||
    parsed.version !== 1 ||
    !parsed.project ||
    !Array.isArray(parsed.plans) ||
    !Array.isArray(parsed.devices) ||
    !Array.isArray(parsed.planElements)
  ) {
    throw new Error("El archivo Liconex no es valido o usa una version incompatible.");
  }

  return parsed as LiconexProjectFile;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function decodeBase64(value: string) {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "proyecto";
}
