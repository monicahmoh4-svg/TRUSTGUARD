// components/views/Social.tsx
'use client';
import { useState } from 'react';
import {
  Card, CardHeader, CardTitle, SectionHeader, Textarea, Button,
  ScanBar, Badge, Spinner, EmptyState,
} from '@/components/ui';

const LIVE_THREATS = [
  { platform: 'Telegram • @CryptoAlerts', text: '🚀 URGENT: MoonFloki airdrop ending in 1 hour! Connect wallet at moonfloki-airdrop[.]xyz — 10,000 tokens FREE! Don\'t miss out!', confidence: 96, type: 'PHISHING' },
  { platform: 'X (Twitter)', text: '"SafeSwap" team promising 1000% APY this week. Token unlocks in 3 days. Dev wallet holds 78% of supply. Join presale now!', confidence: 74, type: 'SCAM' },
  { platform: 'Discord • NovaCoin', text: 'We are being targeted by FUD. Our contract is SAFU. Ignore FUD spreaders. Buy the dip! Limited time 2x bonus for early holders.', confidence: 61, type: 'SUSPICIOUS' },
  { platform: 'Telegram • AirdropHunters', text: 'Verified USDC airdrop — claim $500 by connecting wallet to usdc-official-claim[.]net before midnight!', confidence: 99, type: 'PHISHING' },
];

interface SocialResult {
  threatType: string;
  confidence: number;
  redFlags: string[];
  manipulationTactics: string[];
  verdict: 'PHISHING' | 'SCAM' | 'SUSPICIOUS' | 'LEGITIMATE' | 'UNKNOWN';
  analysis: string;
  recommendation: string;
  socialScore: number;
}

export function Social() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialResult | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!content.trim() || content.length < 10) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const verdictColors: Record<string, string> = {
    PHISHING: 'var(--red)', SCAM: 'var(--red)', SUSPICIOUS: 'var(--amber)',
    LEGITIMATE: 'var(--green)', UNKNOWN: 'var(--blue)',
  };
  const verdictVariants: Record<string, 'danger' | 'warning' | 'safe' | 'info'> = {
    PHISHING: 'danger', SCAM: 'danger', SUSPICIOUS: 'warning',
    LEGITIMATE: 'safe', UNKNOWN: 'info',
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Social Threat Intelligence"
        subtitle="NLP-powered scam detection across Telegram, X (Twitter), Discord, and WhatsApp"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Textarea
            value={content}
            onChange={setContent}
            placeholder="Paste suspicious message, URL, project description, or any crypto content to analyze..."
            rows={5}
            className="mb-2"
          />
          <Button onClick={analyze} disabled={loading || content.length < 10} className="w-full justify-center">
            {loading ? <><Spinner /> Analyzing with NLP...</> : '🧠 Run Threat Analysis'}
          </Button>
          <ScanBar visible={loading} />
          {error && (
            <div className="mt-2 p-2 rounded bg-[rgba(255,77,77,0.1)] text-[var(--red)] text-[12px]">{error}</div>
          )}
          {result && (
            <div className="mt-3 animate-slide-in space-y-3">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={verdictVariants[result.verdict] || 'info'}>
                    {result.verdict}
                  </Badge>
                  <div className="text-[12px] text-[var(--text-2)]">
                    Confidence: <span className="font-bold font-mono-custom" style={{ color: verdictColors[result.verdict] }}>{result.confidence}%</span>
                  </div>
                </div>
                <div className="text-[12px] font-semibold text-[var(--text-2)] mb-1">Threat Type: {result.threatType}</div>
                <p className="text-[12px] text-[var(--text-2)] leading-relaxed">{result.analysis}</p>
                <div className="mt-2 p-2 rounded text-[12px]" style={{ background: `${verdictColors[result.verdict]}11`, color: verdictColors[result.verdict] }}>
                  → {result.recommendation}
                </div>
              </Card>
              {result.redFlags.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Red Flags</CardTitle></CardHeader>
                  {result.redFlags.map((f, i) => (
                    <div key={i} className="flex gap-2 py-1.5 border-b border-[var(--border)] last:border-0 text-[12px]">
                      <span className="text-[var(--red)]">▲</span>
                      <span className="text-[var(--text-2)]">{f}</span>
                    </div>
                  ))}
                </Card>
              )}
              {result.manipulationTactics.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Manipulation Tactics</CardTitle></CardHeader>
                  {result.manipulationTactics.map((t, i) => (
                    <div key={i} className="flex gap-2 py-1.5 border-b border-[var(--border)] last:border-0 text-[12px]">
                      <span className="text-[var(--amber)]">●</span>
                      <span className="text-[var(--text-2)]">{t}</span>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
          {!result && !loading && (
            <EmptyState icon="💬" title="Paste content above" description="Works with messages, URLs, project descriptions, investment pitches" />
          )}
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle>Live Threat Feed</CardTitle><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite' }} /></CardHeader>
            <div className="space-y-3">
              {LIVE_THREATS.map((t, i) => (
                <div key={i} className={`p-3 rounded-[6px] border-l-2 ${t.type === 'PHISHING' ? 'bg-[rgba(255,77,77,0.05)] border-[var(--red)]' : 'bg-[rgba(245,166,35,0.05)] border-[var(--amber)]'}`}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: t.type === 'PHISHING' ? 'var(--red)' : 'var(--amber)' }}>{t.platform}</div>
                  <div className="text-[12px] text-[var(--text)] leading-relaxed mb-2">"{t.text}"</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.type === 'PHISHING' ? 'danger' : 'warning'}>{t.type}</Badge>
                    <span className="text-[11px] text-[var(--text-3)]">{t.confidence}% confidence</span>
                    <button onClick={() => setContent(t.text)} className="ml-auto text-[11px] text-[var(--blue)] cursor-pointer hover:underline">Analyze →</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Identity Graph ────────────────────────────────────────────────────────────
// components/views/Identity.tsx
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Input, SignalItem } from '@/components/ui';

interface IdentityResult {
  address: string;
  identityScore: number;
  signals: Array<{ type: string; category: string; message: string }>;
  connectedAddresses: string[];
  graphNodes: Array<{ id: string; label: string; type: string; size: number }>;
  graphEdges: Array<{ from: string; to: string; weight: number }>;
  stats: { totalConnections: number; flaggedConnections: number; safeConnections: number; txCount: number };
  aiAnalysis: string;
}

export function Identity() {
  const { activeChain } = useAppStore();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentityResult | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const analyze = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chain: activeChain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = 220;

    const nodes = result.graphNodes;
    const edges = result.graphEdges;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    // Position nodes in a radial layout
    const posMap: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      if (i === 0) { posMap[n.id] = { x: cx, y: cy }; return; }
      const angle = ((i - 1) / (nodes.length - 1)) * Math.PI * 2;
      const r = Math.min(W, H) * 0.35;
      posMap[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    ctx.clearRect(0, 0, W, H);

    // Draw edges
    edges.forEach((e) => {
      const a = posMap[e.from], b = posMap[e.to];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = Math.min(e.weight, 3);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((n) => {
      const pos = posMap[n.id];
      if (!pos) return;
      const color = n.type === 'target' ? '#f5a623' : n.type === 'high-activity' ? '#ff4d4d' : n.type === 'normal' ? '#4d9fff' : '#00d68f';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, n.size, 0, Math.PI * 2);
      ctx.fillStyle = color + '33';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(232,234,240,0.8)';
      ctx.font = '9px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, pos.x, pos.y + n.size + 12);
    });
  }, [result]);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Identity Graph Engine"
        subtitle="Cluster wallets, detect Sybil attacks, and map rug pull networks using behavioral graph analysis"
      />
      <div className="flex gap-2 mb-4">
        <Input value={address} onChange={setAddress} onKeyDown={(e) => e.key === 'Enter' && analyze()} placeholder="Enter wallet address to map relationships..." mono />
        <Button onClick={analyze} disabled={loading || !address.trim()}>
          {loading ? <><Spinner /> Mapping...</> : '🕸 Map Network'}
        </Button>
      </div>
      <ScanBar visible={loading} />
      {error && <div className="p-3 rounded bg-[rgba(255,77,77,0.1)] text-[var(--red)] text-[13px] mb-4">⚠ {error}</div>}
      {result && (
        <div className="space-y-4 animate-slide-in">
          <Card>
            <CardHeader><CardTitle>Network Visualization</CardTitle><Badge variant="info">{result.graphNodes.length} nodes</Badge></CardHeader>
            <div className="w-full bg-[var(--bg-3)] rounded-[6px] overflow-hidden" style={{ height: 220 }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-[var(--bg-3)] p-2.5 rounded text-center">
                <div className="text-[18px] font-bold font-mono-custom text-[var(--text)]">{result.stats.totalConnections}</div>
                <div className="text-[11px] text-[var(--text-3)] mt-0.5">Total connections</div>
              </div>
              <div className="bg-[var(--bg-3)] p-2.5 rounded text-center">
                <div className="text-[18px] font-bold font-mono-custom text-[var(--red)]">{result.stats.flaggedConnections}</div>
                <div className="text-[11px] text-[var(--text-3)] mt-0.5">Flagged connections</div>
              </div>
              <div className="bg-[var(--bg-3)] p-2.5 rounded text-center">
                <div className="text-[18px] font-bold font-mono-custom text-[var(--green)]">{result.stats.safeConnections}</div>
                <div className="text-[11px] text-[var(--text-3)] mt-0.5">Safe connections</div>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>AI Identity Analysis</CardTitle></CardHeader>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed">{result.aiAnalysis}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Risk Signals ({result.signals.length})</CardTitle></CardHeader>
              {result.signals.length === 0 ? (
                <EmptyState icon="✓" title="Clean network" description="No suspicious patterns detected" />
              ) : (
                result.signals.map((s, i) => <SignalItem key={i} type={s.type} category={s.category} message={s.message} />)
              )}
            </Card>
          </div>
        </div>
      )}
      {!result && !loading && !error && (
        <EmptyState icon="🕸" title="Map any wallet's network" description="See who a wallet connects to, detect fraud rings, and identify Sybil patterns" />
      )}
    </div>
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
import { formatDistanceToNow } from 'date-fns';

export function Alerts() {
  const { alerts, setAlerts, clearAlerts } = useAppStore();
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Live Alert Center"
        subtitle="Real-time fraud and security threat notifications"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAlerts}>{loading ? <Spinner /> : '↻'} Refresh</Button>
            <Button variant="danger" size="sm" onClick={clearAlerts}>Clear All</Button>
          </div>
        }
      />
      {alerts.length === 0 ? (
        <EmptyState icon="🔔" title="No alerts" description="System is monitoring. Alerts will appear here in real-time." />
      ) : (
        <div className="space-y-1">
          {alerts.map((a) => (
            <div key={a.id} className={`flex gap-3 p-3 rounded-[6px] border-l-2 animate-slide-in ${
              a.type === 'danger' ? 'bg-[rgba(255,77,77,0.05)] border-[var(--red)]' :
              a.type === 'warning' ? 'bg-[rgba(245,166,35,0.05)] border-[var(--amber)]' :
              a.type === 'safe' ? 'bg-[rgba(0,214,143,0.05)] border-[var(--green)]' :
              'bg-[rgba(77,159,255,0.05)] border-[var(--blue)]'
            }`}>
              <div className="text-base flex-shrink-0 mt-0.5">
                {a.type === 'danger' ? '⚠' : a.type === 'warning' ? '⚡' : a.type === 'safe' ? '✓' : 'ℹ'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-[13px] font-medium">{a.title}</div>
                  {a.riskScore !== undefined && (
                    <Badge variant={a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'safe'}>{a.riskScore}</Badge>
                  )}
                </div>
                <div className="text-[12px] text-[var(--text-2)] leading-relaxed">{a.description}</div>
                <div className="text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-wide">{a.source} engine • {a.chain || 'multi-chain'}</div>
              </div>
              <div className="text-[10px] text-[var(--text-3)] font-mono-custom flex-shrink-0">
                {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Portfolio Monitor ────────────────────────────────────────────────────────
interface PortfolioResult {
  portfolio: {
    ethBalance: string;
    ethBalanceUSD: number;
    tokenHoldings: Array<{ symbol: string; name: string; balance: string }>;
    txCount: number;
    firstSeen: string;
    lastActive: string;
  };
  riskScore: { total: number; label: string; signals: Array<{ type: string; category: string; message: string }> };
  aiReport: string;
}

export function Portfolio() {
  const { activeChain } = useAppStore();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState('');

  const monitor = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chain: activeChain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Portfolio Monitor" subtitle="Track and protect your holdings with AI-powered risk assessment" />
      <div className="flex gap-2 mb-4">
        <Input value={address} onChange={setAddress} onKeyDown={(e) => e.key === 'Enter' && monitor()} placeholder="Your wallet address (0x...)" mono />
        <Button onClick={monitor} disabled={loading || !address.trim()}>
          {loading ? <><Spinner /> Analyzing...</> : '📊 Monitor Portfolio'}
        </Button>
      </div>
      <ScanBar visible={loading} />
      {error && <div className="p-3 rounded bg-[rgba(255,77,77,0.1)] text-[var(--red)] text-[13px] mb-4">⚠ {error}</div>}
      {result && (
        <div className="space-y-4 animate-slide-in">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'ETH Balance', value: `${result.portfolio.ethBalance} ETH`, sub: `~$${result.portfolio.ethBalanceUSD.toFixed(0)} USD`, color: 'var(--blue)' },
              { label: 'Tokens Held', value: result.portfolio.tokenHoldings.length, sub: 'ERC-20 tokens', color: 'var(--purple)' },
              { label: 'Risk Score', value: result.riskScore.total, sub: result.riskScore.label, color: result.riskScore.total >= 65 ? 'var(--red)' : result.riskScore.total >= 35 ? 'var(--amber)' : 'var(--green)' },
              { label: 'Transactions', value: result.portfolio.txCount, sub: 'All time', color: 'var(--green)' },
            ].map((m) => (
              <Card key={m.label}>
                <div className="text-[22px] font-bold font-mono-custom" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-wide mt-1">{m.label}</div>
                <div className="text-[11px] text-[var(--text-3)]">{m.sub}</div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Security Report</CardTitle></CardHeader>
              <p className="text-[13px] text-[var(--text-2)] leading-relaxed">{result.aiReport}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Token Holdings</CardTitle></CardHeader>
              <div className="max-h-[240px] overflow-y-auto space-y-1.5">
                {result.portfolio.tokenHoldings.slice(0, 15).map((t) => (
                  <div key={t.symbol} className="flex justify-between p-2 bg-[var(--bg-3)] rounded text-[12px]">
                    <div>
                      <span className="font-semibold text-[var(--text)]">{t.symbol}</span>
                      <span className="text-[var(--text-3)] ml-2 text-[10px]">{t.name}</span>
                    </div>
                    <span className="font-mono-custom text-[var(--text-2)]">{t.balance}</span>
                  </div>
                ))}
                {result.portfolio.tokenHoldings.length === 0 && (
                  <p className="text-[12px] text-[var(--text-3)]">No tokens found</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
      {!result && !loading && !error && (
        <EmptyState icon="📊" title="Enter your wallet address" description="Get AI-powered security analysis of your complete portfolio" />
      )}
    </div>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
export function AIChat() {
  const { chatHistory, addChatMessage, clearChat } = useAppStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const QUICK_PROMPTS = [
    'What are the top rug pull warning signs?',
    'How do honeypot contracts work?',
    'Explain Sybil attacks in DeFi',
    'What makes a crypto project trustworthy?',
    'How to check if a token is safe before buying?',
    'Explain MEV and how it affects retail traders',
  ];

  const send = async (msg?: string) => {
    const text = msg || message.trim();
    if (!text || loading) return;
    setMessage('');

    const userMsg = { role: 'user' as const, content: text, timestamp: new Date().toISOString() };
    addChatMessage(userMsg);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-10).map(h => ({ role: h.role, content: h.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addChatMessage({ role: 'assistant', content: data.response, timestamp: new Date().toISOString() });
    } catch (e) {
      addChatMessage({ role: 'assistant', content: 'Connection error. Please try again.', timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="AI Security Analyst"
        subtitle="Ask anything about crypto security, scam detection, smart contracts, and DeFi risks"
        action={<Button variant="ghost" size="sm" onClick={clearChat}>Clear chat</Button>}
      />
      <Card className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
          {chatHistory.length === 0 && (
            <div className="p-3 bg-[var(--bg-3)] rounded-[6px] text-[13px] text-[var(--text-2)] leading-relaxed">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">TrustGuard AI</div>
              Hello! I am your AI crypto security analyst. I can help you understand fraud patterns, analyze DeFi risks, explain smart contract vulnerabilities, and answer anything about blockchain security. What would you like to investigate?
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-[6px] text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[rgba(0,214,143,0.1)] border border-[rgba(0,214,143,0.2)] text-[var(--green)]'
                    : 'bg-[var(--bg-3)] border border-[var(--border)] text-[var(--text-2)]'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">TrustGuard AI</div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3 bg-[var(--bg-3)] border border-[var(--border)] rounded-[6px]">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(n => (
                    <div key={n} className="w-1.5 h-1.5 rounded-full bg-[var(--text-3)]" style={{ animation: `blink 1.2s infinite ${n * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} disabled={loading} className="px-2.5 py-1 bg-[var(--bg-3)] border border-[var(--border)] rounded-full text-[11px] text-[var(--text-2)] cursor-pointer hover:text-[var(--text)] hover:border-[var(--border-2)] transition-all disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={setMessage}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about any crypto security topic..."
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !message.trim()}>
            {loading ? <Spinner /> : '→'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
