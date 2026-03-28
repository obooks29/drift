import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const API = process.env.DRIFT_API_URL ?? "http://localhost:4000";
const HDR = { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DRIFT_INTERNAL_API_KEY ?? "dev"}` };

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API}/v1/ledger${qs ? `?${qs}` : ""}`, { headers: HDR });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${API}/v1/ledger`, { method: "POST", headers: HDR, body: JSON.stringify(body) });
  return NextResponse.json(await res.json(), { status: res.status });
}
