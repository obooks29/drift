import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";
export default async function Home() {
  const session = await getSession();
  if (session) redirect("/agents");
  return <LandingPage />;
}
