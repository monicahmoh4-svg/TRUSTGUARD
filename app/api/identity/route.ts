// app/api/identity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWalletData } from '@/lib/blockchain';
import { analyzeIdentityGraph } from '@/lib/ai';
import { analyzeIdentity } from '@/lib/riskEngine';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { address, chain = 'eth' } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const walletData = await getWalletData(address, chain);

    // Build connected address list from transaction history
    const allAddresses = [
      ...walletData.transactions.map(tx => tx.from),
      ...walletData.transactions.map(tx => tx.to),
    ].filter(a => a && a.toLowerCase() !== address.toLowerCase());

    const connectedAddresses = Array.from(new Set(allAddresses)).slice(0, 20);

    // Compute tx patterns summary
    const outbound = walletData.transactions.filter(tx => tx.from.toLowerCase() === address.toLowerCase());
    const inbound = walletData.transactions.filter(tx => tx.to.toLowerCase() === address.toLowerCase());
    const txPatterns = `${walletData.txCount} total transactions (${outbound.length} outbound, ${inbound.length} inbound). Balance: ${walletData.balance} ETH. Tokens held: ${walletData.tokenHoldings.length}.`;

    const { score: identityScore, signals } = analyzeIdentity(walletData);

    const aiAnalysis = await analyzeIdentityGraph({
      address,
      chain,
      connectedAddresses,
      txPatterns,
    });

    // Build graph nodes for visualization
    const graphNodes = [
      { id: address, label: address.slice(0, 6) + '...' + address.slice(-4), type: 'target', size: 18 },
      ...connectedAddresses.slice(0, 12).map((addr, i) => ({
        id: addr,
        label: addr.slice(0, 6) + '...' + addr.slice(-4),
        type: i < 3 ? 'high-activity' : i < 7 ? 'normal' : 'low-activity',
        size: i < 3 ? 12 : 8,
      })),
    ];

    const graphEdges = connectedAddresses.slice(0, 12).map(addr => ({
      from: address,
      to: addr,
      weight: walletData.transactions.filter(tx => tx.from === addr || tx.to === addr).length,
    }));

    return NextResponse.json({
      address,
      chain,
      identityScore,
      signals,
      connectedAddresses,
      graphNodes,
      graphEdges,
      stats: {
        totalConnections: connectedAddresses.length,
        flaggedConnections: signals.filter(s => s.type === 'critical').length,
        safeConnections: Math.max(0, connectedAddresses.length - signals.length),
        txCount: walletData.txCount,
      },
      aiAnalysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Identity error:', error);
    const message = error instanceof Error ? error.message : 'Identity analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
