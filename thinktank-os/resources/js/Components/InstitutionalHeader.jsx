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
        isActive
            ? 'text-[#E97451] font-semibold whitespace-nowrap'
            : 'text-stone-600 hover:text-gray-900 transition whitespace-nowrap';

    return (
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/90 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white font-serif font-bold text-lg shadow-sm group-hover:bg-[#E97451] transition">
                            G
                        </div>
                        <div>
                            <span className="block font-serif text-lg font-bold tracking-tight text-gray-900 group-hover:text-[#E97451] transition">
                                Glenride
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-stone-500">
                                {subtitle}
                            </span>
                        </div>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium" aria-label="Institutional">
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
                        href={route('sops.index')}
                        className={linkCls(active === 'sops')}
                    >
                        SOPs
                    </Link>
                    <Link
                        href={route('essays.index')}
                        className={linkCls(active === 'essays')}
                    >
                        Essays
                    </Link>
                    <a
                        href={GATEWAY_URL}
                        className="whitespace-nowrap text-stone-600 hover:text-gray-900 transition"
                    >
                        Routing Hub
                    </a>
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
