import { Head, Link } from '@inertiajs/react';

function InstitutionalHeader({ auth, active }) {
    const linkCls = (isActive) =>
        isActive
            ? 'text-[#E97451] font-semibold'
            : 'text-stone-600 hover:text-gray-900 transition';
    return (
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-[#E97451] transition">
                            G
                        </div>
                        <div>
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-[#E97451] transition">
                                Glenride
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                Essays
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
                    <Link href={route('essays.index')} className={linkCls(active === 'essays')}>
                        Essays
                    </Link>
                </nav>

                <div className="flex items-center space-x-4">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#E97451] transition"
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
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-[#E97451] selection:text-white">
            <Head title="Essays - Glenride" />
            <InstitutionalHeader auth={auth} active="essays" />

            <main className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
                <div className="max-w-3xl">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#E97451]">
                        Glenride · Essays
                    </p>
                    <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Essays
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-stone-600">
                        Long-form arguments from the founder's desk — the thinking
                        the institution is built on, argued the way Glenride's
                        scholars are expected to argue: every claim wired to
                        evidence, limits stated plainly.
                    </p>
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Link
                            key={doc.slug}
                            href={route('essays.show', doc.slug)}
                            className="group flex flex-col rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-[#f6d3c2] hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E97451]">
                                    {doc.id}
                                </span>
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                                    {doc.status}
                                </span>
                            </div>
                            <h2 className="mt-3 font-serif text-xl font-bold text-gray-900 group-hover:text-[#b5532c] transition">
                                {doc.title}
                            </h2>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                                {doc.description}
                            </p>
                            <div className="mt-4 border-t border-stone-100 pt-3 font-mono text-[11px] uppercase tracking-wider text-stone-500">
                                {doc.meta}
                            </div>
                            <span className="mt-3 text-sm font-medium text-[#E97451] group-hover:text-[#9c4a28] transition">
                                Read essay →
                            </span>
                        </Link>
                    ))}
                </div>
            </main>

            <footer className="border-t border-stone-200 py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-stone-400">
                    Glenride · Essays are versioned; arguments are permanent
                </p>
            </footer>
        </div>
    );
}
