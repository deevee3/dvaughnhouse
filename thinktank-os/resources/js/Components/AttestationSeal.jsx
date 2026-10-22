import { Link } from '@inertiajs/react';

const STATUS_STYLES = {
    issued: 'bg-sienna text-ink',
    challenged: 'border border-sienna-deep text-sienna-deep dark:border-sienna dark:text-sienna',
    revoked: 'border border-line text-ink-soft dark:border-line-dark dark:text-cream-soft line-through',
};

export default function AttestationSeal({ attestation = null }) {
    if (!attestation) {
        return (
            <div className="rounded-2xl border border-dashed border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep">
                <div className="font-display text-base font-bold text-ink dark:text-cream">
                    Not yet attested
                </div>
                <p className="mt-1 font-serif text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                    This work has not been issued a Glenride attestation. It carries no
                    verified authorship, evidence, or provenance record yet.
                </p>
            </div>
        );
    }

    const status = attestation.status || 'issued';

    return (
        <div className="rounded-2xl border border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="font-display text-lg font-bold text-ink dark:text-cream">
                        Witnessed by Glenride
                    </div>
                    <div className="mt-1 font-mono text-xs text-ink-soft dark:text-cream-soft">
                        {attestation.public_id}
                    </div>
                </div>
                <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider ${STATUS_STYLES[status] || STATUS_STYLES.issued}`}
                >
                    {status}
                </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-serif text-sm text-ink-soft dark:text-cream-soft">
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
                {attestation.verifier?.name && (
                    <span>Verified by {attestation.verifier.name}</span>
                )}
                <span>Issuer: {attestation.issuer_name || 'Glenride'}</span>
            </div>

            <Link
                href={route('attestations.show', attestation.public_id)}
                className="mt-4 inline-flex items-center text-xs font-mono font-semibold text-sienna-deep transition hover:text-ink dark:text-sienna dark:hover:text-cream"
            >
                Verify this attestation →
            </Link>
        </div>
    );
}
