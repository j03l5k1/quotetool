// app/api/generate-quote/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ✅ REQUIRED env vars (set in Vercel Project Settings → Environment Variables):
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY  (server-only)
// PUBLIC_QUOTE_BASE_URL      e.g. https://quotetool-dun.vercel.app  (or your viewer domain)
// QUOTES_TABLE               optional, defaults to "quotes"
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLIC_QUOTE_BASE_URL = process.env.PUBLIC_QUOTE_BASE_URL || "";
const QUOTES_TABLE = process.env.QUOTES_TABLE || "quotes";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // This will show in Vercel logs; API will still respond with 500 if called.
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

export async function POST(req: Request) {
  try {
    const quoteData = await req.json().catch(() => null);

    // ✅ basic shape validation (adjust if you want stricter)
    if (!quoteData || typeof quoteData !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const job_number = quoteData.job_number;
    const customer_name = quoteData.customer_name;

    if (!job_number || !customer_name) {
      return Response.json(
        { error: "Missing required fields", needs: ["job_number", "customer_name"] },
        { status: 400 }
      );
    }

    // Clean float noise
    const totals = {
      subtotal: round2(quoteData.subtotal),
      gst: round2(quoteData.gst),
      grand_total: round2(quoteData.grand_total),
      setup_cost: round2(quoteData.setup_cost),
      pipe_work_total: round2(quoteData.pipe_work_total),
      digging_total: round2(quoteData.digging_total),
    };

    const public_id = makePublicId(10);

    // ✅ Minimal columns to save. This assumes you have a "quotes" table with:
    // - public_id (text, unique)
    // - job_number (text)
    // - customer_name (text)
    // - customer_email (text, nullable)
    // - customer_phone (text, nullable)
    // - customer_address (text, nullable)
    // - job_address (text, nullable)
    // - scope_of_works (text, nullable)
    // - totals (jsonb)
    // - payload (jsonb)  <-- stores full quote object
    // - created_at (timestamptz, default now()) OR we set it here
    //
    // If your schema differs, tell me and I’ll map it.
    const insertRow = {
  public_id,
  public_token: public_id, // ✅ add this line
  job_number: String(job_number),
  customer_name: String(customer_name),
  customer_email: quoteData.customer_email ? String(quoteData.customer_email) : null,
  customer_phone: quoteData.customer_phone ? String(quoteData.customer_phone) : null,
  customer_address: quoteData.customer_address ? String(quoteData.customer_address) : null,
  job_address: quoteData.job_address ? String(quoteData.job_address) : null,
  scope_of_works: quoteData.scope_of_works ? String(quoteData.scope_of_works) : null,
  totals,
  payload: quoteData,
  created_at: nowIso(),
};


    const { data, error } = await supabase
      .from(QUOTES_TABLE)
      .insert(insertRow)
      .select("public_id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        { error: "Failed to save quote", detail: error.message },
        { status: 500 }
      );
    }

    const url =
      PUBLIC_QUOTE_BASE_URL
        ? `${PUBLIC_QUOTE_BASE_URL.replace(/\/$/, "")}/q/${data.public_id}`
        : `/q/${data.public_id}`;

    return Response.json(
  {
    ok: true,
    public_id: data.public_id,
    publicUrl: url,   // ✅ what the UI wants
    url,              // optional: keep both while you transition
  },
  { status: 200 }
);

  } catch (err: any) {
    console.error("generate-quote route error:", err?.message ?? err, err?.stack);
    return Response.json({ error: "Server error generating quote" }, { status: 500 });
  }
}
