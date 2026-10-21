import { useEffect, useState } from "react";
import heroBanner from "./assets/hero-collab.jpg";
import heroDonate from "./assets/hero-donate.jpg";
import workResearch from "./assets/work-research.webp";
import workAi from "./assets/work-ai-systems.webp";
import workAdvisory from "./assets/work-advisory.webp";
import workStore from "./assets/work-store.webp";
import glenrideLogo from "./assets/glenride-logo.png";

const ORG_URL = import.meta.env.VITE_ORG_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8085' : 'https://dvaughnhouse.org');

// Donation destination: the House Donation Treasury Safe on Base (1-of-1, his wallet).
const DONATION_ADDRESS = "0xa6eab535043EB98De32e5791b0E83ab47f88C430";
const DONATION_NETWORK = "Base";

const NAV = [
  { label: "About", href: "/about" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

function Header({ base = "" }) {
  const [open, setOpen] = useState(false);
  const homeHref = base === "/" ? "/" : "#top";
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <a href={homeHref} className="leading-none">
          <span className="block text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            D&rsquo;Vaughn House
          </span>
          <span className="mt-1 hidden text-[11px] font-medium tracking-wide text-slate-500 sm:block dark:text-slate-400">
            Independent AI Orchestrator
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={`${base}${item.href}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <a
            href="/donate"
            className="rounded-lg bg-gradient-to-r from-amber-600 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-red-500 transition-colors"
          >
            Donate
          </a>
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
                  href={`${base}${item.href}`}
                  onClick={() => setOpen(false)}
                  className="block text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/donate"
                onClick={() => setOpen(false)}
                className="inline-block rounded-lg bg-gradient-to-r from-amber-600 to-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Donate
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  const benefits = [
    {
      n: "01",
      title: "Cut the busywork",
      body: "AI tools that handle the tedious work for you — built right, no shortcuts.",
    },
    {
      n: "02",
      title: "Get the evidence",
      body: "What's really behind drug shortages, in plain English. Free to read.",
    },
    {
      n: "03",
      title: "Don't get left behind",
      body: "Plain talk on the AI shift — and what you can actually do about it.",
    },
  ];
  return (
    <section className="relative overflow-hidden" aria-label="Introduction">
      <img
        src={heroBanner}
        alt="A diverse group of professionals collaborating around a table in a bright, grand conservatory"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/80" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:px-8">
        <p className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-white/85">
          Less bureaucracy. More breakthroughs.
        </p>
        <h1 className="mt-8 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white">
          Understand the system.
          <br />
          <span className="bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
            Build your way out.
          </span>
        </h1>
        <p className="mt-8 max-w-3xl text-base sm:text-lg leading-relaxed text-white/80">
          You don&rsquo;t need another lecture about AI. You need less
          busywork, straight facts on drug shortages, and plain talk on where
          things are headed — from someone who spent fifteen years inside
          the system. And everything here runs on one principle: proof,
          not promises.
        </p>
        <p className="mt-6 max-w-3xl text-base sm:text-lg leading-relaxed text-white/90">
          <strong className="font-bold text-white">This site is the gateway to my work as an independent AI orchestrator</strong> — one door into Glenride&rsquo;s investigations, the SpinWave scholarly commons, and the store. It&rsquo;s for anyone who wants proof, not promises: plain-language research and AI systems built in the open, verified before asserted.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.n}
              className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-lg backdrop-blur"
            >
              <p className="font-mono text-xs font-bold tracking-widest text-amber-700">
                {b.n}
              </p>
              <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                {b.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {b.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#work"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02]"
          >
            See the work
          </a>
          <a
            href="#contact"
            className="inline-flex items-center rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:border-white transition-colors"
          >
            Start a conversation
          </a>
        </div>
      </div>
    </section>
  );
}

function OrchestratorQA() {
  return (
    <section aria-label="What an independent AI orchestrator does" className="border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          What does an independent AI orchestrator do?
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          An independent AI orchestrator designs, runs, and verifies AI systems outside big institutions — choosing the models, wiring the agents, and proving the work happened as claimed. I build on hardware I own, keep human judgment at the top of every system, and publish the receipts. If you want less busywork, straight facts on systems like drug supply chains, and plain talk on the AI shift without a sales pitch, that&rsquo;s what this site is for.
        </p>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    {
      value: "227",
      label: "U.S. drugs in shortage, as of Q2 2026 — rising for the third straight quarter",
      source: "ASHP, Q2 2026",
    },
    {
      value: "78%",
      label: "of drug-ingredient factories are outside the U.S., as of the FDA's latest published data",
      source: "FDA",
    },
    {
      value: "~90%",
      label: "of the world's most advanced chips are made in Taiwan, as of 2026",
      source: "Industry analyses, 2026",
    },
    {
      value: "85%",
      label: "of rare-earth refining happens in China, as of 2025",
      source: "IEA, 2025",
    },
    {
      value: "$2.6B",
      label: "average cost to develop one new drug, per the latest Tufts CSDD estimate",
      source: "Tufts CSDD",
    },
    {
      value: "~12%",
      label: "of drugs that enter trials ever get approved, per the latest Tufts CSDD estimate",
      source: "Tufts CSDD",
    },
  ];
  return (
    <section aria-label="By the numbers" className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">
          The problem, in numbers
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value + s.label}>
              <p className="text-4xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400">
                {s.value}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {s.label}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Source: {s.source}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" aria-label="About" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">About</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Built in regulated rooms. Building outside them now.
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Twelve years in clinical research, now operating as an independent AI orchestrator.
        </p>
        <a
          href="/about"
          className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 transition-colors hover:text-amber-600 dark:text-slate-100 dark:hover:text-amber-400"
        >
          Read the full story <span className="ml-2">&rarr;</span>
        </a>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    title: "The Independent Architect",
    body: "The craft of building \u2014 systems design, runbooks, near-zero-cost infrastructure. No theory without a working artifact.",
  },
  {
    title: "The Power\u2013Wisdom Gap",
    body: "This is not another dot-com. Plain-language work on what \u201cif you don\u2019t move, you lose\u201d means in practice.",
  },
  {
    title: "Cognitive Stewardship",
    body: "Human primacy. Free will and the machine. Words as load-bearing spells. The thinking that keeps the building honest.",
  },
  {
    title: "Glenride Investigations",
    body: "Supply-chain vulnerabilities, pharmaceutical data, the systems that seek to harm \u2014 investigated in plain language. Verified before asserted.",
  },
  {
    title: "The Independent Economy",
    body: "The work, built in public. Real numbers, real lessons, never a profit promise.",
  },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">About</p>
      <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        Built in regulated rooms. Building outside them now.
      </h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          For over a decade I managed data pipelines and regulatory compliance
          for clinical trials &mdash; first at the University of Cincinnati, then at
          AstraZeneca and Merck. That work taught me two things: how to run
          systems where mistakes have consequences, and how much good work
          dies inside bureaucracy.
        </p>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Today I operate as an independent AI orchestrator. I design
          agentic systems that run on hardware I own, publish research
          through an independent think tank, and build in public so the
          receipts are visible. Human judgment stays at the top of every
          system I ship &mdash; the machine proposes, the person decides.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/60">
        <img
          src={glenrideLogo}
          alt="Glenride think tank logo"
          className="h-28 w-28 shrink-0 rounded-2xl"
        />
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">
            Mission statement
          </p>
          <p className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Combat systems that seek to harm you.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Three motions: <strong className="font-semibold text-slate-900 dark:text-slate-100">understand</strong> the
            system, <strong className="font-semibold text-slate-900 dark:text-slate-100">build</strong> the
            alternative, <strong className="font-semibold text-slate-900 dark:text-slate-100">compel</strong> the
            change. Less bureaucracy. More breakthroughs.
          </p>
        </div>
      </div>

      <h2 className="mt-14 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        The five pillars
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
          >
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {p.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function System() {
  const steps = [
    {
      n: "Stage 01",
      title: "The Factory",
      sub: "AI chief-of-staff OS",
      body: "The way I run AI: persistent memory, an audit log of every action, standing protocols. The work gets done here \u2014 and the trail it leaves is the evidence.",
    },
    {
      n: "Stage 02",
      title: "The Issuer",
      sub: "Glenride",
      body: "The think tank doesn't just publish research \u2014 it stamps it. Claim, evidence, verifier, timestamp. Other institutions sell reputation. Glenride sells receipts.",
    },
    {
      n: "Stage 03",
      title: "The Proven Library",
      sub: "SpinWave",
      body: "Scholars earn for verified manuscripts and datasets; readers license knowledge they can trust. Set knowledge free \u2014 then prove it.",
    },
  ];
  const areas = [
    {
      title: "Supply-chain resilience",
      body: "Where the systems that move medicine and goods break \u2014 and who gets hurt when they do.",
    },
    {
      title: "Pharmaceutical data",
      body: "Drug shortages in plain English: what's really behind them, and what you can do about it.",
    },
    {
      title: "Applied AI",
      body: "How AI actually gets directed and verified in real operations \u2014 the proof layer, built in the open.",
    },
  ];
  return (
    <>
      <section id="system" aria-label="The system" className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">The system</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Three stages, one loop.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            The AI chief-of-staff OS does the work &mdash; directed, logged, verified. Glenride attests it &mdash; signed proof that it happened as claimed. SpinWave publishes the best of it &mdash; a library where knowledge isn&rsquo;t just free, it&rsquo;s proven. Every attestation makes the next one stronger.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
                <p className="font-mono text-xs font-bold tracking-widest text-amber-700 dark:text-amber-500">{s.n}</p>
                <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-500">{s.sub}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            In a world where every agent claims and nobody verifies, this is the proof layer. Witnessed by Glenride.
          </p>
        </div>
      </section>
      <section id="research" aria-label="Research areas" className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">Research</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            What Glenride&rsquo;s working on now.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {areas.map((a) => (
              <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{a.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            All published free, in plain language.
          </p>
        </div>
      </section>
    </>
  );
}

function Work() {
  const cards = [
    {
      title: "Glenride",
      img: workResearch,
      imgAlt: "Glowing laboratory flask dissolving into data points",
      body: "An independent think tank built to combat systems that seek to harm you. Now the attestation authority: signed proof that work happened as claimed. Understand. Build. Compel. Prove.",
      link: ORG_URL,
      cta: "Visit Glenride",
    },
    {
      title: "SpinWave",
      img: workAi,
      imgAlt: "Interlocking AI circuit nodes with flowing amber data pathways",
      body: "A utility token for the scholarly commons — scholars earn for verified manuscripts and datasets, readers license knowledge they can trust. On Base. No hype, no profit promises; the trust center carries the receipts, and Glenride attestation carries the proof.",
      link: "https://spinwave.pages.dev",
      cta: "See SpinWave",
    },
    {
      title: "Store",
      img: workStore,
      imgAlt: "Dark storefront with a glowing amber doorway and circuit pathways leading in",
      body: "The isolated transaction layer — offerings, procurement, and commercial engagements. The institution lives at one address, the commerce at another. Separate on purpose.",
      link: "#contact",
      cta: "Get in touch",
    },
  ];
  return (
    <section id="work" aria-label="Work" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">Work</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          What I&rsquo;m building
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {cards.map((card) => (
            <a
              key={card.title}
              href={card.link}
              className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:focus:ring-slate-600"
            >
              <img
                src={card.img}
                alt={card.imgAlt}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <div className="p-8 sm:p-10">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400">
                  {card.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {card.body}
                </p>
                <span className="mt-8 inline-flex items-center text-sm font-semibold tracking-wide text-slate-900 transition-colors group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400">
                  {card.cta} <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "partnership", message: "", company: "" });
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: "sending", message: "" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus({ state: "success", message: "Received. I'll read it personally — thank you." });
        setForm({ name: "", email: "", topic: "partnership", message: "", company: "" });
      } else if (data.error === "storage_not_configured") {
        setStatus({ state: "error", message: "The contact form isn't online yet — check back soon." });
      } else if (data.error === "rate_limited") {
        setStatus({ state: "error", message: "Too many messages in a short time — try again in an hour." });
      } else {
        setStatus({ state: "error", message: "Something didn't validate — check the fields and try again." });
      }
    } catch {
      setStatus({ state: "error", message: "Couldn't send — check your connection and try again." });
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700";

  return (
    <section id="contact" aria-label="Contact" className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">Contact</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Start a conversation
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Partnerships, research collaboration, press, or just a sharp question
          about independent AI infrastructure. Your message goes directly to me —
          I read everything myself. No list, no resale, no sharing.
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <form onSubmit={submit} className="max-w-2xl space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Name
              </label>
              <input
                id="contact-name" type="text" required maxLength={100}
                value={form.name} onChange={set("name")} className={inputCls}
                placeholder="Your name" autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                id="contact-email" type="email" required maxLength={254}
                value={form.email} onChange={set("email")} className={inputCls}
                placeholder="you@example.com" autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-topic" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Topic
            </label>
            <select id="contact-topic" value={form.topic} onChange={set("topic")} className={inputCls}>
              <option value="partnership">Partnership</option>
              <option value="research">Research collaboration</option>
              <option value="press">Press</option>
              <option value="speaking">Speaking</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Message
            </label>
            <textarea
              id="contact-message" required maxLength={2000} rows={5}
              value={form.message} onChange={set("message")} className={inputCls}
              placeholder="What's on your mind?"
            />
          </div>
          {/* Honeypot: invisible to humans, irresistible to bots */}
          <input
            type="text" name="company" value={form.company} onChange={set("company")}
            tabIndex={-1} autoComplete="off" aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
          />
          <div>
            <button
              type="submit"
              disabled={status.state === "sending"}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-600 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-amber-500 hover:to-red-500 disabled:opacity-60"
            >
              {status.state === "sending" ? "Sending…" : "Send message"}
            </button>
          </div>
          {status.state === "success" && (
            <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {status.message}
            </p>
          )}
          {status.state === "error" && (
            <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
              {status.message}
            </p>
          )}
        </form>
          <img
            src={workAdvisory}
            alt="Glowing compass over architectural blueprints — finding direction through complex systems"
            className="hidden w-full rounded-2xl border border-slate-200 object-cover shadow-sm lg:block dark:border-slate-800"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

function DonatePage() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Donate — D'Vaughn House";
    window.scrollTo(0, 0);
  }, []);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden" aria-label="Support the mission">
        <img
          src={heroDonate}
          alt="A speaker on stage before a packed grand hall — carrying the mission to the people"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/80" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 lg:px-8">
          <p className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-white/85">
            Support
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Fuel the mission.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Fund independent investigation into the systems that touch your health,
            your work, and your future — and keep the findings free for everyone.
          </p>
          <div className="mt-8">
            <a
              href="#send"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02]"
            >
              Get the address
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-16 lg:px-8">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
          <strong className="font-bold">Plain talk first:</strong> I am not a
          nonprofit and I do not have tax-exempt status. Nothing you send here
          is tax-deductible. This is personal support for independent work —
          not a charitable contribution, not an investment, and not a purchase.
        </p>
      </div>

      <div className="mt-10 space-y-12 text-base leading-relaxed text-slate-600 dark:text-slate-300">
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Where does my donation go?
          </h2>
          <p className="mt-4 max-w-3xl">
            Straight to independent work. Donations fund Glenride&rsquo;s investigations — drug-shortage research, supply-chain analysis, plain-language publishing — plus the infrastructure that keeps everything free to read. They don&rsquo;t buy influence over findings, equity, tokens, or returns. The address is a 1-of-1 Safe on Base, controlled by my own wallet, and every investigation is published whether the conclusions are convenient or not.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Sponsor the findings. Never the conclusions.
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_260px] md:items-start">
            <ul className="space-y-6">
              <li>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">Evidence nobody bought.</strong>{" "}
                Every investigation is funded by people, not sponsors — so when
                Glenride publishes on drug shortages, you know the conclusion
                wasn&rsquo;t purchased.
              </li>
              <li>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">Research that stays public.</strong>{" "}
                Findings go out in plain language, free to read. Your support is
                what keeps it that way — no paywall, no gatekeeper.
              </li>
              <li>
                <strong className="font-semibold text-slate-900 dark:text-slate-100">Eyes on your own medicine cabinet.</strong>{" "}
                227 drugs are in shortage in the U.S., as of Q2 2026 (ASHP). Independent
                investigation into why is a public good you personally benefit from.
              </li>
            </ul>
            <img
              src={workResearch}
              alt="Glowing laboratory flask dissolving into data points — independent research, verified before asserted"
              className="w-full rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-800"
              loading="lazy"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            What it never does
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>It doesn&rsquo;t buy equity, tokens, or a share of anything.</li>
            <li>It doesn&rsquo;t buy influence over the research — findings get published as they&rsquo;re found, whether they&rsquo;re convenient or not.</li>
            <li>It doesn&rsquo;t come with promises about returns. Ever.</li>
          </ul>
        </section>

        <section id="send" className="scroll-mt-24">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Where to send it
          </h2>
          {DONATION_ADDRESS ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {DONATION_NETWORK} address
              </p>
              <p className="mt-3 break-all font-mono text-sm text-slate-900 dark:text-slate-100">
                {DONATION_ADDRESS}
              </p>
              <button
                type="button"
                onClick={copyAddress}
                className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-amber-600 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-red-500 transition-colors"
              >
                {copied ? "Copied ✓" : "Copy address"}
              </button>
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-2xl border-2 border-red-400 bg-red-50 p-5 dark:border-red-700 dark:bg-red-950/50"
              >
                <svg
                  className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-base font-semibold leading-relaxed text-red-800 dark:text-red-200">
                  {DONATION_NETWORK} network only. Assets sent on any other
                  network may be permanently unrecoverable.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3">
              The donation address is being set up — check back soon. Nothing
              here will ever ask you to send funds to an address posted
              anywhere else.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Another way to support
          </h2>
          <p className="mt-3">
            If you&rsquo;d rather support the work commercially, reach out
            through the{" "}
            <a href="#contact" className="font-semibold text-slate-900 underline underline-offset-4 dark:text-slate-100">
              contact form
            </a>
            .
          </p>
        </section>
      </div>
      </div>
    </div>
  );
}

const PATRON_TIERS = [
  {
    id: "insider",
    name: "Insider",
    price: "Free",
    tagline: "Follow the work.",
    perks: [
      "The Dispatch — the weekly newsletter, every issue",
      "Early access to every video before it goes public",
      "First to hear about the AI chief-of-staff class",
    ],
    cta: "You're in the room. Watch what's being built, week by week.",
  },
  {
    id: "patron",
    name: "Patron",
    price: "$10/mo",
    tagline: "Fund the work.",
    perks: [
      "Everything in Insider",
      "Behind-the-scenes build notes — the stuff that doesn't make the videos",
      "Monthly live Q&A — ask anything, get a straight answer",
      "Your name in the credits of every video",
    ],
    cta: "Ten dollars a month keeps the cameras on and the research free.",
  },
  {
    id: "founding",
    name: "Founding Patron",
    price: "$500+",
    tagline: "Steer the work.",
    perks: [
      "Everything in Patron, for life",
      "Your name on the founding wall — permanent",
      "A direct line: help decide what gets built and researched next",
      "First invitation to every live event and gathering",
    ],
    cta: "Founders don't just fund the mission. They shape it.",
  },
];

function PatronPage() {
  const [form, setForm] = useState({ name: "", email: "", tier: "insider", message: "", company: "" });
  const [status, setStatus] = useState({ state: "idle", message: "" });

  useEffect(() => {
    document.title = "Become a Patron — D'Vaughn House";
    window.scrollTo(0, 0);
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: "sending", message: "" });
    try {
      const res = await fetch("/api/patron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus({
          state: "success",
          message:
            form.tier === "insider"
              ? "You're in. Watch your inbox — the next Dispatch is on its way."
              : "Received. I'll personally follow up within 48 hours to arrange your patronage — thank you.",
        });
        setForm({ name: "", email: "", tier: "insider", message: "", company: "" });
      } else if (data.error === "storage_not_configured") {
        setStatus({ state: "error", message: "Signup isn't online yet — check back soon." });
      } else if (data.error === "rate_limited") {
        setStatus({ state: "error", message: "Too many signups in a short time — try again in an hour." });
      } else {
        setStatus({ state: "error", message: "Something didn't validate — check the fields and try again." });
      }
    } catch {
      setStatus({ state: "error", message: "Couldn't send — check your connection and try again." });
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700";

  return (
    <div>
      <section className="relative overflow-hidden" aria-label="Become a patron">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 lg:px-8">
          <p className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-white/85">
            Patrons
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Become a patron of the work.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Independent work needs independent funding. Patrons keep the
            research free, the videos honest, and the mission pointed at people —
            not sponsors.
          </p>
          <div className="mt-8">
            <a
              href="#join"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02]"
            >
              Choose your tier
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {PATRON_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-amber-700 dark:text-amber-500">
                {tier.tagline}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {tier.name}
              </h2>
              <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200">{tier.price}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span aria-hidden="true" className="text-amber-600 dark:text-amber-500">✓</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm italic text-slate-500 dark:text-slate-400">{tier.cta}</p>
            </div>
          ))}
        </div>

        <div id="join" className="mx-auto mt-16 max-w-2xl scroll-mt-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Join as a patron
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Tell me who you are and which tier fits. For paid tiers, I follow up
            personally within 48 hours to arrange everything — no automated
            billing, no surprises.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="patron-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Name
                </label>
                <input
                  id="patron-name" type="text" required maxLength={100}
                  value={form.name} onChange={set("name")} className={inputCls}
                  placeholder="Your name" autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="patron-email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  id="patron-email" type="email" required maxLength={254}
                  value={form.email} onChange={set("email")} className={inputCls}
                  placeholder="you@example.com" autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="patron-tier" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Tier
              </label>
              <select id="patron-tier" value={form.tier} onChange={set("tier")} className={inputCls}>
                {PATRON_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name} — {tier.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="patron-message" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Anything you want me to know? <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="patron-message" maxLength={2000} rows={3}
                value={form.message} onChange={set("message")} className={inputCls}
                placeholder="Why this work matters to you, what you'd like to see built…"
              />
            </div>
            {/* Honeypot: invisible to humans, irresistible to bots */}
            <input
              type="text" name="company" value={form.company} onChange={set("company")}
              tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
            />
            <div>
              <button
                type="submit"
                disabled={status.state === "sending"}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-600 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-amber-500 hover:to-red-500 disabled:opacity-60"
              >
                {status.state === "sending" ? "Sending…" : "Become a patron"}
              </button>
            </div>
            {status.state === "success" && (
              <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {status.message}
              </p>
            )}
            {status.state === "error" && (
              <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
                {status.message}
              </p>
            )}
          </form>

          <div className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="font-bold">Plain talk:</strong> I am not a
              nonprofit and I do not have tax-exempt status. Patronage is
              personal support for independent work — not a charitable
              contribution, not tax-deductible, not an investment, and not a
              purchase. Paid tiers are arranged personally, by me, after you
              sign up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const LEGAL_DOCS = {
  terms: {
    title: "Terms of Service",
    updated: "October 11, 2026",
    intro:
      "These terms are a working placeholder while formal terms are prepared with counsel. By using this site, you agree to these plain-language terms.",
    sections: [
      {
        heading: "Use of the site",
        body: "You may read, share, and link to the public content here. You may not scrape the site at abusive volume, misrepresent the content as your own, or use the site to break the law.",
      },
      {
        heading: "Intellectual property",
        body: "Essays, research, artwork, and brand marks on this site belong to D'Vaughn House unless credited otherwise. You may quote brief passages with attribution; any other reproduction needs written permission.",
      },
      {
        heading: "Purchases",
        body: "Products sold through the store are covered by the terms shown at checkout: what you get, the license scope, and the refund terms are stated before any payment is accepted. No product takes payment before its price and terms are published.",
      },
      {
        heading: "No professional advice",
        body: "Nothing on this site is financial, legal, investment, or medical advice. Token and market content is educational. You are responsible for your own decisions.",
      },
      {
        heading: "Limitation of liability",
        body: "The site is provided as-is. To the extent the law allows, D'Vaughn House is not liable for damages arising from your use of the site.",
      },
      {
        heading: "Changes",
        body: "These terms may be updated as the work grows. The current version always lives at this address, with its last-updated date shown above.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "October 11, 2026",
    intro:
      "This policy is a working placeholder while a formal policy is prepared. In plain language, here is how your information is handled.",
    sections: [
      {
        heading: "What is collected",
        body: "If you use the contact form: your name, email address, and message. The site does not run third-party advertising trackers. Standard server logs (used for security and reliability) may record visits in anonymized or aggregate form.",
      },
      {
        heading: "How it is used",
        body: "Contact details are used only to reply to you. They are never sold, rented, or shared with marketers.",
      },
      {
        heading: "Cookies",
        body: "The site does not set advertising cookies. Basic functional storage in your browser may be used for preferences like display theme.",
      },
      {
        heading: "Data retention",
        body: "Messages sent through the contact form are kept as long as needed to respond and for legitimate record-keeping, then removed on request.",
      },
      {
        heading: "Your rights",
        body: "You may ask what information is held about you, ask for a correction, or ask for deletion, through the contact page. Requests are answered personally.",
      },
      {
        heading: "Changes",
        body: "This policy may be updated as the work grows. The current version always lives at this address, with its last-updated date shown above.",
      },
    ],
  },
};

function LegalPage({ doc }) {
  useEffect(() => {
    document.title = `${doc.title} — D'Vaughn House`;
    window.scrollTo(0, 0);
  }, [doc.title]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        {doc.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Last updated: {doc.updated}
      </p>
      <p className="mt-6 leading-relaxed text-slate-600 dark:text-slate-300">{doc.intro}</p>
      <div className="mt-10 space-y-8">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {s.heading}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

function Footer({ base = "" }) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
            D&rsquo;Vaughn House
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={`${base}${item.href}`}
                className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/donate"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50 transition-colors"
            >
              Donate
            </a>
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
            <a
              href="/terms"
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 transition-colors"
            >
              Privacy Policy
            </a>
          </nav>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2026 D&rsquo;Vaughn House. All rights reserved.
          </p>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          Nothing on this site is financial, legal, investment, or medical advice.
          Token and market content is educational only.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          Content updated: October 19, 2026.
        </p>
      </div>
    </footer>
  );
}

export default function App({ path: propPath } = {}) {
  const path =
    propPath ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const isDonate = path.startsWith("/donate");
  const isPatron = path.startsWith("/patron");
  const isAbout = path.startsWith("/about");
  const isTerms = path.startsWith("/terms");
  const isPrivacy = path.startsWith("/privacy");
  if (isDonate) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
        <Header base="/" />
        <main>
          <DonatePage />
        </main>
        <Footer base="/" />
      </div>
    );
  }
  if (isPatron) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
        <Header base="/" />
        <main>
          <PatronPage />
        </main>
        <Footer base="/" />
      </div>
    );
  }
  if (isAbout) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
        <Header base="/" />
        <main>
          <AboutPage />
        </main>
        <Footer base="/" />
      </div>
    );
  }
  if (isTerms || isPrivacy) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
        <Header base="/" />
        <main>
          <LegalPage doc={isTerms ? LEGAL_DOCS.terms : LEGAL_DOCS.privacy} />
        </main>
        <Footer base="/" />
      </div>
    );
  }
  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
      <Header />
      <main>
        <Hero />
        <OrchestratorQA />
        <Stats />
        <About />
        <System />
        <Work />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
