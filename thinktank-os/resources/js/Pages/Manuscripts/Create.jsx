import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';

export default function Create({ recentManuscripts = [], submittedId = null }) {
    const user = usePage().props.auth.user;
    const [manuscripts, setManuscripts] = useState(recentManuscripts);
    const [dragOver, setDragOver] = useState(false);
    const [activeJob, setActiveJob] = useState(null);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        title: '',
        abstract: '',
        manuscript_file: null,
        compliance_ethics: false,
        compliance_transparency: false,
        compliance_citations: false,
    });

    // If submittedId was passed from redirect, find it or track it
    useEffect(() => {
        if (submittedId) {
            const found = manuscripts.find((m) => m.id === submittedId);
            if (found) {
                setActiveJob(found);
            }
        }
    }, [submittedId, manuscripts]);

    // WebSocket real-time listener via Laravel Echo & Reverb
    useEffect(() => {
        if (window.Echo && user?.id) {
            const channel = window.Echo.private(`manuscripts.${user.id}`);

            channel.listen('.ManuscriptStatusUpdated', (event) => {
                setManuscripts((prev) =>
                    prev.map((m) => (m.id === event.id ? { ...m, ...event } : m))
                );

                if (activeJob && activeJob.id === event.id) {
                    setActiveJob((prev) => ({ ...prev, ...event }));
                }
            });

            return () => {
                window.Echo.leave(`manuscripts.${user.id}`);
            };
        }
    }, [user?.id, activeJob]);

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('manuscript_file', e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setData('manuscript_file', e.target.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('manuscripts.store'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    const isComplianceComplete =
        data.compliance_ethics &&
        data.compliance_transparency &&
        data.compliance_citations;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-indigo-600">
                        ThinkTank OS // ContextForge
                    </span>
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Manuscript Intake Dropzone
                    </h2>
                </div>
            }
        >
            <Head title="Manuscript Intake - ThinkTank OS" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    {/* Real-time synthesis alert banner */}
                    {activeJob && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="relative flex h-3 w-3">
                                            {activeJob.status === 'submitted' && (
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                                            )}
                                            <span
                                                className={`relative inline-flex h-3 w-3 rounded-full ${
                                                    activeJob.status === 'ai_synthesized'
                                                        ? 'bg-emerald-500'
                                                        : 'bg-indigo-600'
                                                }`}
                                            ></span>
                                        </span>
                                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-800">
                                            {activeJob.status === 'ai_synthesized'
                                                ? 'Synthesis Complete (202 Verified)'
                                                : 'Asynchronous Synthesis Running (202 Accepted)'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {activeJob.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {activeJob.status === 'ai_synthesized'
                                            ? `Vanguard Policy Brief drafted (${activeJob.word_count ?? 0} words). Ready for human editorial polish.`
                                            : 'The George Foreman Grill mechanic is active: web thread released; ContextForge is synthesizing in background via Redis queue.'}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                        activeJob.status === 'ai_synthesized'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-indigo-100 text-indigo-800'
                                    }`}
                                >
                                    {activeJob.status}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Main Form: Dropzone and Compliance */}
                        <div className="lg:col-span-2">
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm"
                            >
                                {/* Section 1: Manuscript Metadata */}
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            1. Manuscript Details
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Scouted PhD research manuscripts (typically 25–40 pages).
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="title" value="Manuscript Title *" />
                                        <TextInput
                                            id="title"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="e.g., Supply Chain Fragility in Strategic Microelectronics"
                                            required
                                        />
                                        <InputError message={errors.title} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="abstract" value="Executive Abstract" />
                                        <textarea
                                            id="abstract"
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                            value={data.abstract}
                                            onChange={(e) => setData('abstract', e.target.value)}
                                            placeholder="Core methodology, empirical dataset description, and institutional findings..."
                                        />
                                        <InputError message={errors.abstract} className="mt-2" />
                                    </div>
                                </div>

                                {/* Section 2: Interactive Dropzone */}
                                <div className="space-y-4">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            2. Raw Manuscript File Upload
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Files will be ingested securely and scrubbed via ContextForge.
                                        </p>
                                    </div>

                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(true);
                                        }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleFileDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                                            dragOver
                                                ? 'border-indigo-500 bg-indigo-50/50'
                                                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                                        }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx,.doc,.txt"
                                            onChange={handleFileSelect}
                                        />

                                        <svg
                                            className="h-12 w-12 text-gray-400"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20L28 8z"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M28 8v12h12"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>

                                        <div className="mt-4 text-sm text-gray-600">
                                            {data.manuscript_file ? (
                                                <span className="font-semibold text-indigo-600">
                                                    Selected: {data.manuscript_file.name} (
                                                    {(
                                                        data.manuscript_file.size /
                                                        (1024 * 1024)
                                                    ).toFixed(2)}{' '}
                                                    MB)
                                                </span>
                                            ) : (
                                                <span>
                                                    <span className="font-semibold text-indigo-600">
                                                        Drop manuscript file here
                                                    </span>{' '}
                                                    or click to browse
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            PDF, DOCX, TXT up to 50MB
                                        </p>
                                    </div>
                                    <InputError
                                        message={errors.manuscript_file}
                                        className="mt-2"
                                    />

                                    {progress && (
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-indigo-600 h-2.5 rounded-full"
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Mandatory Compliance Checklists */}
                                <div className="space-y-4">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            3. Mandatory Compliance Checklists
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            All three compliance criteria must be explicitly verified to qualify for the $500 micro-grant.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={data.compliance_ethics}
                                                onChange={(e) =>
                                                    setData('compliance_ethics', e.target.checked)
                                                }
                                            />
                                            <span className="text-sm text-gray-700 leading-snug">
                                                <strong className="font-semibold text-gray-900">
                                                    Research Ethics Protocol:
                                                </strong>{' '}
                                                I certify that this research adheres to institutional review protocols, data privacy safeguards, and contains no undisclosed commercial conflicts of interest.
                                            </span>
                                        </label>
                                        <InputError
                                            message={errors.compliance_ethics}
                                            className="mt-1"
                                        />

                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={data.compliance_transparency}
                                                onChange={(e) =>
                                                    setData('compliance_transparency', e.target.checked)
                                                }
                                            />
                                            <span className="text-sm text-gray-700 leading-snug">
                                                <strong className="font-semibold text-gray-900">
                                                    Data Transparency &amp; Reproducibility:
                                                </strong>{' '}
                                                I confirm that all empirical figures, models, and references are accessible for independent audit and verification.
                                            </span>
                                        </label>
                                        <InputError
                                            message={errors.compliance_transparency}
                                            className="mt-1"
                                        />

                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={data.compliance_citations}
                                                onChange={(e) =>
                                                    setData('compliance_citations', e.target.checked)
                                                }
                                            />
                                            <span className="text-sm text-gray-700 leading-snug">
                                                <strong className="font-semibold text-gray-900">
                                                    Attribution &amp; Originality:
                                                </strong>{' '}
                                                I confirm this manuscript is original scholarship, rigorously cited, and complies with Glenride Institute synthesis guidelines.
                                            </span>
                                        </label>
                                        <InputError
                                            message={errors.compliance_citations}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                                    <span className="text-xs text-gray-500">
                                        Submitting triggers the George Foreman Grill asynchronous synthesis loop.
                                    </span>
                                    <PrimaryButton
                                        disabled={
                                            processing ||
                                            !isComplianceComplete ||
                                            !data.manuscript_file ||
                                            !data.title
                                        }
                                        className="px-6 py-3"
                                    >
                                        {processing
                                            ? 'Ingesting...'
                                            : 'Drop Manuscript & Synthesize (202)'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar: Status Matrix & Architecture Specs */}
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900">
                                    Asynchronous Pipeline Specs
                                </h3>
                                <dl className="mt-4 space-y-3 text-xs">
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <dt className="text-gray-500">Web Response</dt>
                                        <dd className="font-mono font-semibold text-gray-900">
                                            202 Accepted
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <dt className="text-gray-500">Queue Engine</dt>
                                        <dd className="font-mono font-semibold text-indigo-600">
                                            Redis + Horizon
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <dt className="text-gray-500">Live Broadcaster</dt>
                                        <dd className="font-mono font-semibold text-gray-900">
                                            Laravel Reverb
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-100 pb-2">
                                        <dt className="text-gray-500">Target Output</dt>
                                        <dd className="font-semibold text-gray-900">
                                            4-Page Vanguard Brief
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Scholar Micro-grant</dt>
                                        <dd className="font-semibold text-emerald-600">
                                            $500.00 Fixed
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Recent Scholar Submissions */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900">
                                    Your Manuscripts
                                </h3>
                                {manuscripts.length === 0 ? (
                                    <p className="mt-4 text-xs text-gray-500">
                                        No manuscripts ingested yet. Upload your first file above.
                                    </p>
                                ) : (
                                    <ul className="mt-4 divide-y divide-gray-100">
                                        {manuscripts.map((m) => (
                                            <li
                                                key={m.id}
                                                className="py-3 text-xs space-y-1"
                                                onClick={() => setActiveJob(m)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 truncate max-w-[180px]">
                                                        {m.title}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            m.status === 'ai_synthesized'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-indigo-100 text-indigo-800'
                                                        }`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 font-mono">
                                                    {m.id.substring(0, 8)}...
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
