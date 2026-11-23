// Launches list, shared by tc and trade. Divider rows, 65px pitch.
// The Graph column shows gate progress only. No price, no sparkline,
// no market cap renders until a real source exists and is wired.
// Tabs that cannot be computed from verified data do not ship: the
// Market cap tab stays hidden until a price source exists.

import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    LAUNCH_CERTIFICATE,
    QUOTE_ASSETS,
    SELECTORS,
} from '../tressConfig';
import {
    decodeCertificateRecord,
    encodeUintArg,
    ethCall,
    ethGetBlockByNumber,
    readBool,
    readTokenMeta,
    readUint,
} from '../rpc';
import { useAsyncData } from '../useChain';
import { formatAge, formatDateTime, gatePercentTenths, shortenAddress } from '../format';
import {
    Badge,
    EmptyState,
    ErrorFix,
    FilterPill,
    ListGridToggle,
    PairCell,
    SkeletonRows,
    StaleLabel,
    Tabs,
} from './primitives';
import { GateBar, GateNumbers } from './GateProgress';
import { tcUrl, tradeUrl } from '../urls';

async function readGate(hookCore) {
    if (!hookCore || /^0x0{40}$/i.test(hookCore)) return null;
    try {
        const [cumulative, threshold, feeActive] = await Promise.all([
            readUint(hookCore, SELECTORS.cumulativeVolumeQuote),
            readUint(hookCore, SELECTORS.volumeThresholdQuote),
            readBool(hookCore, SELECTORS.feeActive),
        ]);
        return { cumulative, threshold, feeActive };
    } catch {
        return null;
    }
}

async function fetchAll() {
    const next = await readUint(LAUNCH_CERTIFICATE, SELECTORS.nextLaunchId);
    const count = Number(next) - 1;
    if (count <= 0) return [];
    const ids = Array.from({ length: count }, (_, i) => count - i);
    const rows = await Promise.all(
        ids.map(async (id) => {
            const hex = await ethCall(LAUNCH_CERTIFICATE, SELECTORS.recordOf + encodeUintArg(id));
            const record = { id, ...decodeCertificateRecord(hex) };
            const [tokenMeta, quoteMeta, gate, block] = await Promise.all([
                readTokenMeta(record.token).catch(() => null),
                readTokenMeta(record.quoteAsset).catch(() => null),
                readGate(record.hookCore),
                ethGetBlockByNumber(Number(record.launchBlock)).catch(() => null),
            ]);
            const knownQuote = QUOTE_ASSETS.find(
                (q) => q.address.toLowerCase() === record.quoteAsset.toLowerCase(),
            );
            return {
                record,
                tokenMeta,
                quote: knownQuote || quoteMeta,
                gate,
                launchTime: block ? Number(BigInt(block.timestamp)) : null,
            };
        }),
    );
    return rows;
}

const TABS = [
    { key: 'new', label: 'New' },
    { key: 'active', label: 'Active' },
    { key: 'near', label: 'Near graduation' },
    { key: 'graduated', label: 'Graduated' },
];

function lockBadge(record) {
    if (record.lockMode === 0) return <Badge accent>Abyssal</Badge>;
    return <Badge>Timed, unlocks {formatDateTime(record.unlockTime)}</Badge>;
}

function Row({ row, linkTo }) {
    const { record, tokenMeta, quote, gate, launchTime } = row;
    const href =
        linkTo === 'token'
            ? tradeUrl(`/token/${record.token}`)
            : tcUrl(`/launches/${record.id}`);
    const name = tokenMeta?.name || 'Unnamed token';
    const symbol = tokenMeta?.symbol || '';
    const age = launchTime ? formatAge(launchTime) : `block ${record.launchBlock.toString()}`;
    return (
        <Link className="tc-row" href={href}>
            <span className="tc-row-identity">
                <span className="tc-avatar" aria-hidden="true">
                    {(symbol || name).slice(0, 2).toUpperCase()}
                </span>
                <span>
                    <span className="tc-row-name">
                        {name}
                        {symbol && <span className="tc-row-ticker">{symbol}</span>}
                    </span>
                    <span className="tc-row-creator">
                        {shortenAddress(record.creator)} · {age} {lockBadge(record)}
                    </span>
                </span>
            </span>
            <span className="tc-row-hide-phone tc-align-right">
                <PairCell symbol={quote?.symbol} address={record.quoteAsset} />
            </span>
            <span className="tc-row-hide-phone">
                <GateBar gate={gate} />
            </span>
            <span>
                <GateNumbers gate={gate} quoteSymbol={quote?.symbol} />
            </span>
        </Link>
    );
}

function Card({ row, linkTo }) {
    const { record, tokenMeta, quote, gate, launchTime } = row;
    const href =
        linkTo === 'token'
            ? tradeUrl(`/token/${record.token}`)
            : tcUrl(`/launches/${record.id}`);
    const name = tokenMeta?.name || 'Unnamed token';
    const symbol = tokenMeta?.symbol || '';
    const age = launchTime ? formatAge(launchTime) : `block ${record.launchBlock.toString()}`;
    return (
        <Link className="tc-card" href={href}>
            <span className="tc-row-identity">
                <span className="tc-avatar" aria-hidden="true">
                    {(symbol || name).slice(0, 2).toUpperCase()}
                </span>
                <span>
                    <span className="tc-row-name">
                        {name}
                        {symbol && <span className="tc-row-ticker">{symbol}</span>}
                    </span>
                    <span className="tc-row-creator">
                        {shortenAddress(record.creator)} · {age}
                    </span>
                </span>
            </span>
            <span className="tc-block-gap-top tc-block">
                <PairCell symbol={quote?.symbol} address={record.quoteAsset} /> {lockBadge(record)}
            </span>
            <span className="tc-block-gap-top tc-block">
                <GateBar gate={gate} />
            </span>
            <span className="tc-card-value">
                <GateNumbers gate={gate} quoteSymbol={quote?.symbol} />
            </span>
        </Link>
    );
}

export function LaunchList({ linkTo, emptyAction = null }) {
    const { data: rows, asOf, loading, error, retry, stale } = useAsyncData(fetchAll, [], 'launchList');
    const [tab, setTab] = useState('new');
    const [pairFilter, setPairFilter] = useState('any');
    const [view, setView] = useState('list');

    const pairs = useMemo(() => {
        const seen = new Map();
        (rows || []).forEach((row) => {
            const key = row.record.quoteAsset.toLowerCase();
            if (!seen.has(key)) seen.set(key, row.quote?.symbol || 'Unknown');
        });
        return [...seen.entries()];
    }, [rows]);

    const filtered = useMemo(() => {
        if (!rows) return [];
        return rows.filter((row) => {
            if (pairFilter !== 'any' && row.record.quoteAsset.toLowerCase() !== pairFilter) {
                return false;
            }
            const gate = row.gate;
            if (tab === 'new') return true;
            if (tab === 'active') return gate && gate.cumulative > 0n && !gate.feeActive;
            if (tab === 'near') {
                return (
                    gate &&
                    !gate.feeActive &&
                    Number(gatePercentTenths(gate.cumulative, gate.threshold)) >= 80
                );
            }
            if (tab === 'graduated') return gate && gate.feeActive;
            return true;
        });
    }, [rows, tab, pairFilter]);

    if (loading) return <SkeletonRows copy="Loading launches." />;
    if (error) {
        return (
            <ErrorFix
                title="The chain read failed."
                fix="Check the network and try again."
                onRetry={retry}
            />
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <EmptyState
                title="No launches yet."
                body="No token has launched on Base Sepolia yet. When the first launch confirms, it appears here with its terms read straight from the chain."
                action={emptyAction}
            />
        );
    }

    return (
        <div>
            <Tabs tabs={TABS} active={tab} onChange={setTab} label="Launch filters" />
            <div className="tc-filter-row">
                <span className="tc-pill-row">
                    <FilterPill
                        label="Any pair"
                        pressed={pairFilter === 'any'}
                        onClick={() => setPairFilter('any')}
                    />
                    {pairs.map(([address, symbol]) => (
                        <FilterPill
                            key={address}
                            label={symbol}
                            pressed={pairFilter === address}
                            onClick={() => setPairFilter(address)}
                        />
                    ))}
                </span>
                <ListGridToggle view={view} onChange={setView} />
            </div>
            <p className="tc-loading-line">
                {filtered.length} {filtered.length === 1 ? 'launch' : 'launches'}{' '}
                <StaleLabel asOf={asOf} stale={stale} />
            </p>
            {filtered.length === 0 ? (
                <EmptyState
                    title="No launches match this filter."
                    body="Try another tab or pair. The list itself is not empty."
                />
            ) : view === 'list' ? (
                <div>
                    <div className="tc-column-heads" aria-hidden="true">
                        <span>Token</span>
                        <span>Pair</span>
                        <span>Graph</span>
                        <span>Gate progress</span>
                    </div>
                    {filtered.map((row) => (
                        <Row key={row.record.id} row={row} linkTo={linkTo} />
                    ))}
                </div>
            ) : (
                <div className="tc-grid">
                    {filtered.map((row) => (
                        <Card key={row.record.id} row={row} linkTo={linkTo} />
                    ))}
                </div>
            )}
        </div>
    );
}
