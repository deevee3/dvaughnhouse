// Plus+ portal. Passes buy tools, sight, and time. Nothing a pass
// unlocks touches a contract, a lock, a fee, or anyone else's launch.
// Subscription state is SaaS state. Launch figures are on-chain
// state, and every figure names its source. Billing runs in test
// mode: no charge is made and no live payment provider is called.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Component } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PLUS_TIERS } from '../../TressColumn/tressConfig';
import { TressShell } from '../../TressColumn/components/TressShell';
import {
    AddressLink,
    EmptyState,
    ErrorFix,
    SkeletonRows,
    SourceLabel,
    Tabs,
} from '../../TressColumn/components/primitives';
import { plusApi } from '../../TressColumn/plusApi';
import { useWallet } from '../../TressColumn/useWallet';
import { tcUrl } from '../../TressColumn/urls';

// Tier keys match the canonical config exactly (SAPPHIRE/EMERALD/RUBY).
const TIER_KEYS = ['SAPPHIRE', 'EMERALD', 'RUBY'];
const TIER_RANK = { SAPPHIRE: 1, EMERALD: 2, RUBY: 3 };

export class PortalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed) {
            return (
                <div className="tc-error" role="alert">
                    <strong>The Plus+ portal did not load.</strong> Check the
                    network and try again.
                    <div className="tc-error-action">
                        <button
                            type="button"
                            className="tc-button-quiet"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function usePlusData(path, active) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => setAttempt((a) => a + 1), []);

    useEffect(() => {
        if (!active || !path) return undefined;
        let alive = true;
        setLoading(true);
        setError(null);
        plusApi
            .get(path)
            .then((result) => {
                if (alive) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (alive) {
                    setError(err);
                    setLoading(false);
                }
            });
        return () => {
            alive = false;
        };
    }, [path, active, attempt]);

    return { data, loading, error, retry, refresh: retry };
}

function SectionGate({ hasAccess, tier, children }) {
    if (hasAccess) return children;
    return (
        <EmptyState
            title={`This section needs ${PLUS_TIERS[tier].name} or higher.`}
            body="Your account has no active pass at that tier. Pick a tier below to subscribe in test mode."
        />
    );
}

function TierScreen({ tierKey, subscription, billing, onSubscribe, subscribeNote, busy }) {
    const tier = PLUS_TIERS[tierKey];
    const isCurrent = subscription && subscription.tier === tierKey && subscription.status === 'active';
    return (
        <div className="tc-tier-glass-field">
        <div className="tc-card tc-tier-card">
            <p className="tc-lede">
                {tier.name}, ${tier.priceMonthly} per month. {tier.target}. Monthly only.
            </p>
            <ul className="tc-feature-list">
                {tier.features.map((feature) => (
                    <li className="tc-feature" key={feature}>
                        <span className="tc-feature-name">{feature}</span>
                        <span className="tc-feature-note">Included with this pass.</span>
                    </li>
                ))}
            </ul>
            <div className="tc-block-gap-top">
                {isCurrent ? (
                    <p className="tc-module-copy">This is your current pass.</p>
                ) : (
                    <button
                        type="button"
                        className="tc-button-primary"
                        disabled={busy}
                        onClick={() => onSubscribe(tierKey)}
                    >
                        Subscribe to {tier.name}
                    </button>
                )}
                {subscribeNote && <p className="tc-field-error">{subscribeNote}</p>}
            </div>
            <p className="tc-module-note">
                {billing.test_mode
                    ? 'Test mode. Subscribing records a test subscription. No charge is made.'
                    : 'Billing is connected.'}
            </p>
        </div>
        </div>
    );
}

function FeedSection({ hasAccess, indexer }) {
    const [pureOnly, setPureOnly] = useState(false);
    const { data, loading, error, retry } = usePlusData(
        hasAccess ? `/plus/api/feed${pureOnly ? '?pure=1' : ''}` : null,
        hasAccess
    );
    const [liveAt, setLiveAt] = useState(null);
    const [liveError, setLiveError] = useState(false);

    useEffect(() => {
        if (!hasAccess) return undefined;
        const source = new EventSource('/plus/api/feed/stream');
        source.addEventListener('snapshot', (event) => {
            setLiveAt(new Date().toLocaleTimeString());
            setLiveError(false);
        });
        source.onerror = () => setLiveError(true);
        return () => source.close();
    }, [hasAccess]);

    return (
        <SectionGate hasAccess={hasAccess} tier="SAPPHIRE">
            <p className="tc-lede">
                Launches the indexer has read from the chain, newest first.
                <SourceLabel source="on-chain" />
            </p>
            <p className="tc-module-note">
                Indexer: last block {indexer.last_block || 0}, latest seen{' '}
                {indexer.latest_seen || 0}, {indexer.launch_count || 0} launches indexed.
                {liveAt ? ` Live feed heard at ${liveAt}.` : ''}
                {liveError ? ' Live feed is down. This list refreshes when you open it.' : ''}
            </p>
            <div className="tc-block-gap-top">
                <button
                    type="button"
                    className="tc-pill"
                    aria-pressed={pureOnly}
                    onClick={() => setPureOnly((v) => !v)}
                >
                    {pureOnly ? 'Pure launches only' : 'All launches'}
                </button>
            </div>
            {loading && <SkeletonRows copy="Loading launches." />}
            {error && (
                <ErrorFix title="The feed did not load." fix={error.message} onRetry={retry} />
            )}
            {data && data.launches && data.launches.length === 0 && (
                <EmptyState
                    title="No launches yet."
                    body="The feed is empty until the first launch is indexed. Nothing here is a placeholder."
                />
            )}
            {data && data.launches && data.launches.length > 0 && (
                <ul className="tc-feature-list">
                    {data.launches.map((launch) => (
                        <li className="tc-feature" key={launch.certificate_id}>
                            <span className="tc-feature-name">
                                Launch {launch.certificate_id}
                            </span>
                            <span className="tc-feature-note">
                                <AddressLink address={launch.token} kind="token" /> ·{' '}
                                {launch.pure ? 'Pure' : 'Standard'} · lock mode {launch.lock_mode} ·{' '}
                                <a href={tcUrl(`/launches/${launch.certificate_id}`)}>Certificate</a>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </SectionGate>
    );
}

function RadarSection({ hasAccess }) {
    const { data, loading, error, retry } = usePlusData(
        hasAccess ? '/plus/api/radar' : null,
        hasAccess
    );
    const { address, connect } = useWallet();
    const [form, setForm] = useState({ distributor: '', index: '', account: '', amount: '', proof: '' });
    const [result, setResult] = useState(null);
    const [checking, setChecking] = useState(false);
    const [checkError, setCheckError] = useState(null);

    const checkClaim = async () => {
        setChecking(true);
        setCheckError(null);
        setResult(null);
        try {
            const proof = form.proof
                .split(/[\s,]+/)
                .map((item) => item.trim())
                .filter(Boolean);
            const checked = await plusApi.post('/plus/api/radar/verify', {
                distributor: form.distributor.trim(),
                index: Number(form.index),
                account: (form.account || address || '').trim(),
                amount: form.amount.trim(),
                proof,
            });
            setResult(checked);
        } catch (err) {
            setCheckError(err);
        } finally {
            setChecking(false);
        }
    };

    return (
        <SectionGate hasAccess={hasAccess} tier="SAPPHIRE">
            <p className="tc-lede">
                Airdrop distributors the indexer has found, and a claim check
                against the on-chain root. <SourceLabel source="on-chain" />
            </p>
            {loading && <SkeletonRows copy="Loading campaigns." />}
            {error && (
                <ErrorFix title="The radar did not load." fix={error.message} onRetry={retry} />
            )}
            {data && data.campaigns && data.campaigns.length === 0 && (
                <EmptyState
                    title="No airdrop campaigns exist."
                    body="The radar has nothing to watch until the first launch with a distributor is indexed."
                />
            )}
            {data && data.campaigns && data.campaigns.length > 0 && (
                <ul className="tc-feature-list">
                    {data.campaigns.map((campaign) => (
                        <li className="tc-feature" key={campaign.distributor}>
                            <span className="tc-feature-name">
                                <AddressLink address={campaign.distributor} />
                            </span>
                            <span className="tc-feature-note">
                                Launch {campaign.certificate_id} · block {campaign.launch_block}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {data && data.batch_claimer && (
                <p className="tc-module-note">{data.batch_claimer}</p>
            )}

            <h3 className="tc-h2"><span className="tc-index">//03</span>Check a claim</h3>
            <p className="tc-lede">
                Paste the index, account, amount, and proof from the campaign
                list. The portal checks the proof against the root on chain.
                Claiming still happens on chain, in your own wallet.
            </p>
            <div className="tc-block-gap-top">
                <label className="tc-field-label" htmlFor="radar-distributor">
                    Distributor address
                </label>
                <input
                    id="radar-distributor"
                    className="tc-field"
                    value={form.distributor}
                    onChange={(event) => setForm({ ...form, distributor: event.target.value })}
                    placeholder="0x…"
                />
                <label className="tc-field-label" htmlFor="radar-index">
                    Leaf index
                </label>
                <input
                    id="radar-index"
                    className="tc-field"
                    value={form.index}
                    onChange={(event) => setForm({ ...form, index: event.target.value })}
                    placeholder="0"
                />
                <label className="tc-field-label" htmlFor="radar-account">
                    Account
                </label>
                <input
                    id="radar-account"
                    className="tc-field"
                    value={form.account}
                    onChange={(event) => setForm({ ...form, account: event.target.value })}
                    placeholder={address || '0x…'}
                />
                {!address && (
                    <p className="tc-module-note">
                        No wallet is connected here. Connect one below, or paste an account.
                    </p>
                )}
                {address && (
                    <button type="button" className="tc-button-quiet" onClick={() => setForm({ ...form, account: address })}>
                        Use connected wallet
                    </button>
                )}
                <label className="tc-field-label" htmlFor="radar-amount">
                    Amount in wei
                </label>
                <input
                    id="radar-amount"
                    className="tc-field"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    placeholder="1000000000000000000"
                />
                <label className="tc-field-label" htmlFor="radar-proof">
                    Proof, one hash per line
                </label>
                <textarea
                    id="radar-proof"
                    className="tc-field"
                    rows={4}
                    value={form.proof}
                    onChange={(event) => setForm({ ...form, proof: event.target.value })}
                />
                <button
                    type="button"
                    className="tc-button-primary"
                    disabled={checking}
                    onClick={checkClaim}
                >
                    Check claim
                </button>
                {checkError && (
                    <ErrorFix title="The check failed." fix={checkError.message} />
                )}
                {result && (
                    <p className="tc-module-copy">
                        {result.valid
                            ? 'Proof checks against the on-chain root.'
                            : 'Proof does not match the on-chain root.'}{' '}
                        {result.note || ''}
                    </p>
                )}
            </div>
            {!address && (
                <div className="tc-block-gap-top">
                    <button type="button" className="tc-button-primary" onClick={connect}>
                        Connect wallet
                    </button>
                </div>
            )}
        </SectionGate>
    );
}

function WorkbenchSection({ hasAccess, indexer }) {
    const { data, loading, error, retry, refresh } = usePlusData(
        hasAccess ? '/plus/api/snapshots' : null,
        hasAccess
    );
    const [form, setForm] = useState({
        name: '',
        token_address: '',
        snapshot_block: '',
        min_hold_blocks: '',
        exclude_first_n_blocks: '',
    });
    const [formError, setFormError] = useState(null);
    const [formBusy, setFormBusy] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionBusy, setActionBusy] = useState(null);
    const [proofAccount, setProofAccount] = useState('');
    const [proofSnapshotId, setProofSnapshotId] = useState('');
    const [proofResult, setProofResult] = useState(null);

    const createSnapshot = async () => {
        setFormBusy(true);
        setFormError(null);
        try {
            await plusApi.post('/plus/api/snapshots', {
                name: form.name.trim(),
                token_address: form.token_address.trim(),
                snapshot_block: Number(form.snapshot_block),
                filters: {
                    min_hold_blocks: form.min_hold_blocks === '' ? 0 : Number(form.min_hold_blocks),
                    exclude_first_n_blocks:
                        form.exclude_first_n_blocks === '' ? 0 : Number(form.exclude_first_n_blocks),
                },
            });
            setForm({ name: '', token_address: '', snapshot_block: '', min_hold_blocks: '', exclude_first_n_blocks: '' });
            refresh();
        } catch (err) {
            setFormError(err);
        } finally {
            setFormBusy(false);
        }
    };

    const runAction = async (id, action) => {
        setActionBusy(`${action}:${id}`);
        setActionError(null);
        try {
            await plusApi.post(`/plus/api/snapshots/${id}/${action}`, {});
            refresh();
        } catch (err) {
            setActionError(err);
        } finally {
            setActionBusy(null);
        }
    };

    const fetchProof = async () => {
        setActionError(null);
        setProofResult(null);
        try {
            const result = await plusApi.get(
                `/plus/api/snapshots/${encodeURIComponent(proofSnapshotId.trim())}/proof?account=${encodeURIComponent(proofAccount.trim())}`
            );
            setProofResult(result);
        } catch (err) {
            setActionError(err);
        }
    };

    return (
        <SectionGate hasAccess={hasAccess} tier="EMERALD">
            <p className="tc-lede">
                Build a holder snapshot at a block, with named filters shown
                before the root is generated. <SourceLabel source="on-chain" />
            </p>
            <p className="tc-module-note">
                Filters: minimum holding blocks excludes wallets whose first
                transfer arrived within that many blocks of the snapshot.
                Exclude first N blocks excludes wallets first seen within N
                blocks of the token first transfer. Exclusions are listed by
                name. Nothing is silently excluded.
            </p>
            <div className="tc-block-gap-top">
                <label className="tc-field-label" htmlFor="snap-name">Snapshot name</label>
                <input
                    id="snap-name"
                    className="tc-field"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Community drop, March"
                />
                <label className="tc-field-label" htmlFor="snap-token">Token address</label>
                <input
                    id="snap-token"
                    className="tc-field"
                    value={form.token_address}
                    onChange={(event) => setForm({ ...form, token_address: event.target.value })}
                    placeholder="0x…"
                />
                <label className="tc-field-label" htmlFor="snap-block">Snapshot block</label>
                <input
                    id="snap-block"
                    className="tc-field"
                    value={form.snapshot_block}
                    onChange={(event) => setForm({ ...form, snapshot_block: event.target.value })}
                    placeholder={String(indexer.latest_seen || '')}
                />
                <label className="tc-field-label" htmlFor="snap-hold">
                    Minimum holding blocks (0 means no filter)
                </label>
                <input
                    id="snap-hold"
                    className="tc-field"
                    value={form.min_hold_blocks}
                    onChange={(event) => setForm({ ...form, min_hold_blocks: event.target.value })}
                    placeholder="0"
                />
                <label className="tc-field-label" htmlFor="snap-first">
                    Exclude first N blocks (0 means no filter)
                </label>
                <input
                    id="snap-first"
                    className="tc-field"
                    value={form.exclude_first_n_blocks}
                    onChange={(event) => setForm({ ...form, exclude_first_n_blocks: event.target.value })}
                    placeholder="0"
                />
                <button
                    type="button"
                    className="tc-button-primary"
                    disabled={formBusy}
                    onClick={createSnapshot}
                >
                    Save snapshot draft
                </button>
                {formError && <ErrorFix title="The draft did not save." fix={formError.message} />}
            </div>

            {loading && <SkeletonRows copy="Loading snapshots." />}
            {error && (
                <ErrorFix title="Snapshots did not load." fix={error.message} onRetry={retry} />
            )}
            {actionError && <ErrorFix title="That step failed." fix={actionError.message} />}
            {data && data.snapshots && data.snapshots.length === 0 && (
                <EmptyState
                    title="No snapshots yet."
                    body="Save a draft above, compute its holders, then generate its root."
                />
            )}
            {data && data.snapshots && data.snapshots.length > 0 && (
                <ul className="tc-feature-list">
                    {data.snapshots.map((snapshot) => (
                        <li className="tc-feature" key={snapshot.id}>
                            <span className="tc-feature-name">
                                {snapshot.name} · {snapshot.status} · {snapshot.holder_count} holders
                            </span>
                            <span className="tc-feature-note">
                                Block {snapshot.snapshot_block} ·{' '}
                                {snapshot.merkle_root ? `Root ${snapshot.merkle_root.slice(0, 18)}…` : 'No root yet'}
                                {snapshot.excluded && snapshot.excluded.length > 0 && (
                                    <>
                                        {' '}· Excluded {snapshot.excluded.length}:{' '}
                                        {snapshot.excluded
                                            .slice(0, 3)
                                            .map((item) => item.address.slice(0, 10))
                                            .join(', ')}
                                        {snapshot.excluded.length > 3 ? '…' : ''}
                                    </>
                                )}
                            </span>
                            <span className="tc-feature-note">
                                <button
                                    type="button"
                                    className="tc-button-quiet"
                                    disabled={actionBusy === `compute:${snapshot.id}`}
                                    onClick={() => runAction(snapshot.id, 'compute')}
                                >
                                    Compute holders
                                </button>{' '}
                                <button
                                    type="button"
                                    className="tc-button-quiet"
                                    disabled={actionBusy === `generate-root:${snapshot.id}`}
                                    onClick={() => runAction(snapshot.id, 'generate-root')}
                                >
                                    Generate root
                                </button>{' '}
                                <a href={`/plus/api/snapshots/${snapshot.id}/export`}>
                                    Export CSV
                                </a>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <h3 className="tc-h2"><span className="tc-index">//04</span>Proof lookup</h3>
            <p className="tc-lede">
                Pick a snapshot above, paste an account, and get its leaf
                index, amount, and proof for the root.
            </p>
            <div className="tc-block-gap-top">
                <label className="tc-field-label" htmlFor="proof-snapshot">Snapshot id</label>
                <input
                    id="proof-snapshot"
                    className="tc-field"
                    value={proofSnapshotId}
                    onChange={(event) => setProofSnapshotId(event.target.value)}
                    placeholder="1"
                />
                <label className="tc-field-label" htmlFor="proof-account">Account</label>
                <input
                    id="proof-account"
                    className="tc-field"
                    value={proofAccount}
                    onChange={(event) => setProofAccount(event.target.value)}
                    placeholder="0x…"
                />
                <button type="button" className="tc-button-primary" onClick={fetchProof}>
                    Get proof
                </button>
                {proofResult && (
                    <p className="tc-module-copy">
                        Index {proofResult.index} · Amount {proofResult.amount} wei ·{' '}
                        {proofResult.proof.length} proof steps.
                    </p>
                )}
            </div>

            <h3 className="tc-h2"><span className="tc-index">//05</span>Scout</h3>
            <p className="tc-lede">
                {indexer.launch_count || 0} launches indexed. Last indexed
                block {indexer.last_block || 0}, latest seen{' '}
                {indexer.latest_seen || 0}. <SourceLabel source="on-chain" />
            </p>
            <p className="tc-module-note">
                Vanity certificate URLs use this shape:{' '}
                plus.dvaughnhouse.com/p/1. Each one resolves to the same
                certificate record on the launch page.
            </p>
            <h3 className="tc-h2"><span className="tc-index">//06</span>Start from the workbench</h3>
            <p className="tc-lede">
                The creator workbench is the launch flow on Tress Column. It
                is open to every signed-in account.
            </p>
            <Link className="tc-button-primary" href={tcUrl('/start')}>
                Start a launch
            </Link>
        </SectionGate>
    );
}

function AlertsSection({ hasAccess, feedData }) {
    const { data, loading, error, retry, refresh } = usePlusData(
        hasAccess ? '/plus/api/alerts' : null,
        hasAccess
    );
    const [form, setForm] = useState({ type: 'whale', target: '', threshold_bps: '' });
    const [formError, setFormError] = useState(null);
    const [busy, setBusy] = useState(false);

    const createAlert = async () => {
        setBusy(true);
        setFormError(null);
        try {
            await plusApi.post('/plus/api/alerts', {
                type: form.type,
                target: form.target.trim(),
                threshold_bps: form.threshold_bps.trim() || null,
            });
            setForm({ type: 'whale', target: '', threshold_bps: '' });
            refresh();
        } catch (err) {
            setFormError(err);
        } finally {
            setBusy(false);
        }
    };

    const toggleAlert = async (id) => {
        try {
            await plusApi.post(`/plus/api/alerts/${id}/toggle`, {});
            refresh();
        } catch (err) {
            setFormError(err);
        }
    };

    const deleteAlert = async (id) => {
        try {
            await plusApi.del(`/plus/api/alerts/${id}`);
            refresh();
        } catch (err) {
            setFormError(err);
        }
    };

    const timed = (feedData && feedData.launches ? feedData.launches : []).filter(
        (launch) => Number(launch.lock_mode) === 1
    );

    return (
        <SectionGate hasAccess={hasAccess} tier="EMERALD">
            <p className="tc-lede">
                Watchtower alerts. They show in the portal only. No email or
                push channel is wired on this build.
            </p>
            <div className="tc-block-gap-top">
                <label className="tc-field-label" htmlFor="alert-type">Alert type</label>
                <select
                    id="alert-type"
                    className="tc-field"
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                    <option value="whale">Whale movement</option>
                    <option value="release">Lock release</option>
                    <option value="gate">Fee gate crossed</option>
                </select>
                <label className="tc-field-label" htmlFor="alert-target">Target token or launch</label>
                <input
                    id="alert-target"
                    className="tc-field"
                    value={form.target}
                    onChange={(event) => setForm({ ...form, target: event.target.value })}
                    placeholder="0x… or launch 1"
                />
                <label className="tc-field-label" htmlFor="alert-threshold">
                    Threshold in basis points (whale alerts only)
                </label>
                <input
                    id="alert-threshold"
                    className="tc-field"
                    value={form.threshold_bps}
                    onChange={(event) => setForm({ ...form, threshold_bps: event.target.value })}
                    placeholder="100"
                />
                <button type="button" className="tc-button-primary" disabled={busy} onClick={createAlert}>
                    Save alert
                </button>
                {formError && <ErrorFix title="The alert did not save." fix={formError.message} />}
            </div>

            {loading && <SkeletonRows copy="Loading alerts." />}
            {error && (
                <ErrorFix title="Alerts did not load." fix={error.message} onRetry={retry} />
            )}
            {data && data.alerts && data.alerts.length === 0 && (
                <EmptyState title="No alerts yet." body="Save one above. It fires in the portal only." />
            )}
            {data && data.alerts && data.alerts.length > 0 && (
                <ul className="tc-feature-list">
                    {data.alerts.map((alert) => (
                        <li className="tc-feature" key={alert.id}>
                            <span className="tc-feature-name">
                                {alert.type} · {alert.target}
                            </span>
                            <span className="tc-feature-note">
                                {alert.enabled ? 'On' : 'Off'}
                                {alert.threshold_bps ? ` · ${alert.threshold_bps} bps` : ''}
                            </span>
                            <span className="tc-feature-note">
                                <button type="button" className="tc-button-quiet" onClick={() => toggleAlert(alert.id)}>
                                    {alert.enabled ? 'Turn off' : 'Turn on'}
                                </button>{' '}
                                <button type="button" className="tc-button-quiet" onClick={() => deleteAlert(alert.id)}>
                                    Delete
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <h3 className="tc-h2"><span className="tc-index">//07</span>Lock countdowns</h3>
            {timed.length === 0 && (
                <EmptyState
                    title="No timed locks to count down."
                    body="Timed launches show their release time here once the first one is indexed."
                />
            )}
            {timed.length > 0 && (
                <ul className="tc-feature-list">
                    {timed.map((launch) => (
                        <li className="tc-feature" key={launch.certificate_id}>
                            <span className="tc-feature-name">Launch {launch.certificate_id}</span>
                            <span className="tc-feature-note">
                                Release at Unix time {launch.unlock_time}.{' '}
                                <a href={tcUrl(`/launches/${launch.certificate_id}`)}>Certificate</a>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </SectionGate>
    );
}

function RebatesSection({ hasAccess, isRuby }) {
    const { data, loading, error, retry, refresh } = usePlusData(
        hasAccess ? '/plus/api/rebates' : null,
        hasAccess
    );
    const [form, setForm] = useState({ campaign: '', fee_wei: '19400000000000000' });
    const [formError, setFormError] = useState(null);
    const [busy, setBusy] = useState(false);

    const claimRebate = async () => {
        setBusy(true);
        setFormError(null);
        try {
            await plusApi.post('/plus/api/rebates', {
                campaign: form.campaign.trim(),
                fee_wei: form.fee_wei.trim(),
            });
            setForm({ campaign: '', fee_wei: '19400000000000000' });
            refresh();
        } catch (err) {
            setFormError(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <SectionGate hasAccess={hasAccess} tier="RUBY">
            <p className="tc-lede">
                Citadel monitoring and the Ruby rebate. Rebates are off-chain
                records. The on-chain fee (0.0194 ETH flat) never changes.
            </p>
            {isRuby && (
                <p className="tc-module-copy">
                    Abyssal Gold Studio seal: this account carries the Studio
                    seal on its portal presentation. The seal marks how the
                    launch is presented here. It changes nothing on chain.
                </p>
            )}
            {loading && <SkeletonRows copy="Loading rebates." />}
            {error && (
                <ErrorFix title="Rebates did not load." fix={error.message} onRetry={retry} />
            )}
            {data && (
                <p className="tc-module-copy">
                    Free deploys left this month: {data.free_deploys_left_this_month}.
                </p>
            )}
            <div className="tc-block-gap-top">
                <label className="tc-field-label" htmlFor="rebate-campaign">Campaign name</label>
                <input
                    id="rebate-campaign"
                    className="tc-field"
                    value={form.campaign}
                    onChange={(event) => setForm({ ...form, campaign: event.target.value })}
                    placeholder="Community drop, March"
                />
                <label className="tc-field-label" htmlFor="rebate-fee">Fee paid, in wei</label>
                <input
                    id="rebate-fee"
                    className="tc-field"
                    value={form.fee_wei}
                    onChange={(event) => setForm({ ...form, fee_wei: event.target.value })}
                />
                <button type="button" className="tc-button-primary" disabled={busy} onClick={claimRebate}>
                    Record rebate
                </button>
                {formError && <ErrorFix title="The rebate did not save." fix={formError.message} />}
            </div>
            {data && data.rebates && data.rebates.length === 0 && (
                <EmptyState
                    title="No rebates recorded."
                    body="Record one above after a deploy. The first each month is free, extras are recorded at 50% off, off-chain only."
                />
            )}
            {data && data.rebates && data.rebates.length > 0 && (
                <ul className="tc-feature-list">
                    {data.rebates.map((rebate) => (
                        <li className="tc-feature" key={rebate.id}>
                            <span className="tc-feature-name">{rebate.campaign}</span>
                            <span className="tc-feature-note">
                                {rebate.rebate_status === 'free' ? 'Free, monthly rebate' : '50% off, recorded'} ·{' '}
                                {rebate.fee_wei} wei
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <p className="tc-module-note">
                Citadel status: the indexer is the monitor on this build. Its
                health shows on the Feed section: last block, latest seen,
                and launch count. No separate monitoring service is running.
            </p>
        </SectionGate>
    );
}

function SupportSection({ hasAccess }) {
    const { data, loading, error, retry, refresh } = usePlusData(
        hasAccess ? '/plus/api/support' : null,
        hasAccess
    );
    const [form, setForm] = useState({ subject: '', body: '' });
    const [formError, setFormError] = useState(null);
    const [busy, setBusy] = useState(false);

    const createRequest = async () => {
        setBusy(true);
        setFormError(null);
        try {
            await plusApi.post('/plus/api/support', {
                subject: form.subject.trim(),
                body: form.body.trim(),
            });
            setForm({ subject: '', body: '' });
            refresh();
        } catch (err) {
            setFormError(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <SectionGate hasAccess={hasAccess} tier="RUBY">
            <p className="tc-lede">
                Priority incident support. Requests are stored here and
                answered in the portal. No outside support channel is wired
                on this build.
            </p>
            <div className="tc-block-gap-top">
                <label className="tc-field-label" htmlFor="support-subject">Subject</label>
                <input
                    id="support-subject"
                    className="tc-field"
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    placeholder="Launch page shows a stale gate"
                />
                <label className="tc-field-label" htmlFor="support-body">What happened</label>
                <textarea
                    id="support-body"
                    className="tc-field"
                    rows={4}
                    value={form.body}
                    onChange={(event) => setForm({ ...form, body: event.target.value })}
                />
                <button type="button" className="tc-button-primary" disabled={busy} onClick={createRequest}>
                    Send request
                </button>
                {formError && <ErrorFix title="The request did not send." fix={formError.message} />}
            </div>
            {loading && <SkeletonRows copy="Loading requests." />}
            {error && (
                <ErrorFix title="Requests did not load." fix={error.message} onRetry={retry} />
            )}
            {data && data.requests && data.requests.length === 0 && (
                <EmptyState title="No requests yet." body="Send one above." />
            )}
            {data && data.requests && data.requests.length > 0 && (
                <ul className="tc-feature-list">
                    {data.requests.map((item) => (
                        <li className="tc-feature" key={item.id}>
                            <span className="tc-feature-name">{item.subject}</span>
                            <span className="tc-feature-note">{item.status}</span>
                        </li>
                    ))}
                </ul>
            )}
        </SectionGate>
    );
}

export default function Index({ billing, subscription: initialSubscription, entitlement, indexer }) {
    const { auth } = usePage().props;
    const user = auth?.user || null;
    const [active, setActive] = useState('SAPPHIRE');
    const [section, setSection] = useState('tiers');
    const [subscription, setSubscription] = useState(initialSubscription || null);
    const [subscribeNote, setSubscribeNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [cancelNote, setCancelNote] = useState('');
    const feedQuery = usePlusData(user && subscription ? '/plus/api/feed' : null, Boolean(user && subscription));

    const rank = subscription ? TIER_RANK[subscription.tier] || 0 : 0;
    const hasTier = (tier) => rank >= (TIER_RANK[tier] || 99);

    const onSubscribe = async (tierKey) => {
        setBusy(true);
        setSubscribeNote('');
        try {
            const result = await plusApi.post('/plus/api/subscribe', { tier: tierKey });
            setSubscription(result.subscription);
            setSubscribeNote(
                result.note || 'Subscription recorded.'
            );
        } catch (err) {
            setSubscribeNote(err.message);
        } finally {
            setBusy(false);
        }
    };

    const onCancel = async () => {
        setBusy(true);
        setCancelNote('');
        try {
            await plusApi.post('/plus/api/subscription/cancel', {});
            setSubscription(null);
            setCancelNote('Subscription cancelled. Portal features stop at the end of the current period.');
        } catch (err) {
            setCancelNote(err.message);
        } finally {
            setBusy(false);
        }
    };

    const sections = [
        { key: 'tiers', label: 'Tiers' },
        { key: 'feed', label: 'Feed' },
        { key: 'radar', label: 'Claim Radar' },
        { key: 'workbench', label: 'Workbench' },
        { key: 'alerts', label: 'Alerts' },
        { key: 'rebates', label: 'Rebates' },
        { key: 'support', label: 'Support' },
    ];

    return (
        <TressShell surface="plus" title="Plus+" active="portal">
            <p className="tc-lede">
                Plus+ passes buy tools, sight, and time. Nothing a pass unlocks
                touches a contract, a lock, a fee, or anyone else's launch.
            </p>

            <PortalErrorBoundary>
                <Tabs
                    tabs={sections}
                    active={section}
                    onChange={setSection}
                    label="Plus+ sections"
                />

                {section === 'tiers' && (
                    <div>
                        <Tabs
                            tabs={TIER_KEYS.map((key) => ({
                                key,
                                label: `${PLUS_TIERS[key].name} · $${PLUS_TIERS[key].priceMonthly}/mo`,
                            }))}
                            active={active}
                            onChange={(key) => {
                                setActive(key);
                                setSubscribeNote('');
                            }}
                            label="Plus+ tiers"
                        />
                        <TierScreen
                            tierKey={active}
                            subscription={subscription}
                            billing={billing}
                            onSubscribe={onSubscribe}
                            subscribeNote={subscribeNote}
                            busy={busy}
                        />
                    </div>
                )}

                {section === 'feed' && (
                    <FeedSection hasAccess={hasTier('SAPPHIRE')} indexer={indexer || {}} />
                )}
                {section === 'radar' && <RadarSection hasAccess={hasTier('SAPPHIRE')} />}
                {section === 'workbench' && (
                    <WorkbenchSection hasAccess={hasTier('EMERALD')} indexer={indexer || {}} />
                )}
                {section === 'alerts' && (
                    <AlertsSection
                        hasAccess={hasTier('EMERALD')}
                        feedData={feedQuery.data}
                    />
                )}
                {section === 'rebates' && (
                    <RebatesSection hasAccess={hasTier('RUBY')} isRuby={subscription?.tier === 'RUBY'} />
                )}
                {section === 'support' && <SupportSection hasAccess={hasTier('RUBY')} />}
            </PortalErrorBoundary>

            <section className="tc-section" aria-labelledby="tc-status-h">
                <h2 className="tc-h2" id="tc-status-h"><span className="tc-index">//02</span>Your subscription</h2>
                <SourceLabel source="saas" />
                {!user && (
                    <EmptyState
                        title="Sign in to see your subscription."
                        body="Plus+ passes belong to your account."
                        action={
                            <a className="tc-button-primary" href={`/auth/tress-entry?return=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}>
                                Sign in with Albert Pass
                            </a>
                        }
                    />
                )}
                {user && !subscription && (
                    <div>
                        <p className="tc-module-copy">No subscription on record for this account.</p>
                        <p className="tc-module-note">
                            {billing.test_mode
                                ? 'Billing runs in test mode. Subscribing records a test subscription. No charge is made.'
                                : 'Billing is connected.'}
                        </p>
                    </div>
                )}
                {user && subscription && (
                    <div>
                        <p className="tc-module-copy">
                            {PLUS_TIERS[subscription.tier].name} · ${subscription.price_monthly} per month ·{' '}
                            {subscription.provider_mode === 'test' ? 'Test mode' : subscription.provider} ·{' '}
                            Renews {subscription.renews_at ? new Date(subscription.renews_at).toLocaleDateString() : 'No date set'}
                        </p>
                        <p className="tc-module-note">
                            {subscription.provider_mode === 'test'
                                ? 'Test subscription. No charge was made and no live payment provider was called.'
                                : ''}
                        </p>
                        <button type="button" className="tc-button-quiet" disabled={busy} onClick={onCancel}>
                            Cancel subscription
                        </button>
                        {cancelNote && <p className="tc-module-copy">{cancelNote}</p>}
                    </div>
                )}
            </section>
        </TressShell>
    );
}
