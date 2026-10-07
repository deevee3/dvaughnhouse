import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';

const COLUMN_CONFIG = [
    {
        key: 'submitted',
        label: '1. Ingested Dropzone',
        subtitle: 'Awaiting / In Synthesis Queue',
        color: 'border-amber-500/40 bg-amber-500/5 text-amber-500',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        emptyMessage: 'No manuscripts pending synthesis.',
    },
    {
        key: 'ai_synthesized',
        label: '2. ContextForge Synthesized',
        subtitle: 'Agentic 4-Page Monograph Ready',
        color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        emptyMessage: 'No synthesized manuscripts awaiting review.',
    },
    {
        key: 'human_polish',
        label: '3. Human Polish & Curation',
        subtitle: 'Editorial Review & Fact Verification',
        color: 'border-purple-500/40 bg-purple-500/5 text-purple-400',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        emptyMessage: 'No manuscripts currently in editorial polish.',
    },
    {
        key: 'published',
        label: '4. Vanguard Library',
        subtitle: 'Published Institutional Monographs',
        color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        emptyMessage: 'No published monographs yet.',
    },
];

export default function Matrix({ columns = {}, stats = {}, isOrchestrator = false, auth }) {
    const [boardColumns, setBoardColumns] = useState({
        submitted: columns.submitted || [],
        ai_synthesized: columns.ai_synthesized || [],
        human_polish: columns.human_polish || [],
        published: columns.published || [],
    });

    const [boardStats, setBoardStats] = useState(stats);
    const [selectedManuscript, setSelectedManuscript] = useState(null);
    const [briefContent, setBriefContent] = useState('');
    const [editableTitle, setEditableTitle] = useState('');
    const [isLoadingBrief, setIsLoadingBrief] = useState(false);
    const [isSavingBrief, setIsSavingBrief] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [liveEventCount, setLiveEventCount] = useState(0);

    // Sync board state if props change
    useEffect(() => {
        setBoardColumns({
            submitted: columns.submitted || [],
            ai_synthesized: columns.ai_synthesized || [],
            human_polish: columns.human_polish || [],
            published: columns.published || [],
        });
        setBoardStats(stats);
    }, [columns, stats]);

    // Show toast helper
    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4500);
    };

    // Real-time WebSocket subscriptions via Laravel Reverb
    useEffect(() => {
        if (!window.Echo) return;

        const handleRealtimeUpdate = (e) => {
            setLiveEventCount((prev) => prev + 1);
            triggerToast(`⚡ Real-time: "${e.title}" transitioned to ${e.status.replace('_', ' ')}`);

            setBoardColumns((prev) => {
                const next = {
                    submitted: prev.submitted.filter((m) => m.id !== e.id),
                    ai_synthesized: prev.ai_synthesized.filter((m) => m.id !== e.id),
                    human_polish: prev.human_polish.filter((m) => m.id !== e.id),
                    published: prev.published.filter((m) => m.id !== e.id),
                };

                // Find existing object for full details or construct from event
                const existing =
                    [...prev.submitted, ...prev.ai_synthesized, ...prev.human_polish, ...prev.published].find(
                        (m) => m.id === e.id
                    ) || {};

                const updatedItem = {
                    ...existing,
                    id: e.id,
                    title: e.title,
                    status: e.status,
                    synthesized_brief_path: e.synthesized_brief_path,
                    word_count: e.word_count,
                    grant_amount: e.grant_amount || existing.grant_amount || 500,
                    published_at: e.published_at,
                    user: e.author || existing.user,
                    updated_at: e.updated_at,
                };

                if (next[e.status]) {
                    next[e.status] = [updatedItem, ...next[e.status]];
                }

                return next;
            });

            // Update modal if currently open
            setSelectedManuscript((curr) => {
                if (curr && curr.id === e.id) {
                    return { ...curr, status: e.status, word_count: e.word_count };
                }
                return curr;
            });
        };

        // Listen on portfolio-matrix channel
        const matrixChannel = window.Echo.private('portfolio-matrix');
        matrixChannel.listen('.ManuscriptStatusUpdated', handleRealtimeUpdate);

        // Also listen on scholar's private channel if user id is known
        let userChannel = null;
        if (auth?.user?.id) {
            userChannel = window.Echo.private(`manuscripts.${auth.user.id}`);
            userChannel.listen('.ManuscriptStatusUpdated', handleRealtimeUpdate);
            userChannel.listen('.ManuscriptSynthesized', handleRealtimeUpdate);
        }

        return () => {
            matrixChannel.stopListening('.ManuscriptStatusUpdated');
            if (userChannel) {
                userChannel.stopListening('.ManuscriptStatusUpdated');
                userChannel.stopListening('.ManuscriptSynthesized');
            }
        };
    }, [auth?.user?.id]);

    // Open Editorial Studio Modal
    const openEditorialStudio = async (manuscript) => {
        setSelectedManuscript(manuscript);
        setEditableTitle(manuscript.title);
        setIsLoadingBrief(true);
        setEditMode(manuscript.status === 'human_polish');

        try {
            const res = await window.axios.get(route('matrix.show', manuscript.id));
            setBriefContent(res.data.brief_content || '');
            if (res.data.manuscript) {
                setSelectedManuscript(res.data.manuscript);
                setEditableTitle(res.data.manuscript.title);
            }
        } catch (err) {
            console.error('Failed to load manuscript details:', err);
            triggerToast('Failed to load full brief content from storage.');
        } finally {
            setIsLoadingBrief(false);
        }
    };

    // Close Editorial Studio Modal
    const closeEditorialStudio = () => {
        setSelectedManuscript(null);
        setBriefContent('');
        setEditMode(false);
    };

    // Move manuscript status
    const transitionStatus = async (manuscriptId, newStatus) => {
        setIsTransitioning(true);
        try {
            const res = await window.axios.patch(route('matrix.updateStatus', manuscriptId), {
                status: newStatus,
            });

            const updated = res.data.manuscript;
            setBoardColumns((prev) => {
                const next = {
                    submitted: prev.submitted.filter((m) => m.id !== manuscriptId),
                    ai_synthesized: prev.ai_synthesized.filter((m) => m.id !== manuscriptId),
                    human_polish: prev.human_polish.filter((m) => m.id !== manuscriptId),
                    published: prev.published.filter((m) => m.id !== manuscriptId),
                };
                if (next[newStatus]) {
                    next[newStatus] = [updated, ...next[newStatus]];
                }
                return next;
            });

            if (selectedManuscript && selectedManuscript.id === manuscriptId) {
                setSelectedManuscript(updated);
            }

            triggerToast(`Success: Manuscript moved to ${newStatus.replace('_', ' ')}.`);
        } catch (err) {
            console.error('Failed to transition status:', err);
            triggerToast('Error: Failed to transition status.');
        } finally {
            setIsTransitioning(false);
        }
    };

    // Save editorial revisions
    const saveEditorialContent = async () => {
        if (!selectedManuscript) return;
        setIsSavingBrief(true);
        try {
            const res = await window.axios.patch(
                route('matrix.updateContent', selectedManuscript.id),
                {
                    content: briefContent,
                    title: editableTitle,
                }
            );

            const updated = res.data.manuscript;
            setSelectedManuscript(updated);
            setBriefContent(res.data.brief_content);

            // Update in boardColumns
            setBoardColumns((prev) => {
                const status = updated.status;
                const next = { ...prev };
                if (next[status]) {
                    next[status] = next[status].map((m) => (m.id === updated.id ? updated : m));
                }
                return next;
            });

            triggerToast('Editorial polish saved successfully.');
        } catch (err) {
            console.error('Failed to save editorial content:', err);
            triggerToast('Error saving editorial revisions.');
        } finally {
            setIsSavingBrief(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                Operational Pipeline
                            </span>
                            <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
                                ThinkTank OS // Institutional Matrix
                            </span>
                            <span className="flex items-center text-xs font-medium text-emerald-600">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Reverb Synced {liveEventCount > 0 && `(${liveEventCount})`}
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                            The Portfolio Matrix
                        </h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('manuscripts.create')}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition"
                        >
                            + Intake Dropzone
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="The Portfolio Matrix - ThinkTank OS" />

            {/* Floating Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center rounded-xl bg-gray-900/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur border border-gray-700 animate-fade-in">
                    <span className="mr-2">⚡</span>
                    {toastMessage}
                </div>
            )}

            <div className="py-8 bg-gray-50 min-h-[calc(100vh-10rem)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Top KPI Metrics Deck */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <dt className="text-xs font-mono uppercase tracking-wider text-gray-500">
                                Total Ingested
                            </dt>
                            <dd className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                                {boardStats.total_manuscripts ?? 0}
                            </dd>
                            <span className="text-[11px] text-gray-400 font-mono">
                                30-Page Research Papers
                            </span>
                        </div>

                        <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4 shadow-sm">
                            <dt className="text-xs font-mono uppercase tracking-wider text-cyan-800">
                                AI Synthesized
                            </dt>
                            <dd className="mt-1 text-2xl font-bold tracking-tight text-cyan-900">
                                {boardColumns.ai_synthesized.length}
                            </dd>
                            <span className="text-[11px] text-cyan-700 font-mono">
                                Distilled via ContextForge
                            </span>
                        </div>

                        <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 shadow-sm">
                            <dt className="text-xs font-mono uppercase tracking-wider text-purple-800">
                                Human Polish
                            </dt>
                            <dd className="mt-1 text-2xl font-bold tracking-tight text-purple-900">
                                {boardColumns.human_polish.length}
                            </dd>
                            <span className="text-[11px] text-purple-700 font-mono">
                                Active Editorial Review
                            </span>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
                            <dt className="text-xs font-mono uppercase tracking-wider text-emerald-800">
                                Published Monographs
                            </dt>
                            <dd className="mt-1 text-2xl font-bold tracking-tight text-emerald-900">
                                {boardColumns.published.length}
                            </dd>
                            <span className="text-[11px] text-emerald-700 font-mono">
                                Live in Vanguard Library
                            </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <dt className="text-xs font-mono uppercase tracking-wider text-gray-500">
                                Micro-Grants Committed
                            </dt>
                            <dd className="mt-1 text-2xl font-bold font-mono tracking-tight text-emerald-600">
                                ${(boardStats.total_grants_allocated ?? 0).toLocaleString()}
                            </dd>
                            <span className="text-[11px] text-gray-400 font-mono">
                                $500 Base Per Fellow
                            </span>
                        </div>
                    </div>

                    {/* The Kanban Matrix Board */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {COLUMN_CONFIG.map((col) => {
                            const items = boardColumns[col.key] || [];

                            return (
                                <div
                                    key={col.key}
                                    className="flex flex-col rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur p-4"
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                                        <div>
                                            <h2 className="text-sm font-bold text-gray-900">
                                                {col.label}
                                            </h2>
                                            <p className="text-[11px] text-gray-400">
                                                {col.subtitle}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border ${col.badgeColor}`}
                                        >
                                            {items.length}
                                        </span>
                                    </div>

                                    {/* Column Cards Container */}
                                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-22rem)] pr-1">
                                        {items.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                                                {col.emptyMessage}
                                            </div>
                                        ) : (
                                            items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition duration-150 relative cursor-pointer"
                                                    onClick={() => openEditorialStudio(item)}
                                                >
                                                    {/* Top chips */}
                                                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1.5">
                                                        <span>ID: {item.id.slice(0, 8)}...</span>
                                                        <span className="font-semibold text-emerald-600">
                                                            ${parseFloat(item.grant_amount || 500).toFixed(0)} Grant
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition">
                                                        {item.title}
                                                    </h3>

                                                    {/* Author & Words */}
                                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                                        <span className="truncate max-w-[120px]">
                                                            {item.user?.name || 'Fellow'}
                                                        </span>
                                                        <span className="font-mono text-[11px] text-gray-400">
                                                            {item.word_count ? `${item.word_count} words` : '—'}
                                                        </span>
                                                    </div>

                                                    {/* Card Stage Action Footer */}
                                                    <div
                                                        className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditorialStudio(item)}
                                                            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            Editorial Studio →
                                                        </button>

                                                        {/* Quick advance buttons based on stage */}
                                                        {item.status === 'submitted' && (
                                                            <button
                                                                type="button"
                                                                disabled={isTransitioning}
                                                                onClick={() => transitionStatus(item.id, 'ai_synthesized')}
                                                                className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-200 transition"
                                                            >
                                                                Mark Synthesized
                                                            </button>
                                                        )}

                                                        {item.status === 'ai_synthesized' && (
                                                            <button
                                                                type="button"
                                                                disabled={isTransitioning}
                                                                onClick={() => transitionStatus(item.id, 'human_polish')}
                                                                className="rounded bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700 hover:bg-purple-100 transition"
                                                            >
                                                                Begin Polish →
                                                            </button>
                                                        )}

                                                        {item.status === 'human_polish' && (
                                                            <button
                                                                type="button"
                                                                disabled={isTransitioning}
                                                                onClick={() => transitionStatus(item.id, 'published')}
                                                                className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                                            >
                                                                Publish ✓
                                                            </button>
                                                        )}

                                                        {item.status === 'published' && (
                                                            <span className="text-[10px] font-mono font-medium text-emerald-600">
                                                                Live Monograph
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Editorial Studio Slide-Over / Full Modal */}
            {selectedManuscript && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/60 backdrop-blur-sm flex justify-end animate-fade-in">
                    <div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full border-l border-gray-200">
                        {/* Modal Header */}
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50/80">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs text-indigo-600 font-semibold">
                                        EDITORIAL STUDIO // {selectedManuscript.id}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                            selectedManuscript.status === 'published'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : selectedManuscript.status === 'human_polish'
                                                ? 'bg-purple-100 text-purple-800'
                                                : selectedManuscript.status === 'ai_synthesized'
                                                ? 'bg-cyan-100 text-cyan-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}
                                    >
                                        {selectedManuscript.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mt-1">
                                    {selectedManuscript.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditorialStudio}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body: Two Column Layout */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Metadata & Controls Sidebar */}
                            <div className="md:col-span-1 space-y-4 border-r border-gray-100 pr-6">
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">
                                        Monograph Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editableTitle}
                                        onChange={(e) => setEditableTitle(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Author / Fellow:</span>
                                        <span className="font-semibold text-gray-900">
                                            {selectedManuscript.user?.name || 'Institutional Fellow'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="text-gray-700 font-mono text-[11px]">
                                            {selectedManuscript.user?.email || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Micro-Grant:</span>
                                        <span className="font-mono font-semibold text-emerald-600">
                                            ${parseFloat(selectedManuscript.grant_amount || 500).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Brief Word Count:</span>
                                        <span className="font-mono font-semibold text-gray-900">
                                            {selectedManuscript.word_count || strWordCount(briefContent)} words
                                        </span>
                                    </div>
                                </div>

                                {/* Compliance Certification Status */}
                                <div className="rounded-xl bg-white p-4 border border-emerald-200 text-xs space-y-2">
                                    <div className="font-semibold text-emerald-800 flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Compliance Gated 3/3
                                    </div>
                                    <ul className="text-gray-600 space-y-1 pl-4 list-disc text-[11px]">
                                        <li>Research Ethics Protocol: Verified</li>
                                        <li>Data Transparency: Certified</li>
                                        <li>Original Citations: Verified</li>
                                    </ul>
                                </div>

                                {/* Stage Progression Actions */}
                                <div className="space-y-2 pt-2">
                                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-500">
                                        Stage Progression
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => transitionStatus(selectedManuscript.id, 'submitted')}
                                            className={`rounded-lg py-1.5 text-xs font-medium border transition ${
                                                selectedManuscript.status === 'submitted'
                                                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            1. Submitted
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => transitionStatus(selectedManuscript.id, 'ai_synthesized')}
                                            className={`rounded-lg py-1.5 text-xs font-medium border transition ${
                                                selectedManuscript.status === 'ai_synthesized'
                                                    ? 'bg-cyan-100 border-cyan-300 text-cyan-900 font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            2. Synthesized
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => transitionStatus(selectedManuscript.id, 'human_polish')}
                                            className={`rounded-lg py-1.5 text-xs font-medium border transition ${
                                                selectedManuscript.status === 'human_polish'
                                                    ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            3. Human Polish
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => transitionStatus(selectedManuscript.id, 'published')}
                                            className={`rounded-lg py-1.5 text-xs font-medium border transition ${
                                                selectedManuscript.status === 'published'
                                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            4. Published ✓
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Pane (Brief Editor & Preview) */}
                            <div className="md:col-span-2 flex flex-col h-full">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditMode(false)}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                                                !editMode ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            Policy Brief Preview
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditMode(true)}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                                                editMode ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            Markdown Editor
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {strWordCount(briefContent)} words
                                    </span>
                                </div>

                                {isLoadingBrief ? (
                                    <div className="flex-1 flex items-center justify-center p-12 text-gray-400 font-mono text-sm">
                                        Loading synthesized brief from storage...
                                    </div>
                                ) : editMode ? (
                                    <textarea
                                        rows={22}
                                        value={briefContent}
                                        onChange={(e) => setBriefContent(e.target.value)}
                                        placeholder="Enter or polish policy brief markdown..."
                                        className="w-full flex-1 font-mono text-xs p-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50/50 resize-none leading-relaxed"
                                    />
                                ) : (
                                    <div className="flex-1 overflow-y-auto p-6 rounded-xl border border-gray-200 bg-white font-serif text-sm leading-relaxed prose prose-indigo max-w-none">
                                        {briefContent ? (
                                            <div className="whitespace-pre-wrap font-sans text-gray-800 space-y-3">
                                                {briefContent}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-400 font-sans">
                                                No synthesized brief available yet. The background ContextForge job is processing.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Action Bar Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={closeEditorialStudio}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Close Studio
                            </button>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    disabled={isSavingBrief}
                                    onClick={saveEditorialContent}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                                >
                                    {isSavingBrief ? 'Saving Polish...' : 'Save Editorial Revisions'}
                                </button>
                                {selectedManuscript.status !== 'published' && (
                                    <button
                                        type="button"
                                        disabled={isTransitioning}
                                        onClick={() => transitionStatus(selectedManuscript.id, 'published')}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                                    >
                                        Finalize & Publish to Library ✓
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function strWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}
