import { supabase } from './supabase';

export interface QuoteLineItem {
  id: string;
  size: '100mm' | '150mm';
  meters: number;
  junctions: number;
  total: number;
}

export interface QuoteExtraItem {
  id: string;
  note: string;
  amount: number;
}

export interface QuoteData {
  id?: string;
  job_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  job_address: string;
  job_description?: string;
  technician_name: string;
  scope_of_works: string;
  
  // Line items
  pipe_lines: QuoteLineItem[];
  
  // Digging
  digging_enabled: boolean;
  digging_hours: number;
  digging_total: number;
  
  // Extras
  extras: QuoteExtraItem[];
  
  // Totals
  setup_cost: number;
  pipe_work_total: number;
  subtotal: number;
  gst: number;
  grand_total: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export async function saveQuote(quoteData: QuoteData): Promise<{ id: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        job_number: quoteData.job_number,
        customer_name: quoteData.customer_name,
        customer_email: quoteData.customer_email,
        customer_phone: quoteData.customer_phone,
        customer_address: quoteData.customer_address,
        job_address: quoteData.job_address,
        job_description: quoteData.job_description,
        technician_name: quoteData.technician_name,
        scope_of_works: quoteData.scope_of_works,
        pipe_lines: quoteData.pipe_lines,
        digging_enabled: quoteData.digging_enabled,
        digging_hours: quoteData.digging_hours,
        digging_total: quoteData.digging_total,
        extras: quoteData.extras,
        setup_cost: quoteData.setup_cost,
        pipe_work_total: quoteData.pipe_work_total,
        subtotal: quoteData.subtotal,
        gst: quoteData.gst,
        grand_total: quoteData.grand_total,
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { id: '', error: error.message };
    }

    return { id: data.id };
  } catch (err) {
    console.error('Save quote error:', err);
    return { id: '', error: err instanceof Error ? err.message : 'Failed to save quote' };
  }
}

export async function getQuote(id: string): Promise<{ data: QuoteData | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { data: null, error: error.message };
    }

    return { data: data as QuoteData };
  } catch (err) {
    console.error('Get quote error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch quote' };
  }
}

export async function listQuotes(): Promise<{ data: QuoteData[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return { data: [], error: error.message };
    }

    return { data: data as QuoteData[] };
  } catch (err) {
    console.error('List quotes error:', err);
    return { data: [], error: err instanceof Error ? err.message : 'Failed to list quotes' };
  }
}
