// app/api/quotes/[public_id]/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const QUOTES_TABLE = process.env.QUOTES_TABLE || "quotes";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function GET(req: Request, ctx: { params: { public_id: string } }) {
  const id = ctx.params.public_id;
  const token = new URL(req.url).searchParams.get("t");

  const { data, error } = await supabase
    .from(QUOTES_TABLE)
    .select(
      "public_id, public_token, archived, archived_at, deleted_at, status, created_at, customer_name, job_address, totals, payload"
    )
    .eq("public_id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (data.deleted_at) {
    return Response.json({ error: "deleted" }, { status: 410 });
  }

  if (data.archived) {
    return Response.json({ error: "expired" }, { status: 410 });
  }

  if (!token || token !== data.public_token) {
    return Response.json({ error: "invalid_link" }, { status: 404 });
  }

  return Response.json(
    {
      ok: true,
      meta: {
        public_id: data.public_id,
        status: data.status,
        created_at: data.created_at,
        customer_name: data.customer_name,
        job_address: data.job_address,
      },
      totals: data.totals,
      payload: data.payload,
    },
    { status: 200 }
  );
}
