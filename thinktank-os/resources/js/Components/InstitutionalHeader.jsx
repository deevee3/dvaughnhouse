import { Link, usePage } from '@inertiajs/react';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'https://dvaughnhouse.com';

export default function InstitutionalHeader({
    auth: authProp,
    active = 'library',
    subtitle = 'Vanguard Policy Monographs',
}) {
    const { props } = usePage();
    const auth = authProp ?? props?.auth;

    const linkCls = (isActive) =>
        `whitespace-nowrap text-sm font-medium transition py-1 border-b-2 ${
            isActive
                ? 'text-[#E97451] border-[#E97451]'
                : 'text-stone-600 hover:text-gray-900 border-transparent'
        }`;

    return (
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center gap-10">
                    <Link href="/" className="group flex shrink-0 items-center space-x-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-[#E97451] transition">
                            G
                        </div>
                        <div className="shrink-0">
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-[#E97451] transition whitespace-nowrap">
                                Glenride
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500 whitespace-nowrap">
                                {subtitle}
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8" aria-label="Institutional">
                        <Link
                            href={route('library.index')}
                            className={linkCls(active === 'library')}
                        >
                            Vanguard Library
                        </Link>
                        <Link
                            href={route('thesis.index')}
                            className={linkCls(active === 'thesis')}
                        >
                            Institutional Thesis
                        </Link>
                        <Link
                            href={route('essays.index')}
                            className={linkCls(active === 'essays')}
                        >
                            Essays
                        </Link>
                        <a
                            href={GATEWAY_URL}
                            className="whitespace-nowrap py-1 text-sm font-medium border-b-2 border-transparent text-stone-600 hover:text-gray-900 transition"
                        >
                            Routing Hub
                        </a>
                    </nav>
                </div>

                <div className="flex shrink-0 items-center space-x-4">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#E97451] transition"
                        >
                            ThinkTank OS Portal →
                        </Link>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Link
                                href={route('login')}
                                className="text-xs font-mono font-medium text-stone-600 hover:text-gray-900 px-3 py-1.5 transition"
                            >
                                Fellow Sign In
                            </Link>
                            <Link
                                href={route('login')}
                                className="inline-flex items-center rounded-lg bg-[#E97451] px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#cf6238] transition"
                            >
                                ThinkTank OS
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
