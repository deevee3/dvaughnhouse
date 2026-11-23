// Gate progress: cumulative volume over the threshold, read from the
// hook accounting contract. The same numbers the fee logic uses.
// The bar carries progress, the words carry the fee state. No color
// carries direction anywhere on these surfaces.

import { POST_GATE_FEE_BPS, PRE_GATE_FEE_BPS } from '../tressConfig';
import { formatBps, gatePercentTenths } from '../format';
import { StaleLabel } from './primitives';

export function GateProgress({
    gate,
    quoteSymbol,
    asOf = null,
    stale = false,
    showRule = false,
    showFeeNote = false,
}) {
    if (!gate) {
        return <div className="tc-row-meta">No gate data.</div>;
    }
    const pct = gatePercentTenths(gate.cumulative, gate.threshold);
    const feeBps = gate.feeActive ? POST_GATE_FEE_BPS : PRE_GATE_FEE_BPS;
    return (
        <div className="tc-gate">
            <GateBar gate={gate} />
            <GateNumbers gate={gate} quoteSymbol={quoteSymbol} asOf={asOf} stale={stale} />
            {showRule && (
                <div className="tc-gate-fee">
                    The swap that crosses the gate still pays no fee.
                </div>
            )}
            {showFeeNote && (
                <div className="tc-gate-fee">
                    The fee never touches the launched token.
                </div>
            )}
        </div>
    );
}

// Bar only, for the Graph column. The Graph column shows gate progress
// only until a price source exists. No sparkline renders.
export function GateBar({ gate }) {
    if (!gate) return null;
    const pct = gatePercentTenths(gate.cumulative, gate.threshold);
    return (
        <div
            className="tc-gate-track"
            role="progressbar"
            aria-valuenow={Number(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Gate progress ${pct} percent`}
        >
            <div className="tc-gate-fill" style={{ '--tc-gate-pct': `${pct}%` }} />
        </div>
    );
}

// Percent plus fee state, for the Gate column.
export function GateNumbers({ gate, quoteSymbol, asOf = null, stale = false }) {
    if (!gate) {
        return <div className="tc-row-meta">No gate data.</div>;
    }
    const pct = gatePercentTenths(gate.cumulative, gate.threshold);
    const feeBps = gate.feeActive ? POST_GATE_FEE_BPS : PRE_GATE_FEE_BPS;
    return (
        <div className="tc-gate">
            <div className="tc-gate-label">
                {pct}% of the gate <StaleLabel asOf={asOf} stale={stale} />
            </div>
            <div className="tc-gate-fee">
                Fee now: {formatBps(feeBps)} in {quoteSymbol || 'the quote asset'}
            </div>
        </div>
    );
}
