// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chatWithAnalyst } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await chatWithAnalyst(message, history);

    return NextResponse.json({ response, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
