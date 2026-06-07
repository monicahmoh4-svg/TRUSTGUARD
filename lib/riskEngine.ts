// lib/riskEngine.ts
// Multi-layer risk fusion engine

import type { WalletData, ContractData, Transaction } from './blockchain';

export interface RiskScore {
  total: number;           // 0-100 fused score
  behavioral: number;      // 0-100
  contract: number;        // 0-100
  social: number;          // 0-100 (from NLP engine)
  identity: number;        // 0-100
  label: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  confidence: number;      // 0-100
  signals: RiskSignal[];
  recommendation: string;
}

export interface RiskSignal {
  type: 'critical' | 'warning' | 'info' | 'positive';
  category: string;
  message: string;
  weight: number;
}

// Fusion weights from the TrustGuard architecture
const WEIGHTS = {
  behavioral: 0.35,
  contract: 0.30,
  social: 0.20,
  identity: 0.15,
};

export function computeFusedScore(
  behavioral: number,
  contract: number,
  social: number,
  identity: number,
): number {
  return Math.round(
    behavioral * WEIGHTS.behavioral +
    contract * WEIGHTS.contract +
    social * WEIGHTS.social +
    identity * WEIGHTS.identity
  );
}

export function scoreLabel(score: number): 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' {
  if (score >= 65) return 'DANGEROUS';
  if (score >= 35) return 'SUSPICIOUS';
  return 'SAFE';
}

// ---- BEHAVIORAL ANALYSIS ----
export function analyzeBehavior(wallet: WalletData): { score: number; signals: RiskSignal[] } {
  const signals: RiskSignal[] = [];
  let score = 0;

  const txs = wallet.transactions;
  if (txs.length === 0) {
    signals.push({ type: 'info', category: 'Behavioral', message: 'No transaction history found — new or inactive wallet', weight: 10 });
    return { score: 10, signals };
  }

  // 1. Velocity: many txs in short period
  const now = Date.now();
  const last24h = txs.filter(tx => now - tx.timestamp < 86400000);
  if (last24h.length > 20) {
    score += 25;
    signals.push({ type: 'critical', category: 'Behavioral', message: `High velocity: ${last24h.length} transactions in 24 hours`, weight: 25 });
  } else if (last24h.length > 10) {
    score += 10;
    signals.push({ type: 'warning', category: 'Behavioral', message: `Elevated activity: ${last24h.length} transactions in 24 hours`, weight: 10 });
  }

  // 2. Large sudden transfers
  const largeOutbound = txs.filter(tx => tx.from.toLowerCase() === wallet.address.toLowerCase() && tx.valueUSD > 10000);
  if (largeOutbound.length > 0) {
    score += 15;
    signals.push({ type: 'warning', category: 'Behavioral', message: `${largeOutbound.length} large outbound transfer(s) detected (>$10,000)`, weight: 15 });
  }

  // 3. Error rate
  const errors = txs.filter(tx => tx.isError);
  const errorRate = errors.length / txs.length;
  if (errorRate > 0.3) {
    score += 15;
    signals.push({ type: 'warning', category: 'Behavioral', message: `High error rate: ${Math.round(errorRate * 100)}% of transactions failed (bot activity pattern)`, weight: 15 });
  }

  // 4. Circular fund movement
  const addresses = txs.map(tx => tx.to);
  const uniqueAddresses = new Set(addresses);
  if (uniqueAddresses.size < txs.length * 0.3 && txs.length > 10) {
    score += 20;
    signals.push({ type: 'critical', category: 'Behavioral', message: 'Circular fund movement detected — funds cycling through limited addresses', weight: 20 });
  }

  // 5. Wallet age vs activity
  const firstTs = txs[txs.length - 1]?.timestamp || 0;
  const ageInDays = (now - firstTs) / 86400000;
  if (ageInDays < 7 && txs.length > 20) {
    score += 20;
    signals.push({ type: 'critical', category: 'Behavioral', message: `New wallet (${Math.round(ageInDays)} days old) with high activity — suspicious pattern`, weight: 20 });
  } else if (ageInDays > 365) {
    score -= 10;
    signals.push({ type: 'positive', category: 'Behavioral', message: `Established wallet: ${Math.round(ageInDays / 30)} months of history`, weight: -10 });
  }

  // 6. Consistent gas price (bot detection)
  if (txs.length > 5) {
    const gasPrices = txs.slice(0, 10).map(tx => parseInt(tx.gasPrice || '0'));
    const avgGas = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
    const variance = gasPrices.reduce((a, b) => a + Math.pow(b - avgGas, 2), 0) / gasPrices.length;
    if (variance < 1000 && avgGas > 0) {
      score += 10;
      signals.push({ type: 'warning', category: 'Behavioral', message: 'Suspiciously uniform gas prices — possible automated bot activity', weight: 10 });
    }
  }

  // 7. Positive signals
  if (txs.length > 50) {
    signals.push({ type: 'positive', category: 'Behavioral', message: `Active wallet with ${txs.length} transactions — established usage pattern`, weight: -5 });
    score = Math.max(0, score - 5);
  }

  return { score: Math.min(100, Math.max(0, score)), signals };
}

// ---- CONTRACT RISK ANALYSIS ----
export function analyzeContractRisk(
  contract: ContractData,
  tokenMetrics?: { totalSupply?: string | null; holderCount?: number | null; topHolders?: Array<{ address: string; quantity: string }> },
): { score: number; signals: RiskSignal[] } {
  const signals: RiskSignal[] = [];
  let score = 0;

  // 1. Verification
  if (!contract.isVerified) {
    score += 30;
    signals.push({ type: 'critical', category: 'Contract', message: 'Contract source code is NOT verified — cannot inspect for malicious functions', weight: 30 });
  } else {
    signals.push({ type: 'positive', category: 'Contract', message: 'Contract source code is verified on-chain', weight: -10 });
    score -= 10;
  }

  // 2. Source code pattern analysis
  if (contract.sourceCode) {
    const src = contract.sourceCode.toLowerCase();

    // Dangerous patterns
    if (src.includes('selfdestruct') || src.includes('suicide(')) {
      score += 25;
      signals.push({ type: 'critical', category: 'Contract', message: 'SELFDESTRUCT function found — contract can be permanently destroyed, wiping all funds', weight: 25 });
    }
    if (src.includes('onlyowner') && (src.includes('mint(') || src.includes('_mint('))) {
      score += 25;
      signals.push({ type: 'critical', category: 'Contract', message: 'Owner-controlled minting detected — developer can print unlimited tokens', weight: 25 });
    }
    if (src.includes('blacklist') || src.includes('_isblacklisted')) {
      score += 20;
      signals.push({ type: 'critical', category: 'Contract', message: 'Blacklist mechanism found — owner can freeze specific wallets (honeypot signal)', weight: 20 });
    }
    if (src.includes('pause') && src.includes('onlyowner')) {
      score += 15;
      signals.push({ type: 'warning', category: 'Contract', message: 'Owner can pause all transfers — centralization risk', weight: 15 });
    }
    if (src.includes('maxtxamount') || src.includes('maxwallet')) {
      score += 10;
      signals.push({ type: 'warning', category: 'Contract', message: 'Transaction/wallet limits found — can be used to trap holders', weight: 10 });
    }
    if ((src.match(/fee/g) || []).length > 5) {
      score += 15;
      signals.push({ type: 'warning', category: 'Contract', message: 'Multiple fee mechanisms detected — excessive tax structure', weight: 15 });
    }

    // Positive patterns
    if (src.includes('timelock') || src.includes('timelockcontroller')) {
      score -= 15;
      signals.push({ type: 'positive', category: 'Contract', message: 'Timelock mechanism found — changes require delay period (good governance)', weight: -15 });
    }
    if (src.includes('multisig') || src.includes('gnosis')) {
      score -= 10;
      signals.push({ type: 'positive', category: 'Contract', message: 'Multi-signature requirement detected — reduces single-point control risk', weight: -10 });
    }
    if (src.includes('renounceownership')) {
      const hasRenounced = src.includes('address(0)');
      if (hasRenounced) {
        score -= 20;
        signals.push({ type: 'positive', category: 'Contract', message: 'Ownership renounced — contract is fully decentralized', weight: -20 });
      }
    }
    if (src.includes('audit') || src.includes('certik') || src.includes('openzeppelin')) {
      score -= 10;
      signals.push({ type: 'positive', category: 'Contract', message: 'Audit reference found in source code', weight: -10 });
    }
  }

  // 3. Deployment age
  if (contract.deployedAt) {
    const ageInDays = (Date.now() - new Date(contract.deployedAt).getTime()) / 86400000;
    if (ageInDays < 7) {
      score += 20;
      signals.push({ type: 'critical', category: 'Contract', message: `Very new contract: deployed ${Math.round(ageInDays)} days ago — high rug pull risk window`, weight: 20 });
    } else if (ageInDays > 365) {
      score -= 15;
      signals.push({ type: 'positive', category: 'Contract', message: `Established contract: ${Math.round(ageInDays / 30)} months old`, weight: -15 });
    }
  }

  // 4. Proxy contract
  if (contract.isProxy) {
    score += 10;
    signals.push({ type: 'warning', category: 'Contract', message: 'Proxy/upgradeable contract — logic can be changed after deployment', weight: 10 });
  }

  // 5. Token concentration
  if (tokenMetrics?.topHolders && tokenMetrics.topHolders.length > 0 && tokenMetrics.totalSupply) {
    const totalSupply = parseFloat(tokenMetrics.totalSupply);
    const topHolder = tokenMetrics.topHolders[0];
    const topHolderPct = (parseFloat(topHolder.quantity) / totalSupply) * 100;
    if (topHolderPct > 50) {
      score += 30;
      signals.push({ type: 'critical', category: 'Contract', message: `Top holder controls ${topHolderPct.toFixed(1)}% of supply — extreme concentration risk`, weight: 30 });
    } else if (topHolderPct > 20) {
      score += 15;
      signals.push({ type: 'warning', category: 'Contract', message: `Top holder controls ${topHolderPct.toFixed(1)}% of supply`, weight: 15 });
    }
  }

  return { score: Math.min(100, Math.max(0, score)), signals };
}

// ---- IDENTITY RISK SCORING ----
export function analyzeIdentity(wallet: WalletData): { score: number; signals: RiskSignal[] } {
  const signals: RiskSignal[] = [];
  let score = 0;

  // Interaction with known mixer patterns
  const txs = wallet.transactions;

  // Very old inactive wallet suddenly active (common scam pattern)
  if (txs.length > 1) {
    const firstTs = txs[txs.length - 1]?.timestamp || 0;
    const secondTs = txs[txs.length - 2]?.timestamp || 0;
    const gapDays = (secondTs - firstTs) / 86400000;
    if (gapDays > 180) {
      score += 20;
      signals.push({ type: 'warning', category: 'Identity', message: `Dormant wallet suddenly active after ${Math.round(gapDays / 30)} months — suspicious pattern`, weight: 20 });
    }
  }

  // Many unique counterparties (Sybil indicator)
  const counterparties = new Set(txs.map(tx => tx.from === wallet.address ? tx.to : tx.from));
  if (counterparties.size > 30 && txs.length < 50) {
    score += 15;
    signals.push({ type: 'warning', category: 'Identity', message: `High unique counterparty ratio — possible Sybil attack pattern`, weight: 15 });
  }

  // Token diversity check
  if (wallet.tokenHoldings.length > 20) {
    score += 10;
    signals.push({ type: 'info', category: 'Identity', message: `Holds ${wallet.tokenHoldings.length} different tokens — possible airdrop farmer`, weight: 10 });
  }

  // Positive: few tokens, long history = legitimate user
  if (wallet.tokenHoldings.length < 5 && txs.length > 20) {
    score -= 10;
    signals.push({ type: 'positive', category: 'Identity', message: 'Focused token holdings with regular activity — pattern consistent with genuine user', weight: -10 });
  }

  return { score: Math.min(100, Math.max(0, score)), signals };
}

// ---- FULL WALLET RISK REPORT ----
export function buildWalletRiskReport(
  wallet: WalletData,
  socialScore = 20,
): RiskScore {
  const { score: behavioral, signals: bSigs } = analyzeBehavior(wallet);
  const { score: identity, signals: iSigs } = analyzeIdentity(wallet);

  // For wallet scans (no contract), contract score is 0 if not a contract
  const contractScore = wallet.isContract ? 50 : 0;

  const total = computeFusedScore(behavioral, contractScore, socialScore, identity);
  const label = scoreLabel(total);
  const allSignals = [...bSigs, ...iSigs];

  const recs: Record<string, string> = {
    DANGEROUS: 'Do NOT interact with this address. Multiple high-risk indicators detected. This address matches known fraud patterns.',
    SUSPICIOUS: 'Proceed with extreme caution. Verify through multiple sources before any significant transaction.',
    SAFE: 'Address appears to have normal activity patterns. Standard due diligence still applies.',
  };

  return {
    total,
    behavioral,
    contract: contractScore,
    social: socialScore,
    identity,
    label,
    confidence: Math.min(95, 50 + allSignals.length * 5),
    signals: allSignals,
    recommendation: recs[label],
  };
}

export function buildContractRiskReport(
  contract: ContractData,
  tokenMetrics?: Parameters<typeof analyzeContractRisk>[1],
  socialScore = 20,
): RiskScore {
  const { score: contractScore, signals: cSigs } = analyzeContractRisk(contract, tokenMetrics);
  const behavioralScore = 30; // Default for contract-only analysis
  const identityScore = 20;

  const total = computeFusedScore(behavioralScore, contractScore, socialScore, identityScore);
  const label = scoreLabel(total);

  const recs: Record<string, string> = {
    DANGEROUS: 'HIGH RISK: Do not interact with this contract. Critical vulnerabilities detected that could result in total loss of funds.',
    SUSPICIOUS: 'CAUTION: Significant risk factors present. Only interact with funds you can afford to lose.',
    SAFE: 'Contract appears safe based on available signals. Always verify audits independently.',
  };

  return {
    total,
    behavioral: behavioralScore,
    contract: contractScore,
    social: socialScore,
    identity: identityScore,
    label,
    confidence: Math.min(95, 40 + cSigs.length * 8),
    signals: cSigs,
    recommendation: recs[label],
  };
}
