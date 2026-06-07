// app/api/social/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSocialContent } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length < 10) {
      return NextResponse.json({ error: 'Content too short for analysis' }, { status: 400 });
    }

    const analysis = await analyzeSocialContent(content);

    // Compute social risk score from verdict
    const verdictScores: Record<string, number> = {
      PHISHING: 95,
      SCAM: 85,
      SUSPICIOUS: 55,
      LEGITIMATE: 10,
      UNKNOWN: 40,
    };
    const socialScore = verdictScores[analysis.verdict] || 40;

    return NextResponse.json({
      ...analysis,
      socialScore,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Social analysis error:', error);
    const message = error instanceof Error ? error.message : 'Social analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
