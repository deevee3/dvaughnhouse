/**
 * Surface URLs that work on staging and on the live domains.
 *
 * On staging (dvaughnhouse.org) each surface lives under /staging/*.
 * On a live domain (tc / trade / ops / plus .dvaughnhouse.com) each
 * surface lives at its domain root, and cross-surface links go to the
 * other surface's host. The helpers pick the right form from the
 * hostname the page actually loaded on, so one build serves both.
 *
 * Cutover Nov 20, 2026 (his tap): live domains are the home; staging
 * stays as the pre-live check, not the destination.
 */
const LIVE_HOSTS = {
    tc: 'tc.dvaughnhouse.com',
    trade: 'trade.dvaughnhouse.com',
    ops: 'ops.dvaughnhouse.com',
    plus: 'plus.dvaughnhouse.com',
};

const STAGING_BASE = {
    tc: '/staging/tress-column',
    trade: '/staging/terminal',
    ops: '/staging/ops-console',
    plus: '/staging/plus',
};

function isLiveHost() {
    if (typeof window === 'undefined') return false;
    return Object.values(LIVE_HOSTS).includes(window.location.hostname);
}

function surfaceUrl(surface, path = '') {
    if (isLiveHost()) return `https://${LIVE_HOSTS[surface]}${path || '/'}`;
    return `${STAGING_BASE[surface]}${path}`;
}

export const tcUrl = (path = '') => surfaceUrl('tc', path);
export const tradeUrl = (path = '') => surfaceUrl('trade', path);
export const opsUrl = (path = '') => surfaceUrl('ops', path);
export const plusUrl = (path = '') => surfaceUrl('plus', path);
