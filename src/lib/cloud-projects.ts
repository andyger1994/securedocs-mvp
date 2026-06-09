"use client";

import { supabase } from "@/lib/supabase";
import type { Device, FloorPlan, PlanElement, Project } from "@/lib/types";

export interface ProjectDocument {
  project: Project;
  plans: FloorPlan[];
  devices: Device[];
  planElements: PlanElement[];
}

export async function loadCloudProjects() {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  const { data, error } = await supabase
    .from("project_documents")
    .select("share_token,payload")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => {
    const document = row.payload as ProjectDocument;
    return {
      ...document,
      project: { ...document.project, shareToken: row.share_token }
    };
  });
}

export async function saveCloudProjects(documents: ProjectDocument[]) {
  if (!supabase || documents.length === 0) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  for (const document of documents) {
    if (!document.project.shareToken) {
      throw new Error("El proyecto no tiene un token para compartir.");
    }
    const { error } = await supabase.rpc("publish_project_document", {
      project_id: document.project.id,
      project_share_token: document.project.shareToken,
      project_payload: document,
      project_updated_at: document.project.updatedAt
    });
    if (error) throw new Error(error.message);
  }
}

export async function loadSharedProject(projectKey: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_shared_project", { project_key: projectKey });
  if (error) throw error;
  return (data as ProjectDocument | null) ?? null;
}
