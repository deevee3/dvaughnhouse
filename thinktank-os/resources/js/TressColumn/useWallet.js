// Wallet state hook. One hook for every surface: connect, chain,
// disconnect, and the return-visit resurface of pending transactions.

import { useCallback, useEffect, useState } from 'react';
import { CHAIN_ID } from './tressConfig';
import {
    connectInjected,
    connectWalletConnect as connectWalletConnectProvider,
    disconnectWalletConnect as disconnectWalletConnectProvider,
    getInjectedAccounts,
    getWalletChainId,
    hasInjectedWallet,
    isWalletConnectConfigured,
    onWalletAccountsChanged,
    onWalletChainChanged,
    resurfacePending,
    switchToSepolia,
} from './wallet';

export function useWallet() {
    const [address, setAddress] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [settled, setSettled] = useState([]);
    const [connectMethod, setConnectMethod] = useState(null); // 'injected' | 'walletconnect' | null

    useEffect(() => {
        let alive = true;
        getInjectedAccounts().then((accounts) => {
            if (alive && accounts.length > 0) setAddress(accounts[0]);
        });
        getWalletChainId().then((id) => {
            if (alive) setChainId(id);
        });
        const offAccounts = onWalletAccountsChanged((accounts) => {
            setAddress(accounts.length > 0 ? accounts[0] : null);
        });
        const offChain = onWalletChainChanged((id) => setChainId(id));
        return () => {
            alive = false;
            offAccounts();
            offChain();
        };
    }, []);

    const connect = useCallback(async () => {
        setConnecting(true);
        setError(null);
        try {
            const account = await connectInjected();
            setAddress(account);
            const id = await getWalletChainId();
            setChainId(id);
            const done = await resurfacePending(account);
            setSettled(done);
            setConnectMethod('injected');
            return account;
        } catch (err) {
            setError(err);
            return null;
        } finally {
            setConnecting(false);
        }
    }, []);

    // WalletConnect path (QR / mobile wallet). Refuses to start without
    // a configured project ID — see wallet.js, fail-closed by design.
    const connectWalletConnect = useCallback(async () => {
        setConnecting(true);
        setError(null);
        try {
            const account = await connectWalletConnectProvider();
            setAddress(account);
            const id = await getWalletChainId();
            setChainId(id);
            const done = await resurfacePending(account);
            setSettled(done);
            setConnectMethod('walletconnect');
            return account;
        } catch (err) {
            setError(err);
            return null;
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (connectMethod === 'walletconnect') {
            disconnectWalletConnectProvider();
        }
        // Injected wallets have no programmatic disconnect. This forgets
        // the wallet here. The wallet itself stays connected until the
        // user disconnects there. Said plainly in the UI.
        setAddress(null);
        setSettled([]);
        setConnectMethod(null);
    }, [connectMethod]);

    const switchNetwork = useCallback(async () => {
        setError(null);
        try {
            await switchToSepolia();
            const id = await getWalletChainId();
            setChainId(id);
        } catch (err) {
            setError(err);
        }
    }, []);

    return {
        address,
        chainId,
        isCorrectNetwork: chainId === CHAIN_ID,
        hasProvider: hasInjectedWallet(),
        walletConnectAvailable: isWalletConnectConfigured(),
        connectMethod,
        connecting,
        error,
        connect,
        connectWalletConnect,
        disconnect,
        switchNetwork,
        settled,
        clearSettled: () => setSettled([]),
    };
}
