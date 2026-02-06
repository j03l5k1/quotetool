import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const payload = body?.payload;

  if (!payload) {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  const res = await fetch("https://civiro-quotes.vercel.app/api/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer civiro_intake_8f3d7a2c1b9e4d6f0a5c7e2b",
    },
    body: JSON.stringify({ payload }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error || "Viewer error" },
      { status: res.status }
    );
  }

  return NextResponse.json(data); // { id, publicToken, publicUrl }
}
