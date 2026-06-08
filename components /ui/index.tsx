// components/ui/index.tsx
'use client';
import React from 'react';
import { clsx } from 'clsx';

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'danger' | 'warning' | 'safe' | 'info' | 'live'; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide', { 'bg-[rgba(0,214,143,0.15)] text-[var(--green)] border border-[rgba(0,214,143,0.3)]': variant === 'live', 'bg-[rgba(255,77,77,0.12)] text-[var(--red)]': variant === 'danger', 'bg-[rgba(245,166,35,0.12)] text-[var(--amber)]': variant === 'warning', 'bg-[rgba(0,214,143,0.12)] text-[var(--green)]': variant === 'safe', 'bg-[rgba(77,159,255,0.12)] text-[var(--blue)]': variant === 'info', 'bg-[var(--bg-3)] text-[var(--text-2)]': variant === 'default' }, className)}>{children}</span>
  );
}

export function Button({ children, onClick, disabled, variant = 'primary', size = 'md', className, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clsx('inline-flex items-center gap-2 rounded-[6px] font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border', { 'bg-[var(--green-2)] text-white border-transparent hover:bg-[var(--green)] disabled:bg-[var(--bg-4)] disabled:text-[var(--text-3)] disabled:cursor-not-allowed': variant === 'primary', 'bg-transparent text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--bg-3)] hover:text-[var(--text)]': variant === 'ghost', 'bg-[var(--red-3)] text-[var(--red)] border-[rgba(255,77,77,0.3)] hover:bg-[rgba(255,77,77,0.2)]': variant === 'danger', 'px-3 py-1.5 text-[11px]': size === 'sm', 'px-4 py-2.5 text-[13px]': size === 'md' }, className)}>{children}</button>
  );
}

export function Input({ value, onChange, onKeyDown, placeholder, className, mono, disabled }: { value: string; onChange: (v: string) => void; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; placeholder?: string; className?: string; mono?: boolean; disabled?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} disabled={disabled} className={clsx('flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-[6px] px-3 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] transition-all focus:border-[var(--green)] disabled:opacity-50 disabled:cursor-not-allowed', mono && 'font-mono-custom', className)} />
  );
}

export function Textarea({ value, onChange, placeholder, rows = 4, className }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={clsx('w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-[6px] px-3 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] transition-all focus:border-[var(--green)] resize-none', className)} />
  );
}

export function Card({ children, className, accentColor }: { children: React.ReactNode; className?: string; accentColor?: string }) {
  return (
    <div className={clsx('bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] p-4 relative overflow-hidden hover:border-[var(--border-2)] transition-colors', className)} style={accentColor ? ({ borderTopColor: accentColor, borderTopWidth: '2px' } as React.CSSProperties) : undefined}>{children}</div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('flex items-center justify-between mb-3', className)}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold text-[var(--text-2)] uppercase tracking-[0.5px]">{children}</div>;
}

export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className={clsx('inline-block rounded-full border-2 border-white/20 border-t-white animate-spin', { 'w-3.5 h-3.5': size === 'sm', 'w-5 h-5': size === 'md', 'w-8 h-8': size === 'lg' })} />;
}

export function LiveDot({ color = 'green' }: { color?: 'green' | 'red' | 'amber' }) {
  const colors: Record<string, string> = { green: 'bg-[var(--green)] shadow-[0_0_6px_var(--green)]', red: 'bg-[var(--red)] shadow-[0_0_6px_var(--red)]', amber: 'bg-[var(--amber)] shadow-[0_0_6px_var(--amber)]' };
  return <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', colors[color])} style={{ animation: 'pulse-dot 2s infinite' }} />;
}

export function ScanBar({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="h-[2px] bg-[var(--bg-3)] rounded-full overflow-hidden my-2">
      <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--green), var(--blue))', animation: 'scan-bar 1.5s ease-in-out infinite' }} />
    </div>
  );
}

export function RiskBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[12px] text-[var(--text-2)] font-medium">{label}</span>
        <span className="text-[11px] font-semibold font-mono-custom" style={{ color }}>{value}</span>
      </div>
      <div className="h-[4px] bg-[var(--bg-3)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function ScoreRing({ score, label, size = 140 }: { score: number; label: string; size?: number }) {
  const r = size * 0.4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 65 ? 'var(--red)' : score >= 35 ? 'var(--amber)' : 'var(--green)';
  return (
    <div className="flex flex-col items-center py-4">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={size * 0.07} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.07} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="score-ring-circle" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-3xl font-bold font-mono-custom" style={{ color, lineHeight: 1.1 }}>{score}</div>
          <div className="text-[10px] text-[var(--text-2)] font-semibold tracking-wider uppercase mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function AlertItem({ type, title, description, time, source, riskScore }: { type: 'danger' | 'warning' | 'info' | 'safe'; title: string; description: string; time: string; source?: string; riskScore?: number }) {
  const config = { danger: { border: 'var(--red)', bg: 'rgba(255,77,77,0.05)', icon: '⚠' }, warning: { border: 'var(--amber)', bg: 'rgba(245,166,35,0.05)', icon: '⚡' }, info: { border: 'var(--blue)', bg: 'rgba(77,159,255,0.05)', icon: 'ℹ' }, safe: { border: 'var(--green)', bg: 'rgba(0,214,143,0.05)', icon: '✓' } }[type];
  return (
    <div className="flex gap-3 p-3 rounded-[6px] mb-2 border-l-2 animate-slide-in" style={{ background: config.bg, borderColor: config.border }}>
      <div className="text-base flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-[13px] font-medium text-[var(--text)]">{title}</div>
          {riskScore !== undefined && <span className="text-[10px] font-bold font-mono-custom px-1.5 py-0.5 rounded" style={{ background: config.bg, color: config.border, border: `1px solid ${config.border}` }}>{riskScore}</span>}
        </div>
        <div className="text-[12px] text-[var(--text-2)] leading-relaxed">{description}</div>
        {source && <div className="text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-wide">{source} engine</div>}
      </div>
      <div className="text-[10px] text-[var(--text-3)] font-mono-custom flex-shrink-0">{time}</div>
    </div>
  );
}

export function SignalItem({ type, category, message }: { type: string; category: string; message: string }) {
  const config: Record<string, { color: string; icon: string }> = { critical: { color: 'var(--red)', icon: '▲' }, warning: { color: 'var(--amber)', icon: '●' }, info: { color: 'var(--blue)', icon: 'ℹ' }, positive: { color: 'var(--green)', icon: '✓' } };
  const c = config[type] || config.info;
  return (
    <div className="flex gap-2.5 py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-[12px] flex-shrink-0 mt-0.5" style={{ color: c.color }}>{c.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide mr-2" style={{ color: c.color }}>{category}</span>
        <span className="text-[12px] text-[var(--text-2)]">{message}</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-[14px] font-semibold text-[var(--text)] mb-1">{title}</div>
      <div className="text-[12px] text-[var(--text-2)]">{description}</div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--text)] mb-0.5">{title}</h1>
        {subtitle && <p className="text-[12px] text-[var(--text-2)]">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
