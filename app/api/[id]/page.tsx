'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface QuoteLineItem {
  id: string;
  size: '100mm' | '150mm';
  meters: number;
  junctions: number;
  total: number;
}

interface QuoteExtraItem {
  id: string;
  note: string;
  amount: number;
}

interface Quote {
  id: string;
  job_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  job_address: string;
  job_description: string;
  technician_name: string;
  scope_of_works: string;
  pipe_lines: QuoteLineItem[];
  digging_enabled: boolean;
  digging_hours: number;
  digging_total: number;
  extras: QuoteExtraItem[];
  setup_cost: number;
  pipe_work_total: number;
  subtotal: number;
  gst: number;
  grand_total: number;
  created_at: string;
}

export default function QuoteViewer() {
  const params = useParams();
  const id = params?.id as string;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${id}`);
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

    fetchQuote();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Quote Not Found</h2>
          <p className="text-red-300 text-sm mb-6">{error || 'This quote does not exist'}</p>
          
            href="/"
            className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-dark font-bold rounded-xl transition-all"
          >
            Back to Calculator
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 mb-5 backdrop-blur-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-primary font-bold tracking-wide uppercase text-xs">
              Quote #{quote.job_number}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Pipe Relining Quote
          </h1>
          
          <p className="text-gray-400 text-sm">
            Generated {new Date(quote.created_at).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-dark-card/90 to-dark-card/70 backdrop-blur-xl rounded-3xl border border-gray-800/50 shadow-2xl p-5 sm:p-7 space-y-6">
          
          {/* Customer Info */}
          <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
            <h2 className="text-xl font-bold text-white mb-4">Customer Details</h2>
            <div className="grid gap-3 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="text-white font-semibold ml-2">{quote.customer_name}</span>
              </div>
              {quote.customer_email && (
                <div>
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-semibold ml-2">{quote.customer_email}</span>
                </div>
              )}
              {quote.customer_phone && (
                <div>
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white font-semibold ml-2">{quote.customer_phone}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Job Address:</span>
                <span className="text-white font-semibold ml-2">{quote.job_address}</span>
              </div>
              {quote.technician_name && (
                <div>
                  <span className="text-gray-400">Technician:</span>
                  <span className="text-white font-semibold ml-2">{quote.technician_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scope of Works */}
          {quote.scope_of_works && (
            <div className="bg-dark-lighter/50 rounded-2xl p-5 border border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-3">Scope of Works</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {quote.scope_of_works}
              </p>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Quote Breakdown</h2>
            
            {/* Setup Cost */}
            <div className="bg-dark-lighter/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Setup & Service Fee</span>
                <span className="text-primary font-bold text-lg">${quote.setup_cost.toFixed(2)}</span>
              </div>
            </div>

            {/* Pipe Lines */}
            {quote.pipe_lines.map((line, index) => (
              <div key={line.id} className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-4 border border-cyan-500/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">Line {quote.pipe_lines.length - index}</h3>
                    <p className="text-gray-300 text-sm">
                      {line.meters}m of {line.size} pipe relining
                      {line.junctions > 0 && ` with ${line.junctions} junction${line.junctions > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-cyan-400 font-bold text-lg ml-4">${line.total.toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Digging */}
            {quote.digging_enabled && quote.digging_hours > 0 && (
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-4 border border-orange-500/20">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-bold mb-1">Excavation</h3>
                    <p className="text-gray-300 text-sm">{quote.digging_hours} hours</p>
                  </div>
                  <span className="text-orange-400 font-bold text-lg">${quote.digging_total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Extras */}
            {quote.extras.length > 0 && quote.extras.map((extra, index) => (
              <div key={extra.id} className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">Extra {quote.extras.length - index}</h3>
                    {extra.note && (
                      <p className="text-gray-300 text-sm">{extra.note}</p>
                    )}
                  </div>
                  <span className="text-purple-400 font-bold text-lg ml-4">${extra.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 rounded-2xl p-5 border-2 border-primary/30">
            <div className="space-y-3">
              <div className="flex justify-between text-white">
                <span className="font-semibold">Subtotal (ex GST)</span>
                <span className="font-bold">${quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="font-semibold">GST (10%)</span>
                <span className="font-bold">${quote.gst.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-2" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-white font-bold text-xl">TOTAL (inc GST)</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent">
                  ${quote.grand_total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            
              href="/"
              className="flex-1 py-3 bg-dark-lighter/50 hover:bg-dark-lighter border border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-all text-center"
            >
              New Quote
            </a>
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-dark font-bold rounded-xl transition-all shadow-lg shadow-primary/30"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          button, a {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
