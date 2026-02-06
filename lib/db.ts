export type QuoteData = {
  job_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  job_address?: string | null;

  // whatever your route already builds/sends:
  payload: any;
};


export async function saveQuote(data: QuoteData) {
  const viewerUrl =
    process.env.VIEWER_API_URL || "https://civiro-quotes.vercel.app";
  const secret =
    process.env.VIEWER_INTAKE_SECRET || "civiro_intake_8f3d7a2c1b9e4d6f0a5c7e2b";

  if (!data?.payload) {
    throw new Error("Missing payload");
  }

  const res = await fetch(`${viewerUrl}/api/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ payload: data.payload }),
    // Next.js route handler runs on server; no CORS issues here
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || `Viewer error (${res.status})`);
  }

  // Expected: { id, publicToken, publicUrl }
  return json;
}
