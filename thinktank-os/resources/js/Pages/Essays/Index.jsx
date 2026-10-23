import InstitutionalHeader from '@/Components/InstitutionalHeader';
import { Head, Link } from '@inertiajs/react';

export default function Index({ documents = [], auth }) {
    return (
        <div className="min-h-screen bg-paper text-ink dark:bg-night dark:text-cream font-serif selection:bg-sienna selection:text-ink">
            <Head title="Essays - Glenride" />
            <InstitutionalHeader auth={auth} active="essays" />

            {/* Banner hero — full-bleed image */}
            <section aria-hidden="true" className="relative h-[48vh] min-h-[300px] overflow-hidden bg-ink">
                <img
                    src="/images/heroes/hero-digital-twin.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
                />
                <div className="absolute inset-0 bg-ink/50" />
            </section>

            <main className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
                <div className="max-w-3xl">
                    <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink dark:text-cream sm:text-5xl">
                        Essays
                    </h1>
                                        <p className="font-mono text-xs uppercase tracking-widest text-sienna-deep dark:text-sienna">
                        Glenride · Essays
                    </p>
                    <p className="mt-6 text-lg leading-relaxed text-ink-soft dark:text-cream-soft">
                        Long-form arguments from the founder's desk — the thinking
                        the institution is built on, argued the way Glenride's
                        scholars are expected to argue: every claim wired to
                        evidence, limits stated plainly.
                    </p>
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Link
                            key={doc.slug}
                            href={route('essays.show', doc.slug)}
                            className="group flex flex-col rounded-xl border border-line dark:border-line-dark bg-paper dark:bg-night-card p-6 shadow-sm transition hover:border-sienna-deep/40 dark:hover:border-sienna/50 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase tracking-widest text-sienna-deep dark:text-sienna">
                                    {doc.id}
                                </span>
                                <span className="rounded-full bg-paper-deep dark:bg-night-deep px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                    {doc.status}
                                </span>
                            </div>
                            <h2 className="mt-3 font-display text-xl font-bold text-ink dark:text-cream group-hover:text-sienna-deep dark:group-hover:text-sienna transition">
                                {doc.title}
                            </h2>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
                                {doc.description}
                            </p>
                            <div className="mt-4 border-t border-line dark:border-line-dark pt-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                                {doc.meta}
                            </div>
                            <span className="mt-3 text-sm font-medium text-sienna-deep dark:text-sienna group-hover:text-sienna-deep dark:group-hover:text-sienna transition">
                                Read essay →
                            </span>
                        </Link>
                    ))}
                </div>
            </main>

            <footer className="border-t border-line dark:border-line-dark py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                    Glenride · Essays are versioned; arguments are permanent
                </p>
            </footer>
        </div>
    );
}
