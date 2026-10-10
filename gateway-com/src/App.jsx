import { useState } from "react";

const ORG_URL = import.meta.env.VITE_ORG_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8085' : 'https://dvaughnhouse.org');
const STORE_URL = import.meta.env.VITE_STORE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8085/store' : 'https://dvaughnhouse.store');

const NAV = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Gateway", href: "#gateway" },
  { label: "Contact", href: "#contact" },
];

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <a href="#top" className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          D&rsquo;Vaughn House
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          className="md:hidden rounded-md p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-slate-200 px-6 py-4 md:hidden dark:border-slate-800" aria-label="Mobile">
          <ul className="space-y-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:px-8" aria-label="Introduction">
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Independent AI Orchestrator
      </p>
      <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        D&rsquo;Vaughn House
      </h1>
      <p className="mt-6 text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200">
        Less bureaucracy. More breakthroughs.
      </p>
      <p className="mt-6 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        I build independent digital infrastructure — systems that turn chaos into
        usable order. Fifteen years running data and compliance for high-stakes
        clinical research taught me how institutions work. Now I build outside
        them: local-first AI systems, research that answers to evidence, and
        tools that keep people from being left behind.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href="#work"
          className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          See the work
        </a>
        <a
          href="#gateway"
          className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-500 transition-colors dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
        >
          Enter the gateway
        </a>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" aria-label="About" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">About</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Built in regulated rooms. Building outside them now.
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            For over a decade I managed data pipelines and regulatory compliance
            for clinical trials — first at the University of Cincinnati, then at
            AstraZeneca and Merck. That work taught me two things: how to run
            systems where mistakes have consequences, and how much good work
            dies inside bureaucracy.
          </p>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Today I operate as an independent AI orchestrator. I design
            agentic systems that run on hardware I own, publish research
            through an independent think tank, and build in public so the
            receipts are visible. Human judgment stays at the top of every
            system I ship — the machine proposes, the person decides.
          </p>
        </div>
      </div>
    </section>
  );
}

function Work() {
  const cards = [
    {
      title: "Glenride",
      body: "An independent think tank with a venture studio — built to combat systems that seek to harm you. Research on supply-chain resilience, pharmaceutical data, and applied AI. Understand. Build. Compel.",
      link: ORG_URL,
      cta: "Visit Glenride",
    },
    {
      title: "SpinWave",
      body: "A utility token for the scholarly commons — scholars earn for manuscripts and datasets, readers pay to browse and license. On Base. No hype, no profit promises; the trust center carries the receipts.",
      link: "https://spinwave.pages.dev",
      cta: "See SpinWave",
    },
  ];
  return (
    <section id="work" aria-label="Work" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Work</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          What I&rsquo;m building
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {cards.map((card) => (
            <a
              key={card.title}
              href={card.link}
              className="group block rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:p-10 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:focus:ring-slate-600"
            >
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                {card.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {card.body}
              </p>
              <span className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                {card.cta} <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gateway() {
  return (
    <section id="gateway" aria-label="Gateway" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Gateway</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Two doors
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          This site is the front door. The institution lives at one address,
          the commerce at another — separate on purpose.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          <a
            href={ORG_URL}
            className="group block rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:p-10 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:focus:ring-slate-600"
          >
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
              The Institution &amp; Engine
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              The public home of Glenride — research, standard operating
              procedures, and the ThinkTank OS portal.
            </p>
            <span className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
              Enter dvaughnhouse.org <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </a>
          <a
            href={STORE_URL}
            className="group block rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:p-10 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:focus:ring-slate-600"
          >
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
              The Economic Engine
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              The isolated transaction layer — offerings, procurement, and
              commercial engagements.
            </p>
            <span className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
              Enter dvaughnhouse.store <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" aria-label="Contact" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Contact</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Start a conversation
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Partnerships, research collaboration, press, or just a sharp question
          about independent AI infrastructure — the institution door is the
          right one. For commercial inquiries, use the store.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={ORG_URL}
            className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Reach the institution
          </a>
          <a
            href={STORE_URL}
            className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-500 transition-colors dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
          >
            Commercial inquiries
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
          D&rsquo;Vaughn House
        </p>
        <nav className="flex flex-wrap gap-6" aria-label="Footer">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © 2026 · Built independent
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
      <Header />
      <main>
        <Hero />
        <About />
        <Work />
        <Gateway />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
