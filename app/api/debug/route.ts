import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobNumber = searchParams.get('jobNumber');

  if (!jobNumber) {
    return NextResponse.json(
      { error: 'Job number is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.SERVICEM8_API_KEY;

  try {
    // Get job
    const jobResponse = await fetch(
      `https://api.servicem8.com/api_1.0/job.json?%24filter=generated_job_id%20eq%20'${jobNumber}'`,
      {
        headers: {
          'X-API-Key': apiKey!,
          'Content-Type': 'application/json',
        },
      }
    );

    const jobs = await jobResponse.json();
    const job = jobs[0];

    // Get job contacts
    const contactResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobcontact.json?%24filter=job_uuid%20eq%20'${job.uuid}'`,
      {
        headers: {
          'X-API-Key': apiKey!,
          'Content-Type': 'application/json',
        },
      }
    );

    const contacts = await contactResponse.json();

    return NextResponse.json({
      debug: true,
      message: 'Raw API response - check what fields are actually available',
      job: job,
      contacts: contacts,
      contactFields: contacts[0] ? Object.keys(contacts[0]) : []
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 500 }
    );
  }
}
