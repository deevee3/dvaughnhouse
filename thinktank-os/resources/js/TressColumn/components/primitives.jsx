// Small shared pieces for the Tress Column surfaces. Copy rules:
// talk, do not present. Concrete detail first. Short, uneven
// sentences. Errors say what happened, then what to do next.

import { explorerAddress, explorerToken, explorerTx, USDC_SEPOLIA, WETH_SEPOLIA } from '../tressConfig';
import { shortenAddress } from '../format';

export function AddressLink({ address, label = null, kind = 'address' }) {
    const href =
        kind === 'tx'
            ? explorerTx(address)
            : kind === 'token'
              ? explorerToken(address)
              : explorerAddress(address);
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="tc-mono"
            aria-label={`Open ${label || address} on Basescan Sepolia`}
        >
            {label || shortenAddress(address)}
        </a>
    );
}

export function StaleLabel({ asOf, stale }) {
    if (!stale || !asOf) return null;
    const time = new Date(asOf).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });
    return <span className="tc-stale">Stale. As of {time}.</span>;
}

export function SkeletonRows({ count = 4, copy = 'Loading.' }) {
    return (
        <div role="status" aria-live="polite">
            <p className="tc-loading-line">{copy}</p>
            {Array.from({ length: count }, (_, i) => (
                <div className="tc-skeleton-row" key={i} aria-hidden="true">
                    <div className="tc-skeleton-bar tc-skeleton-bar-narrow" />
                    <div className="tc-skeleton-bar" />
                    <div className="tc-skeleton-bar" />
                    <div className="tc-skeleton-bar" />
                </div>
            ))}
        </div>
    );
}

export function ErrorFix({ title, fix, onRetry, retryLabel = 'Try again' }) {
    return (
        <div className="tc-error" role="alert">
            <strong>{title}</strong> {fix}
            {onRetry && (
                <div className="tc-error-action">
                    <button type="button" className="tc-button-quiet" onClick={onRetry}>
                        {retryLabel}
                    </button>
                </div>
            )}
        </div>
    );
}

export function EmptyState({ title, body, action = null }) {
    return (
        <div className="tc-empty">
            <p className="tc-empty-title">{title}</p>
            {body && <p className="tc-empty-body">{body}</p>}
            {action}
        </div>
    );
}

export function Tabs({ tabs, active, onChange, label }) {
    return (
        <div className="tc-tabs" role="tablist" aria-label={label}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active === tab.key}
                    className="tc-tab"
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export function FilterPill({ label, pressed, onClick, ariaLabel }) {
    return (
        <button
            type="button"
            className="tc-pill"
            aria-pressed={pressed}
            aria-label={ariaLabel || label}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

export function ListGridToggle({ view, onChange }) {
    return (
        <div className="tc-toggle" role="group" aria-label="List or grid">
            <button
                type="button"
                aria-pressed={view === 'list'}
                onClick={() => onChange('list')}
            >
                List
            </button>
            <button
                type="button"
                aria-pressed={view === 'grid'}
                onClick={() => onChange('grid')}
            >
                Grid
            </button>
        </div>
    );
}

export function Badge({ children, accent = false }) {
    return (
        <span className={accent ? 'tc-badge tc-badge-accent' : 'tc-badge'}>{children}</span>
    );
}

export function SourceLabel({ source }) {
    return (
        <span className="tc-source-label">
            {source === 'on-chain' ? 'On-chain state' : 'SaaS state'}
        </span>
    );
}

export function PairIcon({ symbol, address }) {
    const lower = (address || '').toLowerCase();
    const weth = WETH_SEPOLIA.toLowerCase();
    const usdc = USDC_SEPOLIA.toLowerCase();
    let className = 'tc-pair-icon tc-pair-icon-other';
    let glyph = (symbol || '?').slice(0, 1).toUpperCase();
    if (lower === weth) {
        className = 'tc-pair-icon tc-pair-icon-eth';
        glyph = 'Ξ';
    } else if (lower === usdc) {
        className = 'tc-pair-icon tc-pair-icon-usdc';
        glyph = '$';
    }
    return (
        <span className={className} aria-hidden="true">
            {glyph}
        </span>
    );
}

export function PairCell({ symbol, address }) {
    return (
        <span className="tc-pair">
            <PairIcon symbol={symbol} address={address} />
            {symbol || 'Unknown'}
        </span>
    );
}
