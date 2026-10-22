import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const fmt = (n) =>
    Number(n ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const shortHash = (hash) =>
    hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : '—';

function RefundForm({ account }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        credits: '',
        current_price_usd: '',
        attestation_public_id: '',
        payout_tx_hash: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('credits.refund', account.id), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <p className="text-xs text-ink-soft">
                Refund policy: unused TTOS convert back to STANZA at the
                lower of this account's original deposit price and the
                current market price. A refund tied to an attestation is
                eligible only after midnight (New York time) following the
                attestation day. The STANZA payout is sent from the treasury
                Safe outside this app — record its tx hash here when sent.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="refund-credits" value="TTOS to refund" />
                    <TextInput
                        id="refund-credits"
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.credits}
                        onChange={(e) => setData('credits', e.target.value)}
                        placeholder="150"
                    />
                    <InputError message={errors.credits} className="mt-1" />
                </div>
                <div>
                    <InputLabel
                        htmlFor="refund-price"
                        value="Current STANZA price (USD)"
                    />
                    <TextInput
                        id="refund-price"
                        type="number"
                        step="any"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.current_price_usd}
                        onChange={(e) => setData('current_price_usd', e.target.value)}
                        placeholder="0.000000"
                    />
                    <InputError message={errors.current_price_usd} className="mt-1" />
                </div>
                <div>
                    <InputLabel
                        htmlFor="refund-attestation"
                        value="Attestation public ID (optional — sets eligibility)"
                    />
                    <TextInput
                        id="refund-attestation"
                        type="text"
                        className="mt-1 block w-full font-mono text-xs"
                        value={data.attestation_public_id}
                        onChange={(e) => setData('attestation_public_id', e.target.value)}
                        placeholder="GLR-AT-2026-XXXXXX"
                    />
                    <InputError message={errors.attestation_public_id} className="mt-1" />
                </div>
                <div>
                    <InputLabel
                        htmlFor="refund-tx"
                        value="Payout tx hash (optional)"
                    />
                    <TextInput
                        id="refund-tx"
                        type="text"
                        className="mt-1 block w-full font-mono text-xs"
                        value={data.payout_tx_hash}
                        onChange={(e) => setData('payout_tx_hash', e.target.value)}
                        placeholder="0x…"
                    />
                    <InputError message={errors.payout_tx_hash} className="mt-1" />
                </div>
            </div>
            <PrimaryButton disabled={processing}>Record Refund</PrimaryButton>
        </form>
    );
}

export default function Show({ account, transactions = [], creditsPerUsd = 75 }) {
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
                            {fmt(account.balance)} TTOS{' '}
                            <span className="text-base font-medium text-ink-soft">
                                (≈ ${fmt(Number(account.balance) / creditsPerUsd)} USD)
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                        <h3 className="mb-4 text-base font-bold text-ink">
                            Refund to STANZA
                        </h3>
                        <RefundForm account={account} />
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
                                                Amount (TTOS)
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
