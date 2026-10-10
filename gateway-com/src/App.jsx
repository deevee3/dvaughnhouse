import { useEffect, useState } from "react";

const ORG_URL = import.meta.env.VITE_ORG_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8085' : 'https://dvaughnhouse.org');
const STORE_URL = import.meta.env.VITE_STORE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8085/store' : 'https://dvaughnhouse.store');

// Donation destination: the House Donation Treasury Safe on Base (1-of-1, his wallet).
const DONATION_ADDRESS = "0xa6eab535043EB98De32e5791b0E83ab47f88C430";
const DONATION_NETWORK = "Base";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Gateway", href: "#gateway" },
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
            Less bureaucracy. More breakthroughs.
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
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
                className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.20),rgba(239,68,68,0.08),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(245,158,11,0.10),rgba(239,68,68,0.05),transparent)]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:px-8">
        <p className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:text-slate-300">
          D&rsquo;Vaughn House — Independent AI Orchestrator
        </p>
        <h1 className="mt-8 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Understand the system.
          <br />
          <span className="bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-red-500">
            Build your way out.
          </span>
        </h1>
        <p className="mt-8 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          You don&rsquo;t need another lecture about AI. You need less
          busywork, straight facts on drug shortages, and plain talk on where
          things are headed — from someone who spent fifteen years inside
          the system.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.n}
              className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-800/60"
            >
              <p className="font-mono text-xs font-bold tracking-widest text-amber-600 dark:text-amber-400">
                {b.n}
              </p>
              <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {b.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {b.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#work"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-600 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02] dark:from-amber-500 dark:to-red-500"
          >
            See the work
          </a>
          <a
            href="#contact"
            className="inline-flex items-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-500 transition-colors dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
          >
            Start a conversation
          </a>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    {
      value: "227",
      label: "U.S. drugs in shortage right now — rising for the third straight quarter",
      source: "ASHP, Q2 2026",
    },
    {
      value: "78%",
      label: "of drug-ingredient factories are outside the U.S.",
      source: "FDA",
    },
    {
      value: "40%",
      label: "of generic drug markets rely on a single supplier",
      source: "FDA",
    },
    {
      value: "5+ yrs",
      label: "how long the average drug shortage lasts",
      source: "USP",
    },
    {
      value: "$2.6B",
      label: "average cost to develop one new drug",
      source: "Tufts CSDD",
    },
    {
      value: "~12%",
      label: "of drugs that enter trials ever get approved",
      source: "Tufts CSDD",
    },
  ];
  return (
    <section aria-label="By the numbers" className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
          The problem, in numbers
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value + s.label}>
              <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
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
  const pillars = [
    {
      title: "The Independent Architect",
      body: "The craft of building — systems design, runbooks, near-zero-cost infrastructure. No theory without a working artifact.",
    },
    {
      title: "The Power–Wisdom Gap",
      body: "This is not another dot-com. Plain-language work on what \u201cif you don\u2019t move, you lose\u201d means in practice.",
    },
    {
      title: "Cognitive Stewardship",
      body: "Human primacy. Free will and the machine. Words as load-bearing spells. The thinking that keeps the building honest.",
    },
    {
      title: "Glenride Investigations",
      body: "Supply-chain vulnerabilities, pharmaceutical data, the systems that seek to harm — investigated in plain language. Verified before asserted.",
    },
    {
      title: "The Independent Economy",
      body: "The ventures, built in public. Real numbers, real lessons, never a profit promise.",
    },
  ];
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

        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
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

        <h3 className="mt-14 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          The five pillars
        </h3>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
            >
              <h4 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {p.title}
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Work() {
  const cards = [
    {
      title: "Glenride",
      body: "An independent think tank with a venture studio — built to combat systems that seek to harm you. Research on supply-chain resilience, pharmaceutical data, and applied AI, published free in plain language so you can act on it. Understand. Build. Compel.",
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
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Contact</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Start a conversation
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Partnerships, research collaboration, press, or just a sharp question
          about independent AI infrastructure. Your message goes directly to me —
          I read everything myself. No list, no resale, no sharing.
        </p>
        <form onSubmit={submit} className="mt-10 max-w-2xl space-y-5">
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
              className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
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
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Support
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
        Fuel the mission.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        Fund independent investigation into the systems that touch your health,
        your work, and your future — and keep the findings free for everyone.
      </p>

      <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
          <strong className="font-bold">Plain talk first:</strong> I am not a
          nonprofit and I do not have tax-exempt status. Nothing you send here
          is tax-deductible. This is personal support for independent work —
          not a charitable contribution, not an investment, and not a purchase.
        </p>
      </div>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-slate-600 dark:text-slate-300">
        <section>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            What you get
          </h2>
          <ul className="mt-3 space-y-4">
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
              227 drugs are in shortage in the U.S. right now. Independent
              investigation into why is a public good you personally benefit from.
            </li>
          </ul>
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

        <section>
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
                className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
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
            If you&rsquo;d rather support the work commercially, the store is
            open:{" "}
            <a href={STORE_URL} className="font-semibold text-slate-900 underline underline-offset-4 dark:text-slate-100">
              {STORE_URL.replace("https://", "")}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

function Footer({ base = "" }) {
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
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © 2026 · Built independent
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const isDonate = window.location.pathname.startsWith("/donate");
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
  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-900 dark:text-slate-50">
      <Header />
      <main>
        <Hero />
        <Stats />
        <About />
        <Work />
        <Gateway />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
