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
  const [extraMaterials, setExtraMaterials] = useState(0);
  const [materialsEnabled, setMaterialsEnabled] = useState(false);
  const [materialsNote, setMaterialsNote] = useState('');

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
    setPipeLines([...pipeLines, newLine]);
  };

  const removePipeLine = (id: string) => {
    setPipeLines(pipeLines.filter(line => line.id !== id));
  };

  const updatePipeLine = (id: string, field: keyof PipeLine, value: any) => {
    setPipeLines(pipeLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
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
  const materialsTotal = materialsEnabled ? extraMaterials : 0;
  const grandTotal = pipeWorkTotal + diggingTotal + materialsTotal;

  return (
    <div className="min-h-screen bg-dark p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-primary/30 bg-primary/5 mb-6">
            <span className="text-primary text-lg">📋</span>
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">
              Quote Builder
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Drainr Quote Tool
          </h1>
          
          <p className="text-gray-400 text-lg">
            Automated quote generation from ServiceM8 to Qwilr
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-dark-card rounded-2xl border-2 border-gray-800 p-6 sm:p-8">
          {/* Job Number Input */}
          {!jobData && (
            <form onSubmit={handleFetchJob} className="mb-8">
              <label className="block text-white font-semibold mb-4 text-lg">
                ServiceM8 Job Number
              </label>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="Enter job number..."
                  className="flex-1 bg-dark-lighter border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
                  required
                />
                
                <button
                  type="submit"
                  disabled={loading || !jobNumber}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:cursor-not-allowed text-dark font-semibold rounded-xl transition-colors duration-200"
                >
                  {loading ? 'Loading...' : 'Fetch Job'}
                </button>
              </div>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-500 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Job Data Display */}
          {jobData && (
            <div className="space-y-8">
              {/* Job Summary */}
              <div className="bg-dark-lighter rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Job #{jobData.job.generated_job_id}</p>
                    <p className="text-white font-semibold">{jobData.company.name}</p>
                    <p className="text-gray-400 text-sm">{jobData.job.job_address}</p>
                  </div>
                  <button
                    onClick={() => setJobData(null)}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Change Job
                  </button>
                </div>
              </div>

              <div className="border-t-2 border-gray-800 pt-8">
                <h2 className="text-2xl font-bold text-primary mb-6">Quote Details</h2>

                {/* Pipe Lines */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Pipe Work</h3>
                    <button
                      onClick={addPipeLine}
                      className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary rounded-lg text-primary font-semibold text-sm transition-colors"
                    >
                      + Add Line
                    </button>
                  </div>

                      <div className="text-center py-8 bg-dark-lighter rounded-xl border border-gray-700">
                      <p className="text-gray-400">No pipe lines added yet</p>
                      <p className="text-gray-500 text-sm mt-1">Click &ldquo;Add Line&rdquo; to start</p>
                    </div>

                  <div className="space-y-4">
                    {pipeLines.map((line, index) => (
                      <div key={line.id} className="bg-dark-lighter rounded-xl p-4 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-primary font-semibold">Line {index + 1}</span>
                          <button
                            onClick={() => removePipeLine(line.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Pipe Size */}
                        <div className="mb-4">
                          <label className="block text-gray-400 text-sm mb-2">Pipe Size</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => updatePipeLine(line.id, 'size', '100mm')}
                              className={`py-3 rounded-xl font-semibold transition-all ${
                                line.size === '100mm'
                                  ? 'bg-primary text-dark border-2 border-primary'
                                  : 'bg-dark border-2 border-gray-700 text-gray-400 hover:border-primary/50'
                              }`}
                            >
                              <div>100mm</div>
                              <div className="text-xs opacity-70">Standard</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePipeLine(line.id, 'size', '150mm')}
                              className={`py-3 rounded-xl font-semibold transition-all ${
                                line.size === '150mm'
                                  ? 'bg-primary text-dark border-2 border-primary'
                                  : 'bg-dark border-2 border-gray-700 text-gray-400 hover:border-primary/50'
                              }`}
                            >
                              <div>150mm</div>
                              <div className="text-xs opacity-70">Multi-dwelling</div>
                            </button>
                          </div>
                        </div>

                        {/* Meters Slider */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-gray-400 text-sm">Meters</label>
                            <input
                              type="number"
                              value={line.meters}
                              onChange={(e) => updatePipeLine(line.id, 'meters', Math.max(0, Math.min(50, Number(e.target.value))))}
                              className="w-20 bg-dark border border-gray-700 rounded-lg px-3 py-1 text-white text-right"
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
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        {/* Junctions Counter */}
                        <div className="mb-4">
                          <label className="block text-gray-400 text-sm mb-2">Junctions</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updatePipeLine(line.id, 'junctions', Math.max(0, line.junctions - 1))}
                              className="w-10 h-10 bg-dark border-2 border-gray-700 hover:border-primary rounded-lg text-white font-bold"
                            >
                              -
                            </button>
                            <div className="flex-1 text-center">
                              <span className="text-2xl font-bold text-white">{line.junctions}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => updatePipeLine(line.id, 'junctions', line.junctions + 1)}
                              className="w-10 h-10 bg-dark border-2 border-gray-700 hover:border-primary rounded-lg text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="pt-3 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Line Total</span>
                            <span className="text-primary font-bold text-lg">
                              ${calculateLineTotal(line).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digging Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Digging Required?</h3>
                    <button
                      onClick={() => setDiggingEnabled(!diggingEnabled)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        diggingEnabled
                          ? 'bg-primary text-dark'
                          : 'bg-dark-lighter border border-gray-700 text-gray-400'
                      }`}
                    >
                      {diggingEnabled ? 'Yes' : 'No'}
                    </button>
                  </div>

                  {diggingEnabled && (
                    <div className="bg-dark-lighter rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-400 text-sm">Hours</label>
                        <input
                          type="number"
                          value={diggingHours}
                          onChange={(e) => setDiggingHours(Math.max(0, Number(e.target.value)))}
                          className="w-20 bg-dark border border-gray-700 rounded-lg px-3 py-1 text-white text-right"
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
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">{diggingHours}h × $180/hr</span>
                          <span className="text-primary font-bold">${diggingTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Materials Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Extra Materials?</h3>
                    <button
                      onClick={() => setMaterialsEnabled(!materialsEnabled)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        materialsEnabled
                          ? 'bg-primary text-dark'
                          : 'bg-dark-lighter border border-gray-700 text-gray-400'
                      }`}
                    >
                      {materialsEnabled ? 'Yes' : 'No'}
                    </button>
                  </div>

                  {materialsEnabled && (
                    <div className="bg-dark-lighter rounded-xl p-4 border border-gray-700 space-y-3">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white">$</span>
                          <input
                            type="number"
                            value={extraMaterials}
                            onChange={(e) => setExtraMaterials(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-dark border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white"
                            min="0"
                            step="10"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Note (optional)</label>
                        <textarea
                          value={materialsNote}
                          onChange={(e) => setMaterialsNote(e.target.value)}
                          placeholder="What materials are needed?"
                          className="w-full bg-dark border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quote Summary */}
                {pipeLines.length > 0 && (
                  <div className="bg-primary/10 border-2 border-primary rounded-xl p-6">
                    <h3 className="text-xl font-bold text-primary mb-4">Quote Summary</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-300">
                        <span>Pipe Work ({pipeLines.length} line{pipeLines.length !== 1 ? 's' : ''})</span>
                        <span>${pipeWorkTotal.toLocaleString()}</span>
                      </div>
                      {diggingEnabled && diggingHours > 0 && (
                        <div className="flex justify-between text-gray-300">
                          <span>Digging ({diggingHours}h)</span>
                          <span>${diggingTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {materialsEnabled && extraMaterials > 0 && (
                        <div className="flex justify-between text-gray-300">
                          <span>Extra Materials</span>
                          <span>${materialsTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t-2 border-primary/30">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-lg">TOTAL</span>
                        <span className="text-primary font-bold text-3xl">${grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      className="w-full mt-6 py-4 bg-primary hover:bg-primary-dark text-dark font-bold text-lg rounded-xl transition-colors"
                      onClick={() => alert('Phase 3: Generate Qwilr quote - coming next!')}
                    >
                      Generate Quote
                    </button>
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
