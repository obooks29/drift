import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const API_URL = process.env.DRIFT_API_URL ?? "http://localhost:4000";

async function forwardToAPI(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.DRIFT_INTERNAL_API_KEY ?? "dev"}`, ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const qs = req.nextUrl.searchParams.toString();
  return forwardToAPI(`/agents${qs ? `?${qs}` : ""}`);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  return forwardToAPI("/agents/register", { method: "POST", body: JSON.stringify(body) });
}
