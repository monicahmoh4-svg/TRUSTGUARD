// app/api/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWalletData } from '@/lib/blockchain';
import { buildWalletRiskReport } from '@/lib/riskEngine';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { address, chain = 'eth' } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const walletData = await getWalletData(address, chain);
    const riskScore = buildWalletRiskReport(walletData);

    // Get ETH price
    let ethPrice = 3500;
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { next: { revalidate: 60 } });
      const data = await res.json();
      ethPrice = data?.ethereum?.usd || 3500;
    } catch (_) {}

    // AI portfolio security report
    const tokenList = walletData.tokenHoldings.slice(0, 10).map(t => `${t.symbol} (${t.balance})`).join(', ');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Generate a portfolio security report for wallet ${address} on ${chain.toUpperCase()}:

Portfolio: ${walletData.balance} ETH (~$${(parseFloat(walletData.balance) * ethPrice).toFixed(0)} USD)
Tokens: ${tokenList || 'None detected'}
Risk Score: ${riskScore.total}/100 (${riskScore.label})
Transaction Count: ${walletData.txCount}
Active Since: ${walletData.firstSeen}

Cover: (1) Overall portfolio security posture, (2) Riskiest token exposures, (3) Recommended protective actions, (4) Monitoring priorities.

Be specific and actionable in 3-4 sentences.`,
      }],
    });

    const aiReport = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      address,
      chain,
      portfolio: {
        ethBalance: walletData.balance,
        ethBalanceUSD: parseFloat(walletData.balance) * ethPrice,
        tokenHoldings: walletData.tokenHoldings,
        totalTokens: walletData.tokenHoldings.length,
        txCount: walletData.txCount,
        firstSeen: walletData.firstSeen,
        lastActive: walletData.lastActive,
      },
      riskScore,
      aiReport,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Portfolio error:', error);
    const message = error instanceof Error ? error.message : 'Portfolio analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
