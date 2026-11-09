import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'https://dvaughnhouse.com';

export default function InstitutionalHeader({
    auth: authProp,
    active = 'library',
    subtitle = 'Vanguard Policy Monographs',
}) {
    const { props } = usePage();
    const auth = authProp ?? props?.auth;
    const [showingMobileMenu, setShowingMobileMenu] = useState(false);
    const moreActive = active === 'thesis' || active === 'attestations';

    const linkCls = (isActive) =>
        isActive
            ? 'text-sienna-deep font-semibold whitespace-nowrap dark:text-sienna'
            : 'text-ink-soft transition whitespace-nowrap hover:text-ink dark:text-cream-soft dark:hover:text-cream';

    const mobileLinkCls =
        'block w-full px-4 py-2 text-start text-sm text-ink-soft transition hover:bg-paper-deep hover:text-ink dark:text-cream-soft dark:hover:bg-night-deep dark:hover:text-cream';

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
                        href={route('essays.index')}
                        className={linkCls(active === 'essays')}
                    >
                        Essays
                    </Link>
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className={`inline-flex items-center gap-1 ${linkCls(moreActive)}`}
                                aria-haspopup="true"
                            >
                                More
                                <svg
                                    className="h-3.5 w-3.5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content>
                            <Dropdown.Link href={route('thesis.index')}>
                                Institutional Thesis
                            </Dropdown.Link>
                            <Dropdown.Link href={route('attestations.index')}>
                                Attestations
                            </Dropdown.Link>
                            <Dropdown.Link href={GATEWAY_URL}>
                                Routing Hub
                            </Dropdown.Link>
                            <Dropdown.Link href="https://mission.dvaughnhouse.com">
                                Mission Control
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </nav>

                <div className="flex items-center space-x-4">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-2 text-ink-soft transition hover:bg-paper-deep hover:text-ink focus:outline-none md:hidden dark:text-cream-soft dark:hover:bg-night-deep dark:hover:text-cream"
                        onClick={() => setShowingMobileMenu((open) => !open)}
                        aria-label={showingMobileMenu ? 'Close menu' : 'Open menu'}
                        aria-expanded={showingMobileMenu}
                    >
                        <svg
                            className="h-6 w-6"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            {showingMobileMenu ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                    <div className="hidden items-center space-x-4 md:flex">
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
                                    className="inline-flex items-center rounded-lg bg-sienna px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-ink shadow-sm transition hover:bg-sienna-deep hover:text-paper"
                                >
                                    ThinkTank OS
                                </Link>
                                <a
                                    href={`${GATEWAY_URL}/donate`}
                                    className="rounded-full bg-sienna px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sienna-deep hover:text-paper"
                                >
                                    Donate
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showingMobileMenu && (
                <nav className="border-t border-line bg-paper px-2 py-2 md:hidden dark:border-line-dark dark:bg-night" aria-label="Mobile">
                    <ResponsiveNavLink href={route('library.index')} active={active === 'library'}>
                        Vanguard Library
                    </ResponsiveNavLink>
                    <ResponsiveNavLink href={route('essays.index')} active={active === 'essays'}>
                        Essays
                    </ResponsiveNavLink>
                    <ResponsiveNavLink href={route('thesis.index')} active={active === 'thesis'}>
                        Institutional Thesis
                    </ResponsiveNavLink>
                    <ResponsiveNavLink href={route('attestations.index')} active={active === 'attestations'}>
                        Attestations
                    </ResponsiveNavLink>
                    <a href={GATEWAY_URL} className={mobileLinkCls}>
                        Routing Hub
                    </a>
                    <a href="https://mission.dvaughnhouse.com" className={mobileLinkCls}>
                        Mission Control
                    </a>
                    <div className="mt-2 border-t border-line pt-2 dark:border-line-dark">
                        {auth?.user ? (
                            <ResponsiveNavLink href={route('dashboard')}>
                                ThinkTank OS Portal →
                            </ResponsiveNavLink>
                        ) : (
                            <>
                                <ResponsiveNavLink href={route('login')}>
                                    ThinkTank OS
                                </ResponsiveNavLink>
                                <a
                                    href={`${GATEWAY_URL}/donate`}
                                    className="mt-2 inline-block rounded-full bg-sienna px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sienna-deep hover:text-paper"
                                >
                                    Donate
                                </a>
                            </>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}
