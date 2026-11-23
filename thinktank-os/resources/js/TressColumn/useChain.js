// Chain-data hooks. Every hook returns the same shape: data, asOf,
// loading, error, retry, stale. Loading shows skeleton rows, errors
// follow the error-fix pattern, and any figure older than its
// freshness window carries a stale label with its as-of time.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    CHAIN_ID,
    DEPLOY_BLOCK,
    DISTRIBUTION_FACTORY,
    FRESHNESS_WINDOWS_MS,
    HOOK_CERTIFICATE_FACTORY,
    LAUNCH_CERTIFICATE,
    SELECTORS,
    TOPICS,
    TREASURY_SAFE,
} from './tressConfig';
import {
    decodeCertificateRecord,
    decodeLaunchedLog,
    encodeAddressArg,
    encodeUintArg,
    ethBlockNumber,
    ethCall,
    ethChainId,
    ethGetBalance,
    ethGetBlockByNumber,
    ethGetCode,
    ethGetLogs,
    readAddress,
    readBool,
    readUint,
} from './rpc';

export function useAsyncData(fetcher, deps, windowKey) {
    const [data, setData] = useState(null);
    const [asOf, setAsOf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const cancelled = useRef(false);

    const retry = useCallback(() => {
        setAttempt((a) => a + 1);
    }, []);

    useEffect(() => {
        cancelled.current = false;
        setLoading(true);
        setError(null);
        let alive = true;
        fetcher()
            .then((result) => {
                if (!alive) return;
                setData(result);
                setAsOf(Date.now());
                setLoading(false);
            })
            .catch((err) => {
                if (!alive) return;
                setError(err);
                setLoading(false);
            });
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, attempt]);

    const stale =
        asOf !== null &&
        windowKey &&
        Date.now() - asOf > (FRESHNESS_WINDOWS_MS[windowKey] ?? Infinity);

    return { data, asOf, loading, error, retry, stale };
}

export function useChainGuard() {
    return useAsyncData(async () => {
        const chainId = await ethChainId();
        if (chainId !== CHAIN_ID) {
            throw new Error(
                `The chain read came back on chain ${chainId}, not Base Sepolia (${CHAIN_ID}).`,
            );
        }
        return chainId;
    }, []);
}

export function useNextLaunchId() {
    return useAsyncData(async () => {
        const next = await readUint(LAUNCH_CERTIFICATE, SELECTORS.nextLaunchId);
        return Number(next);
    }, [], 'launchList');
}

// All launches, newest first. The count comes from nextLaunchId, so
// zero launches costs one read and no event scan.
export function useLaunchList() {
    return useAsyncData(async () => {
        const next = await readUint(LAUNCH_CERTIFICATE, SELECTORS.nextLaunchId);
        const count = Number(next) - 1;
        if (count <= 0) return [];
        const ids = Array.from({ length: count }, (_, i) => count - i);
        const records = await Promise.all(
            ids.map(async (id) => {
                const hex = await ethCall(
                    LAUNCH_CERTIFICATE,
                    SELECTORS.recordOf + encodeUintArg(id),
                );
                return { id, ...decodeCertificateRecord(hex) };
            }),
        );
        return records;
    }, [], 'launchList');
}

export function useLaunchRecord(launchId) {
    return useAsyncData(async () => {
        const hex = await ethCall(
            LAUNCH_CERTIFICATE,
            SELECTORS.recordOf + encodeUintArg(launchId),
        );
        const record = decodeCertificateRecord(hex);
        if (/^0x0{40}$/i.test(record.token)) return null;
        return { id: launchId, ...record };
    }, [launchId], 'launchList');
}

export function useGate(hookCore) {
    return useAsyncData(async () => {
        if (!hookCore || /^0x0{40}$/i.test(hookCore)) return null;
        const [cumulative, threshold, active, fees] = await Promise.all([
            readUint(hookCore, SELECTORS.cumulativeVolumeQuote),
            readUint(hookCore, SELECTORS.volumeThresholdQuote),
            readBool(hookCore, SELECTORS.feeActive),
            readUint(hookCore, SELECTORS.totalFeesQuote),
        ]);
        return { cumulative, threshold, feeActive: active, totalFeesQuote: fees };
    }, [hookCore], 'gateProgress');
}

export function usePart1Status() {
    return useAsyncData(async () => {
        const [deployed, distributed, token, locker, vestingVault, airdropDistributor, deployTimestamp, launched] =
            await Promise.all([
                readBool(DISTRIBUTION_FACTORY, SELECTORS.deployed),
                readBool(DISTRIBUTION_FACTORY, SELECTORS.distributed),
                readAddress(DISTRIBUTION_FACTORY, SELECTORS.part1Token),
                readAddress(DISTRIBUTION_FACTORY, SELECTORS.part1Locker),
                readAddress(DISTRIBUTION_FACTORY, SELECTORS.part1VestingVault),
                readAddress(DISTRIBUTION_FACTORY, SELECTORS.part1AirdropDistributor),
                readUint(DISTRIBUTION_FACTORY, SELECTORS.part1DeployTimestamp),
                readBool(
                    HOOK_CERTIFICATE_FACTORY,
                    SELECTORS.launched + encodeAddressArg(DISTRIBUTION_FACTORY),
                ),
            ]);
        return {
            deployed,
            distributed,
            token,
            locker,
            vestingVault,
            airdropDistributor,
            deployTimestamp,
            launched,
        };
    }, [], 'part1Status');
}

export function useSafeRead() {
    return useAsyncData(async () => {
        const [balance, code, threshold] = await Promise.all([
            ethGetBalance(TREASURY_SAFE),
            ethGetCode(TREASURY_SAFE),
            readUint(TREASURY_SAFE, SELECTORS.getThreshold),
        ]);
        return { balance, hasCode: code && code !== '0x', threshold: Number(threshold) };
    }, [], 'safeBalance');
}

export function useBlockTime(blockNumber) {
    return useAsyncData(async () => {
        if (blockNumber === null || blockNumber === undefined) return null;
        const block = await ethGetBlockByNumber(Number(blockNumber));
        return block ? Number(BigInt(block.timestamp)) : null;
    }, [String(blockNumber)], 'launchList');
}

// Creator scan window, in blocks. The relay pages in 200-block
// chunks (25 per request) and this hook caps total pages at 10, so
// one scan covers at most 10 x 25 x 200 = 50,000 blocks. The scan
// runs BACKWARD from the latest block, so it covers the most recent
// 50,000 blocks: a launch made today is found, a launch older than
// that window is not. Full coverage from DEPLOY_BLOCK needs the
// indexer, which is not built. An incomplete scan says so instead
// of pretending it finished.
const CREATOR_SCAN_MAX_BLOCKS = 50000;

// Launches created by one address, from Launched events. Bounded
// backward scan: the most recent CREATOR_SCAN_MAX_BLOCKS blocks.
// complete is true only when the scan reached DEPLOY_BLOCK; any
// older window left unscanned makes it false, and the page says so.
export function useLaunchedByCreator(creator) {
    return useAsyncData(async () => {
        if (!creator) return { launches: [], complete: true, scanFrom: DEPLOY_BLOCK, scanTo: DEPLOY_BLOCK + CREATOR_SCAN_MAX_BLOCKS - 1 };
        const latest = await ethBlockNumber();
        const scanFrom = Math.max(DEPLOY_BLOCK, latest - CREATOR_SCAN_MAX_BLOCKS + 1);
        const scanTo = latest;
        const topic = `0x${creator.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
        const { logs, complete: windowComplete } = await ethGetLogs(
            {
                address: HOOK_CERTIFICATE_FACTORY,
                topics: [TOPICS.launched, null, null, topic],
                fromBlock: `0x${scanFrom.toString(16)}`,
                toBlock: `0x${scanTo.toString(16)}`,
            },
            { maxPages: 10 },
        );
        return {
            launches: logs.map(decodeLaunchedLog).reverse(),
            complete: windowComplete && scanFrom === DEPLOY_BLOCK,
            scanFrom,
            scanTo,
        };
    }, [creator], 'launchList');
}
