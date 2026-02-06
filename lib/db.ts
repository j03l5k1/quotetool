export type QuoteData = {
  job_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  job_address?: string | null;

  // This is the payload your viewer API expects
  payload: any;
};

export async function saveQuote(quoteData: QuoteData): Promise<{
  id?: string;
  publicUrl?: string;
  error?: string;
}> {
  const viewerUrl =
    process.env.VIEWER_API_URL || "https://civiro-quotes.vercel.app";

  // MVP: hard-coded fallback
  const secret =
    process.env.VIEWER_INTAKE_SECRET || "civiro_intake_8f3d7a2c1b9e4d6f0a5c7e2b";

  try {
    const res = await fetch(`${viewerUrl}/api/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ payload: quoteData.payload }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: data?.error || `Viewer error (${res.status})` };
    }

    // viewer returns { id, publicToken, publicUrl }
    return {
      id: data?.id,
      publicUrl: data?.publicUrl,
    };
  } catch (e: any) {
    return { error: e?.message || "Failed to reach viewer" };
  }
}
