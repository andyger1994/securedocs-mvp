"use client";

import { create } from "zustand";
import { deviceCatalog } from "@/lib/device-catalog";
import { mockDevices, mockPlanElements, mockPlans, mockProjects } from "@/lib/mock-data";
import type { Device, DeviceType, FloorPlan, PlanElement, PlanElementType, Project } from "@/lib/types";

interface ProjectState {
  hydrated: boolean;
  projects: Project[];
  plans: FloorPlan[];
  devices: Device[];
  planElements: PlanElement[];
  hydrate: () => void;
  createProject: (clientName: string, address: string) => Project;
  addFloorPlan: (projectId: string) => FloorPlan;
  selectFloorPlan: (projectId: string, planId: string) => void;
  addDevice: (projectId: string, planId: string, type: DeviceType, x: number, y: number) => Device;
  moveDevice: (deviceId: string, x: number, y: number) => void;
  updateDevice: (deviceId: string, patch: Partial<Device>) => void;
  addPlanElement: (projectId: string, planId: string, type: PlanElementType, element: Omit<PlanElement, "id" | "projectId" | "planId" | "type">) => void;
  clearPlanElements: (planId: string) => void;
  updatePlanSource: (planId: string, sourceUrl: string | undefined, sourceType: FloorPlan["sourceType"]) => void;
}

const STORAGE_KEY = "liconex-mvp";
const LEGACY_STORAGE_KEY = "security-docs-mvp";

function saveSnapshot(projects: Project[], plans: FloorPlan[], devices: Device[], planElements: PlanElement[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, plans, devices, planElements }));
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  hydrated: false,
  projects: mockProjects,
  plans: mockPlans,
  devices: mockDevices,
  planElements: mockPlanElements,
  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      set({ hydrated: true });
      saveSnapshot(mockProjects, mockPlans, mockDevices, mockPlanElements);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<Pick<ProjectState, "projects" | "plans" | "devices" | "planElements">>;
      const migrated = migrateSnapshot(
        parsed.projects ?? mockProjects,
        parsed.plans ?? mockPlans,
        parsed.devices ?? mockDevices,
        parsed.planElements ?? []
      );
      set({
        hydrated: true,
        projects: migrated.projects,
        plans: migrated.plans,
        devices: migrated.devices,
        planElements: migrated.planElements
      });
      saveSnapshot(migrated.projects, migrated.plans, migrated.devices, migrated.planElements);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      set({ hydrated: true });
    }
  },
  createProject: (clientName, address) => {
    const id = `project-${crypto.randomUUID()}`;
    const planId = `plan-${crypto.randomUUID()}`;
    const project: Project = {
      id,
      organizationId: "org-secureline",
      clientName,
      address,
      updatedAt: new Date().toISOString(),
      planId
    };
    const plan: FloorPlan = { id: planId, projectId: id, name: "Piso 1", sourceType: "blank" };
    const projects = [project, ...get().projects];
    const plans = [plan, ...get().plans];
    set({ projects, plans });
    saveSnapshot(projects, plans, get().devices, get().planElements);
    return project;
  },
  addFloorPlan: (projectId) => {
    const projectPlans = get().plans.filter((plan) => plan.projectId === projectId);
    const floorNumber = projectPlans.length + 1;
    const plan: FloorPlan = {
      id: `plan-${crypto.randomUUID()}`,
      projectId,
      name: `Piso ${floorNumber}`,
      sourceType: "blank"
    };
    const plans = [...get().plans, plan];
    const projects = get().projects.map((project) =>
      project.id === projectId ? { ...project, planId: plan.id, updatedAt: new Date().toISOString() } : project
    );
    set({ plans, projects });
    saveSnapshot(projects, plans, get().devices, get().planElements);
    return plan;
  },
  selectFloorPlan: (projectId, planId) => {
    const projects = get().projects.map((project) =>
      project.id === projectId ? { ...project, planId, updatedAt: new Date().toISOString() } : project
    );
    set({ projects });
    saveSnapshot(projects, get().plans, get().devices, get().planElements);
  },
  addDevice: (projectId, planId, type, x, y) => {
    const catalogItem = deviceCatalog.find((item) => item.type === type)!;
    const device: Device = {
      id: `dev-${crypto.randomUUID()}`,
      projectId,
      planId,
      type,
      layer: catalogItem.layer,
      name: catalogItem.label,
      brand: "",
      model: "",
      ip: "",
      location: "",
      switchAssociated: "",
      port: "",
      power: "",
      installedAt: new Date().toISOString().slice(0, 10),
      technician: "",
      notes: "",
      x,
      y,
      ...getDefaultCoverage(type),
      files: []
    };
    const devices = [...get().devices, device];
    const projects = touchProject(get().projects, projectId);
    set({ devices, projects });
    saveSnapshot(projects, get().plans, devices, get().planElements);
    return device;
  },
  moveDevice: (deviceId, x, y) => {
    const device = get().devices.find((item) => item.id === deviceId);
    const devices = get().devices.map((item) => (item.id === deviceId ? { ...item, x, y } : item));
    const projects = device ? touchProject(get().projects, device.projectId) : get().projects;
    set({ devices, projects });
    saveSnapshot(projects, get().plans, devices, get().planElements);
  },
  updateDevice: (deviceId, patch) => {
    const device = get().devices.find((item) => item.id === deviceId);
    const devices = get().devices.map((item) => (item.id === deviceId ? { ...item, ...patch } : item));
    const projects = device ? touchProject(get().projects, device.projectId) : get().projects;
    set({ devices, projects });
    saveSnapshot(projects, get().plans, devices, get().planElements);
  },
  addPlanElement: (projectId, planId, type, element) => {
    const planElement: PlanElement = {
      id: `element-${crypto.randomUUID()}`,
      projectId,
      planId,
      type,
      ...element
    };
    const planElements = [...get().planElements, planElement];
    const projects = touchProject(get().projects, projectId);
    set({ planElements, projects });
    saveSnapshot(projects, get().plans, get().devices, planElements);
  },
  clearPlanElements: (planId) => {
    const plan = get().plans.find((item) => item.id === planId);
    const planElements = get().planElements.filter((element) => element.planId !== planId);
    const projects = plan ? touchProject(get().projects, plan.projectId) : get().projects;
    set({ planElements, projects });
    saveSnapshot(projects, get().plans, get().devices, planElements);
  },
  updatePlanSource: (planId, sourceUrl, sourceType) => {
    const plans = get().plans.map((plan) => (plan.id === planId ? { ...plan, sourceUrl, sourceType } : plan));
    set({ plans });
    saveSnapshot(get().projects, plans, get().devices, get().planElements);
  }
}));

function touchProject(projects: Project[], projectId: string) {
  return projects.map((project) =>
    project.id === projectId ? { ...project, updatedAt: new Date().toISOString() } : project
  );
}

function getDefaultCoverage(type: DeviceType) {
  if (type === "camera") {
    return { coverageAngle: 105, coverageDirection: 0, coverageRange: 190 };
  }
  if (type === "light") {
    return { coverageAngle: 120, coverageDirection: 0, coverageRange: 160 };
  }
  if (type === "sensor") {
    return { coverageAngle: 8, coverageDirection: 0, coverageRange: 220 };
  }
  return {};
}

function migrateSnapshot(projects: Project[], plans: FloorPlan[], devices: Device[], planElements: PlanElement[]) {
  const nextPlans = plans.map((plan) => {
    const sourceType = (plan as unknown as { sourceType: string }).sourceType;
    return {
      ...plan,
      sourceType: sourceType === "satellite" ? "blank" : plan.sourceType
    };
  }) as FloorPlan[];

  const plansByProject = new Map<string, FloorPlan[]>();
  for (const plan of nextPlans) {
    plansByProject.set(plan.projectId, [...(plansByProject.get(plan.projectId) ?? []), plan]);
  }

  const migratedProjects = projects.map((project) => {
    const projectPlans = plansByProject.get(project.id) ?? [];
    if (projectPlans.some((plan) => plan.id === project.planId)) return project;

    const plan: FloorPlan = {
      id: `plan-${crypto.randomUUID()}`,
      projectId: project.id,
      name: "Piso 1",
      sourceType: "blank"
    };
    nextPlans.push(plan);
    return { ...project, planId: plan.id };
  });

  return { projects: migratedProjects, plans: nextPlans, devices, planElements };
}
