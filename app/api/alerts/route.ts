// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// In-memory alert store (in production, use Redis or a database)
const alertStore: Alert[] = [];

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'safe';
  title: string;
  description: string;
  address?: string;
  chain?: string;
  timestamp: string;
  source: 'behavioral' | 'contract' | 'social' | 'identity' | 'system';
  riskScore?: number;
}

// Seed with some system-generated alerts on first load
function seedAlerts() {
  if (alertStore.length > 0) return;
  const now = Date.now();
  alertStore.push(
    {
      id: 'sys-1',
      type: 'danger',
      title: 'High-Risk Contract Deployment Detected',
      description: 'New unverified contract with mint authority deployed on ETH mainnet. Owner retains full control. Classic rug pull setup detected by behavioral engine.',
      chain: 'eth',
      timestamp: new Date(now - 120000).toISOString(),
      source: 'contract',
      riskScore: 89,
    },
    {
      id: 'sys-2',
      type: 'warning',
      title: 'Suspicious Wallet Cluster Active',
      description: 'Identity graph detected 12 wallets sharing behavioral patterns moving funds in coordinated fashion. Possible Sybil attack on airdrop protocol.',
      chain: 'eth',
      timestamp: new Date(now - 480000).toISOString(),
      source: 'identity',
      riskScore: 67,
    },
    {
      id: 'sys-3',
      type: 'danger',
      title: 'Phishing Campaign Detected',
      description: 'NLP engine identified high-confidence phishing campaign (94%) targeting DeFi users via Telegram. Fake "SafeYield" airdrop with cloned UI.',
      timestamp: new Date(now - 900000).toISOString(),
      source: 'social',
      riskScore: 94,
    },
    {
      id: 'sys-4',
      type: 'safe',
      title: 'Contract Security Verification Complete',
      description: 'USDC ERC-20 contract passed all 47 security checks. Verified, audited, liquidity confirmed locked. No privilege escalation vectors found.',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chain: 'eth',
      timestamp: new Date(now - 1320000).toISOString(),
      source: 'contract',
      riskScore: 4,
    },
    {
      id: 'sys-5',
      type: 'warning',
      title: 'MEV Bot Activity Spike',
      description: 'Behavioral engine detected 340% increase in MEV sandwich attacks on Uniswap V3 pairs in last 2 hours. Avoid large swaps without slippage protection.',
      chain: 'eth',
      timestamp: new Date(now - 2400000).toISOString(),
      source: 'behavioral',
      riskScore: 58,
    },
  );
}

export async function GET() {
  seedAlerts();
  return NextResponse.json({
    alerts: alertStore.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    count: alertStore.length,
    dangerous: alertStore.filter(a => a.type === 'danger').length,
  });
}

export async function POST(req: NextRequest) {
  try {
    seedAlerts();
    const body = await req.json();
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: body.type || 'info',
      title: body.title,
      description: body.description,
      address: body.address,
      chain: body.chain,
      timestamp: new Date().toISOString(),
      source: body.source || 'system',
      riskScore: body.riskScore,
    };
    alertStore.unshift(alert);
    // Keep only last 50
    if (alertStore.length > 50) alertStore.splice(50);
    return NextResponse.json({ alert, success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}
