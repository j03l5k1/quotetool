// app/api/mux/create-upload/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const job_uuid = String(body?.job_uuid || "").trim();
    if (!job_uuid) {
      return NextResponse.json({ ok: false, error: "missing job_uuid" }, { status: 400 });
    }

    const viewerBase = (process.env.VIEWER_BASE_URL || "").replace(/\/$/, "");
    const secret = process.env.VIEWER_INTAKE_SECRET || "";

    if (!viewerBase) {
      return NextResponse.json({ ok: false, error: "missing VIEWER_BASE_URL" }, { status: 500 });
    }
    if (!secret) {
      return NextResponse.json({ ok: false, error: "missing VIEWER_INTAKE_SECRET" }, { status: 500 });
    }

    const res = await fetch(`${viewerBase}/api/mux/create-upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ job_uuid }),
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
