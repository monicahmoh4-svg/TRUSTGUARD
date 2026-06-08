// components/Topbar.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAppStore, type Chain } from '@/lib/store';
import { LiveDot, Badge } from './ui';
import { clsx } from 'clsx';

const CHAINS: { id: Chain; label: string }[] = [
  { id: 'eth', label: 'ETH' },
  { id: 'bnb', label: 'BNB' },
  { id: 'polygon', label: 'MATIC' },
];

export default function Topbar() {
  const { activeChain, setChain } = useAppStore();
  const [blockNum, setBlockNum] = useState(19_847_231);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const ti = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);
    const tb = setInterval(() => {
      setBlockNum((n) => n + 1);
    }, 13_000);
    setClock(new Date().toLocaleTimeString());
    return () => { clearInterval(ti); clearInterval(tb); };
  }, []);

  const chainLabels: Record<Chain, string> = {
    eth: 'Ethereum Mainnet',
    bnb: 'BNB Chain',
    polygon: 'Polygon',
    sol: 'Solana',
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-2)] px-5"
      style={{ height: 52 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 font-semibold text-[15px] tracking-tight mr-2">
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[14px]"
          style={{ background: 'linear-gradient(135deg, var(--green), var(--blue-2))' }}
        >
          🛡
        </div>
        TrustGuard AI
      </div>

      <Badge variant="live">● LIVE</Badge>

      {/* Chain selector */}
      <div className="flex gap-1.5 ml-2">
        {CHAINS.map((chain) => (
          <button
            key={chain.id}
            onClick={() => setChain(chain.id)}
            className={clsx(
              'px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all border',
              activeChain === chain.id
                ? 'bg-[rgba(77,159,255,0.15)] text-[var(--blue)] border-[rgba(77,159,255,0.3)]'
                : 'bg-transparent text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)]',
            )}
          >
            {chain.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-4 text-[12px] text-[var(--text-2)]">
        <div className="flex items-center gap-1.5">
          <LiveDot />
          <span>
            {chainLabels[activeChain]} &nbsp;|&nbsp; Block{' '}
            <span className="font-mono-custom">{blockNum.toLocaleString()}</span>
          </span>
        </div>
        <span className="font-mono-custom text-[var(--text-3)]">{clock}</span>
      </div>
    </header>
  );
}
