// app/api/admin/quotes/route.ts
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

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const u = new URL(req.url);
  const tab = (u.searchParams.get("tab") || "active") as "active" | "archived" | "deleted";
  const status = u.searchParams.get("status") || "";
  const search = u.searchParams.get("search") || "";
  const sort = u.searchParams.get("sort") || "created_at";
  const dir = (u.searchParams.get("dir") || "desc") as "asc" | "desc";
  const page = Math.max(1, Number(u.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(5, Number(u.searchParams.get("pageSize") || 25)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from(QUOTES_TABLE)
    .select(
      "public_id, public_token, job_number, customer_name, job_address, status, archived, archived_at, deleted_at, created_at, grand_total",
      { count: "exact" }
    );

  if (tab === "deleted") {
    q = q.not("deleted_at", "is", null);
  } else {
    q = q.is("deleted_at", null).eq("archived", tab === "archived");
  }

  if (status) q = q.eq("status", status);

  if (search) {
    const s = search.replace(/[%_]/g, "\\$&");
    q = q.or(
      `customer_name.ilike.%${s}%,job_address.ilike.%${s}%,job_number.ilike.%${s}%`
    );
  }

  // whitelist sorts
  const sortField =
    sort === "grand_total" || sort === "customer_name" || sort === "status"
      ? sort
      : "created_at";

  q = q.order(sortField, { ascending: dir === "asc" }).range(from, to);

  const { data, error, count } = await q;

  if (error) {
    return Response.json({ error: "query_failed", detail: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, data: data ?? [], count: count ?? 0, page, pageSize }, { status: 200 });
}
