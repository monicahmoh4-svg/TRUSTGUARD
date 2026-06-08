// components/views/Dashboard.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, ScoreRing, RiskBar, AlertItem, Badge, LiveDot, Button } from '@/components/ui/index';
import { formatDistanceToNow } from 'date-fns';

const METRIC_CARDS = [
  { key: 'threats', label: 'Threats Blocked', sub: 'Last 24 hours', color: 'var(--red)', base: 247 },
  { key: 'suspicious', label: 'Suspicious Wallets', sub: 'Flagged for review', color: 'var(--amber)', base: 1834 },
  { key: 'scanned', label: 'Wallets Scanned', sub: 'All time', color: 'var(--green)', base: 48291 },
  { key: 'saved', label: 'Funds Protected', sub: 'Estimated USD', color: 'var(--blue)', base: 2800000 },
];

const LIVE_TXS = [
  { addr: '0x742d35Cc6634C0532925a3b8D4C9C1', amount: '-248.5 ETH', score: 87, type: 'danger' },
  { addr: '0xdead6f2b9Dc5E3c9C34A3B901F7bEEF', amount: '+0.001 ETH', score: 12, type: 'safe' },
  { addr: '0x1f9a4c38A82bD7D2399DC0b1Fd9cc04', amount: '-12.3 USDC', score: 34, type: 'safe' },
  { addr: '0xAbad1c0fFee4D3A9B12C57f89991234', amount: '+500 ETH', score: 72, type: 'warning' },
  { addr: '0x5c92f4B1E7Ab23C4D1A0F8b3E39a14a', amount: '-1000 DAI', score: 91, type: 'danger' },
  { addr: '0x8e77cAb12F45D7B1e4A3B8C912abc12', amount: '+2.4 ETH', score: 19, type: 'safe' },
];

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString();
}

export default function Dashboard() {
  const { alerts, setAlerts } = useAppStore();
  const [metrics, setMetrics] = useState({ threats: 247, suspicious: 1834, scanned: 48291, saved: 2800000 });
  const [txFeed, setTxFeed] = useState(LIVE_TXS);
  const [riskScores] = useState({ total: 55, behavioral: 42, contract: 71, social: 28, identity: 61 });

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (_) {}
  }, [setAlerts]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sample = LIVE_TXS[Math.floor(Math.random() * LIVE_TXS.length)];
      const newTx = {
        ...sample,
        addr: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
      };
      setTxFeed((prev) => [newTx, ...prev].slice(0, 8));
      setMetrics((m) => ({ ...m, scanned: m.scanned + 1 }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scoreColor = riskScores.total >= 65 ? 'var(--red)' : riskScores.total >= 35 ? 'var(--amber)' : 'var(--green)';
  const scoreLabel = riskScores.total >= 65 ? 'DANGEROUS' : riskScores.total >= 35 ? 'SUSPICIOUS' : 'SAFE';

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold mb-0.5">Threat Overview</h1>
          <p className="text-[12px] text-[var(--text-2)]">Real-time fraud detection across all intelligence layers</p>
        </div>
        <Button variant="ghost" onClick={fetchAlerts} size="sm">↻ Refresh</Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {METRIC_CARDS.map((m) => (
          <Card key={m.key} accentColor={m.color}>
            <div className="text-[26px] font-bold font-mono-custom leading-none mb-1" style={{ color: m.color }}>
              {m.key === 'saved' ? `$${fmtAmount(metrics[m.key as keyof typeof metrics])}` : metrics[m.key as keyof typeof metrics].toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-[0.3px]">{m.label}</div>
            <div className="text-[11px] text-[var(--text-3)]">{m.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Risk Score Engine</CardTitle>
            <Badge variant={riskScores.total >= 65 ? 'danger' : riskScores.total >= 35 ? 'warning' : 'safe'}>
              {scoreLabel}
            </Badge>
          </CardHeader>
          <ScoreRing score={riskScores.total} label="System Risk" />
          <div className="px-1">
            <RiskBar label="Behavioral (35%)" value={riskScores.behavioral} color="var(--amber)" />
            <RiskBar label="Contract Risk (30%)" value={riskScores.contract} color="var(--red)" />
            <RiskBar label="Social Risk (20%)" value={riskScores.social} color="var(--green)" />
            <RiskBar label="Identity Risk (15%)" value={riskScores.identity} color="var(--amber)" />
          </div>
          <div className="mt-3 p-2 bg-[var(--bg-3)] rounded-[6px] text-[11px] text-[var(--text-3)]">
            Fused Score = 0.35×Behavioral + 0.30×Contract + 0.20×Social + 0.15×Identity
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Transaction Feed</CardTitle>
            <LiveDot />
          </CardHeader>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {txFeed.map((tx, i) => {
              const sc = tx.type === 'danger' ? 'var(--red)' : tx.type === 'warning' ? 'var(--amber)' : 'var(--green)';
              return (
                <div key={i} className="flex items-center gap-2 p-2 bg-[var(--bg-3)] rounded-[6px] text-[12px] border border-transparent hover:border-[var(--border-2)] transition-all cursor-pointer animate-slide-in">
                  <div className="font-mono-custom text-[var(--text-2)] flex-1 truncate text-[11px]">{tx.addr}</div>
                  <div className="font-semibold font-mono-custom flex-shrink-0" style={{ color: tx.amount.startsWith('-') ? 'var(--red)' : 'var(--green)' }}>{tx.amount}</div>
                  <div className="w-9 h-5 rounded flex items-center justify-center text-[11px] font-bold font-mono-custom flex-shrink-0" style={{ background: `${sc}22`, color: sc }}>{tx.score}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <span className="text-[11px] text-[var(--text-3)]">{alerts.length} total</span>
        </CardHeader>
        {alerts.slice(0, 4).map((a) => (
          <AlertItem key={a.id} type={a.type} title={a.title} description={a.description}
            time={formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
            source={a.source} riskScore={a.riskScore} />
        ))}
        {alerts.length === 0 && (
          <div className="text-[12px] text-[var(--text-3)] py-4 text-center">No alerts yet. Fetching...</div>
        )}
      </Card>
    </div>
  );
}
