'use client';
import { useAppStore } from '@/lib/store';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/views/Dashboard';
import Scanner from '@/components/views/Scanner';
import Contracts from '@/components/views/Contracts';
import { Social, Identity, Alerts, Portfolio, AIChat } from '@/components/views/OtherViews';

const VIEW_MAP = {
  dashboard: Dashboard,
  scanner: Scanner,
  contracts: Contracts,
  social: Social,
  identity: Identity,
  alerts: Alerts,
  portfolio: Portfolio,
  ai: AIChat,
};

export default function Home() {
  const { activeView } = useAppStore();
  const ActiveComponent = VIEW_MAP[activeView as keyof typeof VIEW_MAP] || Dashboard;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            background: 'var(--bg)',
            minHeight: 'calc(100vh - 52px)',
          }}
        >
          <ActiveComponent />
        </main>
      </div>

      {/* Status bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-2)',
          borderTop: '1px solid var(--border)',
          padding: '5px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: 'var(--text-3)',
          zIndex: 40,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          All AI Engines Active
        </span>
        <span>Fusion Score Engine v2.1</span>
        <span>Behavioral + Contract + Social + Identity</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-space-mono, monospace)' }}>
          TrustGuard AI © {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}
