import { Head, Link } from '@inertiajs/react';

export default function Show({ document, auth }) {
    return (
        <div className="min-h-screen bg-paper text-ink dark:bg-night dark:text-cream font-serif selection:bg-sienna selection:text-ink">
            <Head title={`${document.title} - Glenride`} />

            <style>{`
                .essay-content { color: #221D18; line-height: 1.8; font-size: 1.05rem; }
                .essay-content h1 { font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 2.25rem; font-weight: 700; letter-spacing: -0.02em; color: #221D18; margin: 0 0 1rem; line-height: 1.2; }
                .essay-content h2 { font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 1.5rem; font-weight: 700; color: #221D18; margin: 2.5rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid rgba(34, 29, 24, 0.12); }
                .essay-content h3 { font-family: 'Newsreader', Georgia, serif; font-size: 1.15rem; font-weight: 700; color: #221D18; margin: 1.75rem 0 0.5rem; }
                .essay-content p { margin: 1rem 0; }
                .essay-content ul, .essay-content ol { margin: 1rem 0; padding-left: 1.5rem; }
                .essay-content ul { list-style: disc; }
                .essay-content ol { list-style: decimal; }
                .essay-content li { margin: 0.35rem 0; }
                .essay-content li::marker { color: #B84A2B; }
                .essay-content strong { color: #221D18; }
                .essay-content em { color: #57504A; }
                .essay-content hr { border: 0; border-top: 1px solid rgba(34, 29, 24, 0.12); margin: 2rem 0; }
                .essay-content blockquote { border-left: 1px solid #E97451; padding-left: 1rem; margin: 1rem 0; color: #57504A; font-style: italic; }
                .essay-content code { font-family: ui-monospace, monospace; font-size: 0.85em; background: #F3ECDC; padding: 0.15em 0.35em; border-radius: 0.25rem; }
                .essay-content a { color: #B84A2B; text-decoration: underline; }

                @media (prefers-color-scheme: dark) {
                    .essay-content { color: #F3ECDC; }
                    .essay-content h1, .essay-content h2, .essay-content h3, .essay-content strong { color: #F3ECDC; }
                    .essay-content h2, .essay-content hr { border-color: rgba(250, 245, 236, 0.14); }
                    .essay-content th { color: #CFC6B4; border-color: rgba(250, 245, 236, 0.14); }
                    .essay-content td { border-color: rgba(250, 245, 236, 0.14); }
                    .essay-content tr:hover td { background: #241D16; }
                    .essay-content blockquote, .essay-content em { color: #CFC6B4; }
                    .essay-content code { background: #241D16; }
                    .essay-content a { color: #E97451; }
                    .essay-content li::marker { color: #E97451; }
                }
                        `}</style>

            {/* Institutional Header */}
            <header className="sticky top-0 z-40 border-b border-line bg-paper dark:border-line-dark dark:bg-night">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-paper font-display font-bold text-lg shadow-sm group-hover:bg-sienna hover:text-ink transition">
                            G
                        </div>
                        <div>
                            <span className="block font-display text-lg font-bold tracking-tight text-ink dark:text-cream group-hover:text-sienna-deep dark:group-hover:text-sienna transition">
                                Glenride
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                                Essays
                            </span>
                        </div>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <Link href={route('library.index')} className="text-ink-soft dark:text-cream-soft hover:text-ink dark:hover:text-cream transition">
                            Vanguard Library
                        </Link>
                        <Link href={route('thesis.index')} className="text-ink-soft dark:text-cream-soft hover:text-ink dark:hover:text-cream transition">
                            Institutional Thesis
                        </Link>
                        <Link href={route('sops.index')} className="text-ink-soft dark:text-cream-soft hover:text-ink dark:hover:text-cream transition">
                            SOPs
                        </Link>
                        <Link href={route('essays.index')} className="text-sienna-deep dark:text-sienna font-semibold">
                            Essays
                        </Link>
                    </nav>
                    <Link
                        href={route('essays.index')}
                        className="text-xs font-mono font-medium text-ink-soft dark:text-cream-soft hover:text-ink dark:hover:text-cream transition"
                    >
                        ← All essays
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-sienna-deep dark:text-sienna">
                        {document.id}
                    </span>
                    <span className="rounded-full bg-paper-deep dark:bg-night-deep px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                        {document.status}
                    </span>
                </div>

                <div className="mt-4 font-mono text-[11px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                    {document.meta}
                </div>

                <article
                    className="essay-content mt-8 rounded-xl border border-line bg-paper dark:border-line-dark dark:bg-nightdark:bg-night-card p-8 shadow-sm sm:p-12"
                    dangerouslySetInnerHTML={{ __html: document.html }}
                />

                <div className="mt-10 flex justify-between border-t border-line dark:border-line-dark pt-6">
                    <Link
                        href={route('essays.index')}
                        className="text-sm font-medium text-sienna-deep dark:text-sienna hover:text-sienna-deep dark:hover:text-sienna transition"
                    >
                        ← Back to all essays
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                        {document.id} · {document.status}
                    </span>
                </div>
            </main>

            <footer className="border-t border-line dark:border-line-dark py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                    Glenride · D'Vaughn House
                </p>
            </footer>
        </div>
    );
}
