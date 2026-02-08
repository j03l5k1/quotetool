// app/q/[public_id]/page.tsx
import Link from "next/link";

type QuoteApiOk = {
  ok: true;
  meta: {
    public_id: string;
    status: string;
    created_at: string;
    customer_name: string | null;
    job_address: string | null;
  };
  totals: any;
  payload: any;
};

type QuoteApiErr = { error: "not_found" | "invalid_link" | "expired" | "deleted" };

function formatMoney(n: unknown) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return num.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: { public_id: string };
  searchParams: { t?: string };
}) {
  const token = searchParams?.t ?? "";
  const base = process.env.PUBLIC_QUOTE_BASE_URL?.replace(/\/$/, "") || "";
  const url = `${base}/api/quotes/${params.public_id}?t=${encodeURIComponent(token)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as QuoteApiOk | QuoteApiErr;

  const email = process.env.REACTIVATION_EMAIL || "quotes@yourdomain.com";
  const phone = process.env.REACTIVATION_PHONE || "";

  if (!res.ok) {
    const code = (data as QuoteApiErr)?.error;

    if (code === "expired") {
      const subject = encodeURIComponent("Quote reactivation request");
      const body = encodeURIComponent(
        `Hi team,\n\nThis quote has expired. Please reactivate it.\n\nQuote ID: ${params.public_id}\n\nThanks`
      );

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-2">This quote has expired</h1>
            <p className="text-neutral-300 mb-6">
              Please get in touch to reactivate it.
            </p>

            <div className="flex flex-col gap-3">
              <a
                className="w-full text-center font-bold rounded-xl px-4 py-3 bg-emerald-500 text-black hover:bg-emerald-400"
                href={`mailto:${email}?subject=${subject}&body=${body}`}
              >
                Request reactivation
              </a>

              {phone ? (
                <a
                  className="w-full text-center font-semibold rounded-xl px-4 py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750"
                  href={`tel:${phone}`}
                >
                  Call to reactivate
                </a>
              ) : null}

              <p className="text-xs text-neutral-500">
                Quote ID: <span className="font-mono">{params.public_id}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (code === "deleted") {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-2">This quote is no longer available</h1>
            <p className="text-neutral-300 mb-4">
              If you believe this is a mistake, please contact us.
            </p>
            <p className="text-xs text-neutral-500">
              Quote ID: <span className="font-mono">{params.public_id}</span>
            </p>
          </div>
        </div>
      );
    }

    // invalid_link / not_found
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-2">Invalid link</h1>
          <p className="text-neutral-300 mb-4">
            This quote link is invalid or has been replaced.
          </p>
          <p className="text-xs text-neutral-500">
            Quote ID: <span className="font-mono">{params.public_id}</span>
          </p>
        </div>
      </div>
    );
  }

  const ok = data as QuoteApiOk;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quote</h1>
            <p className="text-neutral-400 mt-1">
              {ok.meta.customer_name ?? "Customer"} • {ok.meta.job_address ?? "Address"}
            </p>
            <p className="text-xs text-neutral-600 mt-2">
              Quote ID: <span className="font-mono">{ok.meta.public_id}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-neutral-400 text-sm">Total (inc GST)</div>
            <div className="text-3xl font-extrabold">
              {formatMoney(ok.totals?.grand_total ?? ok.payload?.grand_total)}
            </div>
          </div>
        </div>

        {/* Replace this with your existing “nice” quote renderer if you have one */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-3">Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Subtotal (ex GST)</span>
              <span className="font-semibold">{formatMoney(ok.totals?.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">GST</span>
              <span className="font-semibold">{formatMoney(ok.totals?.gst)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-800">
              <span className="text-neutral-200 font-bold">Total</span>
              <span className="font-bold">{formatMoney(ok.totals?.grand_total)}</span>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="font-bold mb-2">Scope of works</h3>
            <p className="text-neutral-300 whitespace-pre-wrap">
              {ok.payload?.scope_of_works ?? "—"}
            </p>
          </div>

          <div className="mt-5">
            <h3 className="font-bold mb-2">Lines</h3>
            <div className="space-y-2">
              {(ok.payload?.pipe_lines ?? []).map((l: any, idx: number) => (
                <div key={l.id ?? idx} className="flex justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                  <div>
                    <div className="font-semibold">
                      {l.size} • {l.meters}m • {l.junctions} junction{Number(l.junctions) === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="font-bold">{formatMoney(l.total)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 text-xs text-neutral-500">
            Powered by Drainr Quote Tool
          </div>
        </div>

        <div className="mt-6 text-sm text-neutral-500">
          <Link href="/" className="underline hover:text-neutral-300">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
