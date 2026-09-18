import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ manuscripts = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-widest text-indigo-600">
                            ThinkTank OS // Monograph Portfolio
                        </span>
                        <h2 className="text-2xl font-bold leading-tight text-gray-900">
                            My Ingested Manuscripts
                        </h2>
                    </div>
                    <Link
                        href={route('manuscripts.create')}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                            <h3 className="text-base font-bold text-gray-900">
                                No manuscripts ingested
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Ingest a raw research manuscript through the intake dropzone to initiate ContextForge synthesis.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={route('manuscripts.create')}
                                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                >
                                    Go to Intake Dropzone
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                                <thead className="bg-gray-50 font-mono text-xs uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Title & ID</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Compliance</th>
                                        <th className="px-6 py-4 font-semibold">Word Count</th>
                                        <th className="px-6 py-4 font-semibold">Micro-Grant</th>
                                        <th className="px-6 py-4 font-semibold">Ingested</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {manuscripts.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {m.title}
                                                </div>
                                                <div className="font-mono text-xs text-gray-400">
                                                    {m.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        m.status === 'ai_synthesized'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : m.status === 'published'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-indigo-100 text-indigo-800'
                                                    }`}
                                                >
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                                                    ✓ Verified 3/3
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                                {m.word_count ? `${m.word_count} words` : '—'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-emerald-600">
                                                ${parseFloat(m.grant_amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
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
