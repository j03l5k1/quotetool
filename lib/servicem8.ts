// ServiceM8 API Client
const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

export interface ServiceM8Job {
  uuid: string;
  job_address: string;
  generated_job_id: string;
}

export interface ServiceM8Company {
  uuid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface JobData {
  job: ServiceM8Job;
  company: ServiceM8Company;
}

export class ServiceM8Client {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${SERVICEM8_API_BASE}${endpoint}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:x`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ServiceM8 API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getJob(jobNumber: string): Promise<ServiceM8Job> {
    // Search for job by generated_job_id
    const jobs = await this.request<ServiceM8Job[]>(`/job.json?%24filter=generated_job_id%20eq%20'${jobNumber}'`);
    
    if (!jobs || jobs.length === 0) {
      throw new Error(`Job ${jobNumber} not found`);
    }

    return jobs[0];
  }

  async getCompany(companyUuid: string): Promise<ServiceM8Company> {
    const companies = await this.request<ServiceM8Company[]>(`/company/${companyUuid}.json`);
    return companies[0];
  }

  async getJobData(jobNumber: string): Promise<JobData> {
    const job = await this.getJob(jobNumber);
    
    // Get company details from the job
    const companyUuid = (job as any).company_uuid;
    const company = await this.getCompany(companyUuid);

    return {
      job,
      company,
    };
  }
}

export function createServiceM8Client(): ServiceM8Client {
  const apiKey = process.env.SERVICEM8_API_KEY;
  
  if (!apiKey) {
    throw new Error('SERVICEM8_API_KEY environment variable is not set');
  }

  return new ServiceM8Client(apiKey);
}
