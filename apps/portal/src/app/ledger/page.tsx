import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LedgerPage from "@/components/ledger/LedgerPage";

export const metadata = { title: "Action Ledger" };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return (
    <DashboardShell>
      <LedgerPage />
    </DashboardShell>
  );
}
