import { NextRequest, NextResponse } from 'next/server';

interface QuoteData {
  jobNumber: string;
  jobData: {
    job: {
      uuid: string;
      generated_job_id: string;
      job_address: string;
      job_description: string;
    };
    company: {
      name: string;
      phone: string;
      email: string;
    };
    contact: {
      first: string;
      last: string;
      email: string;
      mobile: string;
      phone: string;
    } | null;
  };
  pipeLines: Array<{
    id: string;
    size: '100mm' | '150mm';
    meters: number;
    junctions: number;
    total: number;
  }>;
  digging: {
    enabled: boolean;
    hours: number;
    total: number;
  };
  extras: Array<{
    id: string;
    note: string;
    amount: number;
  }>;
  totals: {
    pipeWork: number;
    digging: number;
    extras: number;
    grandTotal: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const quoteData: QuoteData = await request.json();

    // Check for Zapier webhook URL
    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    if (!zapierWebhookUrl) {
      return NextResponse.json(
        { error: 'Zapier webhook URL not configured' },
        { status: 500 }
      );
    }

    // Format data for Zapier/Qwilr
    const formattedData = {
      // Job Information
      job_number: quoteData.jobData.job.generated_job_id,
      job_uuid: quoteData.jobData.job.uuid,
      
      // Customer Information
      customer_name: quoteData.jobData.company.name,
      customer_email: quoteData.jobData.contact?.email || quoteData.jobData.company.email,
      customer_phone: quoteData.jobData.contact?.mobile || quoteData.jobData.contact?.phone || quoteData.jobData.company.phone,
      customer_address: quoteData.jobData.job.job_address,
      
      // Contact Person (if different from company)
      contact_first_name: quoteData.jobData.contact?.first || '',
      contact_last_name: quoteData.jobData.contact?.last || '',
      
      // Job Notes
      job_notes: quoteData.jobData.job.job_description || '',
      
      // Pipe Lines - formatted as table data
      pipe_lines: quoteData.pipeLines.map((line, index) => ({
        line_number: quoteData.pipeLines.length - index,
        size: line.size,
        meters: line.meters,
        junctions: line.junctions,
        price: line.total,
        description: `${line.meters}m of ${line.size} pipe relining (50yr warranty)${line.junctions > 0 ? ` with ${line.junctions} junction${line.junctions > 1 ? 's' : ''}` : ''}`
      })),
      
      // Digging
      digging_required: quoteData.digging.enabled,
      digging_hours: quoteData.digging.hours,
      digging_cost: quoteData.digging.total,
      
      // Extras
      extras: quoteData.extras.map((extra, index) => ({
        item_number: quoteData.extras.length - index,
        description: extra.note || `Extra Item ${quoteData.extras.length - index}`,
        amount: extra.amount
      })),
      
      // Totals
      pipe_work_total: quoteData.totals.pipeWork,
      digging_total: quoteData.totals.digging,
      extras_total: quoteData.totals.extras,
      grand_total: quoteData.totals.grandTotal,
      
      // Metadata
      generated_date: new Date().toISOString(),
      generated_by: 'Drainr Quote Tool'
    };

    // Send to Zapier webhook
    const zapierResponse = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook failed: ${zapierResponse.status}`);
    }

    const zapierResult = await zapierResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Quote sent to Zapier successfully',
      data: zapierResult,
      // This will be populated by Zapier with the Qwilr link
      qwilrLink: zapierResult.qwilrLink || null
    });

  } catch (error) {
    console.error('Generate Quote Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate quote' 
      },
      { status: 500 }
    );
  }
}
