import type { Device, FloorPlan, Organization, PlanElement, Project } from "@/lib/types";

export const mockOrganization: Organization = {
  id: "org-secureline",
  name: "SecureLine Integraciones",
  createdAt: "2026-05-01T12:00:00.000Z"
};

export const mockPlans: FloorPlan[] = [
  {
    id: "plan-office-main",
    projectId: "project-acme-hq",
    name: "Planta baja",
    sourceType: "mock"
  },
  {
    id: "plan-nova-main",
    projectId: "project-nova-clinic",
    name: "Piso 1",
    sourceType: "blank"
  }
];

export const mockProjects: Project[] = [
  {
    id: "project-acme-hq",
    organizationId: mockOrganization.id,
    clientName: "ACME Logistics",
    address: "Av. Italia 4210, Montevideo",
    updatedAt: "2026-05-22T15:35:00.000Z",
    planId: "plan-office-main"
  },
  {
    id: "project-nova-clinic",
    organizationId: mockOrganization.id,
    clientName: "Clinica Nova",
    address: "Bulevar Artigas 1558, Montevideo",
    updatedAt: "2026-05-20T11:10:00.000Z",
    planId: "plan-nova-main"
  }
];

export const mockDevices: Device[] = [
  {
    id: "dev-cam-1",
    projectId: "project-acme-hq",
    planId: "plan-office-main",
    type: "camera",
    layer: "cctv",
    name: "Camara acceso principal",
    brand: "Hikvision",
    model: "DS-2CD2143G2",
    ip: "192.168.10.21",
    location: "Recepcion",
    switchAssociated: "SW-PB-01",
    port: "Gi1/0/12",
    power: "PoE",
    installedAt: "2026-04-12",
    technician: "Martin Silva",
    notes: "Enfoque hacia puerta principal. Revisar mascara de privacidad.",
    x: 260,
    y: 188,
    coverageAngle: 105,
    coverageDirection: 0,
    coverageRange: 190,
    files: []
  },
  {
    id: "dev-reader-1",
    projectId: "project-acme-hq",
    planId: "plan-office-main",
    type: "reader",
    layer: "access",
    name: "Lector puerta tecnica",
    brand: "ZKTeco",
    model: "KR702E",
    ip: "",
    location: "Sala tecnica",
    switchAssociated: "CTRL-PB-01",
    port: "D2",
    power: "12VDC",
    installedAt: "2026-04-15",
    technician: "Lucia Torres",
    notes: "Cable UTP reservado para futura migracion IP.",
    x: 590,
    y: 310,
    files: []
  }
];

export const mockPlanElements: PlanElement[] = [];
