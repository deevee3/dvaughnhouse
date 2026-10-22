import { Head, Link } from '@inertiajs/react';

export default function Show({ document, auth }) {
    return (
        <div className="min-h-screen bg-paper text-ink dark:bg-night dark:text-cream font-serif selection:bg-sienna selection:text-ink">
            <Head title={`${document.id} — ${document.title} - Glenride`} />

            <style>{`
                .sop-content { color: #221D18; line-height: 1.75; }
                .sop-content h1 { font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; color: #221D18; margin: 0 0 1rem; }
                .sop-content h2 { font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 1.4rem; font-weight: 700; color: #221D18; margin: 2.25rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid rgba(34, 29, 24, 0.12); }
                .sop-content h3 { font-family: 'Newsreader', Georgia, serif; font-size: 1.1rem; font-weight: 700; color: #221D18; margin: 1.75rem 0 0.5rem; }
                .sop-content p { margin: 0.9rem 0; }
                .sop-content ul, .sop-content ol { margin: 0.9rem 0; padding-left: 1.5rem; }
                .sop-content ul { list-style: disc; }
                .sop-content ol { list-style: decimal; }
                .sop-content li { margin: 0.35rem 0; }
                .sop-content li::marker { color: #B84A2B; }
                .sop-content strong { color: #221D18; }
                .sop-content hr { border: 0; border-top: 1px solid rgba(34, 29, 24, 0.12); margin: 2rem 0; }
                .sop-content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }
                .sop-content th { text-align: left; font-family: ui-monospace, monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #57504A; padding: 0.6rem 0.75rem; border-bottom: 2px solid rgba(34, 29, 24, 0.12); }
                .sop-content td { padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(34, 29, 24, 0.12); vertical-align: top; }
                .sop-content tr:hover td { background: #F3ECDC; }
                .sop-content blockquote { border-left: 1px solid #E97451; padding-left: 1rem; margin: 1rem 0; color: #57504A; font-style: italic; }
                .sop-content code { font-family: ui-monospace, monospace; font-size: 0.85em; background: #F3ECDC; padding: 0.15em 0.35em; border-radius: 0.25rem; }
                .sop-content a { color: #B84A2B; text-decoration: underline; }

                @media (prefers-color-scheme: dark) {
                    .sop-content { color: #F3ECDC; }
                    .sop-content h1, .sop-content h2, .sop-content h3, .sop-content strong { color: #F3ECDC; }
                    .sop-content h2, .sop-content hr { border-color: rgba(250, 245, 236, 0.14); }
                    .sop-content th { color: #CFC6B4; border-color: rgba(250, 245, 236, 0.14); }
                    .sop-content td { border-color: rgba(250, 245, 236, 0.14); }
                    .sop-content tr:hover td { background: #241D16; }
                    .sop-content blockquote, .sop-content em { color: #CFC6B4; }
                    .sop-content code { background: #241D16; }
                    .sop-content a { color: #E97451; }
                    .sop-content li::marker { color: #E97451; }
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
                                Standard Operating Procedures
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
                        <Link href={route('sops.index')} className="text-sienna-deep dark:text-sienna font-semibold">
                            SOPs
                        </Link>
                        <Link href={route('essays.index')} className="text-ink-soft dark:text-cream-soft hover:text-ink dark:hover:text-cream transition">
                            Essays
                        </Link>
                    </nav>
                    <Link
                        href={route('sops.index')}
                        className="text-xs font-mono font-medium text-ink-soft dark:text-cream-soft hover:text-ink dark:hover:text-cream transition"
                    >
                        ← All procedures
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-sienna-deep dark:text-sienna">
                        {document.id}
                    </span>
                    <span className="rounded-full bg-paper-deep dark:bg-night-deep px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                        {document.status}
                    </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft dark:text-cream-soft">
                    <span>Owner: <span className="text-ink dark:text-cream">{document.owner}</span></span>
                    <span>Approver: <span className="text-ink dark:text-cream">{document.approver}</span></span>
                </div>

                <article
                    className="sop-content mt-8 rounded-xl border border-line bg-paper dark:border-line-dark dark:bg-nightdark:bg-night-card p-8 shadow-sm sm:p-12"
                    dangerouslySetInnerHTML={{ __html: document.html }}
                />

                <div className="mt-10 flex justify-between border-t border-line dark:border-line-dark pt-6">
                    <Link
                        href={route('sops.index')}
                        className="text-sm font-medium text-sienna-deep dark:text-sienna hover:text-sienna-deep dark:hover:text-sienna transition"
                    >
                        ← Back to all procedures
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                        {document.id} · {document.status}
                    </span>
                </div>
            </main>

            <footer className="border-t border-line dark:border-line-dark py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
                    Glenride · Procedures are versioned; numbers are permanent
                </p>
            </footer>
        </div>
    );
}
