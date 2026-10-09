import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_STYLES = {
    available: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    external: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    coming_soon: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    custom: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
};

const STATUS_LABELS = {
    available: 'Available now',
    external: 'Free · opens in browser',
    coming_soon: 'Coming soon',
    custom: 'Custom setup',
};

function formatPrice(product) {
    if (product.amount_cents == null) return null;
    return `$${parseFloat(product.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function ProductCard({ product, onBuy }) {
    const price = formatPrice(product);
    const purchasable = product.status === 'available' && product.amount_cents != null;

    return (
        <div className="relative flex flex-col justify-between rounded-3xl p-8 border border-slate-800 bg-slate-950/60 shadow-lg transition duration-200 hover:border-slate-700">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
                        {product.tier}
                    </div>
                    <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${STATUS_STYLES[product.status]}`}
                    >
                        {STATUS_LABELS[product.status]}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-white leading-snug">{product.name}</h3>
                <p className="mt-1 text-xs font-mono text-slate-400">{product.tagline}</p>

                {price && (
                    <div className="mt-6 flex items-baseline space-x-2">
                        <span className="text-4xl font-extrabold font-mono text-white">{price}</span>
                        <span className="text-xs font-mono text-slate-400">
                            {product.fulfillment === 'digital_download' ? 'one-time' : '/ year'}
                        </span>
                    </div>
                )}

                <p className="mt-4 text-xs leading-relaxed text-slate-300">{product.description}</p>

                {product.features?.length > 0 && (
                    <div className="mt-8 border-t border-slate-800 pt-6 space-y-3">
                        <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                            What's included:
                        </div>
                        <ul className="space-y-2 text-xs text-slate-300">
                            {product.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start">
                                    <svg
                                        className="h-4 w-4 text-indigo-400 mr-2 shrink-0 mt-0.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="mt-10">
                {purchasable && (
                    <button
                        type="button"
                        onClick={() => onBuy(product)}
                        className="w-full rounded-xl py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30"
                    >
                        Buy now →
                    </button>
                )}
                {product.status === 'external' && product.external_url && (
                    <a
                        href={product.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-xl py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider text-center transition bg-sky-600/20 text-sky-200 border border-sky-500/40 hover:bg-sky-600/30"
                    >
                        Open in browser →
                    </a>
                )}
                {product.status === 'coming_soon' && (
                    <div className="w-full rounded-xl py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-center border border-slate-700 text-slate-500 cursor-not-allowed">
                        Price & terms publishing soon
                    </div>
                )}
                {product.status === 'custom' && (
                    <div className="w-full rounded-xl py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-center border border-slate-700 text-slate-500 cursor-not-allowed">
                        Scoped & quoted in writing first
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Index({ categories = [], stripeKey = '' }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerCompany, setCustomerCompany] = useState('');
    const [attendeeNotes, setAttendeeNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderReceipt, setOrderReceipt] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const openCheckout = (product) => {
        setSelectedProduct(product);
        setOrderReceipt(null);
        setErrorMessage(null);
    };

    const closeCheckout = () => {
        setSelectedProduct(null);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerCompany('');
        setAttendeeNotes('');
        setIsSubmitting(false);
    };

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const intentRes = await window.axios.post(route('store.intent'), {
                product_type: selectedProduct.id,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_company: customerCompany,
                attendee_notes: attendeeNotes,
            });

            const { order, client_secret } = intentRes.data;

            const confirmRes = await window.axios.post(route('store.confirm'), {
                order_id: order.id,
                payment_intent_id: client_secret.split('_secret_')[0],
            });

            setOrderReceipt(confirmRes.data.order);
        } catch (err) {
            console.error('Checkout error:', err);
            setErrorMessage(
                err.response?.data?.message || 'Payment authorization failed. Please verify your details.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <Head title="The Store - dvaughnhouse.store" />

            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono font-bold text-lg shadow-sm">
                            $
                        </div>
                        <div>
                            <span className="block font-bold tracking-tight text-white text-base">
                                The Store
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                                dvaughnhouse.store
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs font-mono">
                        <Link href="/" className="text-slate-400 hover:text-white transition">
                            ← Vanguard Library
                        </Link>
                        <Link
                            href={route('dashboard')}
                            className="rounded-lg bg-slate-800 px-3.5 py-2 text-slate-200 hover:bg-slate-700 transition"
                        >
                            ThinkTank OS Portal
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative border-b border-slate-800 py-20 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono text-indigo-300 mb-6">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                        <span>Secure checkout · Stripe PCI Level 1</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
                        Everything has a price. Nothing is promised.
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Field guides from Reynard's, tools and publications from Glenride, and
                        executive briefings for institutions. Every listing tells you exactly
                        what you get — no product takes payment before its price and terms are published.
                    </p>
                </div>
            </section>

            {/* Category Sections */}
            <main className="py-16 space-y-20">
                {categories.map((category) => (
                    <section key={category.id} className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                            <p className="mt-1 text-sm font-mono text-slate-400">{category.tagline}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {category.products.map((product) => (
                                <ProductCard key={product.id} product={product} onBuy={openCheckout} />
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            {/* Checkout Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={closeCheckout}
                            className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {orderReceipt ? (
                            <div className="text-center py-4 space-y-6">
                                <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                                    ✓
                                </div>

                                <div>
                                    <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                                        Payment Authorized & Verified
                                    </span>
                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        Transaction Confirmed
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        A formal receipt has been transmitted to your email.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-left text-xs space-y-2 font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Order Number:</span>
                                        <span className="font-bold text-indigo-400">{orderReceipt.order_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Item:</span>
                                        <span className="text-white">{selectedProduct.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Authorized Amount:</span>
                                        <span className="font-bold text-emerald-400">
                                            ${parseFloat(orderReceipt.amount).toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Recipient Email:</span>
                                        <span className="text-slate-300">{orderReceipt.customer_email}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCheckout}
                                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-indigo-500 transition"
                                >
                                    Close & Return to Store
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                                <div>
                                    <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1">
                                        <span>Stripe Secure Gateway</span>
                                        <span>•</span>
                                        <span>PCI Level 1</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        Complete Purchase: {selectedProduct.name}
                                    </h3>
                                    <div className="mt-1 text-2xl font-extrabold font-mono text-emerald-400">
                                        ${parseFloat(selectedProduct.amount).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-mono">
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="e.g. Jordan Ellis"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="e.g. you@example.com"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Company / Organization
                                        </label>
                                        <input
                                            type="text"
                                            value={customerCompany}
                                            onChange={(e) => setCustomerCompany(e.target.value)}
                                            placeholder="Optional"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Payment Method
                                        </label>
                                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3.5 flex items-center justify-between text-xs font-mono text-slate-400">
                                            <div className="flex items-center space-x-2">
                                                <span>🔒</span>
                                                <span className="text-slate-300">•••• •••• •••• 4242</span>
                                            </div>
                                            <span className="text-emerald-400 font-semibold">Stripe Verified</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition"
                                    >
                                        {isSubmitting ? 'Authorizing Payment...' : `Authorize $${parseFloat(selectedProduct.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} →`}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
