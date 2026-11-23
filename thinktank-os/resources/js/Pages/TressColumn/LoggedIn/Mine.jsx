// My launches: launches created by the signed-in wallet, plus the
// Part 1 pending state with its resume action. An orphaned Part 1 is
// labeled plainly: nothing is economically live until Part 2 confirms.

import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    CHAIN_ID,
    DISTRIBUTION_FACTORY,
    LAUNCH_CERTIFICATE,
    QUOTE_ASSETS,
    SELECTORS,
} from '../../../TressColumn/tressConfig';
import { decodeCertificateRecord, encodeUintArg, ethCall, ethGetBlockByNumber, readBool, readTokenMeta, readUint } from '../../../TressColumn/rpc';
import { useAsyncData, useLaunchedByCreator, usePart1Status } from '../../../TressColumn/useChain';
import { useWallet } from '../../../TressColumn/useWallet';
import { SignInPrompt, TressShell } from '../../../TressColumn/components/TressShell';
import { AddressLink, EmptyState, ErrorFix, PairCell, SkeletonRows } from '../../../TressColumn/components/primitives';
import { GateBar, GateNumbers } from '../../../TressColumn/components/GateProgress';
import { formatAge } from '../../../TressColumn/format';
import { tcUrl } from '../../../TressColumn/urls';

function useMyRecords(events) {
    return useAsyncData(async () => {
        if (!events) return [];
        const rows = await Promise.all(
            events.map(async (event) => {
                const hex = await ethCall(
                    LAUNCH_CERTIFICATE,
                    SELECTORS.recordOf + encodeUintArg(event.certificateId),
                );
                const record = { id: Number(event.certificateId), event, ...decodeCertificateRecord(hex) };
                const [tokenMeta, quoteMeta, gate, block] = await Promise.all([
                    readTokenMeta(record.token).catch(() => null),
                    readTokenMeta(record.quoteAsset).catch(() => null),
                    (async () => {
                        if (/^0x0{40}$/i.test(record.hookCore)) return null;
                        try {
                            const [cumulative, threshold, feeActive] = await Promise.all([
                                readUint(record.hookCore, SELECTORS.cumulativeVolumeQuote),
                                readUint(record.hookCore, SELECTORS.volumeThresholdQuote),
                                readBool(record.hookCore, SELECTORS.feeActive),
                            ]);
                            return { cumulative, threshold, feeActive };
                        } catch {
                            return null;
                        }
                    })(),
                    ethGetBlockByNumber(Number(record.launchBlock)).catch(() => null),
                ]);
                const knownQuote = QUOTE_ASSETS.find(
                    (q) => q.address.toLowerCase() === record.quoteAsset.toLowerCase(),
                );
                return {
                    ...record,
                    tokenMeta,
                    quote: knownQuote || quoteMeta,
                    gate,
                    launchTime: block ? Number(BigInt(block.timestamp)) : null,
                };
            }),
        );
        return rows;
    }, [JSON.stringify((events || []).map((e) => e.transactionHash))], 'launchList');
}

export default function Mine() {
    const { auth } = usePage().props;
    const user = auth?.user || null;
    const wallet = useWallet();
    const [stored, setStored] = useState(null);
    const part1 = usePart1Status();
    const created = useLaunchedByCreator(wallet.address);
    const records = useMyRecords(created.data?.launches);

    useEffect(() => {
        if (!wallet.address) {
            setStored(null);
            return;
        }
        try {
            const raw = window.localStorage.getItem(`tc.part1.${CHAIN_ID}.${wallet.address.toLowerCase()}`);
            setStored(raw ? JSON.parse(raw) : null);
        } catch {
            setStored(null);
        }
    }, [wallet.address]);

    const part1Pending =
        stored &&
        part1.data?.deployed === true &&
        part1.data?.launched === false &&
        stored.part1 === DISTRIBUTION_FACTORY.toLowerCase();

    return (
        <TressShell surface="tc" title="My launches" active="mine">
            {!user && <SignInPrompt what="see your launches" returnTo={tcUrl('/mine')} />}

            {user && !wallet.address && (
                <div className="tc-empty">
                    <p className="tc-empty-title">Connect a wallet to see your launches.</p>
                    <p className="tc-empty-body">
                        Launches are found by the wallet address that created them. Signing in
                        does not connect a wallet. Connecting a wallet does not sign you in.
                    </p>
                    <button type="button" className="tc-button-primary" onClick={wallet.connect} disabled={wallet.connecting}>
                        Connect a wallet
                    </button>
                    {wallet.error && <p className="tc-field-error">{wallet.error.message}</p>}
                </div>
            )}

            {user && wallet.address && (
                <div>
                    {part1Pending && (
                        <section className="tc-section" aria-labelledby="tc-pending-h">
                            <h2 className="tc-h2" id="tc-pending-h"><span className="tc-index">//02</span>Step 1 done, step 2 pending</h2>
                            <p className="tc-lede">
                                Part 1 deployed for {stored.form?.symbol || 'this launch'}. Nothing is
                                economically live until Part 2 confirms. The launch is resumable.
                            </p>
                            <dl className="tc-terms">
                                <div className="tc-term">
                                    <dt>Part 1 factory</dt>
                                    <dd><AddressLink address={DISTRIBUTION_FACTORY} /></dd>
                                </div>
                                <div className="tc-term">
                                    <dt>Step 1 transaction</dt>
                                    <dd><AddressLink address={stored.deployTx} kind="tx" /></dd>
                                </div>
                            </dl>
                            <div className="tc-block-gap-top">
                                <Link className="tc-button-primary" href={tcUrl('/start')}>
                                    Resume step 2
                                </Link>
                            </div>
                        </section>
                    )}

                    <section className="tc-section" aria-labelledby="tc-created-h">
                        <h2 className="tc-h2" id="tc-created-h"><span className="tc-index">//03</span>Launches you created</h2>
                        {created.loading && <SkeletonRows copy="Loading your launches." />}
                        {created.error && (
                            <ErrorFix
                                title="The chain read failed."
                                fix="Check the network and try again."
                                onRetry={created.retry}
                            />
                        )}
                        {!created.loading && !created.error && created.data?.launches.length === 0 && (
                            <EmptyState
                                title="No launches yet."
                                body="Launches you create with this wallet appear here."
                                action={
                                    <Link className="tc-button-primary" href={tcUrl('/start')}>
                                        Start a launch
                                    </Link>
                                }
                            />
                        )}
                        {!created.loading && !created.error && created.data && created.data.launches.length > 0 && (
                            <div>
                                {records.loading && <SkeletonRows copy="Loading launch records." />}
                                {records.data?.map((row) => {
                                    const name = row.tokenMeta?.name || 'Unnamed token';
                                    const symbol = row.tokenMeta?.symbol || '';
                                    const age = row.launchTime
                                        ? formatAge(row.launchTime)
                                        : `block ${row.launchBlock.toString()}`;
                                    return (
                                        <Link key={row.id} className="tc-row" href={tcUrl(`/launches/${row.id}`)}>
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
                                                        {row.creator.slice(0, 6)}...{row.creator.slice(-4)} · {age}
                                                    </span>
                                                </span>
                                            </span>
                                            <span className="tc-row-hide-phone tc-align-right">
                                                <PairCell symbol={row.quote?.symbol} address={row.quoteAsset} />
                                            </span>
                                            <span className="tc-row-hide-phone">
                                                <GateBar gate={row.gate} />
                                            </span>
                                            <span>
                                                <GateNumbers gate={row.gate} quoteSymbol={row.quote?.symbol} />
                                            </span>
                                        </Link>
                                    );
                                })}
                                {created.data.complete === false && (
                                    <p className="tc-loading-line">
                                        The scan covers the most recent 50,000 blocks only, blocks{' '}
                                        {created.data.scanFrom?.toLocaleString()} to{' '}
                                        {created.data.scanTo?.toLocaleString()}. Launches
                                        older than that are not shown here. Older launches
                                        need the indexer, which is not built.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </TressShell>
    );
}
