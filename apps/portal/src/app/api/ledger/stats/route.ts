import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${process.env.DRIFT_API_URL ?? "http://localhost:4000"}/v1/ledger/stats`, { headers: { Authorization: `Bearer ${process.env.DRIFT_INTERNAL_API_KEY ?? "dev"}` } });
  return NextResponse.json(await res.json(), { status: res.status });
}
