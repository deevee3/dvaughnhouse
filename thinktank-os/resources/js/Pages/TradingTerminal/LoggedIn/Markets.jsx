// Markets. Two labeled row groups, never mixed: Tress Column launches
// with the gate fee rule, and other Base tokens with standard DEX
// routing. No row shows a price, a sparkline, or a market cap until a
// real source exists and is wired.

import { TressShell } from '../../../TressColumn/components/TressShell';
import { LaunchList } from '../../../TressColumn/components/LaunchList';
import { EmptyState } from '../../../TressColumn/components/primitives';
import { useWallet } from '../../../TressColumn/useWallet';
import { CHAIN_NAME } from '../../../TressColumn/tressConfig';
import { shortenAddress } from '../../../TressColumn/format';

function WalletAction() {
    const wallet = useWallet();
    if (!wallet.address) {
        return (
            <button type="button" className="tc-button-primary" onClick={wallet.connect} disabled={wallet.connecting}>
                Connect a wallet
            </button>
        );
    }
    if (!wallet.isCorrectNetwork) {
        return (
            <button type="button" className="tc-button-primary" onClick={wallet.switchNetwork}>
                Switch to {CHAIN_NAME}
            </button>
        );
    }
    return (
        <button type="button" className="tc-button-quiet" onClick={wallet.disconnect} aria-label={`Disconnect wallet ${wallet.address}`}>
            {shortenAddress(wallet.address)} · {CHAIN_NAME}
        </button>
    );
}

export default function Markets() {
    return (
        <TressShell surface="trade" title="Markets" active="markets" action={<WalletAction />}>
            <section className="tc-section" aria-labelledby="tc-launches-h">
                <h2 className="tc-h2" id="tc-launches-h"><span className="tc-index">//02</span>Tress Column launches</h2>
                <p className="tc-lede">
                    Fee rule: 0% before the pool crosses the gate, 0.3% after, taken
                    only in the quote asset. The crossing swap pays no fee.
                </p>
                <LaunchList linkTo="token" />
            </section>

            <section className="tc-section" aria-labelledby="tc-other-h">
                <h2 className="tc-h2" id="tc-other-h"><span className="tc-index">//03</span>Other Base tokens</h2>
                <p className="tc-lede">
                    Standard DEX routing. A routing markup line shows on every quote,
                    even when it is 0.
                </p>
                <EmptyState
                    title="No other tokens listed yet."
                    body="A token list is not wired. Rows here need a token list source. Nothing is invented to fill the list."
                />
            </section>
        </TressShell>
    );
}
