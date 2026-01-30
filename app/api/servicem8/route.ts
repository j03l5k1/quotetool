import { NextRequest, NextResponse } from 'next/server';
import { createServiceM8Client } from '@/lib/servicem8';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobNumber = searchParams.get('jobNumber');

  if (!jobNumber) {
    return NextResponse.json(
      { error: 'Job number is required' },
      { status: 400 }
    );
  }

  try {
    const client = createServiceM8Client();
    const jobData = await client.getJobData(jobNumber);

    return NextResponse.json(jobData);
  } catch (error) {
    console.error('Error fetching job data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch job data' },
      { status: 500 }
    );
  }
}
