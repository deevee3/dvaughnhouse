import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function Show({ manuscript = {}, content = '', related = [], isPreview = false }) {
    const [copiedCitation, setCopiedCitation] = useState(false);

    // Build standard Glenride academic citation
    const citation = useMemo(() => {
        const author = manuscript.user?.name || 'Glenride Fellow';
        const year = manuscript.published_at ? new Date(manuscript.published_at).getFullYear() : '2026';
        return `${author} (${year}). "${manuscript.title}". Glenride Institutional Monographs, Document ID: ${manuscript.id}.`;
    }, [manuscript]);

    const handleCopyCitation = () => {
        navigator.clipboard.writeText(citation);
        setCopiedCitation(true);
        setTimeout(() => setCopiedCitation(false), 3000);
    };

    // Calculate approximate read time
    const readTime = useMemo(() => {
        const words = manuscript.word_count || (content ? content.split(/\s+/).length : 850);
        return Math.max(1, Math.ceil(words / 220));
    }, [manuscript.word_count, content]);

    return (
        <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-indigo-600 selection:text-white">
            <Head title={`${manuscript.title} - The Vanguard Library`} />

            {/* Navigation Masthead */}
            <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fcfbf9]/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <Link
                        href={route('library.index')}
                        className="inline-flex items-center text-xs font-mono font-semibold uppercase tracking-wider text-stone-600 hover:text-gray-900 transition"
                    >
                        ← Back to Vanguard Library
                    </Link>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={handleCopyCitation}
                            className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-mono text-stone-700 hover:bg-stone-50 shadow-sm transition"
                        >
                            {copiedCitation ? '✓ Citation Copied' : 'Copy Citation'}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-mono font-semibold text-white hover:bg-indigo-600 shadow-sm transition"
                        >
                            Print / PDF
                        </button>
                    </div>
                </div>
            </header>

            {/* Preview Banner if unpublished */}
            {isPreview && (
                <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-6 text-center text-xs font-mono text-amber-800">
                    ⚠️ Editorial Preview Mode: This manuscript is in active editorial polish and not yet released to the public index.
                </div>
            )}

            {/* Main Reading Document */}
            <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
                {/* Monograph Document Header */}
                <div className="border-b border-stone-200 pb-10 mb-12">
                    <div className="flex items-center space-x-2 text-xs font-mono text-indigo-600 uppercase tracking-wider mb-4">
                        <span>Glenride Institutional Monographs</span>
                        <span>•</span>
                        <span>Doc ID: {manuscript.id?.slice(0, 8) || 'Vanguard'}</span>
                    </div>

                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-[1.15]">
                        {manuscript.title}
                    </h1>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-stone-500 border-t border-stone-200/60 pt-4">
                        <div>
                            <span className="block font-semibold text-gray-900 font-sans text-sm">
                                {manuscript.user?.name || 'Institutional Fellow'}
                            </span>
                            <span className="text-stone-400">
                                The Glenride Institute // Policy Fellow
                            </span>
                        </div>

                        <div className="flex items-center space-x-4 text-right">
                            <div>
                                <span className="text-stone-400">Date Released:</span>
                                <span className="ml-1 text-gray-800">
                                    {manuscript.published_at
                                        ? new Date(manuscript.published_at).toLocaleDateString('en-US', {
                                              month: 'long',
                                              day: 'numeric',
                                              year: 'numeric',
                                          })
                                        : new Date().toLocaleDateString('en-US', {
                                              month: 'long',
                                              day: 'numeric',
                                              year: 'numeric',
                                          })}
                                </span>
                            </div>
                            <div>
                                <span className="text-stone-400">Read Time:</span>
                                <span className="ml-1 text-gray-800">{readTime} min read</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Abstract Callout */}
                {manuscript.abstract && (
                    <div className="rounded-2xl border-l-4 border-indigo-600 bg-stone-100/70 p-6 mb-12 font-serif text-base text-stone-700 leading-relaxed italic">
                        <div className="font-mono text-xs not-italic font-bold uppercase tracking-wider text-indigo-700 mb-2">
                            Executive Abstract
                        </div>
                        {manuscript.abstract}
                    </div>
                )}

                {/* Brief Body Typography */}
                <article className="font-serif text-stone-800 leading-relaxed text-lg space-y-6">
                    {content ? (
                        <div className="whitespace-pre-wrap font-sans text-base leading-relaxed text-stone-800 space-y-4">
                            {content}
                        </div>
                    ) : (
                        <div className="space-y-8 font-sans text-base leading-relaxed">
                            <section>
                                <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-stone-200 pb-2">
                                    1. Executive Thesis & Problem Formulation
                                </h2>
                                <p className="text-stone-700 leading-relaxed">
                                    The modern operating environment forces leadership architectures to confront unprecedented velocity without sacrificing institutional stability. This Vanguard Policy Brief synthesizes primary empirical findings into actionable protocols designed to eliminate administrative latency.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-stone-200 pb-2">
                                    2. De-Jargonized Empirical Findings
                                </h2>
                                <p className="text-stone-700 leading-relaxed">
                                    Through systematic analysis of clinical data flows and high-assurance supply chains, three operational patterns emerge:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-stone-700 mt-3">
                                    <li><strong>Velocity Without Fragility:</strong> Algorithmic orchestration delivers real-time analytical power only when combined with strict human ethical verification gates.</li>
                                    <li><strong>Supply Chain Redundancy:</strong> Decentralized localized production nodes minimize exposure to single-point maritime or political failure vectors.</li>
                                    <li><strong>Air-Gapped IP Isolation:</strong> Core institutional intellectual capital must remain sequestered from public cloud training sets to prevent competitive degradation.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-stone-200 pb-2">
                                    3. Actionable Policy Recommendations
                                </h2>
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                                        <div className="font-bold text-gray-900 text-sm">Recommendation 1: Local-First Verification Mandates</div>
                                        <p className="text-stone-600 text-sm mt-1">Implement localized zero-trust ingestion protocols for all sensitive datasets, ensuring automated scrubbers operate behind institutional firewalls.</p>
                                    </div>
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                                        <div className="font-bold text-gray-900 text-sm">Recommendation 2: Scholar Incentive Restructuring</div>
                                        <p className="text-stone-600 text-sm mt-1">Deploy automated $500 micro-grant compensation models upon verified compliance intake, accelerating independent doctoral contributions.</p>
                                    </div>
                                    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                                        <div className="font-bold text-gray-900 text-sm">Recommendation 3: Continuous Ethical Auditing</div>
                                        <p className="text-stone-600 text-sm mt-1">Require tripartite digital sign-offs (Ethics, Transparency, and Citation Authenticity) prior to model ingestion.</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-stone-200 pb-2">
                                    4. Economic & Strategic Impact Projection
                                </h2>
                                <p className="text-stone-700 leading-relaxed">
                                    Adopting these strategic interventions insulates the enterprise against technological disruption while maintaining high-assurance regulatory compliance. The Glenride Institute provides ongoing executive advisory retainers to assist enterprise transitions.
                                </p>
                            </section>
                        </div>
                    )}
                </article>

                {/* Official Monograph End Note */}
                <div className="mt-16 pt-8 border-t border-stone-300 font-mono text-xs text-stone-500 space-y-2">
                    <p>
                        <strong>Publication Notice:</strong> This monograph was prepared under the auspices of The Glenride Institute. Autonomous distillation executed via ThinkTank OS ContextForge. Human verification certified by institutional fellows.
                    </p>
                    <p>
                        <strong>Permanent Citation:</strong> {citation}
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-stone-200 bg-white py-12 text-xs text-stone-500 font-mono">
                <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>© {new Date().getFullYear()} The Glenride Institute.</div>
                    <div className="flex items-center space-x-6">
                        <Link href={route('library.index')} className="hover:text-gray-900 transition">
                            Vanguard Library
                        </Link>
                        <Link href={route('thesis.index')} className="hover:text-gray-900 transition">
                            Institutional Thesis
                        </Link>
                        <Link href={route('dashboard')} className="hover:text-gray-900 transition">
                            ThinkTank OS
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
