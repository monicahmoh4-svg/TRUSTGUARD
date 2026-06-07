// app/api/contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getContractData, getTokenMetrics } from '@/lib/blockchain';
import { buildContractRiskReport } from '@/lib/riskEngine';
import { analyzeContract } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { address, chain = 'eth' } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 });
    }
    if (!process.env.ETHERSCAN_API_KEY) {
      return NextResponse.json({ error: 'ETHERSCAN_API_KEY not configured' }, { status: 500 });
    }

    // Fetch contract data and token metrics in parallel
    const [contractData, tokenMetrics] = await Promise.all([
      getContractData(address, chain),
      getTokenMetrics(address, chain),
    ]);

    const topHolderPct = tokenMetrics.topHolders.length > 0 && tokenMetrics.totalSupply
      ? (parseFloat(tokenMetrics.topHolders[0].quantity) / parseFloat(tokenMetrics.totalSupply)) * 100
      : undefined;

    // Run risk scoring
    const riskScore = buildContractRiskReport(contractData, {
      totalSupply: tokenMetrics.totalSupply,
      holderCount: tokenMetrics.holderCount,
      topHolders: tokenMetrics.topHolders,
    });

    // AI analysis
    const aiAnalysis = await analyzeContract({
      address,
      chain,
      contractData: {
        name: contractData.name,
        isVerified: contractData.isVerified,
        compiler: contractData.compiler,
        deployedAt: contractData.deployedAt,
        isProxy: contractData.isProxy,
        sourceCodeSnippet: contractData.sourceCode,
        creator: contractData.creator,
      },
      riskData: {
        total: riskScore.total,
        contract: riskScore.contract,
        label: riskScore.label,
        signals: riskScore.signals,
      },
      tokenMetrics: {
        totalSupply: tokenMetrics.totalSupply,
        holderCount: tokenMetrics.holderCount,
        topHolderPct,
      },
    });

    return NextResponse.json({
      address,
      chain,
      riskScore,
      contract: {
        name: contractData.name,
        isVerified: contractData.isVerified,
        compiler: contractData.compiler,
        deployedAt: contractData.deployedAt,
        isProxy: contractData.isProxy,
        creator: contractData.creator,
        creationTx: contractData.creationTx,
      },
      tokenMetrics: {
        totalSupply: tokenMetrics.totalSupply,
        holderCount: tokenMetrics.holderCount,
        topHolders: tokenMetrics.topHolders,
        topHolderPct,
      },
      aiAnalysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Contract analyze error:', error);
    const message = error instanceof Error ? error.message : 'Contract analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
