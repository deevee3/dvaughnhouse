// The launch certificate, rendered from the on-chain record. Spec
// palette, record document. Every field on screen matches the
// LaunchCertificate record for the launch. Nothing here is editable,
// and transfer moves no rights.

import { CHAIN_NAME, LAUNCH_CERTIFICATE } from '../tressConfig';
import {
    formatDateTime,
    formatTokenAmount,
    formatUsdGate,
    isZeroAddress,
} from '../format';
import { AddressLink } from './primitives';
import { GateProgress } from './GateProgress';

function pct(bps) {
    return `${(Number(bps) / 100).toFixed(1)}%`;
}

function feeTierLabel(tier) {
    // Pool fee tier is Uniswap v4 millionths: 3000 = 0.30%.
    return `${(Number(tier) / 10000).toFixed(2)}%`;
}

export function CertificateDoc({
    record,
    launchId,
    tokenMeta = null,
    gate = null,
    gateAsOf = null,
    gateStale = false,
    quoteSymbol = null,
    quoteDecimals = 18,
}) {
    const abyssal = record.lockMode === 0;
    const name = tokenMeta?.name || 'Unnamed token';
    const symbol = tokenMeta?.symbol || '';

    return (
        <div className="tc-certificate">
            <div className="tc-certificate-inner">
                <p className="tc-certificate-title">
                    {name} {symbol && <span>({symbol})</span>}
                </p>
                <p className="tc-certificate-sub">
                    Launch certificate {launchId} on {CHAIN_NAME}. Minted by the
                    factory to the creator. The record is frozen. There is no
                    update function.
                </p>

                {abyssal ? (
                    <span className="tc-certificate-seal">Abyssal lock. Locked forever.</span>
                ) : (
                    <span className="tc-certificate-seal tc-certificate-seal-timed">
                        Timed lock. Unlocks {formatDateTime(record.unlockTime)}.
                    </span>
                )}

                <div className="tc-section tc-block-gap-top">
                    <dl className="tc-terms">
                        <div className="tc-term">
                            <dt>Token</dt>
                            <dd>
                                <AddressLink address={record.token} kind="token" />
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Creator</dt>
                            <dd>
                                <AddressLink address={record.creator} />
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Quote asset</dt>
                            <dd>
                                <AddressLink address={record.quoteAsset} kind="token" />
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Total supply</dt>
                            <dd>{formatTokenAmount(record.totalSupply, 18)}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Vesting share</dt>
                            <dd>{pct(record.vestingBps)}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Airdrop share</dt>
                            <dd>{pct(record.airdropBps)}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Liquidity share</dt>
                            <dd>{pct(record.liquidityBps)}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Lock mode</dt>
                            <dd>{abyssal ? 'Abyssal (forever)' : 'Timed'}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Unlock time</dt>
                            <dd>
                                {abyssal
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
                            <dt>Pool fee tier</dt>
                            <dd>{feeTierLabel(record.poolFeeTier)}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Gate threshold</dt>
                            <dd>
                                {formatTokenAmount(record.volumeThresholdQuote, quoteDecimals)}{' '}
                                {quoteSymbol || 'quote units'}
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>USD anchor</dt>
                            <dd>{formatUsdGate(record.usdGate)}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Locker</dt>
                            <dd>
                                <AddressLink address={record.locker} />
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Vesting vault</dt>
                            <dd>
                                {isZeroAddress(record.vestingVault) ? (
                                    'None'
                                ) : (
                                    <AddressLink address={record.vestingVault} />
                                )}
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Airdrop distributor</dt>
                            <dd>
                                {isZeroAddress(record.airdropDistributor) ? (
                                    'None'
                                ) : (
                                    <AddressLink address={record.airdropDistributor} />
                                )}
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Hook accounting</dt>
                            <dd>
                                <AddressLink address={record.hookCore} />
                            </dd>
                        </div>
                        <div className="tc-term">
                            <dt>Launch block</dt>
                            <dd>{record.launchBlock.toString()}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Chain</dt>
                            <dd>{record.chainId.toString()}</dd>
                        </div>
                        <div className="tc-term">
                            <dt>Certificate contract</dt>
                            <dd>
                                <AddressLink address={LAUNCH_CERTIFICATE} kind="token" />
                            </dd>
                        </div>
                    </dl>
                </div>

                {gate && (
                    <div className="tc-section">
                        <h3 className="tc-h2">Gate progress</h3>
                        <GateProgress
                            gate={gate}
                            quoteSymbol={quoteSymbol}
                            asOf={gateAsOf}
                            stale={gateStale}
                            showRule
                            showFeeNote
                        />
                    </div>
                )}

                <p className="tc-certificate-note">
                    Transfer of this certificate moves no rights. LP fee claim
                    rights stay with the recorded creator address, not with
                    the holder. The gate threshold was fixed at launch from
                    the planned initial price. Anyone can re-derive it from
                    the launch block.
                </p>
            </div>
        </div>
    );
}
