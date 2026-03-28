import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const API_URL = process.env.DRIFT_API_URL ?? "http://localhost:4000";

async function forward(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.DRIFT_INTERNAL_API_KEY ?? "dev"}`, ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return forward(`/agents/${params.id}`);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  return forward(`/agents/${params.id}`, { method: "DELETE", body: JSON.stringify(body) });
}
