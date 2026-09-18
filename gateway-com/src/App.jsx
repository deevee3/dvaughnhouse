export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 transition-colors">
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:px-8">
        {/* Minimalist Hero Section */}
        <header className="mb-16 sm:mb-24 space-y-6">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            System.Initialize()
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            D'Vaughn House
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
            I build independent digital ecosystems that distill chaos into actionable policy. For over a decade, I engineered data pipelines and managed strict regulatory compliance for high-stakes clinical trials. Today, I am an Agent Orchestrator. I build proprietary, local-first infrastructure that fuses human moral judgment with autonomous AI precision. Welcome to the Independent Architecture.
          </p>
        </header>

        {/* Air-Gapped Routing Cards */}
        <section aria-label="Routing Hub" className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <a
            href="https://dvaughnhouse.org"
            className="group block p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              The Institution &amp; Engine
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Access the public reading interface for policy briefs and the secure ThinkTank OS portal for research manuscripts.
            </p>
            <span className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Enter dvaughnhouse.org <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </a>

          <a
            href="https://dvaughnhouse.store"
            className="group block p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              The Economic Engine
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              The isolated transaction layer. Secure procurement for closed-door executive salons and corporate underwriting.
            </p>
            <span className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Enter dvaughnhouse.store <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </a>
        </section>
      </main>
    </div>
  );
}
