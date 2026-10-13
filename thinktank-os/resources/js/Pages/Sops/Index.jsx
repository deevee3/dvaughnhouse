import InstitutionalHeader from '@/Components/InstitutionalHeader';
import { Head, Link } from '@inertiajs/react';

export default function Index({ documents = [], auth }) {
    return (
        <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans selection:bg-[#E97451] selection:text-white">
            <Head title="Standard Operating Procedures - Glenride" />
            <InstitutionalHeader auth={auth} active="sops" />

            <main className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
                <div className="max-w-3xl">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#E97451]">
                        Glenride · Operations
                    </p>
                    <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Standard Operating Procedures
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-stone-600">
                        The documented way Glenride works. Every procedure carries an
                        owner, a version, and an approver — nothing here is binding
                        until it is approved and versioned.
                    </p>
                    <div className="mt-6 inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <span className="mr-2 font-mono text-xs font-bold uppercase tracking-wider">
                            Draft
                        </span>
                        These SOPs are v0.1 drafts awaiting first-pass review. They
                        describe intent, not obligation.
                    </div>
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Link
                            key={doc.slug}
                            href={route('sops.show', doc.slug)}
                            className="group flex flex-col rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-[#f6d3c2] hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#E97451]">
                                    {doc.id}
                                </span>
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                                    {doc.status}
                                </span>
                            </div>
                            <h2 className="mt-3 font-serif text-xl font-bold text-gray-900 group-hover:text-[#b5532c] transition">
                                {doc.title}
                            </h2>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                                {doc.description}
                            </p>
                            <div className="mt-4 border-t border-stone-100 pt-3 font-mono text-[11px] uppercase tracking-wider text-stone-500">
                                Owner: {doc.owner} · Approver: {doc.approver}
                            </div>
                            <span className="mt-3 text-sm font-medium text-[#E97451] group-hover:text-[#9c4a28] transition">
                                Read procedure →
                            </span>
                        </Link>
                    ))}
                </div>
            </main>

            <footer className="border-t border-stone-200 py-8">
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-stone-400">
                    Glenride · Procedures are versioned; numbers are permanent
                </p>
            </footer>
        </div>
    );
}
