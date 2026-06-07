// lib/store.ts
import { create } from 'zustand';

export type Chain = 'eth' | 'bnb' | 'polygon' | 'sol';
export type View = 'dashboard' | 'scanner' | 'contracts' | 'social' | 'identity' | 'alerts' | 'portfolio' | 'ai';

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'safe';
  title: string;
  description: string;
  address?: string;
  chain?: string;
  timestamp: string;
  source: string;
  riskScore?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AppState {
  activeView: View;
  activeChain: Chain;
  alerts: Alert[];
  alertCount: number;
  chatHistory: ChatMessage[];

  setView: (view: View) => void;
  setChain: (chain: Chain) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  activeChain: 'eth',
  alerts: [],
  alertCount: 0,
  chatHistory: [],

  setView: (view) => set({ activeView: view }),
  setChain: (chain) => set({ activeChain: chain }),
  setAlerts: (alerts) => set({
    alerts,
    alertCount: alerts.filter(a => a.type === 'danger').length,
  }),
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50),
    alertCount: state.alertCount + (alert.type === 'danger' ? 1 : 0),
  })),
  clearAlerts: () => set({ alerts: [], alertCount: 0 }),
  addChatMessage: (msg) => set((state) => ({
    chatHistory: [...state.chatHistory, msg],
  })),
  clearChat: () => set({ chatHistory: [] }),
}));
