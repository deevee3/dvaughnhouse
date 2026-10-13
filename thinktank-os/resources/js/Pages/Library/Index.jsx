import InstitutionalHeader from '@/Components/InstitutionalHeader';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';

const FEATURED_FALLBACKS = [
    {
        id: 'featured-monograph-1',
        title: 'Autonomous Agentic Governance in High-Assurance Sectors',
        abstract: 'A strategic framework addressing the latency gap between rapid algorithmic decision-making and human moral verification across clinical trial data pipelines and defense infrastructure.',
        word_count: 940,
        published_at: '2026-09-15',
        user: { name: 'D\'Vaughn House' },
        series: 'Glenride Policy Monograph Series No. 1',
        is_curated: true,
    },
];

export default function Index({ briefs = [], auth }) {
    const [searchQuery, setSearchQuery] = useState('');

    // Combine published database briefs with curated flagships if empty or in early stage
    const allBriefs = useMemo(() => {
        if (briefs.length > 0) {
            return briefs;
        }
        return FEATURED_FALLBACKS;
    }, [briefs]);

    const filteredBriefs = useMemo(() => {
        if (!searchQuery.trim()) return allBriefs;
        const q = searchQuery.toLowerCase();
        return allBriefs.filter(
            (b) =>
                b.title?.toLowerCase().includes(q) ||
                b.abstract?.toLowerCase().includes(q) ||
                b.user?.name?.toLowerCase().includes(q)
        );
    }, [allBriefs, searchQuery]);

    return (
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-[#E97451] selection:text-white">
            <Head title="The Vanguard Library - Glenride" />

            <InstitutionalHeader auth={auth} active="library" />

            {/* Hero Section */}
            <section className="relative border-b border-stone-200 bg-white py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center space-x-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-mono text-stone-600 mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>The Glenride Monograph Series</span>
                        </div>
                        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                            The Vanguard Library
                        </h1>
                        <p className="mt-4 text-lg text-stone-600 font-serif leading-relaxed">
                            Peer-reviewed empirical research distilled into actionable, four-page executive policy briefs. Synthesized autonomously through ContextForge and curated by institutional fellows.
                        </p>
                    </div>

                    {/* Search & Topic Filter */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full max-w-lg">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search policy briefs by keyword, topic, or author..."
                                className="w-full rounded-xl border-stone-300 bg-stone-50/50 pl-11 pr-4 py-3 text-sm focus:border-[#cf6238] focus:bg-white focus:ring-[#cf6238] transition shadow-sm"
                            />
                            <svg
                                className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <span className="text-xs font-mono text-stone-400">
                            Showing {filteredBriefs.length} Monographs
                        </span>
                    </div>
                </div>
            </section>

            {/* Policy Brief Grid */}
            <main className="py-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    {filteredBriefs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
                            <h3 className="font-serif text-lg font-bold text-gray-900">
                                No monographs matched your search
                            </h3>
                            <p className="mt-2 text-sm text-stone-500">
                                Try searching for terms like "supply chain", "agentic", or "governance".
                            </p>
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="mt-4 inline-flex items-center rounded-lg bg-[#E97451] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#cf6238]"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {filteredBriefs.map((brief) => (
                                <article
                                    key={brief.id}
                                    className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-[#f2c9b8] transition duration-200"
                                >
                                    <div>
                                        {/* Meta Pill */}
                                        <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-4">
                                            <span className="text-[#E97451] font-medium">
                                                {brief.series || 'Glenride Institutional Monograph'}
                                            </span>
                                            <span>
                                                {brief.published_at
                                                    ? new Date(brief.published_at).toLocaleDateString('en-US', {
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : 'Fall 2026'}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h2 className="font-serif text-xl font-bold text-gray-900 group-hover:text-[#E97451] transition leading-snug">
                                            <Link href={route('briefs.show', brief.id)}>
                                                {brief.title}
                                            </Link>
                                        </h2>

                                        {/* Abstract */}
                                        <p className="mt-3 text-sm text-stone-600 line-clamp-3 leading-relaxed font-sans">
                                            {brief.abstract ||
                                                'Synthesized 4-page policy brief detailing empirical methodology, core operational findings, and actionable recommendations for modern leaders.'}
                                        </p>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                                        <div className="text-xs">
                                            <span className="block font-medium text-gray-900">
                                                {brief.user?.name || 'Institutional Fellow'}
                                            </span>
                                            <span className="block text-[11px] font-mono text-stone-400">
                                                {brief.word_count ? `${brief.word_count} words` : '4-Page Brief'}
                                            </span>
                                        </div>

                                        <Link
                                            href={route('briefs.show', brief.id)}
                                            className="inline-flex items-center text-xs font-mono font-semibold text-[#E97451] group-hover:text-[#9c4a28] transition"
                                        >
                                            Read Brief →
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Institutional Thesis Callout Banner */}
            <section className="border-t border-stone-200 bg-stone-100/60 py-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <span className="font-mono text-xs uppercase tracking-widest text-[#E97451] font-semibold">
                                Foundational Essays
                            </span>
                            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-gray-900">
                                The Power-Wisdom Gap & The Agentic Enterprise
                            </h2>
                            <p className="mt-3 text-sm text-stone-600 font-serif leading-relaxed">
                                Read the philosophical architecture underpinning Glenride. An exploration of why our technological leverage has outpaced institutional judgment—and how human moral primacy must direct autonomous cognition.
                            </p>
                        </div>
                        <Link
                            href={route('thesis.index')}
                            className="inline-flex items-center shrink-0 rounded-xl bg-gray-900 px-6 py-3.5 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#E97451] transition"
                        >
                            Explore Institutional Thesis →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Institutional Footer */}
            <footer className="border-t border-stone-200 bg-white py-12 text-xs text-stone-500 font-mono">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        © {new Date().getFullYear()} Glenride. dvaughnhouse.org. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-6">
                        <Link href={route('library.index')} className="hover:text-gray-900 transition">
                            Vanguard Library
                        </Link>
                        <Link href={route('thesis.index')} className="hover:text-gray-900 transition">
                            Institutional Thesis
                        </Link>
                        <Link href={route('login')} className="hover:text-gray-900 transition">
                            ThinkTank OS Portal
                        </Link>
                        <a href="https://dvaughnhouse.com/terms" className="hover:text-gray-900 transition">
                            Terms
                        </a>
                        <a href="https://dvaughnhouse.com/privacy" className="hover:text-gray-900 transition">
                            Privacy
                        </a>
                        <a href="https://dvaughnhouse.com/#contact" className="hover:text-gray-900 transition">
                            Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
