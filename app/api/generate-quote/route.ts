// app/api/generate-quote/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Env vars (Vercel Project Settings → Environment Variables):
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY  (server-only)
// PUBLIC_QUOTE_BASE_URL      e.g. https://quotetool-dun.vercel.app (or your viewer domain)
// QUOTES_TABLE               optional, defaults to "quotes"
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLIC_QUOTE_BASE_URL = process.env.PUBLIC_QUOTE_BASE_URL || "";
const QUOTES_TABLE = process.env.QUOTES_TABLE || "quotes";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Generates a short public id like "k3m9p2z7qv"
function makePublicId(len = 10) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function round2(n: unknown) {
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function nowIso() {
  return new Date().toISOString();
}

function asText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// ---- Adjust these column names if your Supabase table differs ----
// These are the flat columns your admin list likely reads.
// If your table uses different names, change them here (keys on the left are what we write).
const COLS = {
  public_id: "public_id",
  public_token: "public_token",
  job_number: "job_number",
  customer_name: "customer_name",
  customer_email: "customer_email",
  customer_phone: "customer_phone",
  customer_address: "customer_address",
  job_address: "job_address",
  scope_of_works: "scope_of_works",

  // Flat totals (admin-friendly)
  subtotal: "subtotal",
  gst: "gst",
  grand_total: "grand_total",
  total: "total", // many admin tables read `total` — we set it = grand_total

  // Optional breakdown
  setup_cost: "setup_cost",
  pipe_work_total: "pipe_work_total",
  digging_total: "digging_total",
  extras_total: "extras_total",

  // JSON blobs
  totals_json: "totals",
  payload_json: "payload",

  created_at: "created_at",
} as const;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // ✅ Accept either direct payload OR wrapped { payload: {...} }
    const quoteData = body?.payload ?? body;

    if (!quoteData || typeof quoteData !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const job_number = asText((quoteData as any).job_number);
    const customer_name = asText((quoteData as any).customer_name);

    if (!job_number || !customer_name) {
      return Response.json(
        {
          error: "Missing required fields",
          needs: ["job_number", "customer_name"],
          got: {
            job_number,
            customer_name,
          },
        },
        { status: 400 }
      );
    }

    // Clean float noise + ensure numeric
    const subtotal = round2((quoteData as any).subtotal);
    const gst = round2((quoteData as any).gst);
    const grand_total = round2((quoteData as any).grand_total);

    const setup_cost = round2((quoteData as any).setup_cost);
    const pipe_work_total = round2((quoteData as any).pipe_work_total);
    const digging_total = round2((quoteData as any).digging_total);

    // Compute extras_total if not supplied
    const extras_total =
      round2((quoteData as any).extras_total) ??
      (() => {
        const extras = Array.isArray((quoteData as any).extras) ? (quoteData as any).extras : [];
        const sum = extras.reduce((acc: number, x: any) => acc + (Number(x?.amount) || 0), 0);
        return round2(sum);
      })();

    const totals = {
      subtotal,
      gst,
      grand_total,
      setup_cost,
      pipe_work_total,
      digging_total,
      extras_total,
    };

    // Generate public id + token
    const public_id = makePublicId(10);

    // Build insert row with BOTH flat columns + json blobs
    // NOTE: We use dynamic keys via COLS so you can rename columns easily.
    const insertRow: Record<string, any> = {
      [COLS.public_id]: public_id,
      [COLS.public_token]: public_id, // compatibility

      [COLS.job_number]: job_number,
      [COLS.customer_name]: customer_name,
      [COLS.customer_email]: asText((quoteData as any).customer_email),
      [COLS.customer_phone]: asText((quoteData as any).customer_phone),
      [COLS.customer_address]: asText((quoteData as any).customer_address),
      [COLS.job_address]: asText((quoteData as any).job_address),
      [COLS.scope_of_works]: asText((quoteData as any).scope_of_works),

      // ✅ Flat totals (what admin list should show)
      [COLS.subtotal]: subtotal,
      [COLS.gst]: gst,
      [COLS.grand_total]: grand_total,
      [COLS.total]: grand_total, // <-- key line to stop admin showing 0.00

      // Optional breakdown (safe if columns exist)
      [COLS.setup_cost]: setup_cost,
      [COLS.pipe_work_total]: pipe_work_total,
      [COLS.digging_total]: digging_total,
      [COLS.extras_total]: extras_total,

      // ✅ JSON blobs (viewer can render from these forever)
      [COLS.totals_json]: totals,
      [COLS.payload_json]: quoteData,

      [COLS.created_at]: nowIso(),
    };

    // Insert
    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .insert(insertRow)
      .select(`${COLS.public_id}`)
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        { error: "Failed to save quote", detail: error.message },
        { status: 500 }
      );
    }

    const url = PUBLIC_QUOTE_BASE_URL
      ? `${PUBLIC_QUOTE_BASE_URL.replace(/\/$/, "")}/q/${(data as any)[COLS.public_id]}`
      : `/q/${(data as any)[COLS.public_id]}`;

    return Response.json(
      {
        ok: true,
        public_id: (data as any)[COLS.public_id],
        publicUrl: url, // ✅ what your UI expects
        url, // optional
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("generate-quote route error:", err?.message ?? err, err?.stack);
    return Response.json({ error: "Server error generating quote" }, { status: 500 });
  }
}
