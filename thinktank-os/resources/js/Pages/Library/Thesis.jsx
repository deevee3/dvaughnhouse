import InstitutionalHeader from '@/Components/InstitutionalHeader';
import { Head, Link } from '@inertiajs/react';

export default function Thesis({ auth }) {
    return (
        <div className="min-h-screen bg-paper text-ink dark:bg-night dark:text-cream font-serif selection:bg-sienna selection:text-ink">
            <Head title="Institutional Thesis - Glenride" />

            <InstitutionalHeader
                auth={auth}
                active="thesis"
                subtitle="Foundational Intellectual Thesis"
            />

            {/* Main Thesis Content */}
            <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
                {/* Header Banner */}
                <div className="border-b border-line dark:border-line-dark pb-12 mb-16 text-center">
                    <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink dark:text-cream leading-[1.15]">
                        The Foundational Thesis
                    </h1>
                    <p className="mt-4 text-lg text-ink-soft dark:text-cream-soft font-serif leading-relaxed max-w-xl mx-auto">
                        Two foundational essays exploring why technological velocity has outpaced institutional wisdom—and how human moral judgment must anchor autonomous execution.
                    </p>
                    <div className="mt-6 text-xs font-mono text-ink-soft dark:text-cream-soft">
                        By D'Vaughn House • Founder & Independent AI Orchestrator
                    </div>
                    <div className="mt-6"><div className="inline-flex items-center space-x-2 rounded-full border border-line dark:border-line-dark bg-paper dark:bg-night-card px-3 py-1 text-xs font-mono text-sienna-deep dark:text-sienna mb-6 shadow-sm">
                        <span>Glenride Foundational Monographs</span>
                    </div></div>
                </div>

                {/* Essay 1: The Power-Wisdom Gap */}
                <article className="border-b border-line dark:border-line-dark pb-20 mb-20 space-y-6">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink dark:text-cream leading-tight">
                        The Power-Wisdom Gap: Institutional Fragility in the Age of Exponential Velocity
                    </h2>
                    <div className="font-mono text-xs uppercase tracking-widest text-sienna-deep dark:text-sienna font-semibold">
                        Monograph Essay I
                    </div>
                    <p className="font-serif text-lg text-ink-soft dark:text-cream-soft italic leading-relaxed">
                        Why cognitive leverage without moral clarity accelerates systemic breakdown across civil and industrial infrastructure.
                    </p>

                    <div className="font-serif text-ink dark:text-cream text-lg leading-relaxed space-y-6 pt-6">
                        <p>
                            Throughout industrial history, technological leverage has expanded linearly, granting institutions time to mature ethical conventions, legal doctrine, and regulatory guardrails. In the current era, however, algorithmic velocity expands exponentially while institutional wisdom remains bounded by human biological cognition.
                        </p>

                        <blockquote className="border-l border-sienna pl-6 my-8 italic text-ink dark:text-cream font-serif text-xl leading-relaxed">
                            "When an institution gains infinite analytical horsepower without corresponding ethical maturity, it does not become enlightened. It merely accelerates its capability to make catastrophic misjudgments at light speed."
                        </blockquote>

                        <p>
                            For more than a decade engineering clinical trial data pipelines, I observed how brittle high-stakes systems become when complexity is masked by administrative complacency. When medical protocols failed, they did not fail due to a lack of computation; they failed because bureaucratic friction separated empirical ground truth from executive decision-makers.
                        </p>

                        <p>
                            The mission of Glenride is to close this power-wisdom gap. By combining autonomous agentic synthesis with local-first verification, we reduce thirty-page empirical monographs into concise four-page policy briefs—ensuring that leaders receive uncorrupted truth in time to act with decisive moral clarity.
                        </p>
                    </div>
                </article>

                {/* Essay 2: The Agentic Enterprise */}
                <article className="border-b border-line dark:border-line-dark pb-20 mb-20 space-y-6">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink dark:text-cream leading-tight">
                        The Agentic Enterprise: Autonomous Execution, Local-First Intelligence, and Human Primacy
                    </h2>
                    <div className="font-mono text-xs uppercase tracking-widest text-sienna-deep dark:text-sienna font-semibold">
                        Monograph Essay II
                    </div>
                    <p className="font-serif text-lg text-ink-soft dark:text-cream-soft italic leading-relaxed">
                        Architecting organizations where autonomous agents execute with machine precision while human orchestrators keep ethical oversight.
                    </p>

                    <div className="font-serif text-ink dark:text-cream text-lg leading-relaxed space-y-6 pt-6">
                        <p>
                            The traditional corporate monolith relies on vast hierarchies of middle management to filter, summarize, and transmit operational data. This architecture introduces staggering latency, cognitive distortion, and institutional paralysis.
                        </p>

                        <p>
                            The Agentic Enterprise replaces bureaucratic latency with an asymmetric operating model:
                        </p>

                        <div className="space-y-4 my-8 font-serif">
                            <div className="rounded-2xl border border-line dark:border-line-dark bg-paper dark:bg-night-card p-6 shadow-sm">
                                <h3 className="text-base font-bold text-ink dark:text-cream font-display">
                                    1. Zero-Friction Autonomous Distillation
                                </h3>
                                <p className="text-sm text-ink-soft dark:text-cream-soft mt-1 leading-relaxed">
                                    Autonomous model pipelines (such as ThinkTank OS ContextForge) ingest raw, complex research and instantly distill empirical takeaways, freeing human experts from administrative transcription.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-line dark:border-line-dark bg-paper dark:bg-night-card p-6 shadow-sm">
                                <h3 className="text-base font-bold text-ink dark:text-cream font-display">
                                    2. Local-First Intelligence
                                </h3>
                                <p className="text-sm text-ink-soft dark:text-cream-soft mt-1 leading-relaxed">
                                    Proprietary intelligence must run local-first. Core organizational data cannot be siphoned into public training loops that degrade competitive moat and compromise privacy.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-line dark:border-line-dark bg-paper dark:bg-night-card p-6 shadow-sm">
                                <h3 className="text-base font-bold text-ink dark:text-cream font-display">
                                    3. Non-Negotiable Human Moral Primacy
                                </h3>
                                <p className="text-sm text-ink-soft dark:text-cream-soft mt-1 leading-relaxed">
                                    No policy brief is released, no capital is committed, and no protocol is enacted without decisive human verification. Machines provide analytical velocity; human orchestrators provide moral responsibility.
                                </p>
                            </div>
                        </div>

                        <p>
                            This is the architecture Glenride runs on today. Leaders who adopt it move faster with less systemic risk — because machines do the work, and humans make the calls.
                        </p>
                    </div>
                </article>

                {/* Author Bio Callout */}
                <div className="rounded-3xl border border-line dark:border-line-dark bg-paper dark:bg-night-card p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-ink flex items-center justify-center text-paper font-display font-bold text-2xl shrink-0">
                        DH
                    </div>
                    <div>
                        <h3 className="font-display text-xl font-bold text-ink dark:text-cream">
                            About D'Vaughn House
                        </h3>
                        <p className="mt-2 text-sm text-ink-soft dark:text-cream-soft leading-relaxed font-serif">
                            D'Vaughn House is an Independent AI Orchestrator and Founder of Glenride. For over a decade, he engineered regulatory data pipelines and managed compliance architectures for high-stakes clinical research trials. Today, he designs local-first technological infrastructure uniting autonomous artificial intelligence with decisive human judgment.
                        </p>
                        <div className="mt-4 flex items-center space-x-4 text-xs font-mono text-sienna-deep dark:text-sienna">
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
            <footer className="border-t border-line dark:border-line-dark bg-paper dark:bg-night-card py-12 text-xs text-ink-soft dark:text-cream-soft font-mono">
                <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>© {new Date().getFullYear()} Glenride. dvaughnhouse.org.</div>
                    <div className="flex items-center space-x-6">
                        <Link href={route('library.index')} className="hover:text-ink dark:hover:text-cream transition">
                            Vanguard Library
                        </Link>
                        <Link href={route('thesis.index')} className="hover:text-ink dark:hover:text-cream transition">
                            Institutional Thesis
                        </Link>
                        <Link href={route('dashboard')} className="hover:text-ink dark:hover:text-cream transition">
                            ThinkTank OS Portal
                        </Link>
                        <a href="https://dvaughnhouse.com/terms" className="hover:text-ink dark:hover:text-cream transition">
                            Terms
                        </a>
                        <a href="https://dvaughnhouse.com/privacy" className="hover:text-ink dark:hover:text-cream transition">
                            Privacy
                        </a>
                        <a href="https://dvaughnhouse.com/#contact" className="hover:text-ink dark:hover:text-cream transition">
                            Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
