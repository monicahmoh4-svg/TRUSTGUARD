// lib/blockchain.ts
// Real blockchain data via Etherscan & Alchemy APIs

export interface WalletData {
  address: string;
  balance: string;
  balanceUSD: number;
  txCount: number;
  firstSeen: string;
  lastActive: string;
  transactions: Transaction[];
  tokenHoldings: TokenHolding[];
  contractInteractions: string[];
  isContract: boolean;
  contractCreator?: string;
  ens?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  timestamp: number;
  gasPrice: string;
  isError: boolean;
  functionName?: string;
}

export interface TokenHolding {
  symbol: string;
  name: string;
  balance: string;
  contractAddress: string;
  decimals: number;
}

export interface ContractData {
  address: string;
  name?: string;
  compiler?: string;
  isVerified: boolean;
  sourceCode?: string;
  abi?: string;
  creator?: string;
  creationTx?: string;
  deployedAt?: string;
  isProxy?: boolean;
  implementation?: string;
}

const ETHERSCAN_BASE = 'https://api.etherscan.io/api';
const BSCSCAN_BASE = 'https://api.bscscan.com/api';
const POLYGONSCAN_BASE = 'https://api.polygonscan.com/api';

function getScannerBase(chain: string): string {
  switch (chain) {
    case 'bnb': return BSCSCAN_BASE;
    case 'polygon': return POLYGONSCAN_BASE;
    default: return ETHERSCAN_BASE;
  }
}

function getScannerKey(chain: string): string {
  switch (chain) {
    case 'bnb': return process.env.BSCSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '';
    case 'polygon': return process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '';
    default: return process.env.ETHERSCAN_API_KEY || '';
  }
}

async function fetchScanner(params: Record<string, string>, chain = 'eth') {
  const base = getScannerBase(chain);
  const key = getScannerKey(chain);
  const url = new URL(base);
  Object.entries({ ...params, apikey: key }).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Scanner API error: ${res.status}`);
  const data = await res.json();
  if (data.status === '0' && data.message !== 'No transactions found') {
    if (data.message !== 'No records found' && data.message !== 'No data found') {
      console.warn('Scanner warning:', data.message, data.result);
    }
  }
  return data;
}

export async function resolveAddress(addressOrEns: string, chain = 'eth'): Promise<string> {
  if (/^0x[0-9a-fA-F]{40}$/.test(addressOrEns)) return addressOrEns;
  return addressOrEns;
}

export async function getWalletData(address: string, chain = 'eth'): Promise<WalletData> {
  const [balanceRes, txListRes, tokenRes, codeRes] = await Promise.allSettled([
    fetchScanner({ module: 'account', action: 'balance', address, tag: 'latest' }, chain),
    fetchScanner({ module: 'account', action: 'txlist', address, startblock: '0', endblock: '99999999', page: '1', offset: '100', sort: 'desc' }, chain),
    fetchScanner({ module: 'account', action: 'tokenlist', address }, chain),
    fetchScanner({ module: 'proxy', action: 'eth_getCode', address, tag: 'latest' }, chain),
  ]);

  const balanceWei = balanceRes.status === 'fulfilled' ? (balanceRes.value?.result || '0') : '0';
  const balanceEth = parseFloat(balanceWei) / 1e18;

  let ethPrice = 3500;
  try {
    const priceRes = await fetchScanner({ module: 'stats', action: 'ethprice' }, 'eth');
    ethPrice = parseFloat(priceRes?.result?.ethusd || '3500');
  } catch (_) {}

  const txList: Transaction[] = [];
  if (txListRes.status === 'fulfilled' && Array.isArray(txListRes.value?.result)) {
    for (const tx of txListRes.value.result.slice(0, 50)) {
      const valueEth = parseFloat(tx.value) / 1e18;
      txList.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: valueEth.toFixed(6),
        valueUSD: valueEth * ethPrice,
        timestamp: parseInt(tx.timeStamp) * 1000,
        gasPrice: tx.gasPrice,
        isError: tx.isError === '1',
        functionName: tx.functionName || undefined,
      });
    }
  }

  const tokens: TokenHolding[] = [];
  if (tokenRes.status === 'fulfilled' && Array.isArray(tokenRes.value?.result)) {
    for (const t of tokenRes.value.result.slice(0, 20)) {
      tokens.push({
        symbol: t.symbol,
        name: t.name,
        balance: (parseFloat(t.balance) / Math.pow(10, parseInt(t.decimals || '18'))).toFixed(4),
        contractAddress: t.contractAddress,
        decimals: parseInt(t.decimals || '18'),
      });
    }
  }

  const isContract = codeRes.status === 'fulfilled' &&
    codeRes.value?.result && codeRes.value.result !== '0x';

  const firstTx = txList[txList.length - 1];
  const lastTx = txList[0];

  const uniqueContracts = Array.from(
    new Set(txList.map(tx => tx.to).filter(a => a && a !== address))
  ).slice(0, 20);

  return {
    address,
    balance: balanceEth.toFixed(6),
    balanceUSD: balanceEth * ethPrice,
    txCount: txList.length,
    firstSeen: firstTx ? new Date(firstTx.timestamp).toISOString() : 'Unknown',
    lastActive: lastTx ? new Date(lastTx.timestamp).toISOString() : 'Unknown',
    transactions: txList,
    tokenHoldings: tokens,
    contractInteractions: uniqueContracts,
    isContract,
  };
}

export async function getContractData(address: string, chain = 'eth'): Promise<ContractData> {
  const [sourceRes, abiRes, creatorRes] = await Promise.allSettled([
    fetchScanner({ module: 'contract', action: 'getsourcecode', address }, chain),
    fetchScanner({ module: 'contract', action: 'getabi', address }, chain),
    fetchScanner({ module: 'contract', action: 'getcontractcreation', contractaddresses: address }, chain),
  ]);

  let name, compiler, isVerified = false, sourceCode, abi, isProxy = false, implementation;

  if (sourceRes.status === 'fulfilled' && Array.isArray(sourceRes.value?.result) && sourceRes.value.result[0]) {
    const src = sourceRes.value.result[0];
    name = src.ContractName || undefined;
    compiler = src.CompilerVersion || undefined;
    isVerified = src.SourceCode !== '';
    sourceCode = src.SourceCode?.slice(0, 2000);
    isProxy = src.Proxy === '1';
    implementation = src.Implementation || undefined;
  }

  if (abiRes.status === 'fulfilled' && abiRes.value?.result && abiRes.value.result !== 'Contract source code not verified') {
    abi = abiRes.value.result;
  }

  let creator, creationTx, deployedAt;
  if (creatorRes.status === 'fulfilled' && Array.isArray(creatorRes.value?.result) && creatorRes.value.result[0]) {
    const c = creatorRes.value.result[0];
    creator = c.contractCreator;
    creationTx = c.txHash;
    try {
      const txRes = await fetchScanner({ module: 'proxy', action: 'eth_getTransactionByHash', txhash: creationTx }, chain);
      if (txRes?.result?.blockNumber) {
        const blockRes = await fetchScanner({ module: 'proxy', action: 'eth_getBlockByNumber', tag: txRes.result.blockNumber, boolean: 'false' }, chain);
        if (blockRes?.result?.timestamp) {
          deployedAt = new Date(parseInt(blockRes.result.timestamp, 16) * 1000).toISOString();
        }
      }
    } catch (_) {}
  }

  return { address, name, compiler, isVerified, sourceCode, abi, creator, creationTx, deployedAt, isProxy, implementation };
}

export async function getTokenMetrics(contractAddress: string, chain = 'eth') {
  const [supplyRes, holdersRes] = await Promise.allSettled([
    fetchScanner({ module: 'stats', action: 'tokensupply', contractaddress: contractAddress }, chain),
    fetchScanner({ module: 'token', action: 'tokenholderlist', contractaddress: contractAddress, page: '1', offset: '10' }, chain),
  ]);

  return {
    totalSupply: supplyRes.status === 'fulfilled' ? supplyRes.value?.result : null,
    holderCount: holdersRes.status === 'fulfilled' && Array.isArray(holdersRes.value?.result) ? holdersRes.value.result.length : null,
    topHolders: holdersRes.status === 'fulfilled' && Array.isArray(holdersRes.value?.result)
      ? holdersRes.value.result.slice(0, 5).map((h: { TokenHolderAddress: string; TokenHolderQuantity: string }) => ({
          address: h.TokenHolderAddress,
          quantity: h.TokenHolderQuantity,
        }))
      : [],
  };
}

export async function getKnownScamAddresses(): Promise<Set<string>> {
  const known = new Set([
    '0x00000000219ab540356cbb839cbe05303d7705fa',
    '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae',
  ]);
  return known;
}
