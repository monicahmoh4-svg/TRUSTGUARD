// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWalletData, resolveAddress } from '@/lib/blockchain';
import { buildWalletRiskReport } from '@/lib/riskEngine';
import { analyzeWallet } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { address: rawAddress, chain = 'eth' } = await req.json();

    if (!rawAddress) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    if (!process.env.ETHERSCAN_API_KEY) {
      return NextResponse.json({ error: 'ETHERSCAN_API_KEY not configured' }, { status: 500 });
    }

    // Resolve ENS or validate address
    const address = await resolveAddress(rawAddress.trim(), chain);

    if (!/^0x[0-9a-fA-F]{40}$/.test(address) && !rawAddress.endsWith('.eth')) {
      return NextResponse.json({ error: 'Invalid Ethereum address or ENS name' }, { status: 400 });
    }

    // Fetch real blockchain data
    const walletData = await getWalletData(address || rawAddress, chain);

    // Run risk scoring engine
    const riskScore = buildWalletRiskReport(walletData);

    // Run AI analysis
    const aiAnalysis = await analyzeWallet({
      address: walletData.address,
      chain,
      riskData: {
        total: riskScore.total,
        behavioral: riskScore.behavioral,
        contract: riskScore.contract,
        social: riskScore.social,
        identity: riskScore.identity,
        label: riskScore.label,
        signals: riskScore.signals,
      },
      walletSummary: {
        balance: walletData.balance,
        balanceUSD: walletData.balanceUSD,
        txCount: walletData.txCount,
        firstSeen: walletData.firstSeen,
        lastActive: walletData.lastActive,
        tokenCount: walletData.tokenHoldings.length,
        isContract: walletData.isContract,
      },
    });

    return NextResponse.json({
      address: walletData.address,
      chain,
      riskScore,
      wallet: {
        balance: walletData.balance,
        balanceUSD: walletData.balanceUSD,
        txCount: walletData.txCount,
        firstSeen: walletData.firstSeen,
        lastActive: walletData.lastActive,
        tokenHoldings: walletData.tokenHoldings.slice(0, 10),
        isContract: walletData.isContract,
        recentTransactions: walletData.transactions.slice(0, 10),
      },
      aiAnalysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analyze error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
