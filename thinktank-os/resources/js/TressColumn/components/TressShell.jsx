// Shared shell for the logged-in surfaces: icon rail, centered column,
// testnet banner, header row, footer note. One shell, four surfaces.
// Rail items that do not exist yet do not appear. No dead buttons.

import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import '../../../css/tress-tokens.css';
import { CHAIN_ID, CHAIN_NAME } from '../tressConfig';
import { useChainGuard } from '../useChain';
import { opsUrl, plusUrl, tcUrl, tradeUrl } from '../urls';

function Icon({ d }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {d}
        </svg>
    );
}

const ICONS = {
    list: (
        <>
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
        </>
    ),
    plus: (
        <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </>
    ),
    activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
    grid: (
        <>
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <rect x="13" y="4" width="7" height="7" rx="1" />
            <rect x="4" y="13" width="7" height="7" rx="1" />
            <rect x="13" y="13" width="7" height="7" rx="1" />
        </>
    ),
    layers: (
        <>
            <path d="M12 3l9 5-9 5-9-5 9-5z" />
            <path d="M3 13l9 5 9-5" />
        </>
    ),
    account: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </>
    ),
};

const RAIL_ITEMS = {
    tc: [
        { key: 'launches', label: 'Launches', href: tcUrl(), icon: 'list' },
        { key: 'create', label: 'Start a launch', href: tcUrl('/start'), icon: 'plus' },
        { key: 'mine', label: 'My launches', href: tcUrl('/mine'), icon: 'user' },
    ],
    trade: [
        { key: 'markets', label: 'Markets', href: tradeUrl(), icon: 'list' },
        { key: 'activity', label: 'My activity', href: tradeUrl('/activity'), icon: 'activity' },
    ],
    ops: [
        { key: 'console', label: 'Console', href: opsUrl(), icon: 'grid' },
    ],
    plus: [
        { key: 'portal', label: 'Portal', href: plusUrl(), icon: 'layers' },
    ],
};

const MARKS = { tc: 'TC', trade: 'TC', ops: 'TC', plus: 'P+' };
const HOME = {
    tc: tcUrl(),
    trade: tradeUrl(),
    ops: opsUrl(),
    plus: plusUrl(),
};

// Cross-surface menu: every surface links the other three live
// surfaces, so launchpad, trade, ops, and plus are reachable from
// the rail on each surface. Only live surfaces appear; nothing
// here is dead. The current surface is not listed: it is already
// the surface this rail belongs to. Labels are visible text, not
// tooltips: on a phone there is no hover, and Nov 20 he could not
// tell where the other pages were from the icon-only rail.
const SURFACES = [
    { key: 'tc', label: 'Launchpad', host: 'tc.dvaughnhouse.com', href: tcUrl(), icon: 'list' },
    { key: 'trade', label: 'Markets', host: 'trade.dvaughnhouse.com', href: tradeUrl(), icon: 'activity' },
    { key: 'ops', label: 'Ops console', host: 'ops.dvaughnhouse.com', href: opsUrl(), icon: 'grid' },
    { key: 'plus', label: 'Plus+', host: 'plus.dvaughnhouse.com', href: plusUrl(), icon: 'layers' },
];

function AccountItem({ user, returnTo }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (event) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open ]);

    if (!user) {
        return (
            <a
                className="tc-rail-btn"
                href={`/auth/tress-entry?return=${encodeURIComponent(returnTo)}`}
                aria-label="Sign in with Albert Pass"
                data-tip="Sign in"
            >
                <Icon d={ICONS.account} />
                <span className="tc-rail-label">Sign in</span>
            </a>
        );
    }

    return (
        <div className="tc-account-wrap" ref={wrapRef}>
            <button
                type="button"
                className="tc-rail-btn"
                aria-label="Account menu"
                aria-expanded={open}
                data-tip="Account"
                onClick={() => setOpen((v) => !v)}
            >
                <Icon d={ICONS.account} />
                <span className="tc-rail-label">Account</span>
            </button>
            {open && (
                <div className="tc-menu" role="menu">
                    <div className="tc-menu-email">{user.email}</div>
                    <button
                        type="button"
                        className="tc-menu-item"
                        role="menuitem"
                        onClick={() => router.post('/logout', { return_to: returnTo })}
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

export function TressShell({ surface, title, action = null, active, children, index = '//01' }) {
    const { auth } = usePage().props;
    const user = auth?.user || null;
    const { error: chainError } = useChainGuard();
    const wrongChain =
        chainError && String(chainError.message || '').includes('not Base Sepolia');
    const returnTo =
        typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : HOME[surface];

    return (
        <div className="tc-shell">
            <Head title={`Tress Column — ${title}`} />
            <nav className="tc-rail" aria-label={`${title} navigation`}>
                <Link className="tc-rail-mark" href={HOME[surface]} aria-label="Tress Column home">
                    {MARKS[surface]}
                </Link>
                {RAIL_ITEMS[surface].map((item) => (
                    <Link
                        key={item.key}
                        className="tc-rail-btn"
                        href={item.href}
                        aria-label={item.label}
                        aria-current={active === item.key ? 'page' : undefined}
                        data-tip={item.label}
                    >
                        <Icon d={ICONS[item.icon]} />
                        <span className="tc-rail-label">{item.label}</span>
                    </Link>
                ))}
                <div className="tc-rail-divider" aria-hidden="true" />
                {SURFACES.filter((item) => item.key !== surface).map((item) => (
                    <a
                        key={item.key}
                        className="tc-rail-btn"
                        href={item.href}
                        aria-label={item.label}
                        data-tip={item.label}
                    >
                        <Icon d={ICONS[item.icon]} />
                        <span className="tc-rail-label">{item.label}</span>
                    </a>
                ))}
                <div className="tc-rail-spacer" />
                <AccountItem user={user} returnTo={returnTo} />
            </nav>

            <main className="tc-main">
                <div className="tc-column">
                    <div className="tc-banner" role="note">
                        <span className="tc-banner-label">Testnet</span>
                        <span>
                            {CHAIN_NAME}, chain {CHAIN_ID}. Nothing here touches real funds.
                        </span>
                    </div>

                    {wrongChain && (
                        <div className="tc-error tc-block-gap-top" role="alert">
                            <strong>The chain read came back on the wrong network.</strong>{' '}
                            Figures below may be wrong. Reads stay on {CHAIN_NAME} only.
                            Refresh the page to try again.
                        </div>
                    )}

                    <div className="tc-header">
                        <h1 className="tc-h1"><span className="tc-index">{index}</span>{title}</h1>
                        {action}
                    </div>

                    {children}

                    <nav className="tc-surfaces" aria-label="All Tress Column surfaces">
                        <p className="tc-surfaces-title">
                            Surfaces
                        </p>
                        <ul className="tc-surfaces-list">
                            {SURFACES.map((item) => (
                                <li key={item.key}>
                                    <a
                                        className="tc-surfaces-link"
                                        href={item.href}
                                        aria-current={item.key === surface ? 'page' : undefined}
                                    >
                                        <span className="tc-surfaces-name">{item.label}</span>
                                        <span className="tc-surfaces-host">{item.host}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <p className="tc-surfaces-note">
                            One sign-in covers all four surfaces. One tap takes you there signed in.
                        </p>
                    </nav>

                    <p className="tc-footer-note">
                        Tress Column is a fair-launch exchange on Base where every
                        launch parameter is configured, locked, and printed in plain
                        language at inception. Built around verifiable immutability
                        and transparent fee tiers, Tress Column eliminates post-launch
                        rule changes and issues a permanent on-chain certificate
                        proving exact launch terms from block zero.
                    </p>
                </div>
            </main>
        </div>
    );
}

export function SignInPrompt({ what, returnTo }) {
    return (
        <div className="tc-tier-glass-field">
            <div className="tc-card tc-tier-card">
                <p className="tc-empty-title">Sign in to {what}.</p>
                <p className="tc-empty-body">
                    Sign-in is Albert Pass by Glenride. One identity across the Tress
                    Column surfaces, and one sign-in covers Launchpad, Markets, the
                    Ops console, and Plus+. Your wallet stays
                    separate: signing in does not connect a wallet.
                </p>
                <a
                    className="tc-button-primary"
                    href={`/auth/tress-entry?return=${encodeURIComponent(returnTo || (typeof window !== 'undefined' ? window.location.pathname : '/'))}`}
                >
                    Sign in with Albert Pass
                </a>
            </div>
        </div>
    );
}
