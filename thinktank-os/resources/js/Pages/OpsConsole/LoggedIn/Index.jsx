// Ops console. Staff only, SaaS-side only. The console holds no
// customer balances, approves no withdrawals, and reaches no
// contract. Five modules in the Nov 2 order. Every figure carries its
// source label: SaaS record or on-chain read.

import {
    LAUNCH_CERTIFICATE,
    TREASURY_SAFE,
} from '../../../TressColumn/tressConfig';
import {
    ethBlockNumber,
    ethGetBalance,
    ethGetCode,
    ethGetLogs,
} from '../../../TressColumn/rpc';
import { useAsyncData, useNextLaunchId } from '../../../TressColumn/useChain';
import { formatEth, formatUsdGate } from '../../../TressColumn/format';
import { TressShell } from '../../../TressColumn/components/TressShell';
import { AddressLink, ErrorFix, SourceLabel } from '../../../TressColumn/components/primitives';

function useSafeTransfers() {
    return useAsyncData(async () => {
        const latest = await ethBlockNumber();
        // ethBlockNumber returns a Number. The old code subtracted the
        // BigInt literal 1000n from it, which throws "Cannot mix
        // BigInt and other types" before any eth_getLogs request is
        // sent — the Nov 20 failure box, with the relay never seeing
        // the call (nginx: 4 relay calls per ops load, not 6) and
        // "Try again" re-running the same throw. Plain Number
        // arithmetic here: block numbers fit safely in a Number.
        const from = latest - 1000;
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const padded = `0x${TREASURY_SAFE.slice(2).toLowerCase().padStart(64, '0')}`;
        const { logs, complete } = await ethGetLogs(
            {
                topics: [transferTopic, null, padded],
                fromBlock: `0x${from.toString(16)}`,
                toBlock: `0x${latest.toString(16)}`,
            },
            { maxPages: 10 },
        );
        const code = await ethGetCode(TREASURY_SAFE);
        return { count: logs.length, complete, window: 1000, deployed: code !== '0x' };
    }, [], 'safeBalance');
}

function useSafeBalance() {
    return useAsyncData(async () => {
        const balance = await ethGetBalance(TREASURY_SAFE);
        return { balance };
    }, [], 'safeBalance');
}

function Module({ title, index, children }) {
    return (
        <section className="tc-module" aria-label={title}>
            <h2 className="tc-module-title">{index && <span className="tc-index">{index}</span>}{title}</h2>
            {children}
        </section>
    );
}

export default function Index({ staffEmail }) {
    const nextId = useNextLaunchId();
    const transfers = useSafeTransfers();
    const balance = useSafeBalance();

    return (
        <TressShell
            surface="ops"
            title="Console"
            active="console"
            action={
                <button type="button" className="tc-button-quiet" onClick={() => window.location.reload()}>
                    Refresh reads
                </button>
            }
        >
            <p className="tc-lede">
                Staff only. Signed in as {staffEmail}. The console holds no customer
                balances, approves no withdrawals, and reaches no contract. It reads
                records and shows them.
            </p>

            <Module title="Plus+ subscriptions" index="//02">
                <SourceLabel source="saas" />
                <p className="tc-module-copy">
                    Subscription records are not wired. No billing connection exists on
                    this build, so no count is shown.
                </p>
                <p className="tc-module-note">No figure is shown rather than an invented one.</p>
            </Module>

            <Module title="Airdrop campaigns" index="//03">
                <SourceLabel source="saas" />
                <p className="tc-module-copy">
                    Campaign records are not wired. The campaign fee is 0.0194 ETH per
                    campaign, paid to the treasury.
                </p>
                <p className="tc-module-note">No campaign has run.</p>
            </Module>

            <Module title="Launch monitoring" index="//04">
                <SourceLabel source="on-chain" />
                {nextId.loading && <p className="tc-loading-line">Reading the certificate factory.</p>}
                {nextId.error && (
                    <ErrorFix
                        title="The launch count did not load."
                        fix={`nextLaunchId (eth_call to the LaunchCertificate contract) failed: ${nextId.error.message || 'the chain read failed'}. Nothing below depends on it.`}
                        onRetry={nextId.retry}
                    />
                )}
                {!nextId.loading && !nextId.error && (
                    <p className="tc-module-copy">
                        {nextId.data - 1 === 0
                            ? 'No launches exist yet. The next certificate number is 1.'
                            : `${nextId.data - 1} launches recorded. The next certificate number is ${nextId.data}.`}
                    </p>
                )}
            </Module>

            <Module title="Certificates" index="//05">
                <SourceLabel source="on-chain" />
                <p className="tc-module-copy">
                    The LaunchCertificate contract records every launch. Certificates
                    are minted by the factory only. The contract:
                </p>
                <AddressLink address={LAUNCH_CERTIFICATE} />
            </Module>

            <Module title="Treasury-fee accounting" index="//06">
                <SourceLabel source="on-chain" />
                <p className="tc-module-copy">
                    Treasury Safe: <AddressLink address={TREASURY_SAFE} />
                </p>
                {transfers.loading && <p className="tc-loading-line">Scanning for Safe transfers.</p>}
                {transfers.error && (
                    <ErrorFix
                        title="The Safe transfer scan did not finish."
                        fix={`eth_getLogs over the most recent 1,000 blocks failed: ${transfers.error.message || 'the chain read failed'}. ${balance.data ? 'The native balance below was read live, so the Safe address itself reads fine.' : 'The native balance below could not be read either.'} Earlier windows need the indexer.`}
                        onRetry={transfers.retry}
                    />
                )}
                {!transfers.loading && !transfers.error && transfers.data && (
                    <div>
                        <p className="tc-module-copy">
                            The Safe contract is {transfers.data.deployed ? 'deployed' : 'not deployed'}.
                            Token transfers into the Safe in the most recent {transfers.data.window} blocks:{' '}
                            {transfers.data.count}.
                            {transfers.data.complete === false && ' The scan stopped early.'}
                        </p>
                        <p className="tc-module-note">
                            Fee accounting traces to receipts. With no launches, no hook fees
                            exist. Hook fees arrive in the quote asset only, after the gate.
                            USD anchor for the gate: {formatUsdGate(10_000_000_000_000n)}.
                        </p>
                    </div>
                )}
                {balance.data && (
                    <p className="tc-module-copy">
                        Native balance: {formatEth(balance.data.balance)}. Read live from
                        the Safe address.
                    </p>
                )}
                <p className="tc-module-note">
                    Transfers were scanned in the most recent 1,000 blocks only.
                    Earlier windows need the indexer.
                </p>
            </Module>

            <p className="tc-loading-line">
                No action is offered here. The console reads records. It does not move
                funds, change settings, or approve anything.
            </p>
        </TressShell>
    );
}
