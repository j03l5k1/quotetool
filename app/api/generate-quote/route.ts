import { NextRequest, NextResponse } from "next/server";
import { saveQuote, QuoteData } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const quoteData: QuoteData = await request.json();

    // Validate required fields
    if (!quoteData.job_number || !quoteData.customer_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!quoteData.payload) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    // Save to viewer (MVP)
    const { id, publicUrl, error } = await saveQuote(quoteData);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id,
      publicUrl,
      message: "Quote published successfully",
    });
  } catch (error) {
    console.error("Save quote API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save quote" },
      { status: 500 }
    );
  }
}
