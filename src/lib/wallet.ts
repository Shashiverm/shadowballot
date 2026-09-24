import { WalletState, MidnightNetwork } from './types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const STORAGE_WALLET_KEY = 'shadowballot_mobile_enclave_v1';

export interface DiscoveredWallet {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  apiVersion?: string;
  instance: any;
}

export interface MobileEnclaveData {
  unshieldedAddress: string;
  shieldedAddress: string;
  seed: string;
  created: string;
}

/**
 * Scan window.midnight for all injected Midnight wallets
 * compliant with CAIP-372 / @midnight-ntwrk/dapp-connector-api v4
 */
export function discoverMidnightWallets(): DiscoveredWallet[] {
  const wallets: DiscoveredWallet[] = [];

  if (typeof window === 'undefined') return wallets;

  const midnightObj = (window as any).midnight;

  if (midnightObj && typeof midnightObj === 'object') {
    for (const key of Object.keys(midnightObj)) {
      const entry = midnightObj[key];
      if (entry && typeof entry === 'object') {
        wallets.push({
          id: key,
          name: entry.name || (key === 'mnLace' ? 'Midnight Lace' : key),
          icon: entry.icon || '',
          rdns: entry.rdns,
          apiVersion: entry.apiVersion,
          instance: entry
        });
      }
    }
  }

  return wallets;
}

/**
 * Get or create local device cryptographic enclave (for mobile & sandbox testing)
 */
export function getOrCreateMobileEnclave(): MobileEnclaveData {
  const stored = localStorage.getItem(STORAGE_WALLET_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // re-initialize on parse failure
    }
  }

  const entropy = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const enclave: MobileEnclaveData = {
    unshieldedAddress: `mn_addr_test1${entropy.substring(0, 24)}`,
    shieldedAddress: `mn_shielded1${entropy.substring(0, 32)}`,
    seed: `shielded_entropy_${entropy}`,
    created: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(enclave));
  return enclave;
}

/**
 * Normalizes raw network identifier from Lace into supported MidnightNetwork ('preprod' | 'preview')
 */
export function normalizeNetworkId(raw: string | undefined | null): MidnightNetwork {
  if (!raw) return 'preprod';
  const clean = String(raw).toLowerCase();
  if (clean.includes('preview')) return 'preview';
  return 'preprod';
}

/**
 * Connect to an injected Midnight wallet (Lace, etc.) via official DApp Connector API v4
 * Sets the global network ID using setNetworkId('preprod' | 'preview')
 */
export async function connectInjectedWallet(
  walletId?: string,
  targetNetwork: MidnightNetwork = 'preprod'
): Promise<WalletState> {
  const midnightObj = (window as any).midnight;

  if (!midnightObj) {
    throw new Error('No Midnight wallet detected in browser. Please install the Midnight Lace extension.');
  }

  // Set the global network identifier in Midnight.js runtime
  setNetworkId(targetNetwork);

  // Find target candidate wallet
  let targetWallet = walletId ? midnightObj[walletId] : null;

  if (!targetWallet) {
    if (midnightObj.mnLace) {
      targetWallet = midnightObj.mnLace;
    } else {
      const keys = Object.keys(midnightObj);
      if (keys.length > 0) {
        targetWallet = midnightObj[keys[0]];
      }
    }
  }

  if (!targetWallet) {
    throw new Error('No compatible Midnight wallet provider found.');
  }

  try {
    let connectedApi: any;
    let actualNetwork: MidnightNetwork = targetNetwork;

    // Official DApp Connector API v4: targetWallet.connect(networkId)
    if (typeof targetWallet.connect === 'function') {
      try {
        connectedApi = await targetWallet.connect(targetNetwork);
      } catch (firstErr: any) {
        const errMsg = String(firstErr?.message || firstErr || '');
        const isMismatch = /network\s*id\s*mismatch|mismatch/i.test(errMsg);

        if (isMismatch) {
          // Attempt connect with fallback network
          const fallbackNet: MidnightNetwork = targetNetwork === 'preprod' ? 'preview' : 'preprod';
          try {
            connectedApi = await targetWallet.connect(fallbackNet);
            actualNetwork = fallbackNet;
            setNetworkId(fallbackNet);
          } catch {
            // Attempt connect() with no argument
            try {
              connectedApi = await (targetWallet.connect as any)();
            } catch {
              throw new Error(
                `Network ID mismatch: Lace is set to a different network. ` +
                `Please switch the active network in your Midnight Lace extension to ${targetNetwork.toUpperCase()}.`
              );
            }
          }
        } else {
          throw firstErr;
        }
      }
    } else if (typeof targetWallet.enable === 'function') {
      // Legacy enable fallback
      connectedApi = await targetWallet.enable();
    } else {
      throw new Error('Wallet provider does not implement DApp Connector connect() method.');
    }

    // Inspect detected network from connected API if exposed
    try {
      if (typeof connectedApi.getNetworkId === 'function') {
        const netId = await connectedApi.getNetworkId();
        if (netId) {
          actualNetwork = normalizeNetworkId(netId);
          setNetworkId(actualNetwork);
        }
      } else if (targetWallet.networkId) {
        actualNetwork = normalizeNetworkId(targetWallet.networkId);
        setNetworkId(actualNetwork);
      }
    } catch {
      // keep actualNetwork
    }

    // Retrieve real unshielded address (NEVER FABRICATED)
    let unshieldedAddress = '';
    if (typeof connectedApi.getUnshieldedAddress === 'function') {
      const addrObj = await connectedApi.getUnshieldedAddress();
      unshieldedAddress = addrObj?.unshieldedAddress || '';
    } else if (typeof connectedApi.getUnshieldedAddresses === 'function') {
      const addrs = await connectedApi.getUnshieldedAddresses();
      unshieldedAddress = addrs[0] || '';
    } else if (typeof connectedApi.state === 'function') {
      const stateObj = await connectedApi.state();
      unshieldedAddress = stateObj?.address || '';
    }

    if (!unshieldedAddress) {
      throw new Error('Connected Midnight wallet did not expose an active account address.');
    }

    // Retrieve real shielded address if available
    let shieldedAddress = '';
    try {
      if (typeof connectedApi.getShieldedAddresses === 'function') {
        const shieldedObj = await connectedApi.getShieldedAddresses();
        shieldedAddress = shieldedObj?.shieldedAddress || '';
      }
    } catch {
      // optional
    }

    // Retrieve real dust / token balance (NEVER FABRICATED)
    let balance = 0;
    let dustBalance: bigint | undefined = undefined;
    try {
      if (typeof connectedApi.getDustBalance === 'function') {
        const dust = await connectedApi.getDustBalance();
        if (dust && dust.balance !== undefined) {
          dustBalance = BigInt(dust.balance);
          balance = Number(dustBalance);
        }
      } else if (typeof connectedApi.getUnshieldedBalances === 'function') {
        const balances = await connectedApi.getUnshieldedBalances();
        if (balances && typeof balances === 'object') {
          const firstVal = Object.values(balances)[0];
          if (firstVal !== undefined) {
            balance = Number(firstVal);
          }
        }
      }
    } catch {
      balance = 0;
    }

    return {
      isConnected: true,
      isConnecting: false,
      isInstalled: true,
      address: unshieldedAddress,
      shieldedAddress,
      balance,
      dustBalance,
      network: actualNetwork,
      walletName: targetWallet.name || 'Midnight Lace Extension',
      isDevKeystore: false,
      error: null,
      dappApiInstance: connectedApi
    };
  } catch (err: any) {
    throw new Error(err?.message || 'Failed to authenticate with Midnight wallet.');
  }
}

/**
 * Connect to Mobile Enclave / Local Dev Sandbox Keystore
 */
export async function connectMobileEnclave(network: MidnightNetwork = 'preprod'): Promise<WalletState> {
  setNetworkId(network);
  const enclave = getOrCreateMobileEnclave();
  return {
    isConnected: true,
    isConnecting: false,
    isInstalled: true,
    address: enclave.unshieldedAddress,
    shieldedAddress: enclave.shieldedAddress,
    balance: 0,
    network,
    walletName: 'Mobile Midnight Enclave (Shielded)',
    isDevKeystore: true,
    error: null
  };
}
