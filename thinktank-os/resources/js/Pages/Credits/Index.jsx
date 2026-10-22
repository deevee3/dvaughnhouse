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

function FlashMessages() {
    const flash = usePage().props.flash ?? {};

    return (
        <>
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
        </>
    );
}

function CreateAccountForm({ users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        user_id: '',
        wallet_address: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('credits.store'), { onSuccess: () => reset() });
    };

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-line bg-paper p-6 shadow-sm"
        >
            <h3 className="text-base font-bold text-ink">New Credit Account</h3>
            <p className="text-xs text-ink-soft">
                One account per study or project budget. Balances are prepaid
                service credits (1 Credit = $0.01 USD).
            </p>

            <div>
                <InputLabel htmlFor="account_name" value="Account name *" />
                <TextInput
                    id="account_name"
                    type="text"
                    className="mt-1 block w-full"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g., Study 2026-A — Supply Chain Survey"
                    required
                />
                <InputError message={errors.name} className="mt-2" />
            </div>

            <div>
                <InputLabel htmlFor="account_user" value="Owner (optional)" />
                <select
                    id="account_user"
                    className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-sienna-deep focus:ring-sienna-deep text-sm"
                    value={data.user_id}
                    onChange={(e) => setData('user_id', e.target.value)}
                >
                    <option value="">No owner</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
                <InputError message={errors.user_id} className="mt-2" />
            </div>

            <div>
                <InputLabel
                    htmlFor="account_wallet"
                    value="Wallet address (optional — the deposit watcher's sender match)"
                />
                <TextInput
                    id="account_wallet"
                    type="text"
                    className="mt-1 block w-full font-mono text-xs"
                    value={data.wallet_address}
                    onChange={(e) => setData('wallet_address', e.target.value)}
                    placeholder="0x…"
                />
                <InputError message={errors.wallet_address} className="mt-2" />
            </div>

            <PrimaryButton disabled={processing}>Create Account</PrimaryButton>
        </form>
    );
}

function GrantForm({ account }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        credits: '',
        note: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('credits.grant', account.id), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[140px] flex-1">
                    <InputLabel htmlFor={`grant-${account.id}`} value="Grant credits" />
                    <TextInput
                        id={`grant-${account.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.credits}
                        onChange={(e) => setData('credits', e.target.value)}
                        placeholder="1000"
                    />
                </div>
                <div className="min-w-[180px] flex-[2]">
                    <InputLabel htmlFor={`grant-note-${account.id}`} value="Note" />
                    <TextInput
                        id={`grant-note-${account.id}`}
                        type="text"
                        className="mt-1 block w-full"
                        value={data.note}
                        onChange={(e) => setData('note', e.target.value)}
                        placeholder="Budget allocation Q3"
                    />
                </div>
                <PrimaryButton disabled={processing}>Grant</PrimaryButton>
            </div>
            <InputError message={errors.credits} className="mt-1" />
            <InputError message={errors.note} className="mt-1" />
        </form>
    );
}

function DepositForm({ account }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        blockchain_tx_hash: '',
        log_index: '',
        token_amount: '',
        token_price_usd: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('credits.deposit', account.id), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <InputLabel
                        htmlFor={`dep-hash-${account.id}`}
                        value="STANZA deposit tx hash (Base)"
                    />
                    <TextInput
                        id={`dep-hash-${account.id}`}
                        type="text"
                        className="mt-1 block w-full font-mono text-xs"
                        value={data.blockchain_tx_hash}
                        onChange={(e) => setData('blockchain_tx_hash', e.target.value)}
                        placeholder="0x…"
                    />
                    <InputError message={errors.blockchain_tx_hash} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor={`dep-amt-${account.id}`} value="STANZA deposited" />
                    <TextInput
                        id={`dep-amt-${account.id}`}
                        type="number"
                        step="any"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.token_amount}
                        onChange={(e) => setData('token_amount', e.target.value)}
                        placeholder="250000"
                    />
                    <InputError message={errors.token_amount} className="mt-1" />
                </div>
                <div>
                    <InputLabel
                        htmlFor={`dep-price-${account.id}`}
                        value="STANZA price used (USD)"
                    />
                    <TextInput
                        id={`dep-price-${account.id}`}
                        type="number"
                        step="any"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.token_price_usd}
                        onChange={(e) => setData('token_price_usd', e.target.value)}
                        placeholder="0.000000"
                    />
                    <InputError message={errors.token_price_usd} className="mt-1" />
                </div>
                <div>
                    <InputLabel
                        htmlFor={`dep-log-${account.id}`}
                        value="Log index (optional — for watcher-matched events)"
                    />
                    <TextInput
                        id={`dep-log-${account.id}`}
                        type="number"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.log_index}
                        onChange={(e) => setData('log_index', e.target.value)}
                        placeholder=""
                    />
                    <InputError message={errors.log_index} className="mt-1" />
                </div>
            </div>
            <p className="text-xs text-ink-soft">
                Credits allocated = (STANZA × price USD) / $0.01. Recording the
                same tx hash + log index twice never double-credits.
            </p>
            <PrimaryButton disabled={processing}>Record Deposit</PrimaryButton>
        </form>
    );
}

function TransactionTable({ transactions }) {
    if (!transactions.length) {
        return (
            <p className="text-sm text-ink-soft">No ledger activity yet.</p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="border-b border-line text-ink-soft">
                        <th className="py-2 pr-3 font-semibold">Date</th>
                        <th className="py-2 pr-3 font-semibold">Account</th>
                        <th className="py-2 pr-3 font-semibold">Type</th>
                        <th className="py-2 pr-3 text-right font-semibold">Credits</th>
                        <th className="py-2 pr-3 font-semibold">Token</th>
                        <th className="py-2 pr-3 font-semibold">Tx</th>
                        <th className="py-2 font-semibold">Reference</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {transactions.map((tx) => (
                        <tr key={tx.id}>
                            <td className="py-2 pr-3 whitespace-nowrap text-ink-soft">
                                {new Date(tx.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 pr-3 font-medium text-ink">
                                {tx.account?.name ?? '—'}
                            </td>
                            <td className="py-2 pr-3 capitalize text-ink">{tx.type}</td>
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
                            </td>
                            <td className="py-2 text-ink-soft">{tx.reference ?? '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Index({
    accounts = [],
    recentTransactions = [],
    users = [],
    pegUsd = 0.01,
    attestationPriceCredits = 100,
    depositAddress = '',
    stanzaContract = '',
}) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-sienna-deep">
                        ThinkTank OS // Credits
                    </span>
                    <h2 className="font-display text-2xl font-bold leading-tight text-ink">
                        STANZA Credit Ledger
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-ink-soft">
                        Study and project budgets are prepaid in STANZA and held
                        as service credits at a fixed peg of 1 Credit = $
                        {Number(pegUsd).toFixed(2)} USD. An attestation draws{' '}
                        {fmt(attestationPriceCredits)} credits. Deposits are
                        sent to{' '}
                        <span className="font-mono text-xs">{depositAddress}</span>{' '}
                        (STANZA contract{' '}
                        <span className="font-mono text-xs">{stanzaContract}</span>).
                    </p>
                </div>
            }
        >
            <Head title="Credits - ThinkTank OS" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <FlashMessages />

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-8 lg:col-span-2">
                            {accounts.length === 0 ? (
                                <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                                    <h3 className="text-base font-bold text-ink">
                                        No credit accounts yet
                                    </h3>
                                    <p className="mt-2 text-sm text-ink-soft">
                                        Create the first study/project budget
                                        account to start allocating credits.
                                    </p>
                                </div>
                            ) : (
                                accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="space-y-6 rounded-2xl border border-line bg-paper p-6 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                                            <div>
                                                <Link
                                                    href={route('credits.show', account.id)}
                                                    className="text-lg font-bold text-ink hover:text-sienna-deep"
                                                >
                                                    {account.name}
                                                </Link>
                                                <p className="mt-1 text-xs text-ink-soft">
                                                    Owner: {account.owner?.name ?? '—'}
                                                    {account.wallet_address && (
                                                        <>
                                                            {' · '}Wallet:{' '}
                                                            <span className="font-mono">
                                                                {shortHash(account.wallet_address)}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-2xl font-bold text-ink">
                                                    {fmt(account.balance)}
                                                </div>
                                                <div className="text-xs uppercase tracking-wider text-ink-soft">
                                                    credits (≈ $
                                                    {fmt(Number(account.balance) * pegUsd)})
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-ink">
                                                Grant credits
                                            </h4>
                                            <GrantForm account={account} />
                                        </div>

                                        <div className="border-t border-line pt-4">
                                            <h4 className="mb-2 text-sm font-semibold text-ink">
                                                Record a STANZA deposit
                                            </h4>
                                            <DepositForm account={account} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div>
                            <CreateAccountForm users={users} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                        <h3 className="mb-4 text-base font-bold text-ink">
                            Recent Ledger Activity
                        </h3>
                        <TransactionTable transactions={recentTransactions} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
