// Number and address formatting. One place, so the Pons number rules
// (PRD section 2.2) hold on every surface: money as $ plus one decimal
// plus an abbreviated unit, changes always signed with one decimal,
// direction carried by sign and words, never by color.

export function formatUsdAbbreviated(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '$0.0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    const one = (v) => v.toFixed(1);
    if (abs >= 1_000_000_000) return `${sign}$${one(abs / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${sign}$${one(abs / 1_000_000)}M`;
    if (abs >= 1_000) return `${sign}$${one(abs / 1_000)}K`;
    return `${sign}$${one(abs)}`;
}

// Signed change, always with a sign and one decimal: +9.9%, -7.8%.
// Only for changes. Proportions (gate progress, fee state) use
// formatPercent1 and formatBps instead, unsigned.
export function formatSignedPercent(value) {
    const n = Number(value);
    const sign = n < 0 ? '-' : '+';
    return `${sign}${Math.abs(n).toFixed(1)}%`;
}

// Proportion with one decimal, unsigned: 42.0%.
export function formatPercent1(value) {
    return `${Number(value).toFixed(1)}%`;
}

// Basis points as a fee: 0 -> 0%, 30 -> 0.3%, 5 -> 0.05%.
// Two decimals, trailing zero trimmed, so 5 bps never rounds
// to 0.1% (the old one-decimal form did exactly that).
export function formatBps(bps) {
    const n = Number(bps);
    const pct = n / 100;
    return `${Number(pct.toFixed(2))}%`;
}

// Gate progress from BigInt reads, computed in integers so no float
// rounding creeps in. Returns tenths of a percent as a string.
export function gatePercentTenths(cumulative, threshold) {
    if (threshold === 0n) return '0.0';
    const tenths = (BigInt(cumulative) * 1000n) / BigInt(threshold);
    const whole = tenths / 10n;
    const frac = tenths % 10n;
    return `${whole}.${frac}`;
}

export function shortenAddress(address) {
    if (typeof address !== 'string' || address.length < 10) return address || '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isZeroAddress(address) {
    return (
        typeof address === 'string' &&
        /^0x0{40}$/i.test(address)
    );
}

export function formatAge(timestampSeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
    const diff = Math.max(0, nowSeconds - Number(timestampSeconds));
    const minutes = Math.floor(diff / 60);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    return `${Math.floor(months / 12)}y`;
}

// Base units to human units, trimmed. 18-decimal and 6-decimal assets
// both work. Thousands separators, no trailing zeros.
export function formatTokenAmount(baseUnits, decimals) {
    const value = BigInt(baseUnits);
    const scale = 10n ** BigInt(decimals);
    const whole = value / scale;
    const frac = value % scale;
    const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (frac === 0n) return wholeStr;
    let fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    if (fracStr.length > 6) fracStr = fracStr.slice(0, 6);
    return `${wholeStr}.${fracStr}`;
}

export function formatEth(wei) {
    return `${formatTokenAmount(wei, 18)} ETH`;
}

export function formatUsdGate(usdGateUnits) {
    // usdGate is 6-decimal USD. 10,000,000e6 -> $10.0M.
    const dollars = Number(BigInt(usdGateUnits)) / 1_000_000;
    return formatUsdAbbreviated(dollars);
}

export function formatDateTime(timestampSeconds) {
    const d = new Date(Number(timestampSeconds) * 1000);
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function parseTokenAmount(text, decimals) {
    const clean = String(text || '').trim().replace(/,/g, '');
    if (!/^\d+(\.\d+)?$/.test(clean)) return null;
    const [whole, frac = ''] = clean.split('.');
    if (frac.length > decimals) return null;
    const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
    return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || '0');
}
