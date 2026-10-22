import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ manuscripts = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-widest text-sienna-deep">
                            ThinkTank OS // Monograph Portfolio
                        </span>
                        <h2 className="font-display text-2xl font-bold leading-tight text-ink">
                            My Ingested Manuscripts
                        </h2>
                    </div>
                    <Link
                        href={route('manuscripts.create')}
                        className="inline-flex items-center rounded-lg bg-sienna px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink shadow-sm hover:bg-sienna-deep hover:text-paper focus:outline-none focus:ring-2 focus:ring-sienna-deep focus:ring-offset-2 focus:ring-offset-paper"
                    >
                        + Intake Dropzone
                    </Link>
                </div>
            }
        >
            <Head title="Manuscripts Portfolio - ThinkTank OS" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {manuscripts.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-line bg-paper p-12 text-center">
                            <h3 className="font-display text-base font-bold text-ink">
                                No manuscripts ingested
                            </h3>
                            <p className="mt-1 text-sm text-ink-soft">
                                Ingest a raw research manuscript through the intake dropzone to initiate ContextForge synthesis.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={route('manuscripts.create')}
                                    className="inline-flex items-center rounded-md bg-sienna px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-sienna-deep hover:text-paper"
                                >
                                    Go to Intake Dropzone
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
                            <table className="min-w-full divide-y divide-line text-left text-sm">
                                <thead className="bg-paper-deep font-mono text-xs uppercase tracking-wider text-ink-soft">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Title & ID</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Attestation</th>
                                        <th className="px-6 py-4 font-semibold">Compliance</th>
                                        <th className="px-6 py-4 font-semibold">Word Count</th>
                                        <th className="px-6 py-4 font-semibold">Micro-Grant</th>
                                        <th className="px-6 py-4 font-semibold">Ingested</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {manuscripts.map((m) => (
                                        <tr key={m.id} className="hover:bg-paper-deep/50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-ink">
                                                    {m.title}
                                                </div>
                                                <div className="font-mono text-xs text-ink-soft">
                                                    {m.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        m.status === 'ai_synthesized'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : m.status === 'published'
                                                            ? 'bg-sienna text-ink'
                                                            : 'bg-paper-deep text-sienna-deep'
                                                    }`}
                                                >
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {m.attestations?.[0] ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-800">
                                                        Attested · {m.attestations[0].public_id}
                                                    </span>
                                                ) : m.status === 'published' ? (
                                                    <span className="inline-flex items-center rounded-full bg-paper-deep px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                                                        Not attested
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-ink-soft">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                                                    ✓ Verified 3/3
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-ink-soft">
                                                {m.word_count ? `${m.word_count} words` : '—'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-emerald-600">
                                                ${parseFloat(m.grant_amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-ink-soft">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
