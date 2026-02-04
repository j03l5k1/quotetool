// app/api/send-to-qwilr/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const quoteData = await request.json();
    
    // Zapier webhook URL - you'll replace this with your actual Zapier webhook
    const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || '';
    
    if (!ZAPIER_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Zapier webhook URL not configured' },
        { status: 500 }
      );
    }

    // Format the data for Qwilr
    const qwilrData = formatQuoteForQwilr(quoteData);
    
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

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Quote sent to Qwilr successfully',
      data: result
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
  // Extract key information from your quote
  const {
    jobNumber,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    jobAddress,
    items = [],
    subtotal,
    gst,
    total,
    notes,
    validUntil
  } = quoteData;

  // Format line items for Qwilr
  const lineItems = items.map((item: any, index: number) => ({
    id: `item_${index + 1}`,
    name: item.description || item.name,
    description: item.notes || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || item.price,
    unitLabel: item.unit || 'unit',
    total: item.total || (item.quantity * item.unitPrice),
    optional: false,
    selected: true
  }));

  // Create structured data for Qwilr (via Zapier)
  return {
    // Page metadata
    pageTitle: `Quote ${jobNumber} - ${customerName}`,
    jobNumber,
    quoteDate: new Date().toISOString(),
    validUntil: validUntil || addDays(new Date(), 30).toISOString(),
    
    // Customer information
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: customerAddress
    },
    
    // Job information
    job: {
      address: jobAddress,
      notes: notes || ''
    },
    
    // Quote items
    lineItems,
    
    // Pricing
    pricing: {
      subtotal: subtotal || calculateSubtotal(items),
      gst: gst || (subtotal * 0.1),
      total: total || (subtotal * 1.1),
      currency: 'AUD'
    },
    
    // Additional metadata
    metadata: {
      source: 'Drainr Quote Tool',
      jobNumber,
      timestamp: new Date().toISOString()
    }
  };
}

function calculateSubtotal(items: any[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = item.total || (item.quantity || 1) * (item.unitPrice || item.price || 0);
    return sum + itemTotal;
  }, 0);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
