'use client';

import { useState, useEffect } from 'react';

interface JobContact {
  uuid: string;
  first: string;
  last: string;
  email: string;
  mobile: string;
  phone: string;
}

interface JobData {
  job: {
    uuid: string;
    job_address: string;
    generated_job_id: string;
    job_description: string;
  };
  company: {
    uuid: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  contact: JobContact | null;
  staff?: {
    first: string;
    last: string;
    email?: string;
    mobile?: string;
  } | null;
}

interface PipeLine {
  id: string;
  size: '100mm' | '150mm';
  meters: number;
  junctions: number;
}

interface ExtraItem {
  id: string;
  amount: number;
  note: string;
}

interface QuoteDraft {
  jobNumber: string;
  jobData: JobData | null;
  pipeLines: PipeLine[];
  diggingHours: number;
  diggingEnabled: boolean;
  extraItems: ExtraItem[];
  timestamp: number;
}

// Pricing configuration (PRE-GST PRICES)
const PRICING = {
  setup: 2272.73, // Fixed setup cost (pre-GST)
  '100mm': {
    perMeter: 409.09,   // Pre-GST (was 450)
    perJunction: 681.82, // Pre-GST (was 750)
  },
  '150mm': {
    perMeter: 500,      // Pre-GST (was 550)
    perJunction: 772.73, // Pre-GST (was 850)
  },
  diggingPerHour: 163.64, // Pre-GST (was 180)
};

// Icons
const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Pipette: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Shovel: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  Package: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  MapPin: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Undo: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

export default function Home() {
  const [jobNumber, setJobNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState<JobData | null>(null);
  
  // Quote details
  const [pipeLines, setPipeLines] = useState<PipeLine[]>([{
    id: Date.now().toString(),
    size: '100mm',
    meters: 10,
    junctions: 0,
  }]);
  const [diggingHours, setDiggingHours] = useState(0);
  const [diggingEnabled, setDiggingEnabled] = useState(false);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
  const [technicianName, setTechnicianName] = useState('');
  const [scopeOfWorks, setScopeOfWorks] = useState('');

  // UI state
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [undoStack, setUndoStack] = useState<PipeLine[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(true);

  // Quote generation state
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [qwilrLink, setQwilrLink] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState('');

  // Auto-save draft to localStorage
  useEffect(() => {
    if (jobData) {
      const draft: QuoteDraft = {
        jobNumber,
        jobData,
        pipeLines,
        diggingHours,
        diggingEnabled,
        extraItems,
        timestamp: Date.now(),
      };
      localStorage.setItem('quoteDraft', JSON.stringify(draft));
      setLastSaved(new Date());
    }
  }, [jobNumber, jobData, pipeLines, diggingHours, diggingEnabled, extraItems]);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('quoteDraft');
    if (saved) {
      const draft: QuoteDraft = JSON.parse(saved);
      if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
        setJobNumber(draft.jobNumber);
        setJobData(draft.jobData);
        setPipeLines(draft.pipeLines);
        setDiggingHours(draft.diggingHours);
        setDiggingEnabled(draft.diggingEnabled);
        setExtraItems(draft.extraItems);
        setLastSaved(new Date(draft.timestamp));
      }
    }
  }, []);

  const handleFetchJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setJobData(null);

    try {
      const response = await fetch(`/api/servicem8?jobNumber=${encodeURIComponent(jobNumber)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job data');
      }

      setJobData(data);
      
      // Auto-populate technician name from ServiceM8 staff data
      if (data.staff) {
        const staffName = `${data.staff.first} ${data.staff.last}`.trim();
        if (staffName) {
          setTechnicianName(staffName);
        }
      }
      
      // Auto-populate scope of works from job description
      if (data.job?.job_description) {
        setScopeOfWorks(data.job.job_description);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuote = async () => {
    setGeneratingQuote(true);
    setQuoteError('');
    
    try {
      const quotePayload = {
        jobNumber,
        jobData,
        technicianName,
        scopeOfWorks,
        pipeLines: pipeLines.map(line => ({
          size: line.size,
          meters: line.meters,
          junctions: line.junctions,
          total: calculateLineTotal(line) // Pre-GST
        })),
        digging: {
          enabled: diggingEnabled,
          hours: diggingHours,
          total: diggingTotal // Pre-GST
        },
        extras: extraItems.map(item => ({
          note: item.note,
          amount: item.amount // Already pre-GST
        })),
        totals: {
          setupCost: PRICING.setup,
          pipeWork: pipeWorkTotal,
          digging: diggingTotal,
          extras: extrasTotal,
          subtotal: subtotal, // pre-GST
          gst: gst,
          grandTotal: grandTotal // inc GST
        }
      };

      const response = await fetch('/api/send-to-qwilr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate quote');
      }

      setQwilrLink(result.qwilrLink || null);
      setQuoteGenerated(true);
      
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to generate quote');
    } finally {
      setGeneratingQuote(false);
    }
  };

  const addPipeLine = () => {
    const newLine: PipeLine = {
      id: Date.now().toString(),
      size: '100mm',
      meters: 10,
      junctions: 0,
    };
    setPipeLines([newLine, ...pipeLines]);
  };

  const removePipeLine = (id: string) => {
    const removed = pipeLines.find(line => line.id === id);
    if (removed) {
      setUndoStack([removed]);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 5000);
    }
    setPipeLines(pipeLines.filter(line => line.id !== id));
  };

  const undoRemove = () => {
    if (undoStack.length > 0) {
      setPipeLines([...undoStack, ...pipeLines]);
      setUndoStack([]);
      setShowUndo(false);
    }
  };

  const updatePipeLine = (id: string, field: keyof PipeLine, value: any) => {
    setPipeLines(pipeLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const duplicatePipeLine = (line: PipeLine) => {
    const newLine: PipeLine = {
      ...line,
      id: Date.now().toString(),
    };
    setPipeLines([newLine, ...pipeLines]);
  };

  const addExtraItem = () => {
    const newItem: ExtraItem = {
      id: Date.now().toString(),
      amount: 0,
      note: '',
    };
    setExtraItems([newItem, ...extraItems]);
  };

  const removeExtraItem = (id: string) => {
    setExtraItems(extraItems.filter(item => item.id !== id));
  };

  const updateExtraItem = (id: string, field: keyof ExtraItem, value: any) => {
    setExtraItems(extraItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Calculate line total (NO setup cost here - just meters + junctions, pre-GST)
  const calculateLineTotal = (line: PipeLine) => {
    const pricing = PRICING[line.size];
    return (
      (line.meters * pricing.perMeter) +
      (line.junctions * pricing.perJunction)
    );
  };

  const getLineBreakdown = (line: PipeLine) => {
    const pricing = PRICING[line.size];
    return {
      meters: line.meters * pricing.perMeter,
      junctions: line.junctions * pricing.perJunction,
      total: calculateLineTotal(line),
    };
  };

  // Calculate totals (all pre-GST)
  const pipeWorkTotal = pipeLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const diggingTotal = diggingEnabled ? diggingHours * PRICING.diggingPerHour : 0;
  const extrasTotal = extraItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Add setup cost to subtotal
  const subtotal = PRICING.setup + pipeWorkTotal + diggingTotal + extrasTotal;
  const gst = subtotal * 0.1;
  const grandTotal = subtotal + gst;

  // Validation
  const isValid = pipeLines.length > 0 && pipeLines.every(line => line.meters > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 mb-5 backdrop-blur-sm">
            <Icons.FileText />
            <span className="text-primary font-bold tracking-wide uppercase text-xs">
              Quote Builder
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Drainr Quote Tool
          </h1>

          {lastSaved && (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mt-2">
              <Icons.Clock />
              <span>Draft saved {Math.floor((Date.now() - lastSaved.getTime()) / 60000)}m ago</span>
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-dark-card/90 to-dark-card/70 backdrop-blur-xl rounded-3xl border border-gray-800/50 shadow-2xl p-5 sm:p-7">
          {!jobData ? (
            <>
              <form onSubmit={handleFetchJob} className="space-y-4">
                <label className="block text-white font-bold mb-3 text-base">
                  ServiceM8 Job Number
                </label>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={jobNumber}
                    onChange={(e) => setJobNumber(e.target.value)}
                    placeholder="Enter job number..."
                    inputMode="numeric"
                    className="flex-1 bg-dark-lighter/50 border border-gray-700/50 rounded-xl px-4 py-3.5 text-white text-base placeholder-gray-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    autoFocus
                  />
                  
                  <button
                    type="submit"
                    disabled={loading || !jobNumber}
                    className="px-6 py-3.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-dark font-bold rounded-xl transition-all duration-200 text-base shadow-lg shadow-primary/20 disabled:shadow-none active:scale-95 whitespace-nowrap"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                        <span>Loading</span>
                      </div>
                    ) : 'Fetch'}
                  </button>
                </div>
              </form>

              {lastSaved && !jobData && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                  <p className="text-primary text-sm font-semibold">Continue where you left off?</p>
                  <p className="text-gray-400 text-xs mt-1">Draft from {lastSaved.toLocaleTimeString()}</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (confirm('Start a new quote? This will clear all current data.')) {
                      setJobData(null);
                      setPipeLines([{
                        id: Date.now().toString(),
                        size: '100mm',
                        meters: 10,
                        junctions: 0,
                      }]);
                      setDiggingHours(0);
                      setDiggingEnabled(false);
                      setExtraItems([]);
                      localStorage.removeItem('quoteDraft');
                    }
                  }}
                  className="text-orange-400 hover:text-orange-300 text-sm font-bold border border-orange-400/30 hover:border-orange-400/50 px-4 py-2 rounded-xl transition-all hover:bg-orange-400/10 active:scale-95"
                >
                  New Quote
                </button>
                <button
                  onClick={() => {
                    setJobData(null);
                    localStorage.removeItem('quoteDraft');
                  }}
                  className="text-primary hover:text-white text-sm font-bold border border-primary/30 hover:border-primary/50 px-4 py-2 rounded-xl transition-all hover:bg-primary/10 active:scale-95"
                >
                  Change Job
                </button>
              </div>

              {/* Job Summary - keeping existing code */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 shadow-lg shadow-primary/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-bold">
                      #{jobData.job.generated_job_id}
                    </span>
                  </div>
                  <p className="text-white font-bold text-lg mb-3">{jobData.company.name}</p>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 text-gray-300">
                      <Icons.MapPin />
                      <p className="text-sm leading-snug">{jobData.job.job_address}</p>
                    </div>
                    
                    {jobData.contact && (jobData.contact.email || jobData.contact.mobile || jobData.contact.phone) && (
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-2" />
                    )}
                    
                    {jobData.contact?.email && (
                      <div className="flex items-start gap-2 text-gray-300">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm break-all leading-snug">{jobData.contact.email}</p>
                      </div>
                    )}
                    
                    {(jobData.contact?.mobile || jobData.contact?.phone) && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5" />
                        </svg>
                        <p className="text-sm">{jobData.contact.mobile || jobData.contact.phone}</p>
                      </div>
                    )}
                  </div>
                  
                  {jobData.job.job_description && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-gray-400 text-xs font-semibold mb-1">Job Notes:</p>
                      <p className="text-gray-300 text-sm">{jobData.job.job_description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

              {/* Technician & Scope Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2 text-sm">
                    Technician Name
                  </label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full bg-dark-lighter/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-base placeholder-gray-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2 text-sm">
                    Scope of Works
                  </label>
                  <textarea
                    value={scopeOfWorks}
                    onChange={(e) => setScopeOfWorks(e.target.value)}
                    placeholder="Describe the work to be performed..."
                    className="w-full bg-dark-lighter/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-base placeholder-gray-500 resize-none focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    rows={4}
                  />
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-4">
                Quote Details
              </h2>

              {/* Pipe Lines - keeping most of existing code, just updating breakdown */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-primary/20 rounded-lg flex-shrink-0">
                        <Icons.Pipette />
                      </div>
                      <h3 className="text-base font-bold text-white truncate">Relining Work</h3>
                    </div>
                    <button
                      onClick={addPipeLine}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-bold rounded-xl transition-all text-sm shadow-lg shadow-primary/30 active:scale-95 whitespace-nowrap flex-shrink-0"
                    >
                      <Icons.Plus />
                      <span>Add Line</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[...pipeLines].reverse().map((line, index) => {
                      const lineColors = [
                        'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
                        'bg-blue-500/20 border-blue-500/40 text-blue-400',
                        'bg-purple-500/20 border-purple-500/40 text-purple-400',
                        'bg-pink-500/20 border-pink-500/40 text-pink-400',
                        'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
                        'bg-orange-500/20 border-orange-500/40 text-orange-400',
                      ];
                      const linePosition = pipeLines.findIndex(l => l.id === line.id);
                      const colorClass = lineColors[linePosition % lineColors.length];
                      
                      return (
                      <div 
                        key={line.id} 
                        className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-xl animate-slideIn"
                      >
                        <div className="flex items-center justify-between mb-4 gap-2">
                          <span className={`px-3 py-1 border rounded-lg text-sm font-bold whitespace-nowrap ${colorClass}`}>
                            Line {pipeLines.length - index}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => duplicatePipeLine(line)}
                              className="flex items-center gap-1 text-primary hover:text-white font-semibold text-xs px-2.5 py-1.5 border border-primary/30 hover:border-primary/50 rounded-lg transition-all hover:bg-primary/10 active:scale-95"
                              title="Duplicate this line"
                            >
                              <Icons.Copy />
                              <span className="hidden sm:inline">Copy</span>
                            </button>
                            <button
                              onClick={() => removePipeLine(line.id)}
                              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold text-xs px-2.5 py-1.5 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-all hover:bg-red-400/10 active:scale-95"
                            >
                              <Icons.X />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        </div>

                        {/* Pipe Size */}
                        <div className="mb-4">
                          <label className="block text-gray-300 font-semibold mb-2 text-sm">Pipe Size</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => updatePipeLine(line.id, 'size', '100mm')}
                              className={`py-4 rounded-xl font-bold transition-all text-lg relative overflow-hidden active:scale-95 ${
                                line.size === '100mm'
                                  ? 'bg-gradient-to-br from-primary to-primary-dark text-dark shadow-lg shadow-primary/30'
                                  : 'bg-dark-lighter/50 border border-gray-600/50 text-gray-300 hover:border-primary/40'
                              }`}
                            >
                              100mm
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePipeLine(line.id, 'size', '150mm')}
                              className={`py-4 rounded-xl font-bold transition-all text-lg relative overflow-hidden active:scale-95 ${
                                line.size === '150mm'
                                  ? 'bg-gradient-to-br from-primary to-primary-dark text-dark shadow-lg shadow-primary/30'
                                  : 'bg-dark-lighter/50 border border-gray-600/50 text-gray-300 hover:border-primary/40'
                              }`}
                            >
                              150mm
                            </button>
                          </div>
                        </div>

                        {/* Meters Slider */}
                        <div className="mb-4">
                          <label className="block text-gray-300 font-semibold mb-3 text-sm text-center">Meters</label>
                          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 mb-3">
                            <div className="text-center mb-4">
                              <span className="text-5xl font-bold text-primary">
                                {line.meters}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="0.5"
                              value={line.meters}
                              onChange={(e) => updatePipeLine(line.id, 'meters', Number(e.target.value))}
                              className="w-full h-2 bg-gray-700/50 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #00d9ff 0%, #00d9ff ${(line.meters / 50) * 100}%, rgba(55, 65, 81, 0.5) ${(line.meters / 50) * 100}%, rgba(55, 65, 81, 0.5) 100%)`
                              }}
                            />
                          </div>
                        </div>

                        {/* Junctions Counter */}
                        <div className="mb-4">
                          <label className="block text-gray-300 font-semibold mb-3 text-sm text-center">Junctions</label>
                          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'junctions', Math.max(0, line.junctions - 1))}
                                className="w-14 h-14 bg-dark-lighter/50 border-2 border-amber-500/50 hover:border-amber-500 rounded-xl text-white font-bold text-2xl transition-all hover:bg-amber-500/10 active:scale-90"
                              >
                                −
                              </button>
                              <div className="flex-1 text-center">
                                <span className="text-5xl font-bold text-amber-400">
                                  {line.junctions}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'junctions', line.junctions + 1)}
                                className="w-14 h-14 bg-dark-lighter/50 border-2 border-amber-500/50 hover:border-amber-500 rounded-xl text-white font-bold text-2xl transition-all hover:bg-amber-500/10 active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Line Total with Breakdown - UPDATED to show NO setup */}
                        <div className="pt-4 border-t border-gray-700/50">
                          <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="w-full flex justify-between items-center group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-semibold text-sm">Line Total (ex GST)</span>
                              <Icons.Info />
                            </div>
                            <span className="text-primary font-bold text-2xl group-hover:scale-105 transition-transform">
                              ${calculateLineTotal(line).toFixed(2)}
                            </span>
                          </button>
                          
                          {showBreakdown && (
                            <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2 text-sm animate-slideIn">
                              {(() => {
                                const breakdown = getLineBreakdown(line);
                                return (
                                  <>
                                    <div className="flex justify-between text-gray-400">
                                      <span>{line.meters}m × ${PRICING[line.size].perMeter.toFixed(2)}/m</span>
                                      <span>${breakdown.meters.toFixed(2)}</span>
                                    </div>
                                    {line.junctions > 0 && (
                                      <div className="flex justify-between text-gray-400">
                                        <span>{line.junctions} junction{line.junctions !== 1 ? 's' : ''} × ${PRICING[line.size].perJunction.toFixed(2)}</span>
                                        <span>${breakdown.junctions.toFixed(2)}</span>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              </div>

              {/* Digging Section - update display text */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-4 border border-orange-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-orange-500/20 rounded-lg flex-shrink-0">
                        <Icons.Shovel />
                      </div>
                      <h3 className="text-base font-bold text-white truncate">Digging Required?</h3>
                      {diggingEnabled && diggingHours > 0 && (
                        <span className="p-1 bg-orange-500/20 rounded-full flex-shrink-0">
                          <Icons.Check />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setDiggingEnabled(!diggingEnabled)}
                      className={`relative w-14 h-8 rounded-full transition-all shadow-inner active:scale-95 ${
                        diggingEnabled ? 'bg-orange-500 shadow-orange-500/50' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                          diggingEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {diggingEnabled && (
                    <div className="mt-5 space-y-4 pt-5 border-t border-orange-500/20 animate-slideIn">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-300 font-semibold text-sm">Hours</label>
                        <input
                          type="number"
                          value={diggingHours}
                          onChange={(e) => setDiggingHours(Math.max(0, Number(e.target.value)))}
                          inputMode="decimal"
                          className="w-20 bg-dark-lighter/50 border border-orange-500/30 rounded-lg px-3 py-2 text-white text-base text-right font-bold focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={diggingHours}
                        onChange={(e) => setDiggingHours(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #f97316 0%, #f97316 ${(diggingHours / 8) * 100}%, rgba(55, 65, 81, 0.5) ${(diggingHours / 8) * 100}%, rgba(55, 65, 81, 0.5) 100%)`
                        }}
                      />
                      <div className="pt-4 border-t border-orange-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-semibold text-sm">{diggingHours}h × ${PRICING.diggingPerHour.toFixed(2)}/hr (ex GST)</span>
                          <span className="text-orange-400 font-bold text-2xl">${diggingTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extras Section - keeping existing code */}
              {extraItems.length === 0 ? (
                <button
                  onClick={addExtraItem}
                  className="w-full bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:from-purple-500/15 hover:to-purple-600/10 rounded-2xl p-4 border border-purple-500/20 hover:border-purple-500/30 shadow-lg transition-all active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Icons.Package />
                    </div>
                    <h3 className="text-base font-bold text-white">Add Extras</h3>
                    <Icons.Plus />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Materials, equipment, etc. (enter ex-GST amount)</p>
                </button>
              ) : (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-4 border border-purple-500/20 shadow-lg">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg flex-shrink-0">
                          <Icons.Package />
                        </div>
                        <h3 className="text-base font-bold text-white truncate">Extras</h3>
                        {extraItems.length > 0 && extrasTotal > 0 && (
                          <span className="p-1 bg-purple-500/20 rounded-full flex-shrink-0">
                            <Icons.Check />
                          </span>
                        )}
                      </div>
                      <button
                        onClick={addExtraItem}
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-purple-500/30 active:scale-95 whitespace-nowrap flex-shrink-0"
                      >
                        <Icons.Plus />
                        <span>Add Extra</span>
                      </button>
                    </div>

                    <div className="space-y-3 mt-5">
                      {[...extraItems].reverse().map((item, index) => (
                        <div key={item.id} className="bg-dark-lighter/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 animate-slideIn">
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-bold">
                              Extra {extraItems.length - index}
                            </span>
                            <button
                              onClick={() => removeExtraItem(item.id)}
                              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold text-xs px-3 py-1.5 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-all hover:bg-red-400/10 active:scale-95"
                            >
                              <Icons.X />
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-gray-300 font-semibold mb-2 text-sm">Amount (ex GST)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-lg font-bold">$</span>
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => updateExtraItem(item.id, 'amount', Math.max(0, Number(e.target.value)))}
                                  inputMode="numeric"
                                  className="w-full bg-dark-lighter/50 border border-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-white text-xl font-bold focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                  min="0"
                                  step="10"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-gray-300 font-semibold mb-2 text-sm">Description</label>
                              <textarea
                                value={item.note}
                                onChange={(e) => updateExtraItem(item.id, 'note', e.target.value)}
                                placeholder="What is this extra for?"
                                className="w-full bg-dark-lighter/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm animate-shake">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>
        
        {jobData && pipeLines.length > 0 && (
          <div className="h-[160px]" />
        )}
      </div>

      {/* Sticky Summary Footer - UPDATED with proper breakdown */}
      {jobData && pipeLines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a] to-transparent py-2 pb-safe z-50 animate-slideUp">
          <div className="max-w-4xl mx-auto px-3">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border-2 border-primary/30 rounded-2xl p-3 shadow-2xl shadow-primary/20 backdrop-blur-xl max-w-2xl mx-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="relative">
                {summaryCollapsed ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setSummaryCollapsed(false)}
                      className="w-full text-primary hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 pb-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show full summary
                    </button>
                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-xl p-2.5 border-2 border-emerald-500/40 mx-auto max-w-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-200 font-bold text-sm">Total (inc GST)</span>
                        <span className="text-3xl font-bold text-emerald-300 leading-none">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-white">Summary</h3>
                    </div>
                    
                    <div className="space-y-1 mb-2">
                      {/* Setup Cost */}
                      <div className="flex justify-between items-center gap-2 text-gray-200 text-xs bg-white/5 backdrop-blur-sm rounded-lg p-1.5">
                        <span className="font-medium">Setup & Service</span>
                        <span className="font-bold whitespace-nowrap">${PRICING.setup.toFixed(2)}</span>
                      </div>

                      {/* Pipe Lines */}
                      {pipeLines.map((line, index) => (
                        <div key={line.id} className="flex justify-between items-start gap-2 text-gray-200 text-xs bg-white/5 backdrop-blur-sm rounded-lg p-1.5">
                          <span className="font-medium leading-tight flex-1">
                            Line {pipeLines.length - index} - {line.meters}m of {line.size}
                            {line.junctions > 0 && ` (${line.junctions} junction${line.junctions !== 1 ? 's' : ''})`}
                          </span>
                          <span className="font-bold whitespace-nowrap">${calculateLineTotal(line).toFixed(2)}</span>
                        </div>
                      ))}

                      {/* Digging */}
                      {diggingEnabled && diggingHours > 0 && (
                        <div className="flex justify-between items-center gap-2 text-orange-300 text-xs bg-white/5 backdrop-blur-sm rounded-lg p-1.5">
                          <span className="font-medium">Excavation ({diggingHours}h)</span>
                          <span className="font-bold whitespace-nowrap">${diggingTotal.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Extras */}
                      {extraItems.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-start gap-2 text-purple-300 text-xs bg-white/5 backdrop-blur-sm rounded-lg p-1.5">
                          <span className="font-medium leading-tight flex-1">
                            {item.note || `Extra ${extraItems.length - index}`}
                          </span>
                          <span className="font-bold whitespace-nowrap">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Totals Breakdown */}
                    <div className="pt-2 border-t-2 border-primary/30 mb-2 space-y-1">
                      <div className="flex justify-between items-center text-white text-sm">
                        <span className="font-semibold">Subtotal (ex GST)</span>
                        <span className="font-bold">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-300 text-sm">
                        <span className="font-semibold">GST (10%)</span>
                        <span className="font-bold">${gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                        <span className="text-white font-bold text-base">TOTAL (inc GST)</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSummaryCollapsed(true)}
                      className="w-full text-primary hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 mb-2"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Hide summary
                    </button>
                  </>
                )}
                
                <button
                  disabled={!isValid || generatingQuote}
                  className="w-full py-3 bg-gradient-to-r from-primary via-primary-dark to-primary hover:from-primary-dark hover:via-primary hover:to-primary-dark disabled:from-gray-700 disabled:to-gray-800 text-dark disabled:text-gray-500 font-bold text-base rounded-xl transition-all shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:shadow-none mt-2"
                  onClick={handleGenerateQuote}
                >
                  {generatingQuote ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                      <span>Sending to Qwilr...</span>
                    </div>
                  ) : (
                    'Send to Qwilr'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keeping all your existing modals and toasts */}
      {showUndo && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl px-6 py-4 shadow-2xl z-50 animate-slideUp">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">Line removed</span>
            <button
              onClick={undoRemove}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-bold rounded-xl transition-all text-sm active:scale-95"
            >
              <Icons.Undo />
              Undo
            </button>
          </div>
        </div>
      )}

      {quoteGenerated && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-dark-card to-dark-lighter border-2 border-primary/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-primary/20 animate-slideUp">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-4">
                <Icons.Check />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Quote Generated!</h3>
              <p className="text-gray-400 mb-6">Your quote has been sent to Zapier and Qwilr</p>
              
              {qwilrLink ? (
                <>
                  <div className="bg-dark-lighter/50 border border-primary/30 rounded-xl p-4 mb-6">
                    <p className="text-xs text-gray-400 mb-2">Qwilr Link:</p>
                    <a 
                      href={qwilrLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-white text-sm font-mono break-all underline"
                    >
                      {qwilrLink}
                    </a>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qwilrLink);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex-1 px-4 py-3 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary font-bold rounded-xl transition-all text-sm active:scale-95"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => window.open(qwilrLink, '_blank')}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-dark font-bold rounded-xl transition-all text-sm shadow-lg shadow-primary/30 active:scale-95"
                    >
                      Open Quote
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                  <p className="text-orange-400 text-sm">
                    Quote sent to Zapier successfully!<br/>
                    <span className="text-xs text-orange-300 mt-1 block">
                      The Qwilr link will be available once Zapier processes the quote.
                    </span>
                  </p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setQuoteGenerated(false);
                  setQwilrLink(null);
                }}
                className="mt-4 w-full px-4 py-3 bg-dark-lighter/50 hover:bg-dark-lighter border border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-all text-sm active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {quoteError && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-red-500/20 border-2 border-red-500/50 rounded-2xl px-6 py-4 shadow-2xl z-50 animate-slideUp max-w-md">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-red-500/20 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-red-400 font-semibold text-sm">Failed to generate quote</p>
              <p className="text-red-300 text-xs mt-1">{quoteError}</p>
            </div>
            <button
              onClick={() => setQuoteError('')}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}
