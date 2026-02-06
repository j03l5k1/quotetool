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
