"use client";

import { create } from "zustand";
import { loadCloudProjects, loadSharedProject, saveCloudProjects, type ProjectDocument } from "@/lib/cloud-projects";
import { deviceCatalog } from "@/lib/device-catalog";
import { mockDevices, mockPlanElements, mockPlans, mockProjects } from "@/lib/mock-data";
import type { LiconexProjectFile } from "@/lib/project-file";
import type { Device, DeviceType, FloorPlan, PlanElement, PlanElementType, Project } from "@/lib/types";

interface HistorySnapshot {
  projects: Project[];
  plans: FloorPlan[];
  devices: Device[];
  planElements: PlanElement[];
}

interface ProjectState {
  hydrated: boolean;
  projects: Project[];
  plans: FloorPlan[];
  devices: Device[];
  planElements: PlanElement[];
  history: HistorySnapshot[];
  undo: () => void;
  hydrate: () => Promise<void>;
  hydrateShared: (projectKey: string) => Promise<void>;
  createProject: (clientName: string, address: string) => Project;
  importProject: (data: LiconexProjectFile) => Project;
  addFloorPlan: (projectId: string) => FloorPlan;
  selectFloorPlan: (projectId: string, planId: string) => void;
  updateFloorPlanName: (planId: string, name: string) => void;
  addDevice: (projectId: string, planId: string, type: DeviceType, x: number, y: number) => Device;
  moveDevice: (deviceId: string, x: number, y: number) => void;
  updateDevice: (deviceId: string, patch: Partial<Device>) => void;
  removeDevice: (deviceId: string) => void;
  addPlanElement: (projectId: string, planId: string, type: PlanElementType, element: Omit<PlanElement, "id" | "projectId" | "planId" | "type">) => void;
  updatePlanElement: (elementId: string, patch: Partial<PlanElement>) => void;
  removePlanElement: (elementId: string) => void;
  clearPlanElements: (planId: string) => void;
  updatePlanSource: (planId: string, sourceUrl: string | undefined, sourceType: FloorPlan["sourceType"]) => void;
}

const STORAGE_KEY = "liconex-mvp";
const LEGACY_STORAGE_KEY = "security-docs-mvp";
let cloudSyncTimer: ReturnType<typeof setTimeout> | undefined;

function saveSnapshot(projects: Project[], plans: FloorPlan[], devices: Device[], planElements: PlanElement[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, plans, devices, planElements }));
  queueCloudSync(projects, plans, devices, planElements);
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  hydrated: false,
  projects: mockProjects,
  plans: mockPlans,
  devices: mockDevices,
  planElements: mockPlanElements,
  history: [],
  undo: () => {
    const history = get().history;
    const previous = history[history.length - 1];
    if (!previous) return;
    set({
      projects: previous.projects,
      plans: previous.plans,
      devices: previous.devices,
      planElements: previous.planElements,
      history: history.slice(0, -1)
    });
    saveSnapshot(previous.projects, previous.plans, previous.devices, previous.planElements);
  },
  hydrate: async () => {
    if (typeof window === "undefined" || get().hydrated) return;
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    let localSnapshot = migrateSnapshot(mockProjects, mockPlans, mockDevices, mockPlanElements);
    if (!raw) {
      localSnapshot = migrateSnapshot(mockProjects, mockPlans, mockDevices, mockPlanElements);
    } else {
      try {
        const parsed = JSON.parse(raw) as Partial<Pick<ProjectState, "projects" | "plans" | "devices" | "planElements">>;
        localSnapshot = migrateSnapshot(
          parsed.projects ?? mockProjects,
          parsed.plans ?? mockPlans,
          parsed.devices ?? mockDevices,
          parsed.planElements ?? []
        );
      } catch {
        localSnapshot = migrateSnapshot(mockProjects, mockPlans, mockDevices, mockPlanElements);
      }
    }
    set({ ...localSnapshot, hydrated: true });
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);

    try {
      const cloudDocuments = await loadCloudProjects();
      const merged = mergeDocuments(buildProjectDocuments(localSnapshot.projects, localSnapshot.plans, localSnapshot.devices, localSnapshot.planElements), cloudDocuments);
      const snapshot = flattenDocuments(merged);
      set({ ...snapshot, hydrated: true });
      saveSnapshot(snapshot.projects, snapshot.plans, snapshot.devices, snapshot.planElements);
    } catch (error) {
      console.error("No se pudieron cargar los proyectos desde Supabase.", error);
      saveSnapshot(localSnapshot.projects, localSnapshot.plans, localSnapshot.devices, localSnapshot.planElements);
    }
  },
  hydrateShared: async (projectKey) => {
    if (typeof window === "undefined") return;
    set({ hydrated: false });
    try {
      const document = await loadSharedProject(projectKey);
      if (!document) {
        set({ hydrated: true, projects: [], plans: [], devices: [], planElements: [] });
        return;
      }
      const snapshot = flattenDocuments([document]);
      set({ ...snapshot, hydrated: true });
    } catch (error) {
      console.error("No se pudo abrir el proyecto compartido.", error);
      set({ hydrated: true, projects: [], plans: [], devices: [], planElements: [] });
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
      planId,
      shareToken: crypto.randomUUID()
    };
    const plan: FloorPlan = { id: planId, projectId: id, name: "Piso 1", sourceType: "blank" };
    const projects = [project, ...get().projects];
    const plans = [plan, ...get().plans];
    set({ projects, plans });
    saveSnapshot(projects, plans, get().devices, get().planElements);
    return project;
  },
  importProject: (data) => {
    const history = pushHistory(get());
    const projectId = `project-${crypto.randomUUID()}`;
    const planIdMap = new Map(data.plans.map((plan) => [plan.id, `plan-${crypto.randomUUID()}`]));
    const deviceIdMap = new Map(data.devices.map((device) => [device.id, `dev-${crypto.randomUUID()}`]));
    const plans = data.plans.map((plan) => ({
      ...plan,
      id: planIdMap.get(plan.id)!,
      projectId
    }));
    const activePlanId = planIdMap.get(data.project.planId) ?? plans[0]?.id;
    const fallbackPlan: FloorPlan = {
      id: `plan-${crypto.randomUUID()}`,
      projectId,
      name: "Piso 1",
      sourceType: "blank"
    };
    const importedPlans = plans.length > 0 ? plans : [fallbackPlan];
    const project: Project = {
      ...data.project,
      id: projectId,
      planId: activePlanId ?? fallbackPlan.id,
      clientName: `${data.project.clientName} (importado)`,
      updatedAt: new Date().toISOString(),
      shareToken: crypto.randomUUID()
    };
    const importedDevices = data.devices.map((device) => {
      const deviceId = deviceIdMap.get(device.id)!;
      return {
        ...device,
        id: deviceId,
        projectId,
        planId: planIdMap.get(device.planId) ?? project.planId,
        files: device.files.map((file) => ({
          ...file,
          id: `file-${crypto.randomUUID()}`,
          deviceId
        }))
      };
    });
    const importedElements = data.planElements.map((element) => ({
      ...element,
      id: `element-${crypto.randomUUID()}`,
      projectId,
      planId: planIdMap.get(element.planId) ?? project.planId,
      deviceId: element.deviceId ? deviceIdMap.get(element.deviceId) : undefined
    }));
    const projects = [project, ...get().projects];
    const nextPlans = [...importedPlans, ...get().plans];
    const devices = [...get().devices, ...importedDevices];
    const planElements = [...get().planElements, ...importedElements];
    set({ projects, plans: nextPlans, devices, planElements, history });
    saveSnapshot(projects, nextPlans, devices, planElements);
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
  updateFloorPlanName: (planId, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const plan = get().plans.find((item) => item.id === planId);
    const plans = get().plans.map((item) => (item.id === planId ? { ...item, name: trimmedName } : item));
    const projects = plan ? touchProject(get().projects, plan.projectId) : get().projects;
    set({ plans, projects });
    saveSnapshot(projects, plans, get().devices, get().planElements);
  },
  addDevice: (projectId, planId, type, x, y) => {
    const history = pushHistory(get());
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
      markerSize: 68,
      ...getDefaultCoverage(type),
      files: []
    };
    const devices = [...get().devices, device];
    const projects = touchProject(get().projects, projectId);
    set({ devices, projects, history });
    saveSnapshot(projects, get().plans, devices, get().planElements);
    return device;
  },
  moveDevice: (deviceId, x, y) => {
    const device = get().devices.find((item) => item.id === deviceId);
    if (!device || (device.x === x && device.y === y)) return;
    const history = pushHistory(get());
    const devices = get().devices.map((item) => (item.id === deviceId ? { ...item, x, y } : item));
    const projects = touchProject(get().projects, device.projectId);
    set({ devices, projects, history });
    saveSnapshot(projects, get().plans, devices, get().planElements);
  },
  updateDevice: (deviceId, patch) => {
    const device = get().devices.find((item) => item.id === deviceId);
    const devices = get().devices.map((item) => (item.id === deviceId ? { ...item, ...patch } : item));
    const projects = device ? touchProject(get().projects, device.projectId) : get().projects;
    set({ devices, projects });
    saveSnapshot(projects, get().plans, devices, get().planElements);
  },
  removeDevice: (deviceId) => {
    const device = get().devices.find((item) => item.id === deviceId);
    if (!device) return;
    const history = pushHistory(get());
    const devices = get().devices.filter((item) => item.id !== deviceId);
    const planElements = get().planElements.filter((element) => element.deviceId !== deviceId);
    const projects = touchProject(get().projects, device.projectId);
    set({ devices, planElements, projects, history });
    saveSnapshot(projects, get().plans, devices, planElements);
  },
  addPlanElement: (projectId, planId, type, element) => {
    const history = pushHistory(get());
    const planElement: PlanElement = {
      id: `element-${crypto.randomUUID()}`,
      projectId,
      planId,
      type,
      ...element
    };
    const planElements = [...get().planElements, planElement];
    const projects = touchProject(get().projects, projectId);
    set({ planElements, projects, history });
    saveSnapshot(projects, get().plans, get().devices, planElements);
  },
  updatePlanElement: (elementId, patch) => {
    const element = get().planElements.find((item) => item.id === elementId);
    if (!element) return;
    const history = pushHistory(get());
    const planElements = get().planElements.map((item) => (item.id === elementId ? { ...item, ...patch } : item));
    const projects = touchProject(get().projects, element.projectId);
    set({ planElements, projects, history });
    saveSnapshot(projects, get().plans, get().devices, planElements);
  },
  removePlanElement: (elementId) => {
    const element = get().planElements.find((item) => item.id === elementId);
    if (!element) return;
    const history = pushHistory(get());
    const planElements = get().planElements.filter((item) => item.id !== elementId);
    const projects = touchProject(get().projects, element.projectId);
    set({ planElements, projects, history });
    saveSnapshot(projects, get().plans, get().devices, planElements);
  },
  clearPlanElements: (planId) => {
    const plan = get().plans.find((item) => item.id === planId);
    if (!plan || !get().planElements.some((element) => element.planId === planId)) return;
    const history = pushHistory(get());
    const planElements = get().planElements.filter((element) => element.planId !== planId);
    const projects = touchProject(get().projects, plan.projectId);
    set({ planElements, projects, history });
    saveSnapshot(projects, get().plans, get().devices, planElements);
  },
  updatePlanSource: (planId, sourceUrl, sourceType) => {
    const plans = get().plans.map((plan) => (plan.id === planId ? { ...plan, sourceUrl, sourceType } : plan));
    set({ plans });
    saveSnapshot(get().projects, plans, get().devices, get().planElements);
  }
}));

function pushHistory(state: Pick<ProjectState, "projects" | "plans" | "devices" | "planElements" | "history">) {
  const snapshot: HistorySnapshot = {
    projects: state.projects,
    plans: state.plans,
    devices: state.devices,
    planElements: state.planElements
  };
  return [...state.history.slice(-29), snapshot];
}

function queueCloudSync(projects: Project[], plans: FloorPlan[], devices: Device[], planElements: PlanElement[]) {
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    void saveCloudProjects(buildProjectDocuments(projects, plans, devices, planElements)).catch((error) => {
      console.error("No se pudieron guardar los proyectos en Supabase.", error);
    });
  }, 700);
}

function buildProjectDocuments(projects: Project[], plans: FloorPlan[], devices: Device[], planElements: PlanElement[]) {
  return projects.map<ProjectDocument>((project) => ({
    project,
    plans: plans.filter((plan) => plan.projectId === project.id),
    devices: devices.filter((device) => device.projectId === project.id),
    planElements: planElements.filter((element) => element.projectId === project.id)
  }));
}

function flattenDocuments(documents: ProjectDocument[]) {
  return {
    projects: documents.map((document) => document.project),
    plans: documents.flatMap((document) => document.plans),
    devices: documents.flatMap((document) => document.devices),
    planElements: documents.flatMap((document) => document.planElements)
  };
}

function mergeDocuments(localDocuments: ProjectDocument[], cloudDocuments: ProjectDocument[]) {
  const documents = new Map<string, ProjectDocument>();
  for (const document of [...localDocuments, ...cloudDocuments]) {
    const current = documents.get(document.project.id);
    if (!current || new Date(document.project.updatedAt) >= new Date(current.project.updatedAt)) {
      documents.set(document.project.id, document);
    }
  }
  return [...documents.values()].sort(
    (left, right) => new Date(right.project.updatedAt).getTime() - new Date(left.project.updatedAt).getTime()
  );
}

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
    if (projectPlans.some((plan) => plan.id === project.planId)) {
      return { ...project, shareToken: project.shareToken ?? crypto.randomUUID() };
    }

    const plan: FloorPlan = {
      id: `plan-${crypto.randomUUID()}`,
      projectId: project.id,
      name: "Piso 1",
      sourceType: "blank"
    };
    nextPlans.push(plan);
    return { ...project, planId: plan.id, shareToken: project.shareToken ?? crypto.randomUUID() };
  });

  const migratedDevices = devices.map((device) =>
    device.type === "video_display" ? { ...device, layer: "access" as const } : device
  );

  return { projects: migratedProjects, plans: nextPlans, devices: migratedDevices, planElements };
}
