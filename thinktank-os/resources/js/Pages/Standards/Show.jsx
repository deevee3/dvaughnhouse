import InstitutionalHeader from '@/Components/InstitutionalHeader';
import { Head, Link } from '@inertiajs/react';

export default function Show({ document, auth }) {
    return (
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-[#E97451] selection:text-white">
            <Head title={`${document.title} - Glenride`} />

            <style>{`
                .standards-content { color: #292524; line-height: 1.75; }
                .standards-content h1 { font-family: ui-serif, Georgia, serif; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; color: #111827; margin: 0 0 1rem; }
                .standards-content h2 { font-family: ui-serif, Georgia, serif; font-size: 1.4rem; font-weight: 700; color: #111827; margin: 2.25rem 0 0.75rem; padding-top: 1.5rem; border-top: 1px solid #e7e5e4; }
                .standards-content h3 { font-size: 1.1rem; font-weight: 700; color: #1c1917; margin: 1.75rem 0 0.5rem; }
                .standards-content p { margin: 0.9rem 0; }
                .standards-content ul, .standards-content ol { margin: 0.9rem 0; padding-left: 1.5rem; }
                .standards-content ul { list-style: disc; }
                .standards-content ol { list-style: decimal; }
                .standards-content li { margin: 0.35rem 0; }
                .standards-content li::marker { color: #E97451; }
                .standards-content strong { color: #111827; }
                .standards-content hr { border: 0; border-top: 1px solid #e7e5e4; margin: 2rem 0; }
                .standards-content a { color: #E97451; text-decoration: underline; }
            `}</style>

            <InstitutionalHeader auth={auth} active="standards" subtitle="Our Standards" />

            <main className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E97451]">
                        Glenride Standard
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                        Living document
                    </span>
                </div>

                <article
                    className="standards-content mt-8 rounded-xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12"
                    dangerouslySetInnerHTML={{ __html: document.html }}
                />

                <div className="mt-10 flex justify-between border-t border-stone-200 pt-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-[#E97451] hover:text-[#9c4a28] transition"
                    >
                        ← Back to Glenride
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-stone-400">
                        Every claim has a trail
                    </span>
                </div>
            </main>

            <footer className="border-t border-stone-200 py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-stone-400">
                    Glenride · AI prepares. Humans decide.
                </p>
            </footer>
        </div>
    );
}
