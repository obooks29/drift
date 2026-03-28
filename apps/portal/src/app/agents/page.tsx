import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import AgentsPage from "@/components/agents/AgentsPage";

export const metadata = { title: "Agents" };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return (
    <DashboardShell>
      <AgentsPage />
    </DashboardShell>
  );
}
