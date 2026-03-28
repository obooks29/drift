import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${process.env.DRIFT_API_URL ?? "http://localhost:4000"}/v1/apex/status`, {
      headers: { Authorization: `Bearer ${process.env.DRIFT_INTERNAL_API_KEY ?? "dev"}` },
      next: { revalidate: 0 },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ apex: "active", agentsMonitored: 0, anomaliesLastHour: 0 });
  }
}
