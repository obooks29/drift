import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import SettingsPage from "@/components/SettingsPage";

export const metadata = { title: "Settings" };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return (
    <DashboardShell>
      <SettingsPage user={session.user} />
    </DashboardShell>
  );
}
