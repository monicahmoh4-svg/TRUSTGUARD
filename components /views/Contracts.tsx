// components/views/Contracts.tsx
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, SectionHeader, Input, Button, ScoreRing, ScanBar, SignalItem, Badge, Spinner, EmptyState } from '@/components/ui/index';
import { formatDistanceToNow } from 'date-fns';

const SAMPLES = [
  { label: 'USDC (safe)', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { label: 'Uniswap V2', addr: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' },
  { label: 'SHIB Token', addr: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' },
  { label: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
];

interface ContractResult {
  address: string; chain: string;
  riskScore: { total: number; contract: number; label: string; confidence: number; signals: Array<{ type: string; category: string; message: string }>; recommendation: string };
  contract: { name?: string; isVerified: boolean; compiler?: string; deployedAt?: string; isProxy?: boolean; creator?: string; creationTx?: string };
  tokenMetrics: { totalSupply?: string | null; holderCount?: number | null; topHolders?: Array<{ address: string; quantity: string }>; topHolderPct?: number };
  aiAnalysis: { summary: string; verdict: string; criticalRisks: string[]; warnings: string[]; positiveSignals: string[]; recommendation: string };
}

export default function Contracts() {
  const { activeChain } = useAppStore();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractResult | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!address.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/contract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chain: activeChain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed'); }
    finally { setLoading(false); }
  };

  const score = result?.riskScore;
  const ai = result?.aiAnalysis;
  const scoreColor = score ? score.total >= 65 ? 'var(--red)' : score.total >= 35 ? 'var(--amber)' : 'var(--green)' : 'var(--green)';

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Smart Contract Risk Analyzer" subtitle="Detect rug pulls, honeypots, ownership risks, and exploit vectors using real on-chain data" />
      <div className="flex gap-2 mb-3">
        <Input value={address} onChange={setAddress} onKeyDown={(e) => e.key === 'Enter' && analyze()} placeholder="Enter contract address (0x...)" mono />
        <Button onClick={analyze} disabled={loading || !address.trim()}>
          {loading ? <><Spinner /> Analyzing...</> : '📄 Analyze Contract'}
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {SAMPLES.map((s) => <Button key={s.addr} variant="ghost" size="sm" onClick={() => setAddress(s.addr)}>{s.label}</Button>)}
      </div>
      <ScanBar visible={loading} />
      {error && <div className="p-3 rounded-[6px] bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.3)] text-[var(--red)] text-[13px] mb-4">⚠ {error}</div>}
      {result && score && ai && (
        <div className="animate-slide-in space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Verdict</CardTitle></CardHeader>
              <div className="text-center py-4">
                <div className="text-[40px] font-bold font-mono-custom" style={{ color: scoreColor }}>{score.total}</div>
                <div className="text-[11px] text-[var(--text-2)] uppercase tracking-wide mb-3">Risk Score</div>
                <div className="inline-block px-4 py-1.5 rounded-full font-bold text-[13px] tracking-wider" style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}44` }}>{ai.verdict}</div>
                <div className="mt-3 text-[11px] text-[var(--text-3)]">Confidence: {score.confidence}%</div>
              </div>
            </Card>
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Contract Summary</CardTitle>
                <Badge variant={result.contract.isVerified ? 'safe' : 'danger'}>{result.contract.isVerified ? '✓ Verified' : '✗ Unverified'}</Badge>
              </CardHeader>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed mb-3">{ai.summary}</p>
              <div className="p-2.5 rounded-[6px] text-[12px] font-medium mb-3" style={{ background: `${scoreColor}11`, color: scoreColor }}>→ {ai.recommendation}</div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                {[
                  { label: 'Name', value: result.contract.name || 'Unknown' },
                  { label: 'Compiler', value: result.contract.compiler?.slice(0, 12) || 'Unknown' },
                  { label: 'Deployed', value: result.contract.deployedAt ? formatDistanceToNow(new Date(result.contract.deployedAt), { addSuffix: true }) : 'Unknown' },
                  { label: 'Creator', value: result.contract.creator ? result.contract.creator.slice(0, 10) + '...' : 'Unknown' },
                  { label: 'Proxy', value: result.contract.isProxy ? 'Yes (upgradeable)' : 'No' },
                  { label: 'Supply', value: result.tokenMetrics.totalSupply ? Number(result.tokenMetrics.totalSupply).toLocaleString() : 'N/A' },
                ].map((row) => (
                  <div key={row.label} className="bg-[var(--bg-3)] rounded p-2">
                    <div className="text-[var(--text-3)] mb-0.5">{row.label}</div>
                    <div className="font-mono-custom text-[var(--text-2)] truncate">{row.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {ai.criticalRisks.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Critical Risks</CardTitle><Badge variant="danger">{ai.criticalRisks.length}</Badge></CardHeader>
                {ai.criticalRisks.map((r, i) => <div key={i} className="flex gap-2 py-2 border-b border-[var(--border)] last:border-0 text-[12px]"><span className="text-[var(--red)] flex-shrink-0">▲</span><span className="text-[var(--text-2)]">{r}</span></div>)}
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Warnings</CardTitle><Badge variant="warning">{ai.warnings.length}</Badge></CardHeader>
              {ai.warnings.length === 0 ? <p className="text-[12px] text-[var(--text-3)]">No warnings</p> :
                ai.warnings.map((w, i) => <div key={i} className="flex gap-2 py-2 border-b border-[var(--border)] last:border-0 text-[12px]"><span className="text-[var(--amber)] flex-shrink-0">●</span><span className="text-[var(--text-2)]">{w}</span></div>)}
            </Card>
            <Card>
              <CardHeader><CardTitle>Trust Signals</CardTitle><Badge variant="safe">{ai.positiveSignals.length}</Badge></CardHeader>
              {ai.positiveSignals.length === 0 ? <p className="text-[12px] text-[var(--text-3)]">No positive signals found</p> :
                ai.positiveSignals.map((p, i) => <div key={i} className="flex gap-2 py-2 border-b border-[var(--border)] last:border-0 text-[12px]"><span className="text-[var(--green)] flex-shrink-0">✓</span><span className="text-[var(--text-2)]">{p}</span></div>)}
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>All Risk Engine Signals ({score.signals.length})</CardTitle></CardHeader>
            <div className="max-h-[240px] overflow-y-auto">
              {score.signals.map((s, i) => <SignalItem key={i} type={s.type} category={s.category} message={s.message} />)}
            </div>
          </Card>
        </div>
      )}
      {!result && !loading && !error && <EmptyState icon="📄" title="Enter a contract address" description="Paste any ERC-20, DeFi, or NFT contract address to get an instant security audit" />}
    </div>
  );
}
