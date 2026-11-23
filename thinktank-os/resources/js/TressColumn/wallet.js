// Wallet connection: injected wallets (EIP-1193) today.
//
// WalletConnect is decided (PRD Q8) but NOT WIRED: it needs the
// WalletConnect package installed, and no install happens without his
// explicit tap naming it. The wallet module is structured so the
// WalletConnect path plugs in beside the injected path. Nothing here
// fakes a WalletConnect session.
//
// A wallet is separate from sign-in. Connecting never signs the user
// in. Signing out never disconnects the wallet and never cancels a
// pending transaction: submitted transactions are recorded locally
// and their receipts are re-checked on reconnect, by address scan.

import {
    CHAIN_HEX,
    CHAIN_ID,
    CHAIN_NAME,
    EXPLORER_BASE,
} from './tressConfig';
import { ethGetTransactionReceipt } from './rpc';

// WalletConnect project ID (Reown Cloud). Empty = WalletConnect stays
// off and the injected path is the only way to connect. Create a project
// at cloud.reown.com and set VITE_WALLETCONNECT_PROJECT_ID in .env.
export function getWalletConnectProjectId() {
    if (typeof import.meta === 'undefined' || !import.meta.env) return null;
    const id = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '').trim();
    return id || null;
}

export function isWalletConnectConfigured() {
    return getWalletConnectProjectId() !== null;
}

// 'wired' once a project ID is configured; 'not-configured' until then.
// Nothing here fakes a WalletConnect session: without a project ID the
// WalletConnect path refuses to start (fail-closed).
export const WALLETCONNECT_STATUS = isWalletConnectConfigured() ? 'wired' : 'not-configured';

export const WALLETCONNECT_NOTE = isWalletConnectConfigured()
    ? 'WalletConnect is available. Use a browser wallet or scan with a mobile wallet.'
    : 'WalletConnect is not set up yet (no project ID). Use a browser wallet for now.';

export class WalletError extends Error {
    constructor(message, code = null) {
        super(message);
        this.name = 'WalletError';
        this.code = code;
    }
}

export function getInjectedProvider() {
    if (typeof window === 'undefined') return null;
    return window.ethereum || null;
}

export function hasInjectedWallet() {
    return getInjectedProvider() !== null;
}

// The provider the user connected with (injected or WalletConnect).
// Null until a connect call succeeds; getActiveProvider() falls back to
// window.ethereum so read-only calls keep working before any connect.
let activeProvider = null;
let activeProviderKind = null; // 'injected' | 'walletconnect' | null

export function getActiveProvider() {
    return activeProvider || getInjectedProvider();
}

export function getActiveProviderKind() {
    return activeProviderKind;
}

function friendlyError(err) {
    if (err && (err.code === 4001 || err.code === 'ACTION_REJECTED')) {
        return new WalletError('You declined in the wallet. Nothing was sent.', 4001);
    }
    if (err && err.message) {
        return new WalletError(err.message, err.code ?? null);
    }
    return new WalletError('The wallet request failed. Try again.', null);
}

export async function connectInjected() {
    const provider = getInjectedProvider();
    if (!provider) {
        throw new WalletError(
            'No browser wallet was found. Install one, then try again.',
            'no-provider',
        );
    }
    try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new WalletError('No account was shared by the wallet.', 'no-account');
        }
        activeProvider = provider;
        activeProviderKind = 'injected';
        return accounts[0].toLowerCase();
    } catch (err) {
        if (err instanceof WalletError) throw err;
        throw friendlyError(err);
    }
}

// WalletConnect path. Lazy-imports the provider package so the main
// bundle stays lean; refuses to start without a project ID (fail-closed).
let walletConnectProvider = null;

export async function connectWalletConnect() {
    const projectId = getWalletConnectProjectId();
    if (!projectId) {
        throw new WalletError(
            'WalletConnect is not set up yet. Add a Reown project ID (VITE_WALLETCONNECT_PROJECT_ID) and try again.',
            'not-configured',
        );
    }
    try {
        const { default: EthereumProvider } = await import('@walletconnect/ethereum-provider');
        walletConnectProvider = await EthereumProvider.init({
            projectId,
            chains: [CHAIN_ID],
            showQrModal: true,
            rpcMap: { [CHAIN_ID]: 'https://sepolia.base.org' },
        });
        const accounts = await walletConnectProvider.enable();
        if (!accounts || accounts.length === 0) {
            throw new WalletError('No account was shared by the wallet.', 'no-account');
        }
        activeProvider = walletConnectProvider;
        activeProviderKind = 'walletconnect';
        return accounts[0].toLowerCase();
    } catch (err) {
        if (err instanceof WalletError) throw err;
        throw friendlyError(err);
    }
}

export async function getWalletConnectAccounts() {
    if (!walletConnectProvider) return [];
    try {
        const accounts =
            walletConnectProvider.accounts ||
            (await walletConnectProvider.request({ method: 'eth_accounts' }));
        return (accounts || []).map((a) => a.toLowerCase());
    } catch {
        return [];
    }
}

export async function disconnectWalletConnect() {
    if (walletConnectProvider) {
        try {
            await walletConnectProvider.disconnect();
        } catch {
            // Already disconnected; the local state below still clears.
        }
        walletConnectProvider = null;
    }
    if (activeProviderKind === 'walletconnect') {
        activeProvider = null;
        activeProviderKind = null;
    }
}

export async function getInjectedAccounts() {
    const provider = getInjectedProvider();
    if (!provider) return [];
    try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        return (accounts || []).map((a) => a.toLowerCase());
    } catch {
        return [];
    }
}

export async function getWalletChainId() {
    const provider = getActiveProvider();
    if (!provider) return null;
    try {
        const hex = await provider.request({ method: 'eth_chainId' });
        return Number(BigInt(hex));
    } catch {
        return null;
    }
}

export async function switchToSepolia() {
    const provider = getActiveProvider();
    if (!provider) {
        throw new WalletError('No browser wallet was found.', 'no-provider');
    }
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN_HEX }],
        });
    } catch (err) {
        if (err && err.code === 4902) {
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: CHAIN_HEX,
                            chainName: CHAIN_NAME,
                            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['https://sepolia.base.org'],
                            blockExplorerUrls: [EXPLORER_BASE],
                        },
                    ],
                });
            } catch (addErr) {
                throw friendlyError(addErr);
            }
        } else {
            throw friendlyError(err);
        }
    }
}

export async function sendWalletTransaction({ from, to, data, valueWei = 0n }) {
    const provider = getActiveProvider();
    if (!provider) {
        throw new WalletError('No browser wallet was found.', 'no-provider');
    }
    const chainId = await getWalletChainId();
    if (chainId !== CHAIN_ID) {
        throw new WalletError(
            `The wallet is on the wrong network. Switch to ${CHAIN_NAME} (chain ${CHAIN_ID}).`,
            'wrong-network',
        );
    }
    try {
        const hash = await provider.request({
            method: 'eth_sendTransaction',
            params: [
                {
                    from,
                    to,
                    data,
                    value: `0x${BigInt(valueWei).toString(16)}`,
                },
            ],
        });
        return hash;
    } catch (err) {
        if (err instanceof WalletError) throw err;
        throw friendlyError(err);
    }
}

export function onWalletAccountsChanged(handler) {
    const provider = getActiveProvider();
    if (!provider || !provider.on) return () => {};
    const wrapped = (accounts) => handler((accounts || []).map((a) => a.toLowerCase()));
    provider.on('accountsChanged', wrapped);
    return () => provider.removeListener('accountsChanged', wrapped);
}

export function onWalletChainChanged(handler) {
    const provider = getActiveProvider();
    if (!provider || !provider.on) return () => {};
    const wrapped = (hex) => handler(Number(BigInt(hex)));
    provider.on('chainChanged', wrapped);
    return () => provider.removeListener('chainChanged', wrapped);
}

// --- Local transaction record ---------------------------------------
//
// Submitted transactions are stored per chain so a return visit can
// resurface results after sign-out, disconnect, or a closed tab. The
// record holds hashes and labels only: no keys, no params, no secrets.
// Launch params for resume live under a separate key (see LaunchFlow).

const TX_KEY = `tc.txs.${CHAIN_ID}`;

export function loadTxRecords() {
    try {
        const raw = window.localStorage.getItem(TX_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function recordTx({ hash, kind, label, from, to }) {
    const records = loadTxRecords();
    if (records.some((r) => r.hash.toLowerCase() === hash.toLowerCase())) return records;
    const next = [
        ...records,
        {
            hash,
            kind,
            label,
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            submittedAt: Date.now(),
            status: 'pending',
        },
    ].slice(-50);
    try {
        window.localStorage.setItem(TX_KEY, JSON.stringify(next));
    } catch {
        // Storage full or blocked: the chain stays the source of truth.
    }
    return next;
}

export function updateTxRecord(hash, patch) {
    const records = loadTxRecords().map((r) =>
        r.hash.toLowerCase() === hash.toLowerCase() ? { ...r, ...patch } : r,
    );
    try {
        window.localStorage.setItem(TX_KEY, JSON.stringify(records));
    } catch {
        // See recordTx.
    }
    return records;
}

// Re-check every pending record for one address. Called when the
// wallet connects, so results from an earlier visit surface on return.
export async function resurfacePending(address) {
    const mine = loadTxRecords().filter(
        (r) => r.from === address.toLowerCase() && r.status === 'pending',
    );
    const settled = [];
    for (const record of mine) {
        try {
            const receipt = await ethGetTransactionReceipt(record.hash);
            if (receipt) {
                const status = receipt.status === '0x1' ? 'confirmed' : 'failed';
                updateTxRecord(record.hash, {
                    status,
                    blockNumber: receipt.blockNumber,
                    settledAt: Date.now(),
                });
                settled.push({ ...record, status, receipt });
            }
        } catch {
            // A failed read leaves the record pending. Next visit retries.
        }
    }
    return settled;
}

export async function waitForReceipt(hash, { timeoutMs = 120000, intervalMs = 3000 } = {}) {
    const started = Date.now();
    for (;;) {
        const receipt = await ethGetTransactionReceipt(hash);
        if (receipt) return receipt;
        if (Date.now() - started > timeoutMs) return null;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}
