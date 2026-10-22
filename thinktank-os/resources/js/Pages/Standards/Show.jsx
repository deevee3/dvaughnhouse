import InstitutionalHeader from '@/Components/InstitutionalHeader';
import { Head, Link } from '@inertiajs/react';

export default function Show({ document, auth }) {
    return (
        <div className="min-h-screen bg-paper text-ink dark:bg-night dark:text-cream font-serif selection:bg-sienna selection:text-ink">
            <Head title={`${document.title} - Glenride`} />

            <style>{`
                .standards-content { color: #221D18; line-height: 1.75; }
                .standards-content h1 { font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; color: #221D18; margin: 0 0 1rem; }
                .standards-content h2 { font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 1.4rem; font-weight: 700; color: #221D18; margin: 2.25rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid rgba(34, 29, 24, 0.12); }
                .standards-content h3 { font-family: 'Newsreader', Georgia, serif; font-size: 1.1rem; font-weight: 700; color: #221D18; margin: 1.75rem 0 0.5rem; }
                .standards-content p { margin: 0.9rem 0; }
                .standards-content ul, .standards-content ol { margin: 0.9rem 0; padding-left: 1.5rem; }
                .standards-content ul { list-style: disc; }
                .standards-content ol { list-style: decimal; }
                .standards-content li { margin: 0.35rem 0; }
                .standards-content li::marker { color: #B84A2B; }
                .standards-content strong { color: #221D18; }
                .standards-content hr { border: 0; border-top: 1px solid rgba(34, 29, 24, 0.12); margin: 2rem 0; }
                .standards-content a { color: #B84A2B; text-decoration: underline; }

                @media (prefers-color-scheme: dark) {
                    .standards-content { color: #F3ECDC; }
                    .standards-content h1, .standards-content h2, .standards-content h3, .standards-content strong { color: #F3ECDC; }
                    .standards-content h2, .standards-content hr { border-color: rgba(250, 245, 236, 0.14); }
                    .standards-content th { color: #CFC6B4; border-color: rgba(250, 245, 236, 0.14); }
                    .standards-content td { border-color: rgba(250, 245, 236, 0.14); }
                    .standards-content tr:hover td { background: #241D16; }
                    .standards-content blockquote, .standards-content em { color: #CFC6B4; }
                    .standards-content code { background: #241D16; }
                    .standards-content a { color: #E97451; }
                    .standards-content li::marker { color: #E97451; }
                }
                        `}</style>

            <InstitutionalHeader auth={auth} active="standards" subtitle="Our Standards" />

            <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-sienna-deep dark:text-sienna">
                        Glenride Standard
                    </span>
                    <span className="rounded-full bg-paper-deep dark:bg-night-deep px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                        Living document
                    </span>
                </div>

                <article
                    className="standards-content mt-8 rounded-xl border border-line dark:border-line-dark bg-paper dark:bg-night-card p-8 shadow-sm sm:p-12"
                    dangerouslySetInnerHTML={{ __html: document.html }}
                />

                <div className="mt-10 flex justify-between border-t border-line dark:border-line-dark pt-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-sienna-deep dark:text-sienna hover:text-sienna-deep dark:hover:text-sienna transition"
                    >
                        ← Back to Glenride
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                        Every claim has a trail
                    </span>
                </div>
            </main>

            <footer className="border-t border-line dark:border-line-dark py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                    Glenride · AI prepares. Humans decide.
                </p>
            </footer>
        </div>
    );
}
