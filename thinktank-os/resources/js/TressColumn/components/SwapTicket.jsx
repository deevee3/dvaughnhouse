// Swap ticket. Amount entry, fee lines, confirm step, result screen.
//
// No quote source is wired and no pool exists, so the ticket shows
// the honest unavailable state and offers no sign action. The quote
// gate keeps the confirm and execute paths unreachable until a real
// source exists and is wired (PRD Q4). The fee lines still show:
// hook fee per the gate state, and the routing markup line on
// non-Tress-Column swaps, even when it is 0.

import { useState } from 'react';
import {
    CHAIN_NAME,
    DEFAULT_DEADLINE_MINUTES,
    DEFAULT_SLIPPAGE_BPS,
    POST_GATE_FEE_BPS,
    PRE_GATE_FEE_BPS,
    QUOTE_SOURCE_WIRED,
    ROUTING_MARKUP_BPS,
} from '../tressConfig';
import { useWallet } from '../useWallet';
import { formatBps } from '../format';

export function SwapTicket({
    tokenMeta = null,
    isTcToken = false,
    gate = null,
    quoteSymbol = null,
}) {
    const wallet = useWallet();
    const [direction, setDirection] = useState('buy');
    const [amount, setAmount] = useState('');
    const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
    const [deadlineMinutes, setDeadlineMinutes] = useState(DEFAULT_DEADLINE_MINUTES);
    const [showWhy, setShowWhy] = useState(false);

    const quote = null; // No quote source is wired. See QUOTE_SOURCE_WIRED.
    const hasPool = isTcToken && gate !== null;
    const feeBps = gate?.feeActive ? POST_GATE_FEE_BPS : PRE_GATE_FEE_BPS;

    const whyNoQuote = !QUOTE_SOURCE_WIRED
        ? 'No quote source is wired. Quotes need a live pool and the quoter wired to it.'
        : 'No quote came back for this pair.';

    return (
        <div className="tc-ticket">
            <div className="tc-toggle" role="group" aria-label="Direction">
                <button
                    type="button"
                    aria-pressed={direction === 'buy'}
                    onClick={() => setDirection('buy')}
                >
                    Buy
                </button>
                <button
                    type="button"
                    aria-pressed={direction === 'sell'}
                    onClick={() => setDirection('sell')}
                >
                    Sell
                </button>
            </div>

            <div className="tc-field tc-block-gap-top">
                <label htmlFor="tc-swap-amount">
                    Amount {direction === 'buy' ? `in ${quoteSymbol || 'the quote asset'}` : `in ${tokenMeta?.symbol || 'the token'}`}
                </label>
                <input
                    id="tc-swap-amount"
                    className="tc-ticket-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.0"
                    autoComplete="off"
                />
            </div>

            <div className="tc-field-row-2">
                <div className="tc-field">
                    <label htmlFor="tc-slippage">Slippage, %</label>
                    <input
                        id="tc-slippage"
                        value={(slippageBps / 100).toString()}
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isFinite(n) && n >= 0) setSlippageBps(Math.round(n * 100));
                        }}
                        inputMode="decimal"
                        autoComplete="off"
                    />
                </div>
                <div className="tc-field">
                    <label htmlFor="tc-deadline">Deadline, minutes</label>
                    <input
                        id="tc-deadline"
                        value={deadlineMinutes}
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isInteger(n) && n > 0) setDeadlineMinutes(n);
                        }}
                        inputMode="numeric"
                        autoComplete="off"
                    />
                </div>
            </div>

            <dl className="tc-fee-lines">
                {isTcToken ? (
                    <>
                        <div className="tc-fee-line">
                            <dt>Hook fee</dt>
                            <dd>
                                {hasPool
                                    ? `${formatBps(feeBps)} in ${quoteSymbol || 'the quote asset'}`
                                    : 'No pool yet. Rule: 0% before the gate, 0.3% after.'}
                            </dd>
                        </div>
                        <div className="tc-fee-line">
                            <dt>Tress Column fee</dt>
                            <dd>None. Tress Column pools carry no added fee.</dd>
                        </div>
                    </>
                ) : (
                    <div className="tc-fee-line">
                        <dt>Routing markup</dt>
                        <dd>{formatBps(ROUTING_MARKUP_BPS)}</dd>
                    </div>
                )}
                <div className="tc-fee-line">
                    <dt>Price impact</dt>
                    <dd>No price source. Impact unknown.</dd>
                </div>
                <div className="tc-fee-line">
                    <dt>Expected output</dt>
                    <dd>{quote ? quote.output : 'No quote yet.'}</dd>
                </div>
            </dl>

            {isTcToken && hasPool && !gate.feeActive && (
                <p className="tc-field-help">
                    The swap that crosses the gate still pays no fee. The fee never
                    touches the launched token.
                </p>
            )}

            {!wallet.address ? (
                <button
                    type="button"
                    className="tc-button-primary"
                    onClick={wallet.connect}
                    disabled={wallet.connecting}
                >
                    Connect a wallet
                </button>
            ) : !wallet.isCorrectNetwork ? (
                <button type="button" className="tc-button-primary" onClick={wallet.switchNetwork}>
                    Switch to {CHAIN_NAME}
                </button>
            ) : (
                <button
                    type="button"
                    className="tc-button-primary"
                    onClick={() => setShowWhy(true)}
                >
                    Why no quote?
                </button>
            )}

            {showWhy && (
                <p className="tc-field-error" role="status">
                    {whyNoQuote} No signature was requested. {hasPool ? '' : 'No pool exists for this token yet.'}
                </p>
            )}
            {wallet.error && <p className="tc-field-error">{wallet.error.message}</p>}

            <p className="tc-field-help">
                The trader signs their own swap. The terminal never takes custody
                and never executes server-side. Slippage {(slippageBps / 100).toFixed(1)}%,
                deadline {deadlineMinutes} minutes.
            </p>
        </div>
    );
}
