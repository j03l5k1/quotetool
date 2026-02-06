import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // Accept either { payload: {...} } OR direct {...} (more forgiving)
  const payload = body?.payload ?? body;

  if (!payload) {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  const secret = process.env.VIEWER_INTAKE_SECRET; // ✅ from Vercel env
  if (!secret) {
    return NextResponse.json(
      { error: "Missing VIEWER_INTAKE_SECRET in Vercel env" },
      { status: 500 }
    );
  }

  const viewerUrl =
    process.env.VIEWER_PUBLISH_URL ??
    "https://civiro-quotes.vercel.app/api/quotes";

  const res = await fetch(viewerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ payload }), // ✅ viewer expects { payload }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error || "Viewer error" },
      { status: res.status }
    );
  }

  // viewer returns { id, publicToken, publicUrl }
  return NextResponse.json(data);
}
