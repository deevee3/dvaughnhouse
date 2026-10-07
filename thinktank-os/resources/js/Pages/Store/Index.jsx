import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ products = [], stripeKey = '' }) {
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
            // 1. Create PaymentIntent and pending order in backend
            const intentRes = await window.axios.post(route('store.intent'), {
                product_type: selectedProduct.id,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_company: customerCompany,
                attendee_notes: attendeeNotes,
            });

            const { order, client_secret } = intentRes.data;

            // 2. Finalize confirmation
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
            <Head title="The Economic Engine - B2B Procurement & Salons" />

            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono font-bold text-lg shadow-sm">
                            $
                        </div>
                        <div>
                            <span className="block font-bold tracking-tight text-white text-base">
                                The Economic Engine
                            </span>
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                                dvaughnhouse.store // Commercial Layer
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs font-mono">
                        <Link href="/" className="text-slate-400 hover:text-white transition">
                            ← Vanguard Library
                        </Link>
                        <a
                            href="http://localhost:5173"
                            className="text-slate-400 hover:text-white transition"
                        >
                            Routing Hub
                        </a>
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
                        <span>Isolated B2B Commercial Layer</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
                        Executive Procurement & Corporate Underwriting
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Purchase seats for closed-door briefing salons, secure enterprise retainers, or license ThinkTank OS infrastructure. All transactions run on air-gapped Stripe PCI Level 1 security.
                    </p>
                </div>
            </section>

            {/* Product Offerings Grid */}
            <main className="py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {products.map((product) => {
                            const isFeatured = product.id === 'executive_salon';

                            return (
                                <div
                                    key={product.id}
                                    className={`relative flex flex-col justify-between rounded-3xl p-8 border transition duration-200 ${
                                        isFeatured
                                            ? 'border-indigo-500/50 bg-gradient-to-b from-slate-800/90 to-slate-900/90 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                                            : 'border-slate-800 bg-slate-950/60 shadow-lg'
                                    }`}
                                >
                                    {isFeatured && (
                                        <div className="absolute -top-3.5 left-8 inline-flex items-center rounded-full bg-indigo-600 px-3 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-white shadow">
                                            Most Popular
                                        </div>
                                    )}

                                    <div>
                                        {/* Tier Label */}
                                        <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold mb-2">
                                            {product.tier}
                                        </div>

                                        {/* Product Name */}
                                        <h2 className="text-xl font-bold text-white leading-snug">
                                            {product.name}
                                        </h2>

                                        {/* Tagline */}
                                        <p className="mt-1 text-xs font-mono text-slate-400">
                                            {product.tagline}
                                        </p>

                                        {/* Price */}
                                        <div className="mt-6 flex items-baseline space-x-2">
                                            <span className="text-4xl font-extrabold font-mono text-white">
                                                ${parseFloat(product.amount).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                            <span className="text-xs font-mono text-slate-400">
                                                {product.id === 'executive_salon' ? '/ seat' : '/ year'}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="mt-4 text-xs leading-relaxed text-slate-300">
                                            {product.description}
                                        </p>

                                        {/* Features List */}
                                        <div className="mt-8 border-t border-slate-800 pt-6 space-y-3">
                                            <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                                                Deliverables Included:
                                            </div>
                                            <ul className="space-y-2 text-xs text-slate-300">
                                                {product.features?.map((feat, idx) => (
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
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-10">
                                        <button
                                            type="button"
                                            onClick={() => openCheckout(product)}
                                            className={`w-full rounded-xl py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition ${
                                                isFeatured
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
                                                    : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                                            }`}
                                        >
                                            {product.id === 'executive_salon'
                                                ? 'Purchase Salon Seat →'
                                                : product.id === 'corporate_retainer'
                                                ? 'Initiate Retainer Intake →'
                                                : 'Procure SaaS License →'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Checkout & Invoicing Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl relative">
                        {/* Close button */}
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
                            /* Success Receipt View */
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
                                        A formal receipt and onboarding itinerary have been transmitted.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-left text-xs space-y-2 font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Order Number:</span>
                                        <span className="font-bold text-indigo-400">{orderReceipt.order_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tier / Item:</span>
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
                            /* Checkout Form View */
                            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                                <div>
                                    <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1">
                                        <span>Stripe Secure Gateway</span>
                                        <span>•</span>
                                        <span>PCI Level 1</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        Complete Procurement: {selectedProduct.name}
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
                                            Authorized Contact Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="e.g. Marcus Vance"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Corporate / Work Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="e.g. director@enterprise.com"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Enterprise / Organization
                                        </label>
                                        <input
                                            type="text"
                                            value={customerCompany}
                                            onChange={(e) => setCustomerCompany(e.target.value)}
                                            placeholder="e.g. Advanced Manufacturing Corp"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Stripe Card Mock / Security Field */}
                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                                            Payment Method (Credit Card / Invoicing)
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
                                        {isSubmitting ? 'Authorizing Payment Intent...' : `Authorize $${parseFloat(selectedProduct.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} →`}
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
