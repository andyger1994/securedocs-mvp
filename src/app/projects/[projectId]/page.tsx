import { AuthGuard } from "@/components/auth-guard";
import { ProjectWorkspace } from "@/components/project-workspace";

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return (
    <AuthGuard>
      <ProjectWorkspace projectId={params.projectId} mode="edit" />
    </AuthGuard>
  );
}
