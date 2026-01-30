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

export default function Home() {
  const [jobNumber, setJobNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState<JobData | null>(null);

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

  return (
    <div className="min-h-screen bg-dark p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
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

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-500 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Job Data Display */}
          {jobData && (
            <div className="space-y-6">
              <div className="border-t-2 border-gray-800 pt-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Job Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Job Number</p>
                    <p className="text-white font-semibold">{jobData.job.generated_job_id}</p>
                  </div>
                  
                  <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Job Address</p>
                    <p className="text-white font-semibold">{jobData.job.job_address}</p>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-gray-800 pt-6">
                <h2 className="text-2xl font-bold text-primary mb-4">Client Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Company Name</p>
                    <p className="text-white font-semibold">{jobData.company.name}</p>
                  </div>
                  
                  {jobData.contact && (
                    <>
                      <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Contact Name</p>
                        <p className="text-white font-semibold">
                          {jobData.contact.first} {jobData.contact.last}
                        </p>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Email</p>
                        <p className="text-white font-semibold">{jobData.contact.email || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Phone</p>
                        <p className="text-white font-semibold">
                          {jobData.contact.mobile || jobData.contact.phone || 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="bg-dark-lighter rounded-lg p-4 border border-gray-700 sm:col-span-2">
                    <p className="text-gray-400 text-sm mb-1">Address</p>
                    <p className="text-white font-semibold">{jobData.company.address || jobData.job.job_address}</p>
                  </div>
                </div>
              </div>

              {/* Next Step: Quote Details Form (Coming Soon) */}
              <div className="border-t-2 border-gray-800 pt-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-6 text-center">
                  <p className="text-primary font-semibold mb-2">Phase 1 Complete! ✓</p>
                  <p className="text-gray-300 text-sm">
                    Job data fetched successfully. Quote details form coming in Phase 2.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
