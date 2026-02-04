// app/api/send-to-qwilr/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    
    const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || '';
    
    if (!ZAPIER_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Zapier webhook URL not configured' },
        { status: 500 }
      );
    }

    // Format the data for Qwilr
    const qwilrData = formatQuoteForQwilr(quoteData);
    
    console.log('Sending to Zapier:', JSON.stringify(qwilrData, null, 2)); // Debug
    
    // Send to Zapier
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qwilrData),
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote sent to Qwilr successfully'
    });

  } catch (error) {
    console.error('Error sending to Qwilr:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send quote to Qwilr',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatQuoteForQwilr(quoteData: any) {
  const {
    jobNumber,
    jobData,
    pipeLines = [],
    digging = { enabled: false, hours: 0, total: 0 },
    extras = [],
    totals,
    technicianName = '',
    scopeOfWorks = ''
  } = quoteData;

  // Debug logging
  console.log('=== FORMAT QUOTE DEBUG ===');
  console.log('technicianName received:', technicianName);
  console.log('jobData.contact:', jobData?.contact);
  console.log('jobData.company:', jobData?.company);
  console.log('========================');

  // Build line items array
  const lineItems = [];

  // 1. Add setup costs as first line item (pre-GST)
  const setupCostPreGST = 2272.73;
  lineItems.push({
    name: 'Setup & Service',
    description: `• Bring all equipment to and from site
• High-pressure water jet & clean of all debris and roots in drain
• Mechanical clean with Picote tool
• CCTV inspection
• Hot water cure liner
• Final CCTV checks to confirm the reline was successful
• Reopen any branch connections as needed with robotic cutter
• CCTV post-work footage
• Clean up the site and take away all rubbish
• Pack up and return all equipment to the depot`,
    quantity: 1,
    unitPrice: setupCostPreGST,
    total: setupCostPreGST
  });

  // 2. Add pipe lines (pre-GST prices)
  pipeLines.forEach((line: any, index: number) => {
    const lineTotal = line.total || 0;
    // Convert to pre-GST
    const preGSTTotal = lineTotal / 1.1;
    
    lineItems.push({
      name: `${line.size} Pipe Relining - Line ${index + 1}`,
      description: `${line.meters}m of ${line.size} pipe relining with 50-year warranty${line.junctions > 0 ? ` (includes ${line.junctions} junction${line.junctions !== 1 ? 's' : ''})` : ''}`,
      quantity: 1,
      unitPrice: preGSTTotal,
      total: preGSTTotal
    });
  });

  // 3. Add digging if enabled (pre-GST)
  if (digging.enabled && digging.hours > 0) {
    const diggingPreGST = digging.total / 1.1;
    lineItems.push({
      name: 'Excavation Work',
      description: `${digging.hours} hours of digging and excavation work`,
      quantity: digging.hours,
      unitPrice: diggingPreGST / digging.hours,
      total: diggingPreGST
    });
  }

  // 4. Add extras (pre-GST)
  extras.forEach((item: any, index: number) => {
    const extraPreGST = item.amount / 1.1;
    lineItems.push({
      name: item.note || `Additional Item ${index + 1}`,
      description: item.note || '',
      quantity: 1,
      unitPrice: extraPreGST,
      total: extraPreGST
    });
  });

  // Calculate totals (pre-GST)
  const subtotalPreGST = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = subtotalPreGST * 0.1;
  const totalIncGST = subtotalPreGST + gstAmount;

  // Return flattened data for Zapier
  return {
    // Page metadata
    pageTitle: `Quote ${jobNumber} - ${jobData?.company?.name || 'Customer'}`,
    jobNumber,
    quoteDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    
    // Customer information (flattened)
    customer_name: jobData?.company?.name || '',
    customer_email: jobData?.contact?.email || jobData?.company?.email || '',
    customer_phone: jobData?.contact?.mobile || jobData?.contact?.phone || jobData?.company?.phone || '',
    customer_address: jobData?.company?.address || '',
    
    // Job information (flattened)
    job_address: jobData?.job?.job_address || '',
    job_notes: jobData?.job?.job_description || '',
    
    // Technician and scope
    technician_name: technicianName || 'Drainr Team',
    scope_of_works: scopeOfWorks || jobData?.job?.job_description || '',
    
    // Line items
    lineItems,
    
    // Pricing (all pre-GST, then GST, then total)
    subtotal: Math.round(subtotalPreGST * 100) / 100,
    gst: Math.round(gstAmount * 100) / 100,
    total: Math.round(totalIncGST * 100) / 100,
    currency: 'AUD',
    
    // Additional metadata
    source: 'Drainr Quote Tool',
    timestamp: new Date().toISOString()
  };
}
