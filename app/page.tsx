'use client';

import { useState } from 'react';

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
  };
  company: {
    uuid: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  contact: JobContact | null;
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

// Pricing configuration - TODO: Make this configurable
const PRICING = {
  '100mm': {
    setup: 2500,
    perMeter: 450,
    perJunction: 750,
  },
  '150mm': {
    setup: 2600,
    perMeter: 550,
    perJunction: 850,
  },
  diggingPerHour: 180,
};

// Simple inline SVG icons
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
};

export default function Home() {
  const [jobNumber, setJobNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState<JobData | null>(null);
  
  // Quote details
  const [pipeLines, setPipeLines] = useState<PipeLine[]>([]);
  const [diggingHours, setDiggingHours] = useState(0);
  const [diggingEnabled, setDiggingEnabled] = useState(false);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
    setPipeLines(pipeLines.filter(line => line.id !== id));
  };

  const updatePipeLine = (id: string, field: keyof PipeLine, value: any) => {
    setPipeLines(pipeLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
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

  // Calculate totals
  const calculateLineTotal = (line: PipeLine) => {
    const pricing = PRICING[line.size];
    return (
      pricing.setup +
      (line.meters * pricing.perMeter) +
      (line.junctions * pricing.perJunction)
    );
  };

  const pipeWorkTotal = pipeLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const diggingTotal = diggingEnabled ? diggingHours * PRICING.diggingPerHour : 0;
  const extrasTotal = extraItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = pipeWorkTotal + diggingTotal + extrasTotal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
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
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-dark-card/90 to-dark-card/70 backdrop-blur-xl rounded-3xl border border-gray-800/50 shadow-2xl p-5 sm:p-7">
          {/* Job Number Input */}
          {!jobData && (
            <form onSubmit={handleFetchJob}>
              <label className="block text-white font-bold mb-4 text-base">
                ServiceM8 Job Number
              </label>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="Enter job number..."
                  className="flex-1 bg-dark-lighter/50 border border-gray-700/50 rounded-2xl px-5 py-4 text-white text-lg placeholder-gray-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                
                <button
                  type="submit"
                  disabled={loading || !jobNumber}
                  className="px-7 py-4 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-dark font-bold rounded-2xl transition-all duration-200 text-base shadow-lg shadow-primary/20 disabled:shadow-none"
                >
                  {loading ? 'Loading...' : 'Fetch'}
                </button>
              </div>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Job Data Display */}
          {jobData && (
            <div className="space-y-6">
              {/* Job Summary */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 shadow-lg shadow-primary/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-bold">
                        #{jobData.job.generated_job_id}
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg mb-2">{jobData.company.name}</p>
                    <div className="flex items-start gap-2 text-gray-300 text-sm">
                      <Icons.MapPin />
                      <p className="leading-relaxed">{jobData.job.job_address}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setJobData(null)}
                    className="text-primary hover:text-white text-sm font-bold border border-primary/30 hover:border-primary/50 px-4 py-2 rounded-xl transition-all hover:bg-primary/10"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Quote Details
              </h2>

              {/* Pipe Lines */}
              <div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-xl">
                        <Icons.Pipette />
                      </div>
                      <h3 className="text-lg font-bold text-white">Pipe Work</h3>
                    </div>
                    <button
                      onClick={addPipeLine}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-dark font-bold rounded-xl transition-all text-sm shadow-lg shadow-primary/30"
                    >
                      <Icons.Plus />
                      Add Line
                    </button>
                  </div>

                  {pipeLines.length === 0 ? (
                    <div className="text-center py-10 border-t border-primary/10">
                      <p className="text-gray-400 text-sm font-medium">No pipe lines yet</p>
                      <p className="text-gray-500 text-xs mt-1">Tap &ldquo;Add Line&rdquo; to start</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-5">
                      {[...pipeLines].reverse().map((line, index) => (
                        <div key={line.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 shadow-xl">
                          <div className="flex items-center justify-between mb-5">
                            <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-bold">
                              Line {pipeLines.length - index}
                            </span>
                            <button
                              onClick={() => removePipeLine(line.id)}
                              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold text-xs px-3 py-1.5 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-all hover:bg-red-400/10"
                            >
                              <Icons.X />
                              Remove
                            </button>
                          </div>

                          {/* Pipe Size */}
                          <div className="mb-5">
                            <label className="block text-gray-300 font-semibold mb-3 text-sm">Pipe Size</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'size', '100mm')}
                                className={`py-4 rounded-xl font-bold transition-all text-base relative overflow-hidden ${
                                  line.size === '100mm'
                                    ? 'bg-gradient-to-br from-primary to-primary-dark text-dark shadow-lg shadow-primary/30'
                                    : 'bg-dark-lighter/50 border border-gray-600/50 text-gray-300 hover:border-primary/40'
                                }`}
                              >
                                <div className="font-bold">100mm</div>
                                <div className="text-xs font-normal opacity-80 mt-0.5">Standard</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'size', '150mm')}
                                className={`py-4 rounded-xl font-bold transition-all text-base relative overflow-hidden ${
                                  line.size === '150mm'
                                    ? 'bg-gradient-to-br from-primary to-primary-dark text-dark shadow-lg shadow-primary/30'
                                    : 'bg-dark-lighter/50 border border-gray-600/50 text-gray-300 hover:border-primary/40'
                                }`}
                              >
                                <div className="font-bold">150mm</div>
                                <div className="text-xs font-normal opacity-80 mt-0.5">Multi-dwelling</div>
                              </button>
                            </div>
                          </div>

                          {/* Meters Slider */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-gray-300 font-semibold text-sm">Meters</label>
                              <input
                                type="number"
                                value={line.meters}
                                onChange={(e) => updatePipeLine(line.id, 'meters', Math.max(0, Math.min(50, Number(e.target.value))))}
                                className="w-20 bg-dark-lighter/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-base text-right font-bold focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                min="0"
                                max="50"
                              />
                            </div>
                            <div className="relative">
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
                          <div className="mb-5">
                            <label className="block text-gray-300 font-semibold mb-3 text-sm">Junctions</label>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'junctions', Math.max(0, line.junctions - 1))}
                                className="w-12 h-12 bg-dark-lighter/50 border border-gray-600/50 hover:border-primary/50 rounded-xl text-white font-bold text-xl transition-all hover:bg-primary/10"
                              >
                                −
                              </button>
                              <div className="flex-1 text-center">
                                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                                  {line.junctions}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'junctions', line.junctions + 1)}
                                className="w-12 h-12 bg-dark-lighter/50 border border-gray-600/50 hover:border-primary/50 rounded-xl text-white font-bold text-xl transition-all hover:bg-primary/10"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="pt-4 border-t border-gray-700/50">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 font-semibold text-sm">Line Total</span>
                              <span className="text-primary font-bold text-2xl">
                                ${calculateLineTotal(line).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Digging Section */}
              <div>
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-5 border border-orange-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-xl">
                        <Icons.Shovel />
                      </div>
                      <h3 className="text-lg font-bold text-white">Digging Required?</h3>
                    </div>
                    <button
                      onClick={() => setDiggingEnabled(!diggingEnabled)}
                      className={`relative w-14 h-8 rounded-full transition-all shadow-inner ${
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
                    <div className="mt-5 space-y-4 pt-5 border-t border-orange-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-gray-300 font-semibold text-sm">Hours</label>
                        <input
                          type="number"
                          value={diggingHours}
                          onChange={(e) => setDiggingHours(Math.max(0, Number(e.target.value)))}
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
                          <span className="text-gray-300 font-semibold text-sm">{diggingHours}h × $180/hr</span>
                          <span className="text-orange-400 font-bold text-2xl">${diggingTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extras Section */}
              <div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-5 border border-purple-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Icons.Package />
                      </div>
                      <h3 className="text-lg font-bold text-white">Extras</h3>
                    </div>
                    <button
                      onClick={addExtraItem}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-purple-500/30"
                    >
                      <Icons.Plus />
                      Add Extra
                    </button>
                  </div>

                  {extraItems.length === 0 ? (
                    <div className="text-center py-10 border-t border-purple-500/10">
                      <p className="text-gray-400 text-sm font-medium">No extras yet</p>
                      <p className="text-gray-500 text-xs mt-1">Materials, equipment, etc.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-5">
                      {[...extraItems].reverse().map((item, index) => (
                        <div key={item.id} className="bg-dark-lighter/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-bold">
                              Extra {extraItems.length - index}
                            </span>
                            <button
                              onClick={() => removeExtraItem(item.id)}
                              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold text-xs px-3 py-1.5 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-all hover:bg-red-400/10"
                            >
                              <Icons.X />
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-gray-300 font-semibold mb-2 text-sm">Amount</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-lg font-bold">$</span>
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => updateExtraItem(item.id, 'amount', Math.max(0, Number(e.target.value)))}
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
                  )}
                </div>
              </div>

              {/* Quote Summary */}
              {pipeLines.length > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border-2 border-primary/30 rounded-3xl p-7 shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-dark/10 rounded-full blur-3xl" />
                  
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-xl">
                        <Icons.FileText />
                      </div>
                      Quote Summary
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-200 text-base bg-white/5 backdrop-blur-sm rounded-xl p-3">
                        <span className="font-semibold">Pipe Work ({pipeLines.length} line{pipeLines.length !== 1 ? 's' : ''})</span>
                        <span className="font-bold">${pipeWorkTotal.toLocaleString()}</span>
                      </div>
                      {diggingEnabled && diggingHours > 0 && (
                        <div className="flex justify-between text-orange-300 text-base bg-white/5 backdrop-blur-sm rounded-xl p-3">
                          <span className="font-semibold">Digging ({diggingHours}h)</span>
                          <span className="font-bold">${diggingTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {extraItems.length > 0 && extrasTotal > 0 && (
                        <div className="flex justify-between text-purple-300 text-base bg-white/5 backdrop-blur-sm rounded-xl p-3">
                          <span className="font-semibold">Extras ({extraItems.length} item{extraItems.length !== 1 ? 's' : ''})</span>
                          <span className="font-bold">${extrasTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-6 border-t-2 border-primary/30 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-2xl">TOTAL</span>
                        <span className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent">
                          ${grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      className="w-full py-5 bg-gradient-to-r from-primary via-primary-dark to-primary hover:from-primary-dark hover:via-primary hover:to-primary-dark text-dark font-bold text-xl rounded-2xl transition-all shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => alert('Phase 3: Generate Qwilr quote - coming next!')}
                    >
                      Generate Quote
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
