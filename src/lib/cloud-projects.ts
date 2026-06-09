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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw profileError ?? new Error("No se encontro la organizacion.");

  const rows = documents.map((document) => ({
    id: document.project.id,
    organization_id: profile.organization_id,
    owner_id: user.id,
    share_token: document.project.shareToken,
    payload: {
      ...document,
      project: {
        ...document.project,
        organizationId: profile.organization_id
      }
    },
    updated_at: document.project.updatedAt
  }));

  const { error } = await supabase.from("project_documents").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function loadSharedProject(projectKey: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_shared_project", { project_key: projectKey });
  if (error) throw error;
  return (data as ProjectDocument | null) ?? null;
}
