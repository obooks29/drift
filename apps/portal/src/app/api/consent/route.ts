import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ requests: [], chain: [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = `ciba_${Math.random().toString(36).slice(2, 9)}`;
  return NextResponse.json({
    id, ...body,
    status: "pending",
    bindingMessage: `DRIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    expiresAt: new Date(Date.now() + 300_000),
    createdAt: new Date(),
  }, { status: 201 });
}
