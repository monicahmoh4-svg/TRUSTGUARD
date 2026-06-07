# 🛡 TrustGuard AI

**AI-Powered Crypto Trust & Fraud Prevention System**

Real-time fraud detection, smart contract risk analysis, and wallet behavioral analytics — powered by Claude AI + live blockchain data.

---

## What's Real (Not Demo)

| Feature | Real Data Source |
|---|---|
| Wallet scanner | Etherscan API — live transaction history, balance, token holdings |
| Contract analyzer | Etherscan API — verified source code, ABI, creator, deployment date |
| Risk scoring | Rule-based engine analyzing real on-chain patterns |
| AI analysis | Claude Sonnet via Anthropic API — real AI explanations |
| Social analysis | Claude NLP — real AI scam classification |
| Identity graph | Real connected wallets from transaction history |

---

## Quick Start (Local)

```bash
git clone https://github.com/YOUR_USERNAME/trustguard-ai
cd trustguard-ai
npm install
cp .env.example .env.local
# Fill in your API keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Required API Keys

### 1. Anthropic API Key (Required — for all AI features)
- Go to: https://console.anthropic.com/
- Create account → API Keys → Create key
- Free tier available

### 2. Etherscan API Key (Required — for wallet/contract data)
- Go to: https://etherscan.io/apis
- Create account → My Profile → API Keys → Add
- Free tier: 5 calls/second, 100k calls/day

### 3. Alchemy API Key (Optional — for ENS resolution)
- Go to: https://dashboard.alchemy.com/
- Create app → Copy API key

Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY
```

---

## Deploy to Vercel (5 minutes)

### Option A: One-click deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/trustguard-ai)

### Option B: Manual deploy

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: TrustGuard AI"
git remote add origin https://github.com/YOUR_USERNAME/trustguard-ai.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → Import Project → Select your repo

3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `ETHERSCAN_API_KEY`  
   - `ALCHEMY_API_KEY` (optional)

4. Click Deploy — done!

---

## Architecture

```
TrustGuard AI
├── app/
│   ├── api/
│   │   ├── analyze/     → Wallet scanner (real Etherscan data + Claude AI)
│   │   ├── contract/    → Contract risk (source code analysis + AI)
│   │   ├── social/      → Social scam detection (Claude NLP)
│   │   ├── identity/    → Identity graph (transaction clustering)
│   │   ├── portfolio/   → Portfolio monitor
│   │   ├── chat/        → AI analyst chat
│   │   └── alerts/      → Real-time alert system
│   └── page.tsx         → Main app shell
├── components/
│   ├── views/           → Feature views (Dashboard, Scanner, etc.)
│   └── ui/              → Shared design system
├── lib/
│   ├── blockchain.ts    → Etherscan + Alchemy data fetching
│   ├── riskEngine.ts    → Multi-layer fusion risk scoring
│   ├── ai.ts            → Anthropic Claude integration
│   └── store.ts         → Zustand global state
└── vercel.json          → Deployment config
```

### Risk Scoring Formula
```
Final Risk Score =
  0.35 × Behavioral Score (wallet tx patterns)
  + 0.30 × Contract Risk (source code analysis)
  + 0.20 × Social Risk (NLP scam signals)
  + 0.15 × Identity Risk (network clustering)
```

### Risk Labels
- **0–34**: SAFE (green)
- **35–64**: SUSPICIOUS (amber)
- **65–100**: DANGEROUS (red)

---

## Features

### 🔍 Wallet Scanner
- Real transaction history from Etherscan
- Balance and token holdings
- Behavioral anomaly detection (velocity, error rate, circular flows)
- AI-generated security assessment

### 📄 Smart Contract Analyzer
- Source code pattern analysis (mint authority, blacklists, selfdestruct, fees)
- Deployment age and creator info
- Token concentration (top holder %)
- Proxy/upgradeable contract detection
- Structured AI verdict: SAFE / CAUTION / DANGEROUS

### 💬 Social Intel
- Paste any message, URL, or crypto pitch
- NLP classification: Phishing / Fake Airdrop / Rug Pull / Legitimate
- Red flags + manipulation tactics breakdown
- Confidence score

### 🕸 Identity Graph
- Visual network map of connected wallets
- Sybil attack pattern detection
- Dormant wallet revival detection
- Canvas-rendered graph visualization

### 🔔 Live Alerts
- System-generated threat notifications
- Persisted alert history
- Filter by severity

### 📊 Portfolio Monitor
- Full ETH + token breakdown
- Portfolio-level risk assessment
- AI security recommendations

### 🤖 AI Analyst Chat
- Multi-turn conversation with Claude
- Context-aware crypto security expert
- Quick prompt chips for common questions

---

## Expansion Roadmap

### Phase 2 (Add these to go pro)
- [ ] PostgreSQL (Neon/Supabase) for alert persistence
- [ ] Redis for real-time wallet monitoring cache
- [ ] WebSocket for true live transaction streaming
- [ ] BNB Chain + Polygon + Solana full support
- [ ] M-Pesa / mobile money integration (Kenya market)

### Phase 3 (Enterprise)
- [ ] Browser extension (Chrome/Firefox)
- [ ] B2B API with rate limiting and API keys
- [ ] Email/SMS alert webhooks
- [ ] Custom watchlists

---

## Kenya / East Africa Notes

Per the project spec, TrustGuard AI has specific expansion opportunity in Kenya:

- M-Pesa phone numbers can be mapped to wallet addresses
- Cross-border payment fraud detection
- Protection for first-time crypto users (Binance Kenya, Paxful users)
- KES-denominated risk reporting

To activate: add M-Pesa API credentials and enable the `/api/mpesa` route (implementation guide in `docs/mpesa.md`).

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **AI**: Anthropic Claude Sonnet (via SDK)
- **Blockchain**: Etherscan API, Alchemy
- **State**: Zustand
- **Charts**: Recharts
- **Deployment**: Vercel

---

## License

MIT — build on this, extend it, make it yours.
