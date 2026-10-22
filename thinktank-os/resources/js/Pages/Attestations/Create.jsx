import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const DEFAULT_CLAIM =
    'Glenride attests that this work was authored as claimed, passed editorial review, and matches the evidence recorded at issuance.';

const SUBJECT_KINDS = [
    { value: 'manuscript', label: 'Manuscript' },
    { value: 'report', label: 'Report' },
    { value: 'dataset', label: 'Dataset' },
    { value: 'external_work', label: 'External work' },
    { value: 'other', label: 'Other' },
];

const inputCls =
    'mt-1 block w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-sm focus:border-sienna-deep focus:ring-sienna-deep';
const labelCls =
    'block font-mono text-xs uppercase tracking-wider text-ink-soft';
const errorCls = 'mt-2 text-sm text-sienna-deep';

export default function Create({ publishedManuscripts = [] }) {
    const [mode, setMode] = useState('manuscript');

    // From-a-manuscript mode (axios, matching the Portfolio Matrix flow)
    const [manuscriptId, setManuscriptId] = useState(publishedManuscripts[0]?.id || '');
    const [msClaim, setMsClaim] = useState(DEFAULT_CLAIM);
    const [msNotes, setMsNotes] = useState('');
    const [msUrl, setMsUrl] = useState('');
    const [msProcessing, setMsProcessing] = useState(false);
    const [msError, setMsError] = useState(null);
    const [msSuccess, setMsSuccess] = useState(null);

    const submitFromManuscript = async (e) => {
        e.preventDefault();
        if (!manuscriptId) return;
        setMsProcessing(true);
        setMsError(null);
        setMsSuccess(null);
        try {
            const res = await window.axios.post(route('attestations.store', manuscriptId), {
                claim: msClaim,
                evidence_notes: msNotes || null,
                evidence_urls: msUrl ? [msUrl] : [],
            });
            const publicId = res.data?.attestation?.public_id;
            setMsSuccess(publicId ? `Attestation issued: ${publicId}` : 'Attestation issued.');
            router.visit(route('attestations.index'));
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.claim?.[0] ||
                err.response?.data?.errors?.evidence_urls?.[0] ||
                'Failed to issue attestation. The manuscript must be Published with all compliance checks verified.';
            setMsError(message);
        } finally {
            setMsProcessing(false);
        }
    };

    // Standalone manual entry mode (Inertia form)
    const manualForm = useForm({
        subject_title: '',
        subject_kind: 'other',
        claim: DEFAULT_CLAIM,
        evidence_notes: '',
        evidence_urls_text: '',
        subject_hash_override: '',
    });

    const submitManual = (e) => {
        e.preventDefault();
        manualForm
            .transform((data) => ({
                subject_title: data.subject_title,
                subject_kind: data.subject_kind,
                claim: data.claim,
                evidence_notes: data.evidence_notes || null,
                evidence_urls: data.evidence_urls_text
                    ? data.evidence_urls_text
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                    : [],
                subject_hash_override: data.subject_hash_override || null,
            }))
            .post(route('attestations.storeManual'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-sienna-deep">
                        ThinkTank OS // Glenride Attestations
                    </span>
                    <h2 className="text-2xl font-bold leading-tight text-ink">
                        New Attestation
                    </h2>
                    <p className="mt-1 text-sm text-ink-soft">
                        Attest a published manuscript from the pipeline, or enter a subject
                        manually. Only Glenride editors and orchestrators can issue attestations.
                    </p>
                </div>
            }
        >
            <Head title="New Attestation - ThinkTank OS" />

            <div className="py-10">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('manuscript')}
                            className={`rounded-xl px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition ${
                                mode === 'manuscript'
                                    ? 'bg-ink text-paper'
                                    : 'border border-line bg-white text-ink hover:bg-paper'
                            }`}
                        >
                            From a manuscript
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('manual')}
                            className={`rounded-xl px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition ${
                                mode === 'manual'
                                    ? 'bg-ink text-paper'
                                    : 'border border-line bg-white text-ink hover:bg-paper'
                            }`}
                        >
                            Manual entry
                        </button>
                    </div>

                    {mode === 'manuscript' ? (
                        <form
                            onSubmit={submitFromManuscript}
                            className="mt-6 space-y-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
                        >
                            <div>
                                <label htmlFor="manuscript" className={labelCls}>
                                    Published manuscript
                                </label>
                                {publishedManuscripts.length === 0 ? (
                                    <p className="mt-2 text-sm text-ink-soft">
                                        No published manuscripts are available to attest yet.
                                        Publish a manuscript from the Portfolio Matrix first.
                                    </p>
                                ) : (
                                    <select
                                        id="manuscript"
                                        value={manuscriptId}
                                        onChange={(e) => setManuscriptId(e.target.value)}
                                        className={inputCls}
                                    >
                                        {publishedManuscripts.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label htmlFor="ms-claim" className={labelCls}>
                                    Claim
                                </label>
                                <textarea
                                    id="ms-claim"
                                    rows={3}
                                    value={msClaim}
                                    onChange={(e) => setMsClaim(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label htmlFor="ms-notes" className={labelCls}>
                                    Evidence notes (optional)
                                </label>
                                <textarea
                                    id="ms-notes"
                                    rows={3}
                                    value={msNotes}
                                    onChange={(e) => setMsNotes(e.target.value)}
                                    placeholder="What was checked, where the evidence lives…"
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label htmlFor="ms-url" className={labelCls}>
                                    Evidence URL (optional)
                                </label>
                                <input
                                    id="ms-url"
                                    type="url"
                                    value={msUrl}
                                    onChange={(e) => setMsUrl(e.target.value)}
                                    placeholder="https://…"
                                    className={inputCls}
                                />
                            </div>

                            {msError && <p className={errorCls}>{msError}</p>}
                            {msSuccess && (
                                <p className="text-sm font-semibold text-ink">{msSuccess}</p>
                            )}

                            <div className="flex items-center justify-between border-t border-line pt-4">
                                <Link
                                    href={route('attestations.index')}
                                    className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft hover:text-ink"
                                >
                                    ← Registry
                                </Link>
                                <button
                                    type="submit"
                                    disabled={msProcessing || !manuscriptId || !msClaim.trim()}
                                    className="inline-flex items-center rounded-xl bg-sienna px-6 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-ink shadow-sm transition hover:bg-sienna-deep hover:text-paper disabled:opacity-50"
                                >
                                    {msProcessing ? 'Issuing…' : 'Issue Attestation'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={submitManual}
                            className="mt-6 space-y-6 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
                        >
                            <p className="text-sm leading-relaxed text-ink-soft">
                                For subjects that are not in the manuscript pipeline — a report,
                                a dataset, or external work Glenride has verified. The record is
                                signed the same way as a pipeline attestation and marked as a
                                manual entry.
                            </p>

                            <div>
                                <label htmlFor="subject_title" className={labelCls}>
                                    Subject title *
                                </label>
                                <input
                                    id="subject_title"
                                    type="text"
                                    value={manualForm.data.subject_title}
                                    onChange={(e) => manualForm.setData('subject_title', e.target.value)}
                                    className={inputCls}
                                    maxLength={500}
                                />
                                {manualForm.errors.subject_title && (
                                    <p className={errorCls}>{manualForm.errors.subject_title}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="subject_kind" className={labelCls}>
                                    Subject kind
                                </label>
                                <select
                                    id="subject_kind"
                                    value={manualForm.data.subject_kind}
                                    onChange={(e) => manualForm.setData('subject_kind', e.target.value)}
                                    className={inputCls}
                                >
                                    {SUBJECT_KINDS.map((kind) => (
                                        <option key={kind.value} value={kind.value}>
                                            {kind.label}
                                        </option>
                                    ))}
                                </select>
                                {manualForm.errors.subject_kind && (
                                    <p className={errorCls}>{manualForm.errors.subject_kind}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="claim" className={labelCls}>
                                    Claim *
                                </label>
                                <textarea
                                    id="claim"
                                    rows={3}
                                    value={manualForm.data.claim}
                                    onChange={(e) => manualForm.setData('claim', e.target.value)}
                                    className={inputCls}
                                />
                                {manualForm.errors.claim && (
                                    <p className={errorCls}>{manualForm.errors.claim}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="evidence_notes" className={labelCls}>
                                    Evidence notes (optional)
                                </label>
                                <textarea
                                    id="evidence_notes"
                                    rows={3}
                                    value={manualForm.data.evidence_notes}
                                    onChange={(e) => manualForm.setData('evidence_notes', e.target.value)}
                                    placeholder="What was checked, where the evidence lives…"
                                    className={inputCls}
                                />
                                {manualForm.errors.evidence_notes && (
                                    <p className={errorCls}>{manualForm.errors.evidence_notes}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="evidence_urls_text" className={labelCls}>
                                    Evidence URLs (optional, one per line)
                                </label>
                                <textarea
                                    id="evidence_urls_text"
                                    rows={3}
                                    value={manualForm.data.evidence_urls_text}
                                    onChange={(e) => manualForm.setData('evidence_urls_text', e.target.value)}
                                    placeholder={'https://…\nhttps://…'}
                                    className={inputCls}
                                />
                                {manualForm.errors.evidence_urls && (
                                    <p className={errorCls}>{manualForm.errors.evidence_urls}</p>
                                )}
                                {manualForm.errors['evidence_urls.0'] && (
                                    <p className={errorCls}>{manualForm.errors['evidence_urls.0']}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="subject_hash_override" className={labelCls}>
                                    Subject hash override (optional, 64-character hex SHA-256)
                                </label>
                                <input
                                    id="subject_hash_override"
                                    type="text"
                                    value={manualForm.data.subject_hash_override}
                                    onChange={(e) => manualForm.setData('subject_hash_override', e.target.value)}
                                    placeholder="Leave blank to hash the entered data"
                                    className={`${inputCls} font-mono`}
                                />
                                {manualForm.errors.subject_hash_override && (
                                    <p className={errorCls}>{manualForm.errors.subject_hash_override}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-line pt-4">
                                <Link
                                    href={route('attestations.index')}
                                    className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-soft hover:text-ink"
                                >
                                    ← Registry
                                </Link>
                                <button
                                    type="submit"
                                    disabled={manualForm.processing}
                                    className="inline-flex items-center rounded-xl bg-sienna px-6 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-ink shadow-sm transition hover:bg-sienna-deep hover:text-paper disabled:opacity-50"
                                >
                                    {manualForm.processing ? 'Issuing…' : 'Issue Attestation'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
