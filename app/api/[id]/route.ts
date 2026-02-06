import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await getQuote(id);

    if (error || !data) {
      return NextResponse.json(
        { error: error || 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Get quote API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch quote' 
      },
      { status: 500 }
    );
  }
}
