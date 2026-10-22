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
            ? 'text-sienna-deep font-semibold whitespace-nowrap dark:text-sienna'
            : 'text-ink-soft transition whitespace-nowrap hover:text-ink dark:text-cream-soft dark:hover:text-cream';

    return (
        <header className="sticky top-0 z-40 border-b border-line bg-paper dark:border-line-dark dark:bg-night">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="group flex items-center space-x-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-paper font-display font-bold text-lg shadow-sm group-hover:bg-sienna group-hover:text-ink transition">
                            G
                        </div>
                        <div>
                            <span className="block font-display text-lg font-bold tracking-tight text-ink transition group-hover:text-sienna-deep dark:text-cream dark:group-hover:text-sienna">
                                Glenride
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-soft dark:text-cream-soft">
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
                        href={route('essays.index')}
                        className={linkCls(active === 'essays')}
                    >
                        Essays
                    </Link>
                    <a
                        href={GATEWAY_URL}
                        className="whitespace-nowrap text-ink-soft transition hover:text-ink dark:text-cream-soft dark:hover:text-cream"
                    >
                        Routing Hub
                    </a>
                </nav>

                <div className="flex items-center space-x-4">
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center rounded-lg bg-ink px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-paper shadow-sm transition hover:bg-sienna hover:text-ink"
                        >
                            ThinkTank OS Portal →
                        </Link>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Link
                                href={route('login')}
                                className="text-xs font-mono font-medium px-3 py-1.5 text-ink-soft transition hover:text-ink dark:text-cream-soft dark:hover:text-cream"
                            >
                                Fellow Sign In
                            </Link>
                            <Link
                                href={route('login')}
                                className="inline-flex items-center rounded-lg bg-sienna px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-ink shadow-sm transition hover:bg-sienna-deep hover:text-paper"
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
