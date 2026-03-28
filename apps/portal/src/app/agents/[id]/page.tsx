import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import AgentDetailPage from "@/components/agents/AgentDetailPage";

export const metadata = { title: "Agent Detail" };

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return (
    <DashboardShell>
      <AgentDetailPage agentId={params.id} />
    </DashboardShell>
  );
}
