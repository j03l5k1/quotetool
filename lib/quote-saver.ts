import { supabase } from './supabase';

export interface QuoteData {
  quoteNumber: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
  };
  property: {
    address: string;
    suburb: string;
    postcode: string;
    state: string;
  };
  technician: {
    name: string;
    phone: string;
  };
  assessment: {
    findings: string;
    recommendation: string;
  };
  lineItems: Array<{
    title: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    gst: number;
    total: number;
  };
}

export async function saveQuoteToDatabase(quoteData: QuoteData) {
  try {
    // Check if customer exists or create new one
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', quoteData.client.email || quoteData.client.name)
      .single();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: quoteData.client.name,
          email: quoteData.client.email,
          phone: quoteData.client.phone,
        })
        .select('id')
        .single();

      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteData.quoteNumber,
        customer_id: customerId,
        property_address: quoteData.property.address,
        property_suburb: quoteData.property.suburb,
        property_postcode: quoteData.property.postcode,
        property_state: quoteData.property.state,
        technician_name: quoteData.technician.name,
        technician_phone: quoteData.technician.phone,
        assessment_findings: quoteData.assessment.findings,
        assessment_recommendation: quoteData.assessment.recommendation,
        subtotal: quoteData.totals.subtotal,
        gst: quoteData.totals.gst,
        total: quoteData.totals.total,
        status: 'sent',
      })
      .select('id')
      .single();

    if (quoteError) throw quoteError;

    // Create line items
    const lineItemsToInsert = quoteData.lineItems.map((item, index) => ({
      quote_id: quote.id,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total: item.total,
      display_order: index,
    }));

    const { error: lineItemsError } = await supabase
      .from('line_items')
      .insert(lineItemsToInsert);

    if (lineItemsError) throw lineItemsError;

    return { success: true, quoteId: quote.id };
  } catch (error) {
    console.error('Error saving quote:', error);
    return { success: false, error };
  }
}

// Helper to generate shareable URL
export function generateQuoteUrl(quoteData: QuoteData): string {
  const encodedData = Buffer.from(JSON.stringify(quoteData)).toString('base64');
  return `https://civiro-quotes.vercel.app/q/${quoteData.quoteNumber}?data=${encodedData}`;
}
