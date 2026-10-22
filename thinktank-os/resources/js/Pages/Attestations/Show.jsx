import InstitutionalHeader from '@/Components/InstitutionalHeader';
import SiteFooter from '@/Components/SiteFooter';
import { Head, Link, useForm } from '@inertiajs/react';

const STATUS_STYLES = {
    issued: 'bg-sienna text-ink',
    challenged:
        'border border-sienna-deep text-sienna-deep dark:border-sienna dark:text-sienna',
    revoked:
        'border border-line text-ink-soft dark:border-line-dark dark:text-cream-soft line-through',
};

const ANCHOR_PLACEHOLDER =
    'Not anchored — anchoring via Pearls on Base is tentative and comes when volume warrants.';

function fingerprint(signature) {
    if (!signature) return '—';
    return signature.slice(0, 16).toUpperCase().match(/.{1,4}/g).join(' ');
}

function formatValue(value) {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Verified' : 'Not verified';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function ManifestRows({ manifest }) {
    if (!manifest || typeof manifest !== 'object') {
        return (
            <p className="text-sm text-ink-soft dark:text-cream-soft">
                No evidence manifest was recorded for this attestation.
            </p>
        );
    }

    const rows = [];
    const walk = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
            const label = prefix ? `${prefix} · ${key.replaceAll('_', ' ')}` : key.replaceAll('_', ' ');
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                walk(value, label);
            } else {
                rows.push([label, formatValue(value)]);
            }
        });
    };
    walk(manifest);

    return (
        <dl className="divide-y divide-line dark:divide-line-dark">
            {rows.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
                    <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                        {label}
                    </dt>
                    <dd className="break-all font-mono text-xs text-ink dark:text-cream sm:max-w-md sm:text-right">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function Show({ attestation = {}, signature_valid = false, canIssue = false, auth }) {
    const status = attestation.status || 'issued';
    const challenges = attestation.challenges || [];
    const isActive = status === 'issued' || status === 'challenged';
    const anchored = Boolean(attestation.anchor_tx);

    const challengeForm = useForm({ grounds: '' });
    const revokeForm = useForm({ reason: '' });

    const submitChallenge = (e) => {
        e.preventDefault();
        challengeForm.post(route('attestations.challenge', attestation.id), {
            preserveScroll: true,
            onSuccess: () => challengeForm.reset('grounds'),
        });
    };

    const submitRevoke = (e) => {
        e.preventDefault();
        revokeForm.post(route('attestations.revoke', attestation.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-paper font-serif text-ink selection:bg-sienna selection:text-ink dark:bg-night dark:text-cream">
            <Head title={`${attestation.public_id || 'Attestation'} - Glenride Attestations`} />

            <InstitutionalHeader auth={auth} active="attestations" subtitle="Glenride Attestations" />

            <main className="mx-auto max-w-4xl px-6 py-16">
                <Link
                    href={route('attestations.index')}
                    className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft transition hover:text-ink dark:text-cream-soft dark:hover:text-cream"
                >
                    ← Back to the registry
                </Link>

                {/* Record header */}
                <div className="mt-8 border-b border-line pb-10 dark:border-line-dark">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm text-sienna-deep dark:text-sienna">
                            {attestation.public_id}
                        </span>
                        <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider ${STATUS_STYLES[status] || STATUS_STYLES.issued}`}
                        >
                            {status}
                        </span>
                        <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider ${
                                signature_valid
                                    ? 'bg-ink text-paper dark:bg-cream dark:text-ink'
                                    : 'border border-sienna-deep text-sienna-deep dark:border-sienna dark:text-sienna'
                            }`}
                        >
                            {signature_valid ? '✓ Signature verified' : '✗ Signature not verified'}
                        </span>
                    </div>
                    <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink dark:text-cream sm:text-4xl">
                        {attestation.subject_title}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft dark:text-cream-soft">
                        <span>Issuer: {attestation.issuer_name || 'Glenride'}</span>
                        <span>Verified by {attestation.verifier?.name || 'Glenride'}</span>
                        {attestation.issued_at && (
                            <span>
                                Issued{' '}
                                {new Date(attestation.issued_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>
                        )}
                        <span>Method: {attestation.method || 'editorial_review_v1'}</span>
                    </div>
                </div>

                {status === 'revoked' && (
                    <div className="mt-8 rounded-2xl border border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep">
                        <div className="font-display text-base font-bold text-ink dark:text-cream">
                            This attestation has been revoked
                        </div>
                        {attestation.revocation_reason && (
                            <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                                Reason: {attestation.revocation_reason}
                            </p>
                        )}
                    </div>
                )}

                {/* Claim */}
                <section className="mt-10">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">The claim</h2>
                    <p className="mt-3 leading-relaxed text-ink dark:text-cream">{attestation.claim}</p>
                </section>

                {/* Evidence */}
                <section className="mt-10 rounded-2xl border border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep sm:p-8">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        The evidence recorded at issuance
                    </h2>
                    <div className="mt-4">
                        <ManifestRows manifest={attestation.evidence_manifest} />
                    </div>
                </section>

                {/* Cryptographic record */}
                <section className="mt-10">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        The signed record
                    </h2>
                    <dl className="mt-4 space-y-4">
                        <div>
                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                Subject hash (SHA-256)
                            </dt>
                            <dd className="mt-1 break-all font-mono text-xs leading-relaxed text-ink dark:text-cream">
                                {attestation.subject_hash}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                Signature fingerprint
                            </dt>
                            <dd className="mt-1 font-mono text-sm tracking-wider text-ink dark:text-cream">
                                {fingerprint(attestation.signature)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                On-chain anchor
                            </dt>
                            <dd className="mt-1 break-all font-mono text-xs leading-relaxed text-ink dark:text-cream">
                                {anchored ? (
                                    <>
                                        {attestation.anchor_platform || 'pearls'} ·{' '}
                                        {attestation.anchor_chain || 'base'} · {attestation.anchor_tx}
                                        {attestation.anchor_contract &&
                                            ` · contract ${attestation.anchor_contract}`}
                                        {attestation.anchored_at &&
                                            ` · anchored ${new Date(attestation.anchored_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                                    </>
                                ) : (
                                    <span className="font-serif text-sm text-ink-soft dark:text-cream-soft">
                                        {ANCHOR_PLACEHOLDER}
                                    </span>
                                )}
                            </dd>
                        </div>
                    </dl>
                    <p className="mt-4 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                        To check this work yourself: hash the published brief and compare it to the
                        subject hash above. If they match, the work in front of you is the exact work
                        Glenride attested — not a later edit wearing its name.
                    </p>
                </section>

                {/* Challenges */}
                <section className="mt-10 border-t border-line pt-10 dark:border-line-dark">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">Challenges</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                        An attestation authority that cannot be questioned is just a priesthood. Any
                        signed-in Fellow can challenge this record with stated grounds; a challenge
                        marks the record as challenged in public until it is resolved.
                    </p>

                    {challenges.length === 0 ? (
                        <p className="mt-4 text-sm text-ink-soft dark:text-cream-soft">
                            No challenges have been raised against this attestation.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-4">
                            {challenges.map((challenge) => (
                                <li
                                    key={challenge.id}
                                    className="rounded-2xl border border-line bg-paper-deep p-5 dark:border-line-dark dark:bg-night-deep"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <span className="font-semibold text-ink dark:text-cream">
                                            {challenge.challenger?.name || 'Fellow'}
                                        </span>
                                        <span className="font-mono uppercase tracking-wider text-sienna-deep dark:text-sienna">
                                            {challenge.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-ink dark:text-cream">
                                        {challenge.grounds}
                                    </p>
                                    {challenge.resolution_note && (
                                        <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                                            Resolution: {challenge.resolution_note}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {auth?.user && isActive && (
                        <form onSubmit={submitChallenge} className="mt-6">
                            <label
                                htmlFor="grounds"
                                className="block font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft"
                            >
                                Raise a challenge — state your grounds
                            </label>
                            <textarea
                                id="grounds"
                                rows={4}
                                value={challengeForm.data.grounds}
                                onChange={(e) => challengeForm.setData('grounds', e.target.value)}
                                className="mt-2 w-full rounded-xl border-line bg-paper px-4 py-3 text-sm text-ink shadow-sm focus:border-sienna-deep focus:ring-sienna-deep dark:border-line-dark dark:bg-night-card dark:text-cream"
                                placeholder="What is wrong with this record, and what evidence shows it?"
                            />
                            {challengeForm.errors.grounds && (
                                <p className="mt-2 text-sm text-sienna-deep dark:text-sienna">
                                    {challengeForm.errors.grounds}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={challengeForm.processing}
                                className="mt-3 inline-flex items-center rounded-xl border border-sienna-deep px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-sienna-deep transition hover:bg-sienna hover:text-ink disabled:opacity-50 dark:border-sienna dark:text-sienna"
                            >
                                Submit challenge
                            </button>
                        </form>
                    )}

                    {canIssue && isActive && (
                        <form
                            onSubmit={submitRevoke}
                            className="mt-8 border-t border-line pt-6 dark:border-line-dark"
                        >
                            <label
                                htmlFor="reason"
                                className="block font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft"
                            >
                                Revoke this attestation (issuers only)
                            </label>
                            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                                <input
                                    id="reason"
                                    type="text"
                                    value={revokeForm.data.reason}
                                    onChange={(e) => revokeForm.setData('reason', e.target.value)}
                                    placeholder="Reason for revocation"
                                    className="w-full rounded-xl border-line bg-paper px-4 py-3 text-sm text-ink shadow-sm focus:border-sienna-deep focus:ring-sienna-deep dark:border-line-dark dark:bg-night-card dark:text-cream"
                                />
                                <button
                                    type="submit"
                                    disabled={revokeForm.processing}
                                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-ink px-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-paper shadow-sm transition hover:bg-sienna-deep disabled:opacity-50"
                                >
                                    Revoke
                                </button>
                            </div>
                            {revokeForm.errors.reason && (
                                <p className="mt-2 text-sm text-sienna-deep dark:text-sienna">
                                    {revokeForm.errors.reason}
                                </p>
                            )}
                        </form>
                    )}
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
