import { Head, Link } from '@inertiajs/react';

function InstitutionalHeader({ auth, active }) {
    const linkCls = (isActive) =>
        isActive
            ? 'text-indigo-600 font-semibold'
            : 'text-stone-600 hover:text-gray-900 transition';
    return (
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-indigo-600 transition">
                            G
                        </div>
                        <div>
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition">
                                The Glenride Institute
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                Standard Operating Procedures
                            </span>
                        </div>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                    <Link href={route('library.index')} className={linkCls(active === 'library')}>
                        Vanguard Library
                    </Link>
                    <Link href={route('thesis.index')} className={linkCls(active === 'thesis')}>
                        Institutional Thesis
                    </Link>
                    <Link href={route('sops.index')} className={linkCls(active === 'sops')}>
                        SOPs
                    </Link>
                </nav>

                <div className="flex items-center space-x-4">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-600 transition"
                        >
                            ThinkTank OS Portal →
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="text-xs font-mono font-medium text-stone-600 hover:text-gray-900 px-3 py-1.5 transition"
                        >
                            Fellow Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default function Index({ documents = [], auth }) {
    return (
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-indigo-600 selection:text-white">
            <Head title="Standard Operating Procedures - The Glenride Institute" />
            <InstitutionalHeader auth={auth} active="sops" />

            <main className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
                <div className="max-w-3xl">
                    <p className="font-mono text-xs uppercase tracking-widest text-indigo-600">
                        Glenride Institute · Operations
                    </p>
                    <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Standard Operating Procedures
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-stone-600">
                        The documented way Glenride works. Every procedure carries an
                        owner, a version, and an approver — nothing here is binding
                        until it is approved and versioned.
                    </p>
                    <div className="mt-6 inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <span className="mr-2 font-mono text-xs font-bold uppercase tracking-wider">
                            Draft
                        </span>
                        These SOPs are v0.1 drafts awaiting first-pass review. They
                        describe intent, not obligation.
                    </div>
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Link
                            key={doc.slug}
                            href={route('sops.show', doc.slug)}
                            className="group flex flex-col rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase tracking-widest text-indigo-600">
                                    {doc.id}
                                </span>
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                                    {doc.status}
                                </span>
                            </div>
                            <h2 className="mt-3 font-serif text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition">
                                {doc.title}
                            </h2>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                                {doc.description}
                            </p>
                            <div className="mt-4 border-t border-stone-100 pt-3 font-mono text-[11px] uppercase tracking-wider text-stone-500">
                                Owner: {doc.owner} · Approver: {doc.approver}
                            </div>
                            <span className="mt-3 text-sm font-medium text-indigo-600 group-hover:text-indigo-800 transition">
                                Read procedure →
                            </span>
                        </Link>
                    ))}
                </div>
            </main>

            <footer className="border-t border-stone-200 py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-stone-400">
                    The Glenride Institute · Procedures are versioned; numbers are permanent
                </p>
            </footer>
        </div>
    );
}
