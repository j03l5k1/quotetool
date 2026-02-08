// app/api/generate-quote/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLIC_QUOTE_BASE_URL = process.env.PUBLIC_QUOTE_BASE_URL || "";
const QUOTES_TABLE = process.env.QUOTES_TABLE || "quotes";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function makePublicId(len = 10) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function nowIso() {
  return new Date().toISOString();
}

function asText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// parses numbers even if "$6,999.99"
function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  const s = String(v).trim();
  if (!s) return null;

  const cleaned = s.replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function round2(v: unknown): number {
  const n = toNumber(v);
  if (n === null) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function sumKey(arr: any[], key: string): number {
  return arr.reduce((acc, x) => acc + (toNumber(x?.[key]) ?? 0), 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const quoteData = body?.payload ?? body;

    if (!quoteData || typeof quoteData !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const job_number = asText((quoteData as any).job_number);
    const customer_name = asText((quoteData as any).customer_name);

    if (!job_number || !customer_name) {
      return Response.json(
        { error: "Missing required fields", needs: ["job_number", "customer_name"] },
        { status: 400 }
      );
    }

    // ---- Authoritative totals (server-side) ----
    const setup_cost = round2((quoteData as any).setup_cost);

    const pipe_lines = Array.isArray((quoteData as any).pipe_lines)
      ? (quoteData as any).pipe_lines
      : [];

    // Each line already includes junctions etc; we trust line.total and sum it safely.
    const pipe_work_total = round2(sumKey(pipe_lines, "total"));

    const digging_enabled = !!(quoteData as any).digging_enabled;
    const digging_total = digging_enabled ? round2((quoteData as any).digging_total) : 0;

    // No extras needed (you said you don’t need them)
    const subtotal = round2(setup_cost + pipe_work_total + digging_total);
    const gst = round2(subtotal * 0.1);
    const grand_total = round2(subtotal + gst);

    const totals = {
      setup_cost,
      pipe_work_total,
      digging_total,
      subtotal,
      gst,
      grand_total,
    };

    const public_id = makePublicId(10);

    const insertRow = {
      public_id,
      public_token: public_id,

      job_number: String(job_number),
      customer_name: String(customer_name),
      customer_email: asText((quoteData as any).customer_email),
      customer_phone: asText((quoteData as any).customer_phone),
      customer_address: asText((quoteData as any).customer_address),
      job_address: asText((quoteData as any).job_address),
      scope_of_works: asText((quoteData as any).scope_of_works),

      // ✅ flat columns your admin is showing
      setup_cost,
      pipe_work_total,
      digging_total,
      subtotal,
      gst,
      grand_total,

      // JSON blobs for viewer / audit trail
      totals,
      payload: quoteData,

      created_at: nowIso(),
    };

    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .insert(insertRow)
      .select("public_id, setup_cost, pipe_work_total, digging_total, subtotal, gst, grand_total")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        { error: "Failed to save quote", detail: error.message },
        { status: 500 }
      );
    }

    const url = PUBLIC_QUOTE_BASE_URL
      ? `${PUBLIC_QUOTE_BASE_URL.replace(/\/$/, "")}/q/${data.public_id}`
      : `/q/${data.public_id}`;

    return Response.json(
      {
        ok: true,
        public_id: data.public_id,
        publicUrl: url,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("generate-quote route error:", err?.message ?? err, err?.stack);
    return Response.json({ error: "Server error generating quote" }, { status: 500 });
  }
}
