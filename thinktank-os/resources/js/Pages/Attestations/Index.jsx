import ImageBand from '@/Components/ImageBand';
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

export default function Index({ attestations = [], stats = {}, canIssue = false, auth }) {
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('attestations.verify'));
    };

    return (
        <div className="min-h-screen bg-paper font-serif text-ink selection:bg-sienna selection:text-ink dark:bg-night dark:text-cream">
            <Head title="Attestations - Glenride" />

            <InstitutionalHeader auth={auth} active="attestations" subtitle="Glenride Attestations" />

            {/* Banner hero — full-bleed image */}
            <section aria-hidden="true" className="relative h-[48vh] min-h-[300px] overflow-hidden bg-ink">
                <img
                    src="/images/heroes/hero-documents.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[center_70%]"
                />
                <div className="absolute inset-0 bg-ink/50" />
            </section>

            <main className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
                <div className="max-w-3xl">
                    <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-cream sm:text-5xl">
                        Proof, not promises.
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-ink-soft dark:text-cream-soft">
                        Every Glenride attestation is a signed record of work that happened as
                        claimed. Each one carries the claim that was checked, the evidence behind
                        it, the verifier who checked it, and the timestamp it was issued. If a
                        record cannot be inspected, it should not be trusted — so every record
                        here can be.
                    </p>
                    {canIssue && (
                        <Link
                            href={route('attestations.create')}
                            className="mt-6 inline-flex items-center rounded-xl bg-ink px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-paper shadow-sm transition hover:bg-sienna hover:text-ink"
                        >
                            + New attestation
                        </Link>
                    )}
                </div>

                {/* What an attestation contains */}
                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['The claim', 'What was done, produced, or asserted — stated plainly.'],
                        ['The evidence', 'The trail behind the claim: sources, files, and compliance checks, hashed at issuance.'],
                        ['The verifier', 'Who checked it. In this first version, Glenride signs — editors and orchestrators only.'],
                        ['The timestamp', 'When the record was issued. The signature covers it, so it cannot be quietly moved.'],
                    ].map(([title, body]) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep"
                        >
                            <div className="font-display text-base font-bold text-ink dark:text-cream">
                                {title}
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                                {body}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Supporting image band — predictive forecast globe */}
            <ImageBand src="/images/heroes/hero-forecast.jpg" />

            <main className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
                {/* Verify a record */}
                <section className="mt-12 rounded-2xl border border-line bg-paper-deep p-6 dark:border-line-dark dark:bg-night-deep sm:p-8">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        Verify an attestation
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                        Enter a public ID (for example, GLR-AT-2026-XXXXXX) or a subject hash from
                        any attested work.
                    </p>
                    <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="Public ID or subject hash"
                            className="w-full rounded-xl border-line bg-paper px-4 py-3 font-mono text-sm text-ink shadow-sm focus:border-sienna-deep focus:ring-sienna-deep dark:border-line-dark dark:bg-night-card dark:text-cream"
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sienna px-6 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-ink shadow-sm transition hover:bg-sienna-deep hover:text-paper disabled:opacity-50"
                        >
                            Verify →
                        </button>
                    </form>
                    {errors.code && (
                        <p className="mt-3 text-sm text-sienna-deep dark:text-sienna">{errors.code}</p>
                    )}
                </section>

                {/* Stats */}
                <div className="mt-12 flex flex-wrap gap-8 border-y border-line py-6 dark:border-line-dark">
                    <div>
                        <div className="font-display text-3xl font-bold text-ink dark:text-cream">
                            {stats.total ?? attestations.length}
                        </div>
                        <div className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                            Attestations recorded
                        </div>
                    </div>
                    <div>
                        <div className="font-display text-3xl font-bold text-ink dark:text-cream">
                            {stats.issued ?? 0}
                        </div>
                        <div className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                            In good standing
                        </div>
                    </div>
                    <div>
                        <div className="font-display text-3xl font-bold text-ink dark:text-cream">
                            {stats.challenged ?? 0}
                        </div>
                        <div className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                            Under challenge
                        </div>
                    </div>
                </div>

                {/* Registry */}
                <section className="mt-12">
                    <h2 className="font-display text-2xl font-bold text-ink dark:text-cream">
                        The registry
                    </h2>

                    {attestations.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-line p-12 text-center dark:border-line-dark">
                            <div className="font-display text-lg font-bold text-ink dark:text-cream">
                                No attestations issued yet
                            </div>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                                The first attested work will appear here the moment Glenride signs
                                it. Published work in the Vanguard Library that has not been
                                attested says so plainly on its own page.
                            </p>
                            <Link
                                href={route('library.index')}
                                className="mt-5 inline-flex items-center rounded-xl bg-ink px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-paper shadow-sm transition hover:bg-sienna hover:text-ink"
                            >
                                Browse the Vanguard Library →
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            {attestations.map((attestation) => (
                                <article
                                    key={attestation.id}
                                    className="flex flex-col justify-between rounded-2xl border border-line bg-paper p-7 shadow-sm transition hover:border-sienna-deep/40 dark:border-line-dark dark:bg-night-card dark:hover:border-sienna/50"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-mono text-xs text-sienna-deep dark:text-sienna">
                                                {attestation.public_id}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider ${STATUS_STYLES[attestation.status] || STATUS_STYLES.issued}`}
                                            >
                                                {attestation.status}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 font-display text-xl font-bold leading-snug text-ink dark:text-cream">
                                            <Link href={route('attestations.show', attestation.public_id)}>
                                                {attestation.subject_title}
                                            </Link>
                                        </h3>
                                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                                            {attestation.claim}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs dark:border-line-dark">
                                        <span className="text-ink-soft dark:text-cream-soft">
                                            {attestation.verifier?.name || 'Glenride'}
                                            {attestation.issued_at &&
                                                ` · ${new Date(attestation.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                        </span>
                                        <Link
                                            href={route('attestations.show', attestation.public_id)}
                                            className="font-mono font-semibold text-sienna-deep transition hover:text-ink dark:text-sienna dark:hover:text-cream"
                                        >
                                            Verify →
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
