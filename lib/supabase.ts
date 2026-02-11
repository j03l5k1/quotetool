// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Don’t throw at import-time in prod builds, but make it obvious in logs
  console.warn(
    "[supabase-admin] Missing SUPABASE_SERVICE_ROLE_KEY (admin DB writes will fail)."
  );
}
