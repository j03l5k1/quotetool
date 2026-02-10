import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

export const runtime = "nodejs"; // ensure Node runtime (not Edge)

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

type Body = {
  // This is the ID we will pass through to the webhook so it knows which quote to update.
  // Use your quote "public_id" (recommended) or whatever stable identifier you already use.
  quote_public_id: string;

  // Optional: for debugging/tracking
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
    const quote_public_id = body?.quote_public_id?.trim();

    if (!quote_public_id) {
      return NextResponse.json(
        { ok: false, error: "Missing quote_public_id" },
        { status: 400 }
      );
    }

    // 👇 This is the key: webhook gets this back and can update the correct quote row.
    const passthrough = JSON.stringify({
      quote_public_id,
      created_by: body?.created_by ?? null,
    });

    // Create a Direct Upload URL
    const upload = await mux.video.uploads.create({
      cors_origin: "*", // tighten later if you want
      new_asset_settings: {
        playback_policy: ["public"], // simplest for now
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
