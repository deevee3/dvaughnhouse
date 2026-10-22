import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';

export default function Create({ recentManuscripts = [], submittedId = null, creditAccounts = [] }) {
    const user = usePage().props.auth.user;
    const [manuscripts, setManuscripts] = useState(recentManuscripts);
    const [dragOver, setDragOver] = useState(false);
    const [activeJob, setActiveJob] = useState(null);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        title: '',
        abstract: '',
        credit_account_id: '',
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

            const updateHandler = (event) => {
                setManuscripts((prev) =>
                    prev.map((m) => (m.id === event.id ? { ...m, ...event } : m))
                );

                if (activeJob && activeJob.id === event.id) {
                    setActiveJob((prev) => ({ ...prev, ...event }));
                }
            };

            channel.listen('.ManuscriptStatusUpdated', updateHandler);
            channel.listen('.ManuscriptSynthesized', updateHandler);

            return () => {
                channel.stopListening('.ManuscriptStatusUpdated');
                channel.stopListening('.ManuscriptSynthesized');
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
                    <span className="font-mono text-xs uppercase tracking-widest text-sienna-deep">
                        ThinkTank OS // ContextForge
                    </span>
                    <h2 className="font-display text-2xl font-bold leading-tight text-ink">
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
                        <div className="rounded-xl border border-line bg-paper-deep p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="relative flex h-3 w-3">
                                            {activeJob.status === 'submitted' && (
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sienna opacity-75"></span>
                                            )}
                                            <span
                                                className={`relative inline-flex h-3 w-3 rounded-full ${
                                                    activeJob.status === 'ai_synthesized'
                                                        ? 'bg-emerald-500'
                                                        : 'bg-sienna'
                                                }`}
                                            ></span>
                                        </span>
                                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sienna-deep">
                                            {activeJob.status === 'ai_synthesized'
                                                ? 'Synthesis Complete (202 Verified)'
                                                : 'Asynchronous Synthesis Running (202 Accepted)'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-ink">
                                        {activeJob.title}
                                    </h3>
                                    <p className="text-sm text-ink-soft">
                                        {activeJob.status === 'ai_synthesized'
                                            ? `Vanguard Policy Brief drafted (${activeJob.word_count ?? 0} words). Ready for human editorial polish.`
                                            : 'The George Foreman Grill mechanic is active: web thread released; ContextForge is synthesizing in background via Redis queue.'}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                        activeJob.status === 'ai_synthesized'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-paper-deep text-sienna-deep'
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
                                className="space-y-8 rounded-2xl border border-line bg-paper p-6 sm:p-8 shadow-sm"
                            >
                                {/* Section 1: Manuscript Metadata */}
                                <div className="space-y-6">
                                    <div className="border-b border-line pb-4">
                                        <h3 className="text-lg font-bold text-ink">
                                            1. Manuscript Details
                                        </h3>
                                        <p className="text-sm text-ink-soft">
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
                                            className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-sienna-deep focus:ring-sienna-deep text-sm"
                                            value={data.abstract}
                                            onChange={(e) => setData('abstract', e.target.value)}
                                            placeholder="Core methodology, empirical dataset description, and institutional findings..."
                                        />
                                        <InputError message={errors.abstract} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="credit_account_id"
                                            value="Credit Account (study/project budget) — optional"
                                        />
                                        <select
                                            id="credit_account_id"
                                            className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-sienna-deep focus:ring-sienna-deep text-sm"
                                            value={data.credit_account_id}
                                            onChange={(e) =>
                                                setData('credit_account_id', e.target.value)
                                            }
                                        >
                                            <option value="">
                                                No budget account — attestation will not draw credits
                                            </option>
                                            {creditAccounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name} — balance{' '}
                                                    {Number(account.balance).toLocaleString()}{' '}
                                                    credits
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-ink-soft">
                                            When this manuscript is attested, the attestation
                                            price is drawn from the selected account's prepaid
                                            STANZA credit balance.
                                        </p>
                                        <InputError
                                            message={errors.credit_account_id}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Interactive Dropzone */}
                                <div className="space-y-4">
                                    <div className="border-b border-line pb-4">
                                        <h3 className="text-lg font-bold text-ink">
                                            2. Raw Manuscript File Upload
                                        </h3>
                                        <p className="text-sm text-ink-soft">
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
                                                ? 'border-sienna-deep bg-paper-deep'
                                                : 'border-line hover:border-sienna-deep/60 bg-paper-deep/50'
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
                                            className="h-12 w-12 text-ink-soft"
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

                                        <div className="mt-4 text-sm text-ink-soft">
                                            {data.manuscript_file ? (
                                                <span className="font-semibold text-sienna-deep">
                                                    Selected: {data.manuscript_file.name} (
                                                    {(
                                                        data.manuscript_file.size /
                                                        (1024 * 1024)
                                                    ).toFixed(2)}{' '}
                                                    MB)
                                                </span>
                                            ) : (
                                                <span>
                                                    <span className="font-semibold text-sienna-deep">
                                                        Drop manuscript file here
                                                    </span>{' '}
                                                    or click to browse
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-ink-soft">
                                            PDF, DOCX, TXT up to 50MB
                                        </p>
                                    </div>
                                    <InputError
                                        message={errors.manuscript_file}
                                        className="mt-2"
                                    />

                                    {progress && (
                                        <div className="w-full bg-line rounded-full h-2.5">
                                            <div
                                                className="bg-sienna h-2.5 rounded-full"
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Mandatory Compliance Checklists */}
                                <div className="space-y-4">
                                    <div className="border-b border-line pb-4">
                                        <h3 className="text-lg font-bold text-ink">
                                            3. Mandatory Compliance Checklists
                                        </h3>
                                        <p className="text-sm text-ink-soft">
                                            All three compliance criteria must be explicitly verified to qualify for the $500 micro-grant.
                                        </p>
                                        <p className="mt-2 text-sm text-ink-soft">
                                            After publication, a Glenride editor attests this work — attestation is the final step of the pipeline.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded border-line text-sienna-deep focus:ring-sienna-deep"
                                                checked={data.compliance_ethics}
                                                onChange={(e) =>
                                                    setData('compliance_ethics', e.target.checked)
                                                }
                                            />
                                            <span className="text-sm text-ink leading-snug">
                                                <strong className="font-semibold text-ink">
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
                                                className="mt-1 h-4 w-4 rounded border-line text-sienna-deep focus:ring-sienna-deep"
                                                checked={data.compliance_transparency}
                                                onChange={(e) =>
                                                    setData('compliance_transparency', e.target.checked)
                                                }
                                            />
                                            <span className="text-sm text-ink leading-snug">
                                                <strong className="font-semibold text-ink">
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
                                                className="mt-1 h-4 w-4 rounded border-line text-sienna-deep focus:ring-sienna-deep"
                                                checked={data.compliance_citations}
                                                onChange={(e) =>
                                                    setData('compliance_citations', e.target.checked)
                                                }
                                            />
                                            <span className="text-sm text-ink leading-snug">
                                                <strong className="font-semibold text-ink">
                                                    Attribution &amp; Originality:
                                                </strong>{' '}
                                                I confirm this manuscript is original scholarship, rigorously cited, and complies with Glenride synthesis guidelines.
                                            </span>
                                        </label>
                                        <InputError
                                            message={errors.compliance_citations}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <div className="pt-4 flex items-center justify-between border-t border-line">
                                    <span className="text-xs text-ink-soft">
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
                            <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                                <h3 className="text-base font-bold text-ink">
                                    Asynchronous Pipeline Specs
                                </h3>
                                <dl className="mt-4 space-y-3 text-xs">
                                    <div className="flex justify-between border-b border-line pb-2">
                                        <dt className="text-ink-soft">Web Response</dt>
                                        <dd className="font-mono font-semibold text-ink">
                                            202 Accepted
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-b border-line pb-2">
                                        <dt className="text-ink-soft">Queue Engine</dt>
                                        <dd className="font-mono font-semibold text-sienna-deep">
                                            Redis + Horizon
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-b border-line pb-2">
                                        <dt className="text-ink-soft">Live Broadcaster</dt>
                                        <dd className="font-mono font-semibold text-ink">
                                            Laravel Reverb
                                        </dd>
                                    </div>
                                    <div className="flex justify-between border-b border-line pb-2">
                                        <dt className="text-ink-soft">Target Output</dt>
                                        <dd className="font-semibold text-ink">
                                            4-Page Vanguard Brief
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-ink-soft">Scholar Micro-grant</dt>
                                        <dd className="font-semibold text-emerald-600">
                                            $500.00 Fixed
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Recent Scholar Submissions */}
                            <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                                <h3 className="text-base font-bold text-ink">
                                    Your Manuscripts
                                </h3>
                                {manuscripts.length === 0 ? (
                                    <p className="mt-4 text-xs text-ink-soft">
                                        No manuscripts ingested yet. Upload your first file above.
                                    </p>
                                ) : (
                                    <ul className="mt-4 divide-y divide-line">
                                        {manuscripts.map((m) => (
                                            <li
                                                key={m.id}
                                                className="py-3 text-xs space-y-1"
                                                onClick={() => setActiveJob(m)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-ink truncate max-w-[180px]">
                                                        {m.title}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            m.status === 'ai_synthesized'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-paper-deep text-sienna-deep'
                                                        }`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-ink-soft font-mono">
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
