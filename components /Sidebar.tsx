// components/Sidebar.tsx
'use client';
import { useAppStore, type View } from '@/lib/store';
import { LiveDot } from '@/components/ui/index';
import { clsx } from 'clsx';

const NAV_ITEMS: { id: View; label: string; icon: string; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🛡', section: 'Analysis' },
  { id: 'scanner', label: 'Wallet Scanner', icon: '🔍' },
  { id: 'contracts', label: 'Contract Risk', icon: '📄' },
  { id: 'social', label: 'Social Intel', icon: '💬' },
  { id: 'identity', label: 'Identity Graph', icon: '🕸' },
  { id: 'alerts', label: 'Live Alerts', icon: '🔔', section: 'Monitor' },
  { id: 'portfolio', label: 'Portfolio', icon: '📊' },
  { id: 'ai', label: 'AI Analyst', icon: '🤖', section: 'Intelligence' },
];

const ENGINE_STATUS = [
  { label: 'Behavioral Engine', status: 'online' },
  { label: 'Contract Scanner', status: 'online' },
  { label: 'NLP Engine', status: 'online' },
  { label: 'Identity Graph', status: 'degraded' },
];

export default function Sidebar() {
  const { activeView, setView, alertCount } = useAppStore();

  return (
    <aside
      className="flex flex-col border-r border-[var(--border)] bg-[var(--bg-2)]"
      style={{ width: 220, minHeight: 'calc(100vh - 52px)', padding: '12px 10px' }}
    >
      {NAV_ITEMS.map((item) => (
        <div key={item.id}>
          {item.section && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-3)] px-3 pt-3 pb-1">
              {item.section}
            </div>
          )}
          <button
            onClick={() => setView(item.id)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all border cursor-pointer text-left',
              activeView === item.id
                ? 'bg-[rgba(0,214,143,0.08)] text-[var(--green)] border-[rgba(0,214,143,0.2)]'
                : 'text-[var(--text-2)] border-transparent hover:bg-[var(--bg-3)] hover:text-[var(--text)]',
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.id === 'alerts' && alertCount > 0 && (
              <span className="text-[10px] font-bold bg-[rgba(255,77,77,0.2)] text-[var(--red)] px-1.5 py-0.5 rounded-full">
                {alertCount}
              </span>
            )}
          </button>
        </div>
      ))}

      {/* Engine status */}
      <div className="mt-auto pt-3 border-t border-[var(--border)]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-3)] px-3 mb-2">
          System Status
        </div>
        <div className="px-3 space-y-1.5">
          {ENGINE_STATUS.map((e) => (
            <div key={e.label} className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-3)]">{e.label}</span>
              <LiveDot color={e.status === 'online' ? 'green' : 'amber'} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
