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
    setPipeLines([newLine, ...pipeLines]); // Add to beginning
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
    setExtraItems([newItem, ...extraItems]); // Add to beginning
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
    <div className="min-h-screen bg-dark p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-primary/30 bg-primary/5 mb-4">
            <span className="text-primary text-lg">📋</span>
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">
              Quote Builder
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Drainr Quote Tool
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-dark-card rounded-2xl border-2 border-gray-800 p-4 sm:p-6">
          {/* Job Number Input */}
          {!jobData && (
            <form onSubmit={handleFetchJob}>
              <label className="block text-white font-semibold mb-3 text-lg">
                ServiceM8 Job Number
              </label>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="Enter job number..."
                  className="flex-1 bg-dark-lighter border-2 border-gray-700 rounded-xl px-4 py-4 text-white text-lg placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
                  required
                />
                
                <button
                  type="submit"
                  disabled={loading || !jobNumber}
                  className="px-6 py-4 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:cursor-not-allowed text-dark font-bold rounded-xl transition-colors duration-200 text-lg"
                >
                  {loading ? 'Loading...' : 'Fetch'}
                </button>
              </div>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Job Data Display */}
          {jobData && (
            <div className="space-y-6">
              {/* Job Summary */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border-2 border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary text-sm font-semibold">Job #{jobData.job.generated_job_id}</p>
                    <p className="text-white font-bold text-lg">{jobData.company.name}</p>
                    <p className="text-gray-300 text-sm mt-1">{jobData.job.job_address}</p>
                  </div>
                  <button
                    onClick={() => setJobData(null)}
                    className="text-primary hover:text-white text-sm font-semibold border border-primary/30 px-3 py-2 rounded-lg"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="border-t-2 border-gray-800 pt-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Quote Details</h2>

                {/* Pipe Lines */}
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border-2 border-primary/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Pipe Work</h3>
                      <button
                        onClick={addPipeLine}
                        className="px-5 py-3 bg-primary hover:bg-primary-dark text-dark font-bold rounded-xl transition-colors text-base"
                      >
                        + Add Line
                      </button>
                    </div>

                    {pipeLines.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-base">No pipe lines yet</p>
                        <p className="text-gray-500 text-sm mt-1">Tap &ldquo;Add Line&rdquo; above to start</p>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {[...pipeLines].reverse().map((line, index) => (
                        <div key={line.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-5 border border-gray-700">
                          <div className="flex items-start justify-between mb-4">
                            <span className="text-primary font-bold text-lg">Line {pipeLines.length - index}</span>
                            <button
                              onClick={() => removePipeLine(line.id)}
                              className="text-red-400 hover:text-red-300 font-semibold px-3 py-1 border border-red-400/30 rounded-lg"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Pipe Size */}
                          <div className="mb-5">
                            <label className="block text-gray-300 font-semibold mb-3 text-base">Pipe Size</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'size', '100mm')}
                                className={`py-4 rounded-xl font-bold transition-all text-base ${
                                  line.size === '100mm'
                                    ? 'bg-primary text-dark border-2 border-primary shadow-lg shadow-primary/20'
                                    : 'bg-dark border-2 border-gray-600 text-gray-300 hover:border-primary/50'
                                }`}
                              >
                                <div>100mm</div>
                                <div className="text-xs font-normal opacity-80 mt-1">Standard</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'size', '150mm')}
                                className={`py-4 rounded-xl font-bold transition-all text-base ${
                                  line.size === '150mm'
                                    ? 'bg-primary text-dark border-2 border-primary shadow-lg shadow-primary/20'
                                    : 'bg-dark border-2 border-gray-600 text-gray-300 hover:border-primary/50'
                                }`}
                              >
                                <div>150mm</div>
                                <div className="text-xs font-normal opacity-80 mt-1">Multi-dwelling</div>
                              </button>
                            </div>
                          </div>

                          {/* Meters Slider */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-gray-300 font-semibold text-base">Meters</label>
                              <input
                                type="number"
                                value={line.meters}
                                onChange={(e) => updatePipeLine(line.id, 'meters', Math.max(0, Math.min(50, Number(e.target.value))))}
                                className="w-24 bg-dark border-2 border-gray-600 rounded-lg px-3 py-2 text-white text-lg text-right font-bold"
                                min="0"
                                max="50"
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="0.5"
                              value={line.meters}
                              onChange={(e) => updatePipeLine(line.id, 'meters', Number(e.target.value))}
                              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                              style={{
                                background: `linear-gradient(to right, #00d9ff 0%, #00d9ff ${(line.meters / 50) * 100}%, #374151 ${(line.meters / 50) * 100}%, #374151 100%)`
                              }}
                            />
                          </div>

                          {/* Junctions Counter */}
                          <div className="mb-5">
                            <label className="block text-gray-300 font-semibold mb-3 text-base">Junctions</label>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'junctions', Math.max(0, line.junctions - 1))}
                                className="w-14 h-14 bg-dark border-2 border-gray-600 hover:border-primary rounded-xl text-white font-bold text-2xl"
                              >
                                -
                              </button>
                              <div className="flex-1 text-center">
                                <span className="text-4xl font-bold text-primary">{line.junctions}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updatePipeLine(line.id, 'junctions', line.junctions + 1)}
                                className="w-14 h-14 bg-dark border-2 border-gray-600 hover:border-primary rounded-xl text-white font-bold text-2xl"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="pt-4 border-t-2 border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 font-semibold">Line Total</span>
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
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-5 border-2 border-orange-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Digging Required?</h3>
                      <button
                        onClick={() => setDiggingEnabled(!diggingEnabled)}
                        className={`relative w-16 h-9 rounded-full transition-all ${
                          diggingEnabled
                            ? 'bg-orange-500'
                            : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform ${
                            diggingEnabled ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {diggingEnabled && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-gray-300 font-semibold text-base">Hours</label>
                          <input
                            type="number"
                            value={diggingHours}
                            onChange={(e) => setDiggingHours(Math.max(0, Number(e.target.value)))}
                            className="w-24 bg-dark border-2 border-orange-500/30 rounded-lg px-3 py-2 text-white text-lg text-right font-bold"
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
                          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          style={{
                            background: `linear-gradient(to right, #f97316 0%, #f97316 ${(diggingHours / 8) * 100}%, #374151 ${(diggingHours / 8) * 100}%, #374151 100%)`
                          }}
                        />
                        <div className="pt-4 border-t-2 border-orange-500/30">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-semibold">{diggingHours}h × $180/hr</span>
                            <span className="text-orange-400 font-bold text-2xl">${diggingTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extras Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-5 border-2 border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Extras</h3>
                      <button
                        onClick={addExtraItem}
                        className="px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors text-base"
                      >
                        + Add Extra
                      </button>
                    </div>

                    {extraItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-base">No extras yet</p>
                        <p className="text-gray-500 text-sm mt-1">Materials, equipment, etc.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        {[...extraItems].reverse().map((item, index) => (
                          <div key={item.id} className="bg-dark-lighter rounded-xl p-4 border border-purple-500/30">
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-purple-400 font-bold text-base">Extra {extraItems.length - index}</span>
                              <button
                                onClick={() => removeExtraItem(item.id)}
                                className="text-red-400 hover:text-red-300 font-semibold px-3 py-1 border border-red-400/30 rounded-lg text-sm"
                              >
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
                                    className="w-full bg-dark border-2 border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-white text-xl font-bold"
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
                                  className="w-full bg-dark border-2 border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none text-base"
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
                  <div className="bg-gradient-to-br from-primary/20 to-primary/10 border-3 border-primary rounded-2xl p-6 shadow-xl shadow-primary/10">
                    <h3 className="text-2xl font-bold text-white mb-5">Quote Summary</h3>
                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between text-gray-200 text-lg">
                        <span className="font-semibold">Pipe Work ({pipeLines.length} line{pipeLines.length !== 1 ? 's' : ''})</span>
                        <span className="font-bold">${pipeWorkTotal.toLocaleString()}</span>
                      </div>
                      {diggingEnabled && diggingHours > 0 && (
                        <div className="flex justify-between text-orange-300 text-lg">
                          <span className="font-semibold">Digging ({diggingHours}h)</span>
                          <span className="font-bold">${diggingTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {extraItems.length > 0 && extrasTotal > 0 && (
                        <div className="flex justify-between text-purple-300 text-lg">
                          <span className="font-semibold">Extras ({extraItems.length} item{extraItems.length !== 1 ? 's' : ''})</span>
                          <span className="font-bold">${extrasTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-5 border-t-2 border-primary/40">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-white font-bold text-2xl">TOTAL</span>
                        <span className="text-primary font-bold text-4xl">${grandTotal.toLocaleString()}</span>
                      </div>
                      <button
                        className="w-full py-5 bg-primary hover:bg-primary-dark text-dark font-bold text-xl rounded-xl transition-colors shadow-lg shadow-primary/30"
                        onClick={() => alert('Phase 3: Generate Qwilr quote - coming next!')}
                      >
                        Generate Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
