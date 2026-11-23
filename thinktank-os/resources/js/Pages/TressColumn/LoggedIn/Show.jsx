// Launch detail and certificate. Sections in PRD order: Terms, Gate
// progress, Certificate, Trade entry. Every address links to the
// explorer. Every field matches the on-chain record.

import { Link } from '@inertiajs/react';
import {
    FEE_TIERS,
    HOOK_CERTIFICATE_FACTORY,
    QUOTE_ASSETS,
    SELECTORS,
    TOPICS,
} from '../../../TressColumn/tressConfig';
import {
    decodeLaunchedLog,
    ethCall,
    ethGetLogs,
    readAddress,
    readBool,
    readTokenMeta,
    readUint,
} from '../../../TressColumn/rpc';
import { useAsyncData, useGate, useLaunchRecord } from '../../../TressColumn/useChain';
import {
    formatDateTime,
    formatTokenAmount,
    formatUsdGate,
    isZeroAddress,
    shortenAddress,
} from '../../../TressColumn/format';
import { TressShell } from '../../../TressColumn/components/TressShell';
import { AddressLink, Badge, EmptyState, ErrorFix, SkeletonRows } from '../../../TressColumn/components/primitives';
import { GateProgress } from '../../../TressColumn/components/GateProgress';
import { CertificateDoc } from '../../../TressColumn/components/CertificateDoc';
import { tcUrl, tradeUrl } from '../../../TressColumn/urls';

function pct(bps) {
    return `${(Number(bps) / 100).toFixed(1)}%`;
}

function useLaunchEvent(launchId, launchBlock) {
    return useAsyncData(async () => {
        // The Launched event is emitted by the launch transaction itself,
        // so it sits at the record's launch block. No record, no scan.
        if (!launchBlock) return { event: null, complete: true };
        const from = BigInt(launchBlock);
        const topic = `0x${BigInt(launchId).toString(16).padStart(64, '0')}`;
        const { logs, complete } = await ethGetLogs(
            {
                address: HOOK_CERTIFICATE_FACTORY,
                topics: [TOPICS.launched, topic],
                fromBlock: `0x${from.toString(16)}`,
                toBlock: `0x${(from + 500n).toString(16)}`,
            },
            { maxPages: 4 },
        );
        return { event: logs.length > 0 ? decodeLaunchedLog(logs[0]) : null, complete };
    }, [launchId, launchBlock ? launchBlock.toString() : ''], 'launchList');
}

function useGuardsAndVesting(record) {
    return useAsyncData(async () => {
        if (!record) return null;
        const [capAmount, capBlocks, capActive, maxSwap, maxSwapBlocks] = await Promise.all([
            readUint(record.token, SELECTORS.walletCapAmount).catch(() => null),
            readUint(record.token, SELECTORS.walletCapBlocks).catch(() => null),
            readBool(record.token, SELECTORS.capActive).catch(() => null),
            readUint(record.hookCore, SELECTORS.maxSwapQuoteAmount).catch(() => null),
            readUint(record.hookCore, SELECTORS.maxSwapBlocks).catch(() => null),
        ]);
        let vesting = null;
        if (!isZeroAddress(record.vestingVault)) {
            const [beneficiary, cliff, duration, start, allocation] = await Promise.all([
                readAddress(record.vestingVault, SELECTORS.vaultBeneficiary).catch(() => null),
                readUint(record.vestingVault, SELECTORS.vaultCliffSeconds).catch(() => null),
                readUint(record.vestingVault, SELECTORS.vaultDurationSeconds).catch(() => null),
                readUint(record.vestingVault, SELECTORS.vaultStartTime).catch(() => null),
                readUint(record.vestingVault, SELECTORS.vaultTotalAllocation).catch(() => null),
            ]);
            vesting = { beneficiary, cliff, duration, start, allocation };
        }
        let merkleRoot = null;
        if (!isZeroAddress(record.airdropDistributor)) {
            merkleRoot = await ethCall(
                record.airdropDistributor,
                SELECTORS.distributorMerkleRoot,
            ).catch(() => null);
        }
        return { capAmount, capBlocks, capActive, maxSwap, maxSwapBlocks, vesting, merkleRoot };
    }, [record?.token || '', record?.hookCore || ''], 'launchList');
}

function useMetas(record) {
    return useAsyncData(async () => {
        if (!record) return null;
        const [tokenMeta, quoteMeta] = await Promise.all([
            readTokenMeta(record.token).catch(() => null),
            readTokenMeta(record.quoteAsset).catch(() => null),
        ]);
        const knownQuote = QUOTE_ASSETS.find(
            (q) => q.address.toLowerCase() === record.quoteAsset.toLowerCase(),
        );
        return { tokenMeta, quote: knownQuote || quoteMeta };
    }, [record?.token || '', record?.quoteAsset || ''], 'tokenMeta');
}

export default function Show({ launchId }) {
    const recordState = useLaunchRecord(launchId);
    const record = recordState.data;
    const gateState = useGate(record?.hookCore);
    const metasState = useMetas(record);
    const guardsState = useGuardsAndVesting(record);
    const eventState = useLaunchEvent(launchId, record?.launchBlock);

    const tokenMeta = metasState.data?.tokenMeta || null;
    const quote = metasState.data?.quote || null;
    const title = tokenMeta ? `${tokenMeta.name} (${tokenMeta.symbol})` : `Launch ${launchId}`;

    return (
        <TressShell surface="tc" title={title} active="launches">
            {recordState.loading && <SkeletonRows copy="Loading launch terms." />}
            {recordState.error && (
                <ErrorFix
                    title="The chain read failed."
                    fix="Check the network and try again."
                    onRetry={recordState.retry}
                />
            )}
            {!recordState.loading && !recordState.error && !record && (
                <EmptyState
                    title="No launch with this number yet."
                    body="The certificate record is empty. The launch may not exist, or the number is wrong."
                    action={
                        <Link className="tc-button-primary" href={tcUrl()}>
                            Back to Launches
                        </Link>
                    }
                />
            )}

            {record && (
                <div>
                    <p className="tc-lede">
                        Launched by {shortenAddress(record.creator)}. Block{' '}
                        {record.launchBlock.toString()}.{' '}
                        {record.lockMode === 0 ? (
                            <Badge accent>Abyssal</Badge>
                        ) : (
                            <Badge>Timed, unlocks {formatDateTime(record.unlockTime)}</Badge>
                        )}
                    </p>

                    <section className="tc-section" aria-labelledby="tc-terms-h">
                        <h2 className="tc-h2" id="tc-terms-h"><span className="tc-index">//02</span>Terms</h2>
                        <dl className="tc-terms">
                            <div className="tc-term">
                                <dt>Supply</dt>
                                <dd>{formatTokenAmount(record.totalSupply, 18)}</dd>
                            </div>
                            <div className="tc-term">
                                <dt>Distribution split</dt>
                                <dd>
                                    {pct(record.vestingBps)} vesting, {pct(record.airdropBps)} airdrop,{' '}
                                    {pct(record.liquidityBps)} liquidity. Sums to 100%.
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Lock mode</dt>
                                <dd>{record.lockMode === 0 ? 'Abyssal, forever' : 'Timed'}</dd>
                            </div>
                            <div className="tc-term">
                                <dt>Unlock timestamp</dt>
                                <dd>
                                    {record.lockMode === 0
                                        ? '0, meaning forever'
                                        : formatDateTime(record.unlockTime)}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>LP fee mode</dt>
                                <dd>
                                    {record.lpFeeMode === 0 ? 'Creator claimable' : 'Dead, compounded'}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Vesting terms</dt>
                                <dd>
                                    {isZeroAddress(record.vestingVault)
                                        ? 'No vesting.'
                                        : guardsState.data?.vesting
                                          ? `Beneficiary ${shortenAddress(guardsState.data.vesting.beneficiary)}. Cliff ${guardsState.data.vesting.cliff} seconds, duration ${guardsState.data.vesting.duration} seconds.`
                                          : 'Reading from the vault.'}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Pool fee tier</dt>
                                <dd>
                                    {(Number(record.poolFeeTier) / 10000).toFixed(2)}%, tick spacing{' '}
                                    {FEE_TIERS.find((t) => t.fee === record.poolFeeTier)?.tickSpacing ?? 'unknown'}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Gate threshold</dt>
                                <dd>
                                    {formatTokenAmount(record.volumeThresholdQuote, quote?.decimals ?? 18)}{' '}
                                    {quote?.symbol || 'quote units'}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>USD anchor</dt>
                                <dd>{formatUsdGate(record.usdGate)}</dd>
                            </div>
                            <div className="tc-term">
                                <dt>Wallet cap guard</dt>
                                <dd>
                                    {guardsState.data?.capAmount === null ||
                                    guardsState.data?.capAmount === undefined
                                        ? 'Could not be read.'
                                        : guardsState.data.capAmount === 0n
                                          ? 'Off.'
                                          : `${formatTokenAmount(guardsState.data.capAmount, 18)} tokens for ${guardsState.data.capBlocks} blocks. ${guardsState.data.capActive ? 'Active now.' : 'Window passed.'}`}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Max swap guard</dt>
                                <dd>
                                    {guardsState.data?.maxSwap === null ||
                                    guardsState.data?.maxSwap === undefined
                                        ? 'Could not be read.'
                                        : guardsState.data.maxSwap === 0n
                                          ? 'Off.'
                                          : `${formatTokenAmount(guardsState.data.maxSwap, quote?.decimals ?? 18)} ${quote?.symbol || ''} for ${guardsState.data.maxSwapBlocks} blocks.`}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Locker</dt>
                                <dd><AddressLink address={record.locker} /></dd>
                            </div>
                            <div className="tc-term">
                                <dt>Vesting vault</dt>
                                <dd>
                                    {isZeroAddress(record.vestingVault) ? 'None' : <AddressLink address={record.vestingVault} />}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Airdrop distributor</dt>
                                <dd>
                                    {isZeroAddress(record.airdropDistributor) ? 'None' : <AddressLink address={record.airdropDistributor} />}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Hook accounting</dt>
                                <dd><AddressLink address={record.hookCore} /></dd>
                            </div>
                            <div className="tc-term">
                                <dt>TCHook</dt>
                                <dd>
                                    {eventState.data?.event ? (
                                        <AddressLink address={eventState.data.event.hook} />
                                    ) : (
                                        'Read from the launch event.'
                                    )}
                                </dd>
                            </div>
                            <div className="tc-term">
                                <dt>Pool id</dt>
                                <dd className="tc-mono">
                                    {eventState.data?.event ? eventState.data.event.poolId : 'Read from the launch event.'}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="tc-section" aria-labelledby="tc-gate-h">
                        <h2 className="tc-h2" id="tc-gate-h"><span className="tc-index">//03</span>Gate progress</h2>
                        {gateState.loading && <p className="tc-loading-line">Loading gate progress.</p>}
                        {gateState.error && (
                            <ErrorFix
                                title="The gate read failed."
                                fix="Check the network and try again."
                                onRetry={gateState.retry}
                            />
                        )}
                        {!gateState.loading && !gateState.error && (
                            <div>
                                <p className="tc-lede">
                                    Cumulative volume {formatTokenAmount(gateState.data?.cumulative ?? 0n, quote?.decimals ?? 18)}{' '}
                                    {quote?.symbol || ''} of a{' '}
                                    {formatTokenAmount(record.volumeThresholdQuote, quote?.decimals ?? 18)}{' '}
                                    {quote?.symbol || ''} threshold.
                                </p>
                                <GateProgress
                                    gate={gateState.data}
                                    quoteSymbol={quote?.symbol}
                                    asOf={gateState.asOf}
                                    stale={gateState.stale}
                                    showRule
                                    showFeeNote
                                />
                            </div>
                        )}
                    </section>

                    <section className="tc-section" aria-labelledby="tc-cert-h">
                        <h2 className="tc-h2" id="tc-cert-h"><span className="tc-index">//04</span>Certificate</h2>
                        <CertificateDoc
                            record={record}
                            launchId={launchId}
                            tokenMeta={tokenMeta}
                            gate={gateState.data}
                            gateAsOf={gateState.asOf}
                            gateStale={gateState.stale}
                            quoteSymbol={quote?.symbol}
                            quoteDecimals={quote?.decimals ?? 18}
                        />
                    </section>

                    <section className="tc-section" aria-labelledby="tc-trade-h">
                        <h2 className="tc-h2" id="tc-trade-h"><span className="tc-index">//05</span>Trade</h2>
                        <Link className="tc-button-primary" href={tradeUrl(`/token/${record.token}`)}>
                            Open the token page
                        </Link>
                    </section>
                </div>
            )}
        </TressShell>
    );
}
