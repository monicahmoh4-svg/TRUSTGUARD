// components/views/Scanner.tsx
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Card, CardHeader, CardTitle, SectionHeader, Input, Button,
  ScoreRing, RiskBar, ScanBar, SignalItem, Badge, Spinner, EmptyState,
} from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

const SAMPLES = [
  { label: 'High-risk wallet', addr: '0x742d35Cc6634C0532925a3b8D4C9C1B5ab9e2f8a' },
  { label: 'USDC Contract', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { label: 'Binance Hot Wallet', addr: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE' },
  { label: 'Uniswap V2 Router', addr: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
];

interface ScanResult {
  address: string;
  chain: string;
  riskScore: {
    total: number;
    behavioral: number;
    contract: number;
    social: number;
    identity: number;
    label: string;
    confidence: number;
    signals: Array<{ type: string; category: string; message: string }>;
    recommendation: string;
  };
  wallet: {
    balance: string;
    balanceUSD: number;
    txCount: number;
    firstSeen: string;
    lastActive: string;
    tokenHoldings: Array<{ symbol: string; balance: string; contractAddress: string }>;
    isContract: boolean;
    recentTransactions: Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      valueUSD: number;
      timestamp: number;
      isError: boolean;
    }>;
  };
  aiAnalysis: string;
  timestamp: string;
}

export default function Scanner() {
  const { activeChain } = useAppStore();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'tokens'>('overview');

  const runScan = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chain: activeChain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const score = result?.riskScore;
  const scoreColor = score
    ? score.total >= 65 ? 'var(--red)' : score.total >= 35 ? 'var(--amber)' : 'var(--green)'
    : 'var(--green)';
  const badgeVariant = score
    ? score.total >= 65 ? 'danger' : score.total >= 35 ? 'warning' : 'safe'
    : 'default';

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Wallet & Address Scanner"
        subtitle="Real-time fraud detection using live blockchain data + AI analysis"
      />

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <Input
          value={address}
          onChange={setAddress}
          onKeyDown={(e) => e.key === 'Enter' && runScan()}
          placeholder="Enter wallet address (0x...) or ENS name"
          mono
          className="flex-1"
        />
        <Button onClick={runScan} disabled={loading || !address.trim()}>
          {loading ? <><Spinner /> Scanning...</> : '🔍 Analyze'}
        </Button>
      </div>

      {/* Sample addresses */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SAMPLES.map((s) => (
          <Button key={s.addr} variant="ghost" size="sm" onClick={() => { setAddress(s.addr); }}>
            {s.label}
          </Button>
        ))}
      </div>

      <ScanBar visible={loading} />

      {error && (
        <div className="p-3 rounded-[6px] bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.3)] text-[var(--red)] text-[13px] mb-4">
          ⚠ {error}
          {error.includes('API_KEY') && (
            <div className="text-[11px] mt-1 text-[var(--red)]/70">
              Add ETHERSCAN_API_KEY and ANTHROPIC_API_KEY to your .env.local file
            </div>
          )}
        </div>
      )}

      {result && score && (
        <div className="animate-slide-in">
          {/* Top cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <Badge variant={badgeVariant as 'danger' | 'warning' | 'safe'}>{score.label}</Badge>
              </CardHeader>
              <ScoreRing score={score.total} label="Risk Score" />
              <div className="px-1">
                <RiskBar label="Behavioral" value={score.behavioral} color={score.behavioral >= 65 ? 'var(--red)' : score.behavioral >= 35 ? 'var(--amber)' : 'var(--green)'} />
                <RiskBar label="Contract" value={score.contract} color={score.contract >= 65 ? 'var(--red)' : score.contract >= 35 ? 'var(--amber)' : 'var(--green)'} />
                <RiskBar label="Social" value={score.social} color={score.social >= 65 ? 'var(--red)' : score.social >= 35 ? 'var(--amber)' : 'var(--green)'} />
                <RiskBar label="Identity" value={score.identity} color={score.identity >= 65 ? 'var(--red)' : score.identity >= 35 ? 'var(--amber)' : 'var(--green)'} />
              </div>
              <div className="mt-3 p-2.5 rounded-[6px] text-[12px] font-medium" style={{ background: `${scoreColor}11`, color: scoreColor }}>
                {score.recommendation}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>AI Security Analysis</CardTitle></CardHeader>
              <div
                className="ai-prose text-[13px] text-[var(--text-2)] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: result.aiAnalysis.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>'),
                }}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-[var(--bg-3)] rounded-[6px] p-2.5 text-center">
                  <div className="text-[16px] font-bold font-mono-custom text-[var(--text)]">
                    {result.wallet.balance} ETH
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] mt-0.5">
                    ~${result.wallet.balanceUSD.toFixed(0)} USD
                  </div>
                </div>
                <div className="bg-[var(--bg-3)] rounded-[6px] p-2.5 text-center">
                  <div className="text-[16px] font-bold font-mono-custom text-[var(--text)]">
                    {result.wallet.txCount}
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] mt-0.5">Transactions</div>
                </div>
                <div className="bg-[var(--bg-3)] rounded-[6px] p-2.5 text-center">
                  <div className="text-[12px] font-mono-custom text-[var(--text-2)] truncate">
                    {result.wallet.firstSeen !== 'Unknown'
                      ? formatDistanceToNow(new Date(result.wallet.firstSeen), { addSuffix: true })
                      : 'Unknown'}
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] mt-0.5">First seen</div>
                </div>
                <div className="bg-[var(--bg-3)] rounded-[6px] p-2.5 text-center">
                  <div className="text-[16px] font-bold font-mono-custom text-[var(--text)]">
                    {result.wallet.tokenHoldings.length}
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] mt-0.5">Tokens held</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Signals + detail tabs */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Signals ({score.signals.length})</CardTitle>
                <Badge variant="default">Confidence: {score.confidence}%</Badge>
              </CardHeader>
              <div className="max-h-[280px] overflow-y-auto">
                {score.signals.length === 0 ? (
                  <EmptyState icon="✓" title="No risk signals" description="Address shows normal activity patterns" />
                ) : (
                  score.signals.map((s, i) => (
                    <SignalItem key={i} type={s.type} category={s.category} message={s.message} />
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className="flex gap-1 mb-3">
                {(['overview', 'transactions', 'tokens'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded text-[11px] font-medium capitalize transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-[var(--bg-4)] text-[var(--text)]'
                        : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="text-[12px] space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                    <span className="text-[var(--text-3)]">Address</span>
                    <span className="font-mono-custom text-[var(--text-2)] truncate ml-4 max-w-[160px]">{result.address.slice(0, 10)}...{result.address.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                    <span className="text-[var(--text-3)]">Type</span>
                    <span className="text-[var(--text-2)]">{result.wallet.isContract ? 'Smart Contract' : 'EOA Wallet'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                    <span className="text-[var(--text-3)]">Chain</span>
                    <span className="text-[var(--text-2)] uppercase">{result.chain}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                    <span className="text-[var(--text-3)]">Last active</span>
                    <span className="text-[var(--text-2)]">
                      {result.wallet.lastActive !== 'Unknown'
                        ? formatDistanceToNow(new Date(result.wallet.lastActive), { addSuffix: true })
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-3)]">Scanned</span>
                    <span className="text-[var(--text-2)]">{formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {result.wallet.recentTransactions.length === 0 ? (
                    <EmptyState icon="📭" title="No transactions" description="No recent transactions found" />
                  ) : (
                    result.wallet.recentTransactions.map((tx) => (
                      <div key={tx.hash} className="p-2 bg-[var(--bg-3)] rounded text-[11px]">
                        <div className="flex justify-between mb-0.5">
                          <span className="font-mono-custom text-[var(--text-3)]">{tx.hash.slice(0, 12)}...</span>
                          <span className={tx.value === '0.000000' ? 'text-[var(--text-3)]' : tx.from.toLowerCase() === result.address.toLowerCase() ? 'text-[var(--red)]' : 'text-[var(--green)]'}>
                            {tx.value} ETH
                          </span>
                        </div>
                        <div className="text-[var(--text-3)]">{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tokens' && (
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {result.wallet.tokenHoldings.length === 0 ? (
                    <EmptyState icon="🪙" title="No tokens" description="No ERC-20 tokens found" />
                  ) : (
                    result.wallet.tokenHoldings.map((t) => (
                      <div key={t.contractAddress} className="flex justify-between p-2 bg-[var(--bg-3)] rounded text-[12px]">
                        <span className="text-[var(--text)] font-medium">{t.symbol}</span>
                        <span className="font-mono-custom text-[var(--text-2)]">{t.balance}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          icon="🔍"
          title="Ready to scan"
          description="Enter any wallet address or ENS name above to get a real-time AI-powered fraud analysis"
        />
      )}
    </div>
  );
}
