// lib/ai.ts
// Anthropic API integration for TrustGuard AI analysis

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are TrustGuard AI, an expert crypto security analyst. You specialize in:
- Blockchain fraud detection and wallet behavioral analysis
- Smart contract vulnerability assessment (rug pulls, honeypots, exploits)
- Social engineering scam detection in crypto communities
- DeFi security, MEV attacks, Sybil attacks, phishing
- M-Pesa and mobile money integration risks in emerging markets (especially Kenya/East Africa)

Always be direct, specific, and actionable. Use technical language where appropriate. 
Format responses clearly. Never give financial advice — focus on security analysis only.
When identifying risks, cite specific on-chain patterns or code patterns as evidence.`;

export async function analyzeWallet(params: {
  address: string;
  chain: string;
  riskData: {
    total: number;
    behavioral: number;
    contract: number;
    social: number;
    identity: number;
    label: string;
    signals: Array<{ type: string; category: string; message: string }>;
  };
  walletSummary: {
    balance: string;
    balanceUSD: number;
    txCount: number;
    firstSeen: string;
    lastActive: string;
    tokenCount: number;
    isContract: boolean;
  };
}): Promise<string> {
  const prompt = `Analyze this ${params.chain.toUpperCase()} wallet address for fraud and security risks:

Address: ${params.address}
Risk Score: ${params.riskData.total}/100 (${params.riskData.label})
Balance: ${params.walletSummary.balance} ETH (~$${params.walletSummary.balanceUSD.toFixed(0)} USD)
Transaction Count: ${params.walletSummary.txCount}
First Seen: ${params.walletSummary.firstSeen}
Last Active: ${params.walletSummary.lastActive}
Token Holdings: ${params.walletSummary.tokenCount} tokens
Is Contract: ${params.walletSummary.isContract}

Sub-scores: Behavioral ${params.riskData.behavioral}/100 | Contract ${params.riskData.contract}/100 | Social ${params.riskData.social}/100 | Identity ${params.riskData.identity}/100

Detected signals:
${params.riskData.signals.map(s => `- [${s.type.toUpperCase()}] ${s.category}: ${s.message}`).join('\n')}

Provide a 3-4 paragraph security assessment. Cover:
1. Overall risk assessment with key evidence
2. The most critical concern and why it matters
3. Specific patterns detected and what they indicate
4. Clear recommendation for any user considering interacting with this address

Be specific, technical, and direct.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : 'Analysis unavailable.';
}

export async function analyzeContract(params: {
  address: string;
  chain: string;
  contractData: {
    name?: string;
    isVerified: boolean;
    compiler?: string;
    deployedAt?: string;
    isProxy?: boolean;
    sourceCodeSnippet?: string;
    creator?: string;
  };
  riskData: {
    total: number;
    contract: number;
    label: string;
    signals: Array<{ type: string; category: string; message: string }>;
  };
  tokenMetrics?: {
    totalSupply?: string | null;
    holderCount?: number | null;
    topHolderPct?: number;
  };
}): Promise<{ summary: string; verdict: string; criticalRisks: string[]; warnings: string[]; positiveSignals: string[]; recommendation: string }> {
  const prompt = `Analyze this smart contract for security risks and fraud patterns:

Contract Address: ${params.address} (${params.chain.toUpperCase()})
Contract Name: ${params.contractData.name || 'Unknown'}
Verified: ${params.contractData.isVerified}
Deployed: ${params.contractData.deployedAt || 'Unknown'}
Compiler: ${params.contractData.compiler || 'Unknown'}
Creator: ${params.contractData.creator || 'Unknown'}
Is Proxy: ${params.contractData.isProxy || false}

Risk Score: ${params.riskData.total}/100 (${params.riskData.label})
Contract Risk Sub-score: ${params.riskData.contract}/100

Token Metrics: ${params.tokenMetrics ? `Supply: ${params.tokenMetrics.totalSupply || 'N/A'} | Holders: ${params.tokenMetrics.holderCount || 'N/A'} | Top holder: ${params.tokenMetrics.topHolderPct?.toFixed(1) || 'N/A'}%` : 'Not a token'}

Detected signals:
${params.riskData.signals.map(s => `- [${s.type.toUpperCase()}] ${s.category}: ${s.message}`).join('\n')}

${params.contractData.sourceCodeSnippet ? `Source code snippet (first 500 chars):\n${params.contractData.sourceCodeSnippet.slice(0, 500)}` : ''}

Return a JSON object with exactly these fields:
{
  "summary": "2-3 sentence technical overview",
  "verdict": "SAFE|CAUTION|DANGEROUS",
  "criticalRisks": ["list", "of", "critical", "issues"],
  "warnings": ["moderate", "concerns"],
  "positiveSignals": ["trust", "indicators"],
  "recommendation": "one clear action sentence for the user"
}

Return ONLY valid JSON. No markdown code blocks.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      summary: `Contract at ${params.address} has been analyzed with risk score ${params.riskData.total}/100.`,
      verdict: params.riskData.label === 'DANGEROUS' ? 'DANGEROUS' : params.riskData.label === 'SUSPICIOUS' ? 'CAUTION' : 'SAFE',
      criticalRisks: params.riskData.signals.filter(s => s.type === 'critical').map(s => s.message),
      warnings: params.riskData.signals.filter(s => s.type === 'warning').map(s => s.message),
      positiveSignals: params.riskData.signals.filter(s => s.type === 'positive').map(s => s.message),
      recommendation: params.riskData.label === 'DANGEROUS' ? 'Do not interact with this contract.' : 'Proceed with caution.',
    };
  }
}

export async function analyzeSocialContent(content: string): Promise<{
  threatType: string;
  confidence: number;
  redFlags: string[];
  manipulationTactics: string[];
  verdict: 'PHISHING' | 'SCAM' | 'SUSPICIOUS' | 'LEGITIMATE' | 'UNKNOWN';
  analysis: string;
  recommendation: string;
}> {
  const prompt = `You are TrustGuard AI's NLP Scam Detection Engine. Analyze this crypto-related content for fraud signals:

CONTENT TO ANALYZE:
"${content.slice(0, 2000)}"

Classify and analyze this content. Return a JSON object with exactly:
{
  "threatType": "Phishing|Fake Airdrop|Rug Pull Promotion|FOMO Manipulation|Pump and Dump|Romance Scam|Legitimate|Unknown",
  "confidence": <number 0-100>,
  "redFlags": ["list of specific red flags"],
  "manipulationTactics": ["psychological tactics used"],
  "verdict": "PHISHING|SCAM|SUSPICIOUS|LEGITIMATE|UNKNOWN",
  "analysis": "3-4 sentence technical analysis of why this is or isn't a scam",
  "recommendation": "What the user should do"
}

Be specific. Cite exact phrases from the content as evidence. Return ONLY valid JSON.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      threatType: 'Unknown',
      confidence: 50,
      redFlags: ['Unable to parse analysis'],
      manipulationTactics: [],
      verdict: 'UNKNOWN',
      analysis: 'Content analyzed. Please review manually.',
      recommendation: 'Exercise caution with any unsolicited crypto offer.',
    };
  }
}

export async function analyzeIdentityGraph(params: {
  address: string;
  chain: string;
  connectedAddresses: string[];
  txPatterns: string;
}): Promise<string> {
  const prompt = `Analyze the identity graph for this ${params.chain.toUpperCase()} wallet:

Address: ${params.address}
Connected Addresses (${params.connectedAddresses.length}): ${params.connectedAddresses.slice(0, 10).join(', ')}
Transaction Patterns: ${params.txPatterns}

Provide a 3-4 sentence identity graph analysis covering:
1. Clustering patterns and what they suggest about this wallet's operator
2. Sybil attack indicators (if any)
3. Network connections to known fraud networks (if any)
4. Overall identity risk assessment

Be specific and technical.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : 'Identity analysis complete.';
}

export async function chatWithAnalyst(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : 'I am unable to process that request right now.';
}
