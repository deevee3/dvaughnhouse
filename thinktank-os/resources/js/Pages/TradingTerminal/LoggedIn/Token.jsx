// Token page. Chart and depth render nothing until a real source
// exists and is wired. Gate progress shows for Tress Column tokens
// only. Every Tress Column token page links its certificate.

import { Link } from '@inertiajs/react';
import {
    LAUNCH_CERTIFICATE,
    QUOTE_ASSETS,
    SELECTORS,
} from '../../../TressColumn/tressConfig';
import {
    decodeCertificateRecord,
    encodeUintArg,
    ethCall,
    ethGetCode,
    readTokenMeta,
    readUint,
} from '../../../TressColumn/rpc';
import { useAsyncData, useGate } from '../../../TressColumn/useChain';
import { TressShell } from '../../../TressColumn/components/TressShell';
import { Badge, EmptyState, ErrorFix, SkeletonRows } from '../../../TressColumn/components/primitives';
import { GateProgress } from '../../../TressColumn/components/GateProgress';
import { SwapTicket } from '../../../TressColumn/components/SwapTicket';
import { tcUrl, tradeUrl } from '../../../TressColumn/urls';

function useTokenPage(tokenAddress) {
    return useAsyncData(async () => {
        const code = await ethGetCode(tokenAddress);
        if (!code || code === '0x') return { exists: false };
        const meta = await readTokenMeta(tokenAddress).catch(() => null);
        const next = await readUint(LAUNCH_CERTIFICATE, SELECTORS.nextLaunchId);
        const count = Number(next) - 1;
        let record = null;
        for (let id = count; id >= 1; id--) {
            const hex = await ethCall(LAUNCH_CERTIFICATE, SELECTORS.recordOf + encodeUintArg(id));
            const candidate = { id, ...decodeCertificateRecord(hex) };
            if (candidate.token.toLowerCase() === tokenAddress.toLowerCase()) {
                record = candidate;
                break;
            }
        }
        let quote = null;
        if (record) {
            quote =
                QUOTE_ASSETS.find((q) => q.address.toLowerCase() === record.quoteAsset.toLowerCase()) ||
                (await readTokenMeta(record.quoteAsset).catch(() => null));
        }
        return { exists: true, meta, record, quote };
    }, [tokenAddress], 'tokenMeta');
}

export default function Token({ tokenAddress }) {
    const page = useTokenPage(tokenAddress);
    const record = page.data?.record || null;
    const gateState = useGate(record?.hookCore);
    const meta = page.data?.meta || null;
    const title = meta ? `${meta.name} (${meta.symbol})` : 'Token';

    return (
        <TressShell surface="trade" title={title} active="markets">
            {page.loading && <SkeletonRows copy="Loading token." />}
            {page.error && (
                <ErrorFix
                    title="The chain read failed."
                    fix="Check the network and try again."
                    onRetry={page.retry}
                />
            )}
            {!page.loading && !page.error && page.data && !page.data.exists && (
                <EmptyState
                    title="No token contract at this address."
                    body="The address holds no code on Base Sepolia."
                    action={
                        <Link className="tc-button-primary" href={tradeUrl()}>
                            Back to Markets
                        </Link>
                    }
                />
            )}

            {!page.loading && !page.error && page.data?.exists && (
                <div>
                    <p className="tc-lede">
                        {record ? (
                            <>
                                A Tress Column launch. <Badge accent>Tress Column</Badge>{' '}
                                <Link href={tcUrl(`/launches/${record.id}`)}>
                                    Launch certificate {record.id}
                                </Link>
                            </>
                        ) : (
                            'This token is not a Tress Column launch.'
                        )}{' '}
                        Chart and depth need a price source. None is wired, so neither
                        renders. No placeholder chart, no invented depth.
                    </p>

                    {record && (
                        <section className="tc-section" aria-labelledby="tc-gate-h">
                            <h2 className="tc-h2" id="tc-gate-h"><span className="tc-index">//02</span>Gate progress</h2>
                            {gateState.loading && <p className="tc-loading-line">Loading gate progress.</p>}
                            {gateState.error && (
                                <ErrorFix
                                    title="The gate read failed."
                                    fix="Check the network and try again."
                                    onRetry={gateState.retry}
                                />
                            )}
                            {!gateState.loading && !gateState.error && (
                                <GateProgress
                                    gate={gateState.data}
                                    quoteSymbol={page.data.quote?.symbol}
                                    asOf={gateState.asOf}
                                    stale={gateState.stale}
                                    showRule
                                    showFeeNote
                                />
                            )}
                        </section>
                    )}

                    <section className="tc-section" aria-labelledby="tc-swap-h">
                        <h2 className="tc-h2" id="tc-swap-h"><span className="tc-index">//03</span>Swap</h2>
                        <SwapTicket
                            tokenMeta={meta}
                            isTcToken={!!record}
                            gate={gateState.data}
                            quoteSymbol={page.data.quote?.symbol}
                        />
                    </section>

                    {record && (
                        <section className="tc-section" aria-labelledby="tc-cert-h">
                            <h2 className="tc-h2" id="tc-cert-h"><span className="tc-index">//04</span>Certificate</h2>
                            <Link className="tc-button-primary" href={tcUrl(`/launches/${record.id}`)}>
                                Read the certificate
                            </Link>
                        </section>
                    )}
                </div>
            )}
        </TressShell>
    );
}
