import { Head, Link } from '@inertiajs/react';

export default function Show({ document, auth }) {
    return (
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-[#E97451] selection:text-white">
            <Head title={`${document.title} - Glenride`} />

            <style>{`
                .essay-content { color: #292524; line-height: 1.8; font-size: 1.05rem; }
                .essay-content h1 { font-family: ui-serif, Georgia, serif; font-size: 2.25rem; font-weight: 700; letter-spacing: -0.02em; color: #111827; margin: 0 0 1rem; line-height: 1.2; }
                .essay-content h2 { font-family: ui-serif, Georgia, serif; font-size: 1.5rem; font-weight: 700; color: #111827; margin: 2.5rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid #e7e5e4; }
                .essay-content h3 { font-size: 1.15rem; font-weight: 700; color: #1c1917; margin: 1.75rem 0 0.5rem; }
                .essay-content p { margin: 1rem 0; }
                .essay-content ul, .essay-content ol { margin: 1rem 0; padding-left: 1.5rem; }
                .essay-content ul { list-style: disc; }
                .essay-content ol { list-style: decimal; }
                .essay-content li { margin: 0.35rem 0; }
                .essay-content li::marker { color: #E97451; }
                .essay-content strong { color: #111827; }
                .essay-content em { color: #44403c; }
                .essay-content hr { border: 0; border-top: 1px solid #e7e5e4; margin: 2rem 0; }
                .essay-content blockquote { border-left: 3px solid #f2c9b8; padding-left: 1rem; margin: 1rem 0; color: #57534e; font-style: italic; }
                .essay-content code { font-family: ui-monospace, monospace; font-size: 0.85em; background: #f5f5f4; padding: 0.15em 0.35em; border-radius: 0.25rem; }
                .essay-content a { color: #E97451; text-decoration: underline; }
            `}</style>

            {/* Institutional Header */}
            <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-[#E97451] transition">
                            G
                        </div>
                        <div>
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-[#E97451] transition">
                                Glenride
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                Essays
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
                        <Link href={route('sops.index')} className="text-stone-600 hover:text-gray-900 transition">
                            SOPs
                        </Link>
                        <Link href={route('essays.index')} className="text-[#E97451] font-semibold">
                            Essays
                        </Link>
                    </nav>
                    <Link
                        href={route('essays.index')}
                        className="text-xs font-mono font-medium text-stone-600 hover:text-gray-900 transition"
                    >
                        ← All essays
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E97451]">
                        {document.id}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                        {document.status}
                    </span>
                </div>

                <div className="mt-4 font-mono text-[11px] uppercase tracking-wider text-stone-500">
                    {document.meta}
                </div>

                <article
                    className="essay-content mt-8 rounded-xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12"
                    dangerouslySetInnerHTML={{ __html: document.html }}
                />

                <div className="mt-10 flex justify-between border-t border-stone-200 pt-6">
                    <Link
                        href={route('essays.index')}
                        className="text-sm font-medium text-[#E97451] hover:text-[#9c4a28] transition"
                    >
                        ← Back to all essays
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-stone-400">
                        {document.id} · {document.status}
                    </span>
                </div>
            </main>

            <footer className="border-t border-stone-200 py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-stone-400">
                    Glenride · D'Vaughn House
                </p>
            </footer>
        </div>
    );
}
