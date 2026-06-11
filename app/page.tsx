'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

type View = 'dashboard' | 'scanner' | 'contracts' | 'social' | 'identity' | 'alerts' | 'portfolio' | 'ai';
type Chain = 'eth' | 'bnb' | 'polygon';

const S = {
  bg: '#0a0c10', bg2: '#111318', bg3: '#181c22', bg4: '#1e232b',
  border: '#2a2f3a', border2: '#3a404d',
  text: '#e8eaf0', text2: '#9aa0b0', text3: '#5a6070',
  green: '#00d68f', green2: '#00a86b', amber: '#f5a623', red: '#ff4d4d', blue: '#4d9fff',
};

function scoreColor(s: number) { return s >= 65 ? S.red : s >= 35 ? S.amber : S.green; }
function scoreLabel(s: number) { return s >= 65 ? 'DANGEROUS' : s >= 35 ? 'SUSPICIOUS' : 'SAFE'; }

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: S.bg2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 16, ...style }}>{children}</div>;
}
function Btn({ children, onClick, disabled, style }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? S.bg4 : S.green2, color: disabled ? S.text3 : '#fff', border: 'none', borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' as const, ...style }}>{children}</button>;
}
function GhostBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return <button onClick={onClick} style={{ background: 'transparent', color: S.text2, border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', ...style }}>{children}</button>;
}
function Inp({ value, onChange, onKeyDown, placeholder, mono }: { value: string; onChange: (v: string) => void; onKeyDown?: (e: React.KeyboardEvent) => void; placeholder?: string; mono?: boolean }) {
  return <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} style={{ flex: 1, background: S.bg2, border: `1px solid ${S.border}`, borderRadius: 6, padding: '9px 13px', color: S.text, fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit', outline: 'none', width: '100%' }} />;
}
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + '22', color, border: `1px solid ${color}44` }}>{children}</span>;
}
function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />;
}
function ScanBar({ on }: { on: boolean }) {
  if (!on) return null;
  return <div style={{ height: 2, background: S.bg3, borderRadius: 1, overflow: 'hidden', margin: '8px 0' }}><div style={{ height: '100%', background: `linear-gradient(90deg,${S.green},${S.blue})`, animation: 'scanbar 1.5s ease-in-out infinite' }} /></div>;
}
function Ring({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r, col = scoreColor(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke={S.bg3} strokeWidth={9} />
          <circle cx={65} cy={65} r={r} fill="none" stroke={col} strokeWidth={9} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: col, fontFamily: 'monospace', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: S.text2, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: 3 }}>Risk Score</div>
        </div>
      </div>
    </div>
  );
}
function RBar({ label, value }: { label: string; value: number }) {
  const col = scoreColor(value);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: S.text2 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: 'monospace' }}>{value}</span>
      </div>
      <div style={{ height: 4, background: S.bg3, borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value}%`, background: col, borderRadius: 2, transition: 'width 0.7s ease' }} />
      </div>
    </div>
  );
}
function Signal({ type, cat, msg }: { type: string; cat: string; msg: string }) {
  const col = type === 'critical' ? S.red : type === 'warning' ? S.amber : type === 'positive' ? S.green : S.blue;
  const icon = type === 'critical' ? '▲' : type === 'warning' ? '●' : type === 'positive' ? '✓' : 'ℹ';
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: `1px solid ${S.border}` }}>
      <span style={{ color: col, fontSize: 11, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div><span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: 'uppercase' as const, marginRight: 6 }}>{cat}</span><span style={{ fontSize: 12, color: S.text2 }}>{msg}</span></div>
    </div>
  );
}
function Empty({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: S.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: S.text2 }}>{desc}</div>
    </div>
  );
}

interface Alert { id: string; type: 'danger' | 'warning' | 'safe' | 'info'; title: string; description: string; timestamp: string; source: string; riskScore?: number; chain?: string; }

function AlertRow({ a }: { a: Alert }) {
  const col = a.type === 'danger' ? S.red : a.type === 'warning' ? S.amber : a.type === 'safe' ? S.green : S.blue;
  const icon = a.type === 'danger' ? '⚠' : a.type === 'warning' ? '⚡' : a.type === 'safe' ? '✓' : 'ℹ';
  const ago = (() => { try { const s = Math.floor((Date.now() - new Date(a.timestamp).getTime()) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`; return `${Math.floor(s / 3600)}h ago`; } catch { return ''; } })();
  return (
    <div style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 6, marginBottom: 6, background: col + '08', borderLeft: `2px solid ${col}` }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
          {a.riskScore !== undefined && <Badge color={col}>{a.riskScore}</Badge>}
        </div>
        <div style={{ fontSize: 12, color: S.text2, lineHeight: 1.5 }}>{a.description}</div>
        <div style={{ fontSize: 10, color: S.text3, marginTop: 3, textTransform: 'uppercase' as const }}>{a.source} engine</div>
      </div>
      <span style={{ fontSize: 10, color: S.text3, fontFamily: 'monospace', flexShrink: 0 }}>{ago}</span>
    </div>
  );
}

const LIVE_TXS = [
  { addr: '0x742d...2f8a', amount: '-248.5 ETH', score: 87 },
  { addr: '0xdead...beef', amount: '+0.001 ETH', score: 12 },
  { addr: '0x1f9a...cc04', amount: '-12.3 USDC', score: 34 },
  { addr: '0xAbad...9991', amount: '+500 ETH', score: 72 },
  { addr: '0x5c92...3a14', amount: '-1000 DAI', score: 91 },
];

function Dashboard({ setAlerts }: { setAlerts: (a: Alert[]) => void }) {
  const [metrics, setMetrics] = useState({ threats: 247, suspicious: 1834, scanned: 48291, saved: 2800000 });
  const [txFeed, setTxFeed] = useState(LIVE_TXS);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try { const r = await fetch('/api/alerts'); const d = await r.json(); if (d.alerts) { setLocalAlerts(d.alerts); setAlerts(d.alerts); } } catch (_) {}
  }, [setAlerts]);

  useEffect(() => { fetchAlerts(); const i = setInterval(fetchAlerts, 30000); return () => clearInterval(i); }, [fetchAlerts]);
  useEffect(() => {
    const i = setInterval(() => {
      const s = LIVE_TXS[Math.floor(Math.random() * LIVE_TXS.length)];
      setTxFeed(p => [{ ...s, addr: '0x' + Math.random().toString(16).slice(2, 8) + '...' + Math.random().toString(16).slice(2, 6) }, ...p].slice(0, 8));
      setMetrics(m => ({ ...m, scanned: m.scanned + 1 }));
    }, 5000);
    return () => clearInterval(i);
  }, []);

  const MCARDS = [
    { label: 'Threats Blocked', val: metrics.threats.toLocaleString(), sub: 'Last 24h', color: S.red },
    { label: 'Suspicious Wallets', val: metrics.suspicious.toLocaleString(), sub: 'Flagged', color: S.amber },
    { label: 'Wallets Scanned', val: metrics.scanned.toLocaleString(), sub: 'All time', color: S.green },
    { label: 'Funds Protected', val: `$${(metrics.saved / 1e6).toFixed(1)}M`, sub: 'Estimated', color: S.blue },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Threat Overview</h1><p style={{ fontSize: 12, color: S.text2 }}>Real-time fraud detection across all intelligence layers</p></div>
        <GhostBtn onClick={fetchAlerts}>↻ Refresh</GhostBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {MCARDS.map(m => (
          <Card key={m.label} style={{ borderTop: `2px solid ${m.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 4 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: S.text3 }}>{m.sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Risk Score Engine</span><Badge color={S.amber}>SUSPICIOUS</Badge></div>
          <Ring score={55} />
          <RBar label="Behavioral (35%)" value={42} /><RBar label="Contract Risk (30%)" value={71} /><RBar label="Social Risk (20%)" value={28} /><RBar label="Identity Risk (15%)" value={61} />
          <div style={{ marginTop: 10, padding: 8, background: S.bg3, borderRadius: 6, fontSize: 11, color: S.text3 }}>Score = 0.35×Behavioral + 0.30×Contract + 0.20×Social + 0.15×Identity</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Live Transaction Feed</span><span style={{ width: 8, height: 8, borderRadius: '50%', background: S.green, display: 'inline-block', animation: 'pulse 2s infinite' }} /></div>
          {txFeed.map((tx, i) => { const col = scoreColor(tx.score); return (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', background: S.bg3, borderRadius: 6, marginBottom: 5, fontSize: 12 }}><span style={{ fontFamily: 'monospace', color: S.text2, flex: 1, fontSize: 11 }}>{tx.addr}</span><span style={{ color: tx.amount.startsWith('-') ? S.red : S.green, fontWeight: 600, fontFamily: 'monospace' }}>{tx.amount}</span><span style={{ background: col + '22', color: col, padding: '2px 6px', borderRadius: 4, fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>{tx.score}</span></div>); })}
        </Card>
      </div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Recent Alerts</span><span style={{ fontSize: 11, color: S.text3 }}>{localAlerts.length} total</span></div>
        {localAlerts.slice(0, 4).map(a => <AlertRow key={a.id} a={a} />)}
        {localAlerts.length === 0 && <div style={{ fontSize: 12, color: S.text3, textAlign: 'center' as const, padding: 16 }}>Loading alerts...</div>}
      </Card>
    </div>
  );
}

function Scanner({ chain }: { chain: Chain }) {
  const [addr, setAddr] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState<any>(null); const [err, setErr] = useState(''); const [tab, setTab] = useState('overview');
  const scan = async () => {
    if (!addr.trim()) return; setLoading(true); setErr(''); setResult(null);
    try { const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr.trim(), chain }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Scan failed'); setResult(d); } catch (e) { setErr(e instanceof Error ? e.message : 'Scan failed'); } finally { setLoading(false); }
  };
  const SAMPLES = [{ label: 'High-risk', addr: '0x742d35Cc6634C0532925a3b8D4C9C1B5ab9e2f8a' }, { label: 'USDC', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }, { label: 'Binance', addr: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE' }, { label: 'Uniswap V2', addr: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' }];
  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Wallet Scanner</h1>
      <p style={{ fontSize: 12, color: S.text2, marginBottom: 14 }}>Real-time fraud detection using live blockchain data + AI analysis</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><Inp value={addr} onChange={setAddr} onKeyDown={e => e.key === 'Enter' && scan()} placeholder="Enter wallet address (0x...) or ENS name" mono /><Btn onClick={scan} disabled={loading || !addr.trim()}>{loading ? <><Spinner /> Scanning...</> : '🔍 Analyze'}</Btn></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{SAMPLES.map(s => <GhostBtn key={s.addr} onClick={() => setAddr(s.addr)}>{s.label}</GhostBtn>)}</div>
      <ScanBar on={loading} />
      {err && <div style={{ padding: 10, background: S.red + '18', border: `1px solid ${S.red}44`, borderRadius: 6, color: S.red, fontSize: 13, marginBottom: 14 }}>⚠ {err}</div>}
      {result && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Risk Assessment</span><Badge color={scoreColor(result.riskScore.total)}>{result.riskScore.label}</Badge></div>
              <Ring score={result.riskScore.total} />
              <RBar label="Behavioral" value={result.riskScore.behavioral} /><RBar label="Contract" value={result.riskScore.contract} /><RBar label="Social" value={result.riskScore.social} /><RBar label="Identity" value={result.riskScore.identity} />
              <div style={{ marginTop: 10, padding: 9, borderRadius: 6, fontSize: 12, fontWeight: 500, background: scoreColor(result.riskScore.total) + '11', color: scoreColor(result.riskScore.total) }}>{result.riskScore.recommendation}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 10 }}>AI Security Analysis</div>
              <div style={{ fontSize: 13, color: S.text2, lineHeight: 1.7, marginBottom: 12 }}>{result.aiAnalysis}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ val: `${result.wallet.balance} ETH`, sub: `~$${result.wallet.balanceUSD?.toFixed(0)} USD` }, { val: result.wallet.txCount, sub: 'Transactions' }, { val: result.wallet.tokenHoldings?.length || 0, sub: 'Tokens held' }, { val: result.wallet.isContract ? 'Contract' : 'EOA', sub: 'Account type' }].map((item, i) => (
                  <div key={i} style={{ background: S.bg3, borderRadius: 6, padding: 10, textAlign: 'center' as const }}><div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: S.text }}>{item.val}</div><div style={{ fontSize: 10, color: S.text3, marginTop: 2 }}>{item.sub}</div></div>
                ))}
              </div>
            </Card>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 10 }}>Detected Signals ({result.riskScore.signals?.length || 0})</div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {(result.riskScore.signals || []).length === 0 ? <Empty icon="✓" title="No risk signals" desc="Normal activity patterns" /> : result.riskScore.signals.map((s: any, i: number) => <Signal key={i} type={s.type} cat={s.category} msg={s.message} />)}
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {['overview', 'transactions', 'tokens'].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none', background: tab === t ? S.bg4 : 'transparent', color: tab === t ? S.text : S.text3, textTransform: 'capitalize' as const }}>{t}</button>)}
              </div>
              {tab === 'overview' && <div style={{ fontSize: 12 }}>{[{ label: 'Address', val: `${result.address?.slice(0, 10)}...${result.address?.slice(-6)}` }, { label: 'Type', val: result.wallet.isContract ? 'Smart Contract' : 'EOA Wallet' }, { label: 'Chain', val: result.chain?.toUpperCase() }, { label: 'First Seen', val: result.wallet.firstSeen !== 'Unknown' ? new Date(result.wallet.firstSeen).toLocaleDateString() : 'Unknown' }].map(row => (<div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${S.border}` }}><span style={{ color: S.text3 }}>{row.label}</span><span style={{ color: S.text2, fontFamily: 'monospace', fontSize: 11 }}>{row.val}</span></div>))}</div>}
              {tab === 'transactions' && <div style={{ maxHeight: 240, overflowY: 'auto' }}>{(result.wallet.recentTransactions || []).length === 0 ? <Empty icon="📭" title="No transactions" desc="None found" /> : result.wallet.recentTransactions.map((tx: any) => (<div key={tx.hash} style={{ padding: 8, background: S.bg3, borderRadius: 5, marginBottom: 5, fontSize: 11 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontFamily: 'monospace', color: S.text3 }}>{tx.hash?.slice(0, 14)}...</span><span style={{ color: tx.from?.toLowerCase() === result.address?.toLowerCase() ? S.red : S.green }}>{tx.value} ETH</span></div><div style={{ color: S.text3, marginTop: 2 }}>{new Date(tx.timestamp).toLocaleString()}</div></div>))}</div>}
              {tab === 'tokens' && <div style={{ maxHeight: 240, overflowY: 'auto' }}>{(result.wallet.tokenHoldings || []).length === 0 ? <Empty icon="🪙" title="No tokens" desc="No ERC-20 tokens found" /> : result.wallet.tokenHoldings.map((t: any) => (<div key={t.contractAddress} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 9px', background: S.bg3, borderRadius: 5, marginBottom: 5, fontSize: 12 }}><span style={{ fontWeight: 600, color: S.text }}>{t.symbol}</span><span style={{ fontFamily: 'monospace', color: S.text2 }}>{t.balance}</span></div>))}</div>}
            </Card>
          </div>
        </div>
      )}
      {!result && !loading && !err && <Empty icon="🔍" title="Ready to scan" desc="Enter any wallet address or ENS name for real-time AI fraud analysis" />}
    </div>
  );
}

function Contracts({ chain }: { chain: Chain }) {
  const [addr, setAddr] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState<any>(null); const [err, setErr] = useState('');
  const analyze = async () => {
    if (!addr.trim()) return; setLoading(true); setErr(''); setResult(null);
    try { const r = await fetch('/api/contract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr.trim(), chain }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); setResult(d); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  };
  const SAMPLES = [{ label: 'USDC (safe)', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }, { label: 'Uniswap V2', addr: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' }, { label: 'SHIB', addr: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' }, { label: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }];
  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Smart Contract Risk Analyzer</h1>
      <p style={{ fontSize: 12, color: S.text2, marginBottom: 14 }}>Detect rug pulls, honeypots, and exploit vectors using real on-chain data</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><Inp value={addr} onChange={setAddr} onKeyDown={e => e.key === 'Enter' && analyze()} placeholder="Enter contract address (0x...)" mono /><Btn onClick={analyze} disabled={loading || !addr.trim()}>{loading ? <><Spinner /> Analyzing...</> : '📄 Analyze Contract'}</Btn></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>{SAMPLES.map(s => <GhostBtn key={s.addr} onClick={() => setAddr(s.addr)}>{s.label}</GhostBtn>)}</div>
      <ScanBar on={loading} />
      {err && <div style={{ padding: 10, background: S.red + '18', border: `1px solid ${S.red}44`, borderRadius: 6, color: S.red, fontSize: 13, marginBottom: 14 }}>⚠ {err}</div>}
      {result && result.aiAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <Card>
              <div style={{ textAlign: 'center' as const, padding: '16px 0' }}>
                <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'monospace', color: scoreColor(result.riskScore.total) }}>{result.riskScore.total}</div>
                <div style={{ fontSize: 11, color: S.text2, textTransform: 'uppercase' as const, letterSpacing: 1, margin: '4px 0 12px' }}>Risk Score</div>
                <Badge color={scoreColor(result.riskScore.total)}>{result.aiAnalysis.verdict}</Badge>
                <div style={{ marginTop: 10, fontSize: 11, color: S.text3 }}>Confidence: {result.riskScore.confidence}%</div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Summary</span><Badge color={result.contract.isVerified ? S.green : S.red}>{result.contract.isVerified ? '✓ Verified' : '✗ Unverified'}</Badge></div>
              <p style={{ fontSize: 13, color: S.text2, lineHeight: 1.7, marginBottom: 10 }}>{result.aiAnalysis.summary}</p>
              <div style={{ padding: 9, borderRadius: 6, fontSize: 12, fontWeight: 500, background: scoreColor(result.riskScore.total) + '11', color: scoreColor(result.riskScore.total) }}>→ {result.aiAnalysis.recommendation}</div>
            </Card>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {result.aiAnalysis.criticalRisks?.length > 0 && <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.red, textTransform: 'uppercase' as const, marginBottom: 10 }}>Critical Risks</div>{result.aiAnalysis.criticalRisks.map((r: string, i: number) => <div key={i} style={{ display: 'flex', gap: 7, padding: '6px 0', borderBottom: `1px solid ${S.border}`, fontSize: 12 }}><span style={{ color: S.red }}>▲</span><span style={{ color: S.text2 }}>{r}</span></div>)}</Card>}
            <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.amber, textTransform: 'uppercase' as const, marginBottom: 10 }}>Warnings</div>{(result.aiAnalysis.warnings || []).map((w: string, i: number) => <div key={i} style={{ display: 'flex', gap: 7, padding: '6px 0', borderBottom: `1px solid ${S.border}`, fontSize: 12 }}><span style={{ color: S.amber }}>●</span><span style={{ color: S.text2 }}>{w}</span></div>)}{(result.aiAnalysis.warnings || []).length === 0 && <p style={{ fontSize: 12, color: S.text3 }}>No warnings</p>}</Card>
            <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.green, textTransform: 'uppercase' as const, marginBottom: 10 }}>Trust Signals</div>{(result.aiAnalysis.positiveSignals || []).map((p: string, i: number) => <div key={i} style={{ display: 'flex', gap: 7, padding: '6px 0', borderBottom: `1px solid ${S.border}`, fontSize: 12 }}><span style={{ color: S.green }}>✓</span><span style={{ color: S.text2 }}>{p}</span></div>)}{(result.aiAnalysis.positiveSignals || []).length === 0 && <p style={{ fontSize: 12, color: S.text3 }}>No positive signals</p>}</Card>
          </div>
        </div>
      )}
      {!result && !loading && !err && <Empty icon="📄" title="Enter a contract address" desc="Get an instant AI-powered security audit of any smart contract" />}
    </div>
  );
}

const THREATS = [
  { platform: 'Telegram • @CryptoAlerts', text: '🚀 URGENT: MoonFloki airdrop ending in 1 hour! Connect wallet at moonfloki-airdrop[.]xyz — 10,000 tokens FREE!', confidence: 96, type: 'PHISHING' },
  { platform: 'X (Twitter)', text: '"SafeSwap" promising 1000% APY. Dev wallet holds 78% of supply. Join presale now!', confidence: 74, type: 'SCAM' },
  { platform: 'Discord • NovaCoin', text: 'We are being targeted by FUD. Our contract is SAFU. Buy the dip! Limited 2x bonus.', confidence: 61, type: 'SUSPICIOUS' },
  { platform: 'Telegram • AirdropHunters', text: 'Verified USDC airdrop — claim $500 at usdc-official-claim[.]net before midnight!', confidence: 99, type: 'PHISHING' },
];

function Social() {
  const [content, setContent] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState<any>(null); const [err, setErr] = useState('');
  const analyze = async () => {
    if (content.length < 10) return; setLoading(true); setErr(''); setResult(null);
    try { const r = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); setResult(d); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  };
  const vcol = (v: string) => (({ PHISHING: S.red, SCAM: S.red, SUSPICIOUS: S.amber, LEGITIMATE: S.green, UNKNOWN: S.blue } as Record<string,string>)[v] || S.blue);
  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Social Threat Intelligence</h1>
      <p style={{ fontSize: 12, color: S.text2, marginBottom: 14 }}>NLP-powered scam detection across Telegram, X, Discord</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Paste suspicious message, URL, or any crypto content..." style={{ width: '100%', background: S.bg2, border: `1px solid ${S.border}`, borderRadius: 6, padding: '9px 13px', color: S.text, fontSize: 13, resize: 'none', marginBottom: 8, outline: 'none' }} />
          <Btn onClick={analyze} disabled={loading || content.length < 10} style={{ width: '100%', justifyContent: 'center' }}>{loading ? <><Spinner /> Analyzing...</> : '🧠 Run Threat Analysis'}</Btn>
          <ScanBar on={loading} />
          {err && <div style={{ marginTop: 8, padding: 8, background: S.red + '18', color: S.red, borderRadius: 6, fontSize: 12 }}>{err}</div>}
          {result && (
            <div style={{ marginTop: 12 }}>
              <Card style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><Badge color={vcol(result.verdict)}>{result.verdict}</Badge><span style={{ fontSize: 12, color: S.text2 }}>Confidence: <strong style={{ color: vcol(result.verdict) }}>{result.confidence}%</strong></span></div>
                <div style={{ fontSize: 12, fontWeight: 600, color: S.text2, marginBottom: 5 }}>Type: {result.threatType}</div>
                <p style={{ fontSize: 12, color: S.text2, lineHeight: 1.6 }}>{result.analysis}</p>
                <div style={{ marginTop: 8, padding: 8, borderRadius: 6, fontSize: 12, background: vcol(result.verdict) + '11', color: vcol(result.verdict) }}>→ {result.recommendation}</div>
              </Card>
              {result.redFlags?.length > 0 && <Card style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 8 }}>Red Flags</div>{result.redFlags.map((f: string, i: number) => <div key={i} style={{ display: 'flex', gap: 7, padding: '5px 0', borderBottom: `1px solid ${S.border}`, fontSize: 12 }}><span style={{ color: S.red }}>▲</span><span style={{ color: S.text2 }}>{f}</span></div>)}</Card>}
              {result.manipulationTactics?.length > 0 && <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 8 }}>Manipulation Tactics</div>{result.manipulationTactics.map((t: string, i: number) => <div key={i} style={{ display: 'flex', gap: 7, padding: '5px 0', borderBottom: `1px solid ${S.border}`, fontSize: 12 }}><span style={{ color: S.amber }}>●</span><span style={{ color: S.text2 }}>{t}</span></div>)}</Card>}
            </div>
          )}
          {!result && !loading && <Empty icon="💬" title="Paste content above" desc="Messages, URLs, project descriptions, investment pitches" />}
        </div>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Live Threat Feed</span><span style={{ width: 8, height: 8, borderRadius: '50%', background: S.green, display: 'inline-block', animation: 'pulse 2s infinite' }} /></div>
          {THREATS.map((t, i) => { const col = t.type === 'PHISHING' ? S.red : S.amber; return (<div key={i} style={{ padding: 10, borderRadius: 6, borderLeft: `2px solid ${col}`, background: col + '08', marginBottom: 10 }}><div style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: 'uppercase' as const, marginBottom: 4 }}>{t.platform}</div><div style={{ fontSize: 12, color: S.text, lineHeight: 1.5, marginBottom: 6 }}>"{t.text}"</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Badge color={col}>{t.type}</Badge><span style={{ fontSize: 11, color: S.text3 }}>{t.confidence}% confidence</span><button onClick={() => setContent(t.text)} style={{ marginLeft: 'auto', fontSize: 11, color: S.blue, background: 'none', border: 'none', cursor: 'pointer' }}>Analyze →</button></div></div>); })}
        </Card>
      </div>
    </div>
  );
}

function Identity({ chain }: { chain: Chain }) {
  const [addr, setAddr] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState<any>(null); const [err, setErr] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyze = async () => {
    if (!addr.trim()) return; setLoading(true); setErr(''); setResult(null);
    try { const r = await fetch('/api/identity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr.trim(), chain }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); setResult(d); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = canvas.offsetWidth || 600; canvas.height = 200;
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    const nodes = result.graphNodes || [], edges = result.graphEdges || [];
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n: any, i: number) => { if (i === 0) { pos[n.id] = { x: cx, y: cy }; return; } const a = ((i - 1) / (nodes.length - 1)) * Math.PI * 2, r = Math.min(W, H) * 0.35; pos[n.id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; });
    ctx.clearRect(0, 0, W, H);
    edges.forEach((e: any) => { const a = pos[e.from], b = pos[e.to]; if (!a || !b) return; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke(); });
    nodes.forEach((n: any) => { const p = pos[n.id]; if (!p) return; const col = n.type === 'target' ? '#f5a623' : n.type === 'high-activity' ? '#ff4d4d' : n.type === 'normal' ? '#4d9fff' : '#00d68f'; ctx.beginPath(); ctx.arc(p.x, p.y, n.size, 0, Math.PI * 2); ctx.fillStyle = col + '33'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(232,234,240,0.8)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText(n.label, p.x, p.y + n.size + 12); });
  }, [result]);
  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Identity Graph Engine</h1>
      <p style={{ fontSize: 12, color: S.text2, marginBottom: 14 }}>Cluster wallets, detect Sybil attacks, and map rug pull networks</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><Inp value={addr} onChange={setAddr} onKeyDown={e => e.key === 'Enter' && analyze()} placeholder="Enter wallet address to map relationships..." mono /><Btn onClick={analyze} disabled={loading || !addr.trim()}>{loading ? <><Spinner /> Mapping...</> : '🕸 Map Network'}</Btn></div>
      <ScanBar on={loading} />
      {err && <div style={{ padding: 10, background: S.red + '18', color: S.red, borderRadius: 6, fontSize: 13, marginBottom: 14 }}>⚠ {err}</div>}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const }}>Network Visualization</span><Badge color={S.blue}>{result.graphNodes?.length || 0} nodes</Badge></div>
            <div style={{ background: S.bg3, borderRadius: 6, overflow: 'hidden', height: 200 }}><canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
              {[{ val: result.stats?.totalConnections, label: 'Total', color: S.text }, { val: result.stats?.flaggedConnections, label: 'Flagged', color: S.red }, { val: result.stats?.safeConnections, label: 'Safe', color: S.green }].map(s => (<div key={s.label} style={{ background: S.bg3, padding: 10, borderRadius: 6, textAlign: 'center' as const }}><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: s.color }}>{s.val}</div><div style={{ fontSize: 11, color: S.text3, marginTop: 2 }}>{s.label}</div></div>))}
            </div>
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 10 }}>AI Analysis</div><p style={{ fontSize: 13, color: S.text2, lineHeight: 1.7 }}>{result.aiAnalysis}</p></Card>
            <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 10 }}>Risk Signals</div>{(result.signals || []).length === 0 ? <Empty icon="✓" title="Clean network" desc="No suspicious patterns" /> : result.signals.map((s: any, i: number) => <Signal key={i} type={s.type} cat={s.category} msg={s.message} />)}</Card>
          </div>
        </div>
      )}
      {!result && !loading && !err && <Empty icon="🕸" title="Map any wallet's network" desc="Detect fraud rings, Sybil patterns, and suspicious connections" />}
    </div>
  );
}

function AlertsView({ alerts, setAlerts, clearAlerts }: { alerts: Alert[]; setAlerts: (a: Alert[]) => void; clearAlerts: () => void }) {
  const [loading, setLoading] = useState(false);
  const fetch_ = useCallback(async () => { setLoading(true); try { const r = await fetch('/api/alerts'); const d = await r.json(); if (d.alerts) setAlerts(d.alerts); } catch (_) {} finally { setLoading(false); } }, [setAlerts]);
  useEffect(() => { fetch_(); }, [fetch_]);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Live Alert Center</h1><p style={{ fontSize: 12, color: S.text2 }}>Real-time fraud and security threat notifications</p></div>
        <div style={{ display: 'flex', gap: 8 }}><GhostBtn onClick={fetch_}>{loading ? '...' : '↻ Refresh'}</GhostBtn><GhostBtn onClick={clearAlerts} style={{ color: S.red, borderColor: S.red + '44' }}>Clear All</GhostBtn></div>
      </div>
      {alerts.length === 0 ? <Empty icon="🔔" title="No alerts" desc="System is monitoring. Alerts will appear here in real-time." /> : alerts.map(a => <AlertRow key={a.id} a={a} />)}
    </div>
  );
}

function Portfolio({ chain }: { chain: Chain }) {
  const [addr, setAddr] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState<any>(null); const [err, setErr] = useState('');
  const monitor = async () => {
    if (!addr.trim()) return; setLoading(true); setErr(''); setResult(null);
    try { const r = await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr.trim(), chain }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); setResult(d); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); }
  };
  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Portfolio Monitor</h1>
      <p style={{ fontSize: 12, color: S.text2, marginBottom: 14 }}>Track and protect your holdings with AI-powered risk assessment</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><Inp value={addr} onChange={setAddr} onKeyDown={e => e.key === 'Enter' && monitor()} placeholder="Your wallet address (0x...)" mono /><Btn onClick={monitor} disabled={loading || !addr.trim()}>{loading ? <><Spinner /> Analyzing...</> : '📊 Monitor Portfolio'}</Btn></div>
      <ScanBar on={loading} />
      {err && <div style={{ padding: 10, background: S.red + '18', color: S.red, borderRadius: 6, fontSize: 13, marginBottom: 14 }}>⚠ {err}</div>}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[{ label: 'ETH Balance', val: `${result.portfolio.ethBalance} ETH`, sub: `~$${result.portfolio.ethBalanceUSD?.toFixed(0)} USD`, col: S.blue }, { label: 'Tokens', val: String(result.portfolio.tokenHoldings?.length || 0), sub: 'ERC-20 tokens', col: '#a855f7' }, { label: 'Risk Score', val: String(result.riskScore.total), sub: result.riskScore.label, col: scoreColor(result.riskScore.total) }, { label: 'Transactions', val: String(result.portfolio.txCount), sub: 'All time', col: S.green }].map(m => (<Card key={m.label} style={{ borderTop: `2px solid ${m.col}` }}><div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: m.col }}>{m.val}</div><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginTop: 4 }}>{m.label}</div><div style={{ fontSize: 11, color: S.text3 }}>{m.sub}</div></Card>))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 10 }}>Security Report</div><p style={{ fontSize: 13, color: S.text2, lineHeight: 1.7 }}>{result.aiReport}</p></Card>
            <Card><div style={{ fontSize: 11, fontWeight: 600, color: S.text2, textTransform: 'uppercase' as const, marginBottom: 10 }}>Token Holdings</div><div style={{ maxHeight: 240, overflowY: 'auto' }}>{(result.portfolio.tokenHoldings || []).slice(0, 15).map((t: any) => (<div key={t.symbol} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 9px', background: S.bg3, borderRadius: 5, marginBottom: 5, fontSize: 12 }}><div><span style={{ fontWeight: 600, color: S.text }}>{t.symbol}</span><span style={{ color: S.text3, marginLeft: 6, fontSize: 10 }}>{t.name}</span></div><span style={{ fontFamily: 'monospace', color: S.text2 }}>{t.balance}</span></div>))}{(result.portfolio.tokenHoldings || []).length === 0 && <p style={{ fontSize: 12, color: S.text3 }}>No tokens found</p>}</div></Card>
          </div>
        </div>
      )}
      {!result && !loading && !err && <Empty icon="📊" title="Enter your wallet address" desc="Get AI-powered security analysis of your complete portfolio" />}
    </div>
  );
}

function AIChat() {
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const QUICK = ['What are the top rug pull warning signs?', 'How do honeypot contracts work?', 'Explain Sybil attacks in DeFi', 'What makes a crypto project trustworthy?', 'How to check if a token is safe?', 'Explain MEV attacks'];
  const send = async (m?: string) => {
    const text = m || msg.trim(); if (!text || loading) return; setMsg('');
    const nh = [...history, { role: 'user' as const, content: text }]; setHistory(nh); setLoading(true);
    try { const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: history.slice(-10) }) }); const d = await r.json(); setHistory([...nh, { role: 'assistant', content: d.response || 'Error.' }]); } catch (_) { setHistory([...nh, { role: 'assistant', content: 'Connection error. Please try again.' }]); } finally { setLoading(false); }
  };
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [history, loading]);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div><h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>AI Security Analyst</h1><p style={{ fontSize: 12, color: S.text2 }}>Ask anything about crypto security, scams, and DeFi risks</p></div>
        <GhostBtn onClick={() => setHistory([])}>Clear chat</GhostBtn>
      </div>
      <Card style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 500 }}>
        <div ref={ref} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, paddingRight: 4 }}>
          {history.length === 0 && <div style={{ padding: 12, background: S.bg3, borderRadius: 6, fontSize: 13, color: S.text2, lineHeight: 1.7 }}><div style={{ fontSize: 10, fontWeight: 700, color: S.text3, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 5 }}>TrustGuard AI</div>Hello! I am your AI crypto security analyst. Ask me anything about fraud patterns, DeFi risks, smart contract vulnerabilities, and blockchain security.</div>}
          {history.map((m, i) => (<div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}><div style={{ maxWidth: '85%', padding: 12, borderRadius: 6, fontSize: 13, lineHeight: 1.7, background: m.role === 'user' ? S.green + '18' : S.bg3, border: `1px solid ${m.role === 'user' ? S.green + '33' : S.border}`, color: m.role === 'user' ? S.green : S.text2 }}>{m.role === 'assistant' && <div style={{ fontSize: 10, fontWeight: 700, color: S.text3, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>TrustGuard AI</div>}<div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div></div></div>))}
          {loading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ padding: 12, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 6, display: 'flex', gap: 5, alignItems: 'center' }}>{[0, 1, 2].map(n => <span key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: S.text3, display: 'inline-block', animation: `blink 1.2s infinite ${n * 0.2}s` }} />)}</div></div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{QUICK.map(q => <button key={q} onClick={() => send(q)} disabled={loading} style={{ padding: '4px 10px', background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 20, fontSize: 11, color: S.text2, cursor: 'pointer' }}>{q}</button>)}</div>
        <div style={{ display: 'flex', gap: 8 }}><Inp value={msg} onChange={setMsg} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder="Ask about any crypto security topic..." /><Btn onClick={() => send()} disabled={loading || !msg.trim()}>{loading ? <Spinner /> : '→'}</Btn></div>
      </Card>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [chain, setChain] = useState<Chain>('eth');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [blockNum, setBlockNum] = useState(19_847_231);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const ti = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    const tb = setInterval(() => setBlockNum(n => n + 1), 13000);
    setClock(new Date().toLocaleTimeString());
    return () => { clearInterval(ti); clearInterval(tb); };
  }, []);

  const dangerCount = alerts.filter(a => a.type === 'danger').length;
  const NAV: { id: View; label: string; icon: string; section?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🛡', section: 'Analysis' },
    { id: 'scanner', label: 'Wallet Scanner', icon: '🔍' },
    { id: 'contracts', label: 'Contract Risk', icon: '📄' },
    { id: 'social', label: 'Social Intel', icon: '💬' },
    { id: 'identity', label: 'Identity Graph', icon: '🕸' },
    { id: 'alerts', label: 'Live Alerts', icon: '🔔', section: 'Monitor' },
    { id: 'portfolio', label: 'Portfolio', icon: '📊' },
    { id: 'ai', label: 'AI Analyst', icon: '🤖', section: 'Intelligence' },
  ];
  const CHAIN_LABELS: Record<Chain, string> = { eth: 'Ethereum Mainnet', bnb: 'BNB Chain', polygon: 'Polygon' };

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${S.bg};color:${S.text};font-family:system-ui,sans-serif;min-height:100vh}
        input,textarea,button{font-family:inherit}
        input::placeholder,textarea::placeholder{color:${S.text3}}
        ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${S.border};border-radius:2px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes scanbar{0%{width:0;margin-left:0}50%{width:60%;margin-left:20%}100%{width:0;margin-left:100%}}
        @keyframes blink{0%,60%,100%{opacity:0.15}30%{opacity:1}}
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 52, background: S.bg2, borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, marginRight: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#00d68f,#2d7fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛡</div>
            TrustGuard AI
          </div>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,214,143,0.15)', color: S.green, border: '1px solid rgba(0,214,143,0.3)' }}>● LIVE</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['eth', 'bnb', 'polygon'] as Chain[]).map(c => (<button key={c} onClick={() => setChain(c)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${chain === c ? S.blue + '66' : S.border}`, background: chain === c ? S.blue + '22' : 'transparent', color: chain === c ? S.blue : S.text2 }}>{c.toUpperCase()}</button>))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: S.text2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: S.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />{CHAIN_LABELS[chain]} | Block <span style={{ fontFamily: 'monospace' }}>{blockNum.toLocaleString()}</span></span>
            <span style={{ fontFamily: 'monospace', color: S.text3 }}>{clock}</span>
          </div>
        </header>
        <div style={{ display: 'flex', flex: 1 }}>
          <aside style={{ width: 210, background: S.bg2, borderRight: `1px solid ${S.border}`, padding: '12px 10px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 52px)' }}>
            {NAV.map(item => (<div key={item.id}>{item.section && <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: S.text3, padding: '12px 12px 4px' }}>{item.section}</div>}<button onClick={() => setView(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `1px solid ${view === item.id ? S.green + '33' : 'transparent'}`, background: view === item.id ? S.green + '12' : 'transparent', color: view === item.id ? S.green : S.text2, textAlign: 'left' as const }}><span style={{ fontSize: 15 }}>{item.icon}</span><span style={{ flex: 1 }}>{item.label}</span>{item.id === 'alerts' && dangerCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: S.red + '33', color: S.red, padding: '1px 6px', borderRadius: 20 }}>{dangerCount}</span>}</button></div>))}
            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${S.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: S.text3, padding: '0 12px 8px' }}>System Status</div>
              {[['Behavioral Engine', true], ['Contract Scanner', true], ['NLP Engine', true], ['Identity Graph', false]].map(([label, online]) => (<div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 12px' }}><span style={{ fontSize: 11, color: S.text3 }}>{label}</span><span style={{ width: 6, height: 6, borderRadius: '50%', background: online ? S.green : S.amber, display: 'inline-block' }} /></div>))}
            </div>
          </aside>
          <main style={{ flex: 1, padding: 20, overflowY: 'auto', background: S.bg, minHeight: 'calc(100vh - 52px)', paddingBottom: 48 }}>
            {view === 'dashboard' && <Dashboard setAlerts={setAlerts} />}
            {view === 'scanner' && <Scanner chain={chain} />}
            {view === 'contracts' && <Contracts chain={chain} />}
            {view === 'social' && <Social />}
            {view === 'identity' && <Identity chain={chain} />}
            {view === 'alerts' && <AlertsView alerts={alerts} setAlerts={setAlerts} clearAlerts={() => setAlerts([])} />}
            {view === 'portfolio' && <Portfolio chain={chain} />}
            {view === 'ai' && <AIChat />}
          </main>
        </div>
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: S.bg2, borderTop: `1px solid ${S.border}`, padding: '5px 20px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: S.text3, zIndex: 40 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: S.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />All AI Engines Active</span>
          <span>Fusion Score Engine v2.1</span>
          <span style={{ marginLeft: 'auto' }}>TrustGuard AI © {new Date().getFullYear()}</span>
        </div>
      </div>
    </>
  );
}
