import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import ApexDashboard from "@/components/apex/ApexDashboard";

export const metadata = { title: "Apex" };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return (
    <DashboardShell>
      <ApexDashboard />
    </DashboardShell>
  );
}
