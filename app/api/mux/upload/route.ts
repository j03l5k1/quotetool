// app/api/mux/upload/route.ts
import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

export const runtime = "nodejs"; // IMPORTANT: Mux SDK requires Node runtime

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

type Body = {
  public_id: string;
  public_token: string;
  created_by?: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;

    const public_id = body?.public_id?.trim();
    const public_token = body?.public_token?.trim();

    if (!public_id || !public_token) {
      return NextResponse.json(
        { ok: false, error: "Missing public_id or public_token" },
        { status: 400 }
      );
    }

    // 👇 This is what the webhook will read later
    const passthrough = JSON.stringify({
      public_id,
      public_token,
      created_by: body?.created_by ?? null,
    });

    const upload = await mux.video.uploads.create({
      cors_origin: "*", // tighten later if desired
      new_asset_settings: {
        playback_policy: ["public"],
        passthrough,
      },
    });

    return NextResponse.json({
      ok: true,
      upload_id: upload.id,
      upload_url: upload.url,
    });
  } catch (err: any) {
    console.error("mux upload create error", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
