import { Head, Link } from '@inertiajs/react';

export default function Thesis({ auth }) {
    return (
        <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-indigo-600 selection:text-white">
            <Head title="Institutional Thesis - The Glenride Institute" />

            {/* Navigation Masthead */}
            <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-indigo-600 transition">
                            G
                        </div>
                        <div>
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition">
                                The Glenride Institute
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                Foundational Intellectual Thesis
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href={route('library.index')}
                            className="text-stone-600 hover:text-gray-900 transition"
                        >
                            Vanguard Library
                        </Link>
                        <Link
                            href={route('thesis.index')}
                            className="text-indigo-600 font-semibold"
                        >
                            Institutional Thesis
                        </Link>
                        <Link
                            href={route('sops.index')}
                            className="text-stone-600 hover:text-gray-900 transition"
                        >
                            SOPs
                        </Link>
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-600 transition"
                            >
                                ThinkTank OS →
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-500 transition"
                            >
                                Fellow Portal
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Thesis Content */}
            <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
                {/* Header Banner */}
                <div className="border-b border-stone-200 pb-12 mb-16 text-center">
                    <div className="inline-flex items-center space-x-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-mono text-indigo-700 mb-6 shadow-sm">
                        <span>Glenride Foundational Monographs</span>
                    </div>
                    <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-[1.15]">
                        The Foundational Thesis
                    </h1>
                    <p className="mt-4 text-lg text-stone-600 font-serif leading-relaxed max-w-xl mx-auto">
                        Two foundational essays exploring why technological velocity has outpaced institutional wisdom—and how human moral judgment must anchor autonomous execution.
                    </p>
                    <div className="mt-6 text-xs font-mono text-stone-400">
                        By D'Vaughn House • Founder & Agent Orchestrator
                    </div>
                </div>

                {/* Essay 1: The Power-Wisdom Gap */}
                <article className="border-b border-stone-200 pb-20 mb-20 space-y-6">
                    <div className="font-mono text-xs uppercase tracking-widest text-indigo-600 font-semibold">
                        Monograph Essay I
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                        The Power-Wisdom Gap: Institutional Fragility in the Age of Exponential Velocity
                    </h2>
                    <p className="font-serif text-lg text-stone-600 italic leading-relaxed">
                        Why cognitive leverage without moral clarity accelerates systemic breakdown across civil and industrial infrastructure.
                    </p>

                    <div className="font-serif text-stone-800 text-lg leading-relaxed space-y-6 pt-6">
                        <p>
                            Throughout industrial history, technological leverage has expanded linearly, granting institutions time to mature ethical conventions, legal doctrine, and regulatory guardrails. In the current era, however, algorithmic velocity expands exponentially while institutional wisdom remains bounded by human biological cognition.
                        </p>

                        <blockquote className="border-l-4 border-indigo-600 pl-6 my-8 italic text-stone-700 font-serif text-xl leading-relaxed">
                            "When an institution gains infinite analytical horsepower without corresponding ethical maturity, it does not become enlightened. It merely accelerates its capability to make catastrophic misjudgments at light speed."
                        </blockquote>

                        <p>
                            For more than a decade engineering clinical trial data pipelines, I observed how brittle high-stakes systems become when complexity is masked by administrative complacency. When medical protocols failed, they did not fail due to a lack of computation; they failed because bureaucratic friction separated empirical ground truth from executive decision-makers.
                        </p>

                        <p>
                            The mission of The Glenride Institute is to close this power-wisdom gap. By combining autonomous agentic synthesis with air-gapped verification, we reduce thirty-page empirical monographs into concise four-page policy briefs—ensuring that leaders receive uncorrupted truth in time to act with decisive moral clarity.
                        </p>
                    </div>
                </article>

                {/* Essay 2: The Agentic Enterprise */}
                <article className="border-b border-stone-200 pb-20 mb-20 space-y-6">
                    <div className="font-mono text-xs uppercase tracking-widest text-indigo-600 font-semibold">
                        Monograph Essay II
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                        The Agentic Enterprise: Autonomous Cognition, Air-Gapped Verification, and Human Moral Primacy
                    </h2>
                    <p className="font-serif text-lg text-stone-600 italic leading-relaxed">
                        Architecting organizations where autonomous agents execute with machine precision while human orchestrators retain sovereign ethical oversight.
                    </p>

                    <div className="font-serif text-stone-800 text-lg leading-relaxed space-y-6 pt-6">
                        <p>
                            The traditional corporate monolith relies on vast hierarchies of middle management to filter, summarize, and transmit operational data. This architecture introduces staggering latency, cognitive distortion, and institutional paralysis.
                        </p>

                        <p>
                            The Agentic Enterprise replaces bureaucratic latency with an asymmetric operating model:
                        </p>

                        <div className="space-y-4 my-8 font-sans">
                            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 font-serif">
                                    1. Zero-Friction Autonomous Distillation
                                </h3>
                                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                                    Autonomous model pipelines (such as ThinkTank OS ContextForge) ingest raw, complex research and instantly distill empirical takeaways, freeing human experts from administrative transcription.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 font-serif">
                                    2. Air-Gapped Intellectual Sovereignty
                                </h3>
                                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                                    Proprietary intelligence must run local-first. Core organizational data cannot be siphoned into public training loops that degrade competitive moat and compromise privacy.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 font-serif">
                                    3. Non-Negotiable Human Moral Primacy
                                </h3>
                                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                                    No policy brief is released, no capital is committed, and no protocol is enacted without decisive human verification. Machines provide analytical velocity; human orchestrators provide moral responsibility.
                                </p>
                            </div>
                        </div>

                        <p>
                            This is not speculation. It is the exact architecture powering The Glenride Institute and ThinkTank OS today. Modern leaders who embrace this paradigm will operate with tenfold efficiency while insulating their enterprises against systemic risk.
                        </p>
                    </div>
                </article>

                {/* Author Bio Callout */}
                <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-stone-900 flex items-center justify-center text-white font-serif font-bold text-2xl shrink-0">
                        DH
                    </div>
                    <div>
                        <h3 className="font-serif text-xl font-bold text-gray-900">
                            About D'Vaughn House
                        </h3>
                        <p className="mt-2 text-sm text-stone-600 leading-relaxed font-serif">
                            D'Vaughn House is an Agent Orchestrator and Founder of The Glenride Institute. For over a decade, he engineered regulatory data pipelines and managed compliance architectures for high-stakes clinical research trials. Today, he designs sovereign, local-first technological infrastructure uniting autonomous artificial intelligence with decisive human judgment.
                        </p>
                        <div className="mt-4 flex items-center space-x-4 text-xs font-mono text-indigo-600">
                            <a href="https://dvaughnhouse.com" className="hover:underline">
                                dvaughnhouse.com Routing Hub →
                            </a>
                            <Link href={route('library.index')} className="hover:underline">
                                Vanguard Library →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-stone-200 bg-white py-12 text-xs text-stone-500 font-mono">
                <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>© {new Date().getFullYear()} The Glenride Institute. dvaughnhouse.org.</div>
                    <div className="flex items-center space-x-6">
                        <Link href={route('library.index')} className="hover:text-gray-900 transition">
                            Vanguard Library
                        </Link>
                        <Link href={route('thesis.index')} className="hover:text-gray-900 transition">
                            Institutional Thesis
                        </Link>
                        <Link href={route('dashboard')} className="hover:text-gray-900 transition">
                            ThinkTank OS Portal
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
