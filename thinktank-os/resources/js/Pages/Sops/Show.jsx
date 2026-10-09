import { Head, Link } from '@inertiajs/react';

export default function Show({ document, auth }) {
    return (
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-indigo-600 selection:text-white">
            <Head title={`${document.id} — ${document.title} - The Glenride Institute`} />

            <style>{`
                .sop-content { color: #292524; line-height: 1.75; }
                .sop-content h1 { font-family: ui-serif, Georgia, serif; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; color: #111827; margin: 0 0 1rem; }
                .sop-content h2 { font-family: ui-serif, Georgia, serif; font-size: 1.4rem; font-weight: 700; color: #111827; margin: 2.25rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid #e7e5e4; }
                .sop-content h3 { font-size: 1.1rem; font-weight: 700; color: #1c1917; margin: 1.75rem 0 0.5rem; }
                .sop-content p { margin: 0.9rem 0; }
                .sop-content ul, .sop-content ol { margin: 0.9rem 0; padding-left: 1.5rem; }
                .sop-content ul { list-style: disc; }
                .sop-content ol { list-style: decimal; }
                .sop-content li { margin: 0.35rem 0; }
                .sop-content li::marker { color: #4f46e5; }
                .sop-content strong { color: #111827; }
                .sop-content hr { border: 0; border-top: 1px solid #e7e5e4; margin: 2rem 0; }
                .sop-content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }
                .sop-content th { text-align: left; font-family: ui-monospace, monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #57534e; padding: 0.6rem 0.75rem; border-bottom: 2px solid #d6d3d1; }
                .sop-content td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
                .sop-content tr:hover td { background: #fafaf9; }
                .sop-content blockquote { border-left: 3px solid #c7d2fe; padding-left: 1rem; margin: 1rem 0; color: #57534e; font-style: italic; }
                .sop-content code { font-family: ui-monospace, monospace; font-size: 0.85em; background: #f5f5f4; padding: 0.15em 0.35em; border-radius: 0.25rem; }
                .sop-content a { color: #4f46e5; text-decoration: underline; }
            `}</style>

            {/* Institutional Header */}
            <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-indigo-600 transition">
                            G
                        </div>
                        <div>
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition">
                                The Glenride Institute
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                Standard Operating Procedures
                            </span>
                        </div>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <Link href={route('library.index')} className="text-stone-600 hover:text-gray-900 transition">
                            Vanguard Library
                        </Link>
                        <Link href={route('thesis.index')} className="text-stone-600 hover:text-gray-900 transition">
                            Institutional Thesis
                        </Link>
                        <Link href={route('sops.index')} className="text-indigo-600 font-semibold">
                            SOPs
                        </Link>
                    </nav>
                    <Link
                        href={route('sops.index')}
                        className="text-xs font-mono font-medium text-stone-600 hover:text-gray-900 transition"
                    >
                        ← All procedures
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-indigo-600">
                        {document.id}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                        {document.status}
                    </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    <span>Owner: <span className="text-stone-700">{document.owner}</span></span>
                    <span>Approver: <span className="text-stone-700">{document.approver}</span></span>
                </div>

                <article
                    className="sop-content mt-8 rounded-xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12"
                    dangerouslySetInnerHTML={{ __html: document.html }}
                />

                <div className="mt-10 flex justify-between border-t border-stone-200 pt-6">
                    <Link
                        href={route('sops.index')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
                    >
                        ← Back to all procedures
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-stone-400">
                        {document.id} · {document.status}
                    </span>
                </div>
            </main>

            <footer className="border-t border-stone-200 py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-stone-400">
                    The Glenride Institute · Procedures are versioned; numbers are permanent
                </p>
            </footer>
        </div>
    );
}
