import { ProjectWorkspace } from "@/components/project-workspace";

export default function SharedProjectPage({ params }: { params: { projectId: string } }) {
  return <ProjectWorkspace projectId={params.projectId} mode="view" />;
}
