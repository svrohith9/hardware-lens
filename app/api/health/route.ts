import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({ ok: true, service: "hardware-lens", ts: new Date().toISOString() });
}
