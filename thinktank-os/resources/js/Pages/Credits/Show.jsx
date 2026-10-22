import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const fmt = (n) =>
    Number(n ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const shortHash = (hash) =>
    hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : '—';

export default function Show({ account, transactions = [], pegUsd = 0.01 }) {
    const flash = usePage().props.flash ?? {};

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-sienna-deep">
                        ThinkTank OS // Credits
                    </span>
                    <h2 className="font-display text-2xl font-bold leading-tight text-ink">
                        {account.name}
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                        <Link
                            href={route('credits.index')}
                            className="font-medium text-sienna-deep hover:underline"
                        >
                            ← All credit accounts
                        </Link>
                        {' · '}Owner: {account.owner?.name ?? '—'}
                        {account.wallet_address && (
                            <>
                                {' · '}Wallet:{' '}
                                <span className="font-mono text-xs">
                                    {account.wallet_address}
                                </span>
                            </>
                        )}
                    </p>
                </div>
            }
        >
            <Head title={`${account.name} - Credits - ThinkTank OS`} />

            <div className="py-10">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="rounded-xl border border-line bg-paper-deep p-4 text-sm font-medium text-ink">
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="rounded-xl border border-sienna-deep bg-paper-deep p-4 text-sm font-medium text-sienna-deep">
                            {flash.error}
                        </div>
                    )}

                    <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-ink-soft">
                            Current balance
                        </div>
                        <div className="mt-1 font-mono text-3xl font-bold text-ink">
                            {fmt(account.balance)}{' '}
                            <span className="text-base font-medium text-ink-soft">
                                credits (≈ ${fmt(Number(account.balance) * pegUsd)} USD at
                                peg)
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                        <h3 className="mb-4 text-base font-bold text-ink">Ledger</h3>
                        {transactions.length === 0 ? (
                            <p className="text-sm text-ink-soft">
                                No transactions recorded for this account yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-line text-ink-soft">
                                            <th className="py-2 pr-3 font-semibold">Date</th>
                                            <th className="py-2 pr-3 font-semibold">Type</th>
                                            <th className="py-2 pr-3 text-right font-semibold">
                                                Credits
                                            </th>
                                            <th className="py-2 pr-3 font-semibold">Token</th>
                                            <th className="py-2 pr-3 font-semibold">Tx hash</th>
                                            <th className="py-2 pr-3 font-semibold">Reference</th>
                                            <th className="py-2 font-semibold">Recorded by</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td className="py-2 pr-3 whitespace-nowrap text-ink-soft">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </td>
                                                <td className="py-2 pr-3 capitalize text-ink">
                                                    {tx.type}
                                                </td>
                                                <td
                                                    className={`py-2 pr-3 text-right font-mono font-semibold ${
                                                        Number(tx.amount) < 0
                                                            ? 'text-sienna-deep'
                                                            : 'text-ink'
                                                    }`}
                                                >
                                                    {Number(tx.amount) > 0 ? '+' : ''}
                                                    {fmt(tx.amount)}
                                                </td>
                                                <td className="py-2 pr-3 font-mono text-ink-soft">
                                                    {tx.token_amount
                                                        ? `${fmt(tx.token_amount)} STANZA @ $${tx.token_price_usd}`
                                                        : '—'}
                                                </td>
                                                <td className="py-2 pr-3 font-mono text-ink-soft">
                                                    {shortHash(tx.blockchain_tx_hash)}
                                                    {tx.log_index !== null &&
                                                        tx.log_index !== undefined &&
                                                        ` #${tx.log_index}`}
                                                </td>
                                                <td className="py-2 pr-3 text-ink-soft">
                                                    {tx.reference ?? '—'}
                                                </td>
                                                <td className="py-2 text-ink-soft">
                                                    {tx.creator?.name ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
