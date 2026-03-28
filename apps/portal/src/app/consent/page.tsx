import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import ConsentPage from "@/components/ConsentPage";

export const metadata = { title: "Consent Chain" };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return (
    <DashboardShell>
      <ConsentPage />
    </DashboardShell>
  );
}
