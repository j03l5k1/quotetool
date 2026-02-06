'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface QuoteData {
  id: string;
  job_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  job_address: string | null;
  job_description: string | null;
  technician_name: string | null;
  scope_of_works: string | null;
  pipe_lines: Array<{
    id: string;
    size: string;
    meters: number;
    junctions: number;
    total: number;
  }>;
  digging_enabled: boolean;
  digging_hours: number;
  digging_total: number;
  extras: Array<{
    id: string;
    note: string;
    amount: number;
  }>;
  setup_cost: number;
  pipe_work_total: number;
  subtotal: number;
  gst: number;
  grand_total: number;
  created_at: string;
}

export default function QuoteViewer() {
  const params = useParams();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load quote');
        }

        setQuote(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchQuote();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Quote Not Found</h1>
          <p className="text-gray-400">{error || 'This quote does not exist or has been deleted.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a] print:bg-white">
        <div className="max-w-4xl mx-auto p-6 print:p-8">
          <div className="mb-8 print:mb-6">
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h1 className="text-3xl font-bold text-white">Quote #{quote.job_number}</h1>
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-dark font-bold rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95"
              >
                Print / Save PDF
              </button>
            </div>

            <div className="hidden print:block mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Drainr Environmental Services</h1>
              <p className="text-gray-600">Professional Pipe Relining Quote</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-card/90 to-dark-card/70 backdrop-blur-xl rounded-3xl border border-gray-800/50 shadow-2xl p-6 print:bg-white print:border-gray-300 print:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:mb-6">
              <div>
                <h2 className="text-sm font-bold text-gray-400 print:text-gray-600 mb-3 uppercase tracking-wide">Customer Details</h2>
                <div className="space-y-2">
                  <p className="text-white print:text-gray-900 font-bold text-lg">{quote.customer_name}</p>
                  {quote.customer_email && (
                    <p className="text-gray-300 print:text-gray-700 text-sm">{quote.customer_email}</p>
                  )}
                  {quote.customer_phone && (
                    <p className="text-gray-300 print:text-gray-700 text-sm">{quote.customer_phone}</p>
                  )}
                  {quote.customer_address && (
                    <p className="text-gray-300 print:text-gray-700 text-sm">{quote.customer_address}</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-400 print:text-gray-600 mb-3 uppercase tracking-wide">Job Details</h2>
                <div className="space-y-2">
                  <p className="text-gray-300 print:text-gray-700 text-sm">
                    <span className="font-semibold">Job #:</span> {quote.job_number}
                  </p>
                  {quote.job_address && (
                    <p className="text-gray-300 print:text-gray-700 text-sm">
                      <span className="font-semibold">Location:</span> {quote.job_address}
                    </p>
                  )}
                  {quote.technician_name && (
                    <p className="text-gray-300 print:text-gray-700 text-sm">
                      <span className="font-semibold">Technician:</span> {quote.technician_name}
                    </p>
                  )}
                  <p className="text-gray-300 print:text-gray-700 text-sm">
                    <span className="font-semibold">Date:</span> {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {quote.scope_of_works && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-sm font-bold text-gray-400 print:text-gray-600 mb-3 uppercase tracking-wide">Scope of Works</h2>
                <p className="text-gray-300 print:text-gray-700 text-sm leading-relaxed">{quote.scope_of_works}</p>
              </div>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 print:via-gray-300 to-transparent mb-8 print:mb-6" />

            <div className="space-y-4 mb-8 print:mb-6">
              <h2 className="text-lg font-bold text-white print:text-gray-900 mb-4">Quote Breakdown</h2>

              <div className="flex justify-between items-center p-4 bg-white/5 print:bg-gray-50 rounded-xl print:rounded-lg border border-gray-700/50 print:border-gray-200">
                <span className="text-gray-300 print:text-gray-700 font-medium">Setup & Service</span>
                <span className="text-white print:text-gray-900 font-bold">${quote.setup_cost.toFixed(2)}</span>
              </div>

              {quote.pipe_lines.map((line, index) => (
                <div key={line.id} className="flex justify-between items-start p-4 bg-cyan-500/10 print:bg-blue-50 rounded-xl print:rounded-lg border border-cyan-500/30 print:border-blue-200">
                  <div className="flex-1">
                    <p className="text-cyan-300 print:text-blue-900 font-semibold mb-1">
                      Line {quote.pipe_lines.length - index} - {line.meters}m of {line.size}
                    </p>
                    {line.junctions > 0 && (
                      <p className="text-cyan-400/70 print:text-blue-700 text-sm">
                        {line.junctions} junction{line.junctions !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-cyan-300 print:text-blue-900 font-bold ml-4">${line.total.toFixed(2)}</span>
                </div>
              ))}

              {quote.digging_enabled && quote.digging_hours > 0 && (
                <div className="flex justify-between items-center p-4 bg-orange-500/10 print:bg-orange-50 rounded-xl print:rounded-lg border border-orange-500/30 print:border-orange-200">
                  <span className="text-orange-300 print:text-orange-900 font-medium">
                    Excavation ({quote.digging_hours}h)
                  </span>
                  <span className="text-orange-300 print:text-orange-900 font-bold">${quote.digging_total.toFixed(2)}</span>
                </div>
              )}

              {quote.extras.map((extra) => (
                <div key={extra.id} className="flex justify-between items-start p-4 bg-purple-500/10 print:bg-purple-50 rounded-xl print:rounded-lg border border-purple-500/30 print:border-purple-200">
                  <span className="text-purple-300 print:text-purple-900 font-medium flex-1">{extra.note || 'Extra Item'}</span>
                  <span className="text-purple-300 print:text-purple-900 font-bold ml-4">${extra.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-primary/30 print:border-gray-300 pt-6 space-y-3">
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-300 print:text-gray-700 font-semibold">Subtotal (ex GST)</span>
                <span className="text-white print:text-gray-900 font-bold">${quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-300 print:text-gray-700 font-semibold">GST (10%)</span>
                <span className="text-white print:text-gray-900 font-bold">${quote.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-primary/20 print:border-gray-200">
                <span className="text-white print:text-gray-900 font-bold text-xl">TOTAL (inc GST)</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent print:text-gray-900">
                  ${quote.grand_total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
