import InstitutionalHeader from '@/Components/InstitutionalHeader';
import SiteFooter from '@/Components/SiteFooter';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function AttestButton({ edition, disabled, waiting }) {
    const { post, processing } = useForm({});

    return (
        <button
            type="button"
            disabled={disabled || processing}
            onClick={() => post(route('attestations.attestDigest', edition))}
            className="rounded bg-sienna px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
            {waiting ? 'Waiting on a human' : processing ? 'Checking gates…' : 'Attest'}
        </button>
    );
}

export default function DigestQueue({ rows = [], canIssue = false, auth, humanPrincipal, authorization }) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen bg-paper font-serif text-ink selection:bg-sienna selection:text-ink dark:bg-night dark:text-cream">
            <Head title="Digest attestation queue - Glenride" />

            <InstitutionalHeader auth={auth} active="attestations" subtitle="Glenride Attestations" />

            <main className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
                <div className="max-w-3xl">
                    <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-cream sm:text-5xl">
                        Digest attestation queue.
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-ink-soft dark:text-cream-soft">
                        One-click attestation for weekly drug-shortage digests. Each row runs
                        the same six gates and the same signing code as the scheduled job. A
                        failed gate holds the row and shows the reason; nothing signs past a
                        failure.
                    </p>
                    <p className="mt-4 leading-relaxed text-ink-soft dark:text-cream-soft">
                        Human principal: {humanPrincipal}. Glenride is the issuer of record,
                        acting through him. The system prepares and executes; it is never the
                        attestor. Authorization: {authorization}
                    </p>
                </div>

                {flash?.success && (
                    <p className="mt-8 rounded border border-sienna bg-sienna/10 px-4 py-3 text-ink dark:text-cream">
                        {flash.success}
                    </p>
                )}
                {flash?.error && (
                    <p className="mt-8 rounded border border-red-700 bg-red-50 px-4 py-3 text-red-900 dark:bg-red-950 dark:text-red-100">
                        {flash.error}
                    </p>
                )}

                <div className="mt-10 space-y-6 pb-24">
                    {rows.length === 0 && (
                        <p className="text-ink-soft dark:text-cream-soft">
                            No digest editions are queued.
                        </p>
                    )}

                    {rows.map((row) => (
                        <article
                            key={row.edition_date}
                            className="rounded border border-line bg-paper px-6 py-5 dark:border-line-dark dark:bg-night"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="max-w-2xl">
                                    <h2 className="font-display text-xl font-bold">{row.subject_title}</h2>
                                    <p className="mt-1 text-sm text-ink-soft dark:text-cream-soft">
                                        Edition {row.edition_date} · kind: {row.subject_kind} ·{' '}
                                        {row.released ? 'released' : 'not released'}
                                        {row.is_public ? ' · public' : ' · paid artifact (file + hash)'}
                                    </p>
                                </div>
                                {canIssue && (
                                    <AttestButton
                                        edition={row.edition_date}
                                        disabled={row.waiting_on_human || row.already_attested}
                                        waiting={row.waiting_on_human}
                                    />
                                )}
                            </div>

                            <dl className="mt-4 space-y-2 text-sm leading-relaxed">
                                <div>
                                    <dt className="font-semibold">Claim</dt>
                                    <dd>{row.claim_built ?? row.claim_built_error ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold">Figures</dt>
                                    <dd>
                                        ASHP {row.digest_run?.ashp}, FDA {row.digest_run?.fda_in_shortage} of{' '}
                                        {row.digest_run?.fda_total}, retrieved {row.digest_run?.retrieved_on}
                                    </dd>
                                </div>
                                {row.public_url && (
                                    <div>
                                        <dt className="font-semibold">Public URL</dt>
                                        <dd>
                                            <a className="underline" href={row.public_url}>
                                                {row.public_url}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="font-semibold">Canonical file</dt>
                                    <dd>
                                        {row.canonical_file} {row.file_exists ? '(on disk)' : '(missing)'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-semibold">Subject hash (SHA-256)</dt>
                                    <dd className="break-all font-mono text-xs">{row.subject_hash ?? 'not recorded'}</dd>
                                </div>
                                {row.release_note && (
                                    <div>
                                        <dt className="font-semibold">Release note</dt>
                                        <dd>{row.release_note}</dd>
                                    </div>
                                )}
                            </dl>

                            {row.already_attested && (
                                <p className="mt-4 text-sm">
                                    Already attested:{' '}
                                    <Link
                                        className="underline"
                                        href={route('attestations.show', row.existing_public_id)}
                                    >
                                        {row.existing_public_id}
                                    </Link>
                                    . Attesting again creates no duplicate.
                                </p>
                            )}

                            {row.held && (
                                <p className="mt-4 rounded border border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                                    Held — gate {row.held_gate} failed: {row.held_reason} (
                                    {row.consecutive_failures} consecutive failed run
                                    {row.consecutive_failures === 1 ? '' : 's'}).
                                </p>
                            )}

                            {row.waiting_on_human && (
                                <p className="mt-4 text-sm font-semibold">
                                    Waiting on a human after 3 consecutive failed runs. Fix the
                                    failed gate, then re-run from the scheduled job with --force or
                                    ask the orchestrator to clear the hold.
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
