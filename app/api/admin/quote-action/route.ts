// app/api/admin/quote-action/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const QUOTES_TABLE = process.env.QUOTES_TABLE || "quotes";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const ok = ADMIN_SECRET && auth === `Bearer ${ADMIN_SECRET}`;
  return ok;
}

function makeId(len = 24) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function nowIso() {
  return new Date().toISOString();
}

const ALLOWED_STATUSES = [
  "draft",
  "sent",
  "pending",
  "awaiting_payment",
  "deposit_paid",
  "completed",
  "lost",
  "declined",
] as const;

type Status = (typeof ALLOWED_STATUSES)[number];

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const public_id = body?.public_id as string | undefined;
  const action = body?.action as string | undefined;

  if (!public_id || !action) {
    return Response.json({ error: "missing_fields", needs: ["public_id", "action"] }, { status: 400 });
  }

  let patch: Record<string, any> = {};
  const now = nowIso();

  if (action === "archive") {
    patch = {
      archived: true,
      archived_at: now,
      status_updated_at: now,
      public_token: makeId(24), // kill existing link
    };
  } else if (action === "unarchive") {
    patch = {
      archived: false,
      archived_at: null,
      status_updated_at: now,
    };
  } else if (action === "delete") {
    patch = {
      deleted_at: now,
      status_updated_at: now,
      public_token: makeId(24), // belt and braces
    };
  } else if (action === "set_status") {
    const status = body?.status as Status | undefined;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: "invalid_status", allowed: ALLOWED_STATUSES }, { status: 400 });
    }
    patch = { status, status_updated_at: now };
  } else if (action === "regenerate_link") {
    // Reactivate: rotate token, unarchive, optional status reset
    const nextStatus = (body?.status as Status | undefined) || "pending";
    if (!ALLOWED_STATUSES.includes(nextStatus)) {
      return Response.json({ error: "invalid_status", allowed: ALLOWED_STATUSES }, { status: 400 });
    }
    patch = {
      public_token: makeId(24),
      archived: false,
      archived_at: null,
      status: nextStatus,
      status_updated_at: now,
    };
  } else {
    return Response.json(
      { error: "invalid_action", allowed: ["archive", "unarchive", "delete", "set_status", "regenerate_link"] },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from(QUOTES_TABLE)
    .update(patch)
    .eq("public_id", public_id)
    .select("public_id, public_token, status, archived, deleted_at")
    .single();

  if (error) {
    return Response.json({ error: "update_failed", detail: error.message }, { status: 500 });
  }

  const base = (process.env.PUBLIC_QUOTE_BASE_URL || "").replace(/\/$/, "");
  const publicUrl = `${base}/q/${data.public_id}?t=${data.public_token}`;

  return Response.json({ ok: true, data, publicUrl }, { status: 200 });
}
