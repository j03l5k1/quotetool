import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const public_id = String(body?.public_id || '').trim();

    if (!public_id) {
      return NextResponse.json({ error: 'missing_public_id' }, { status: 400 });
    }

    // Quote Tool env vars (server-side only)
    const viewerBaseUrl = (process.env.VIEWER_BASE_URL || '').replace(/\/$/, '');
    const viewerSecret = process.env.VIEWER_INTAKE_SECRET || '';

    if (!viewerBaseUrl) {
      return NextResponse.json({ error: 'missing VIEWER_BASE_URL' }, { status: 500 });
    }
    if (!viewerSecret) {
      return NextResponse.json({ error: 'missing VIEWER_INTAKE_SECRET' }, { status: 500 });
    }

    // Call the Viewer route that creates the Mux direct-upload URL
    const r = await fetch(`${viewerBaseUrl}/api/mux/create-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerSecret}`,
      },
      body: JSON.stringify({ public_id }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error || `viewer create-upload failed (${r.status})` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      uploadUrl: data.uploadUrl,
      uploadId: data.uploadId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'quote_tool_create_upload_failed', detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
