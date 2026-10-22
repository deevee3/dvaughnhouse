<?php

namespace App\Http\Controllers;

use App\Models\Attestation;
use App\Models\Manuscript;
use App\Services\Attestation\AttestationService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AttestationController extends Controller
{
    /**
     * Public registry of Glenride attestations.
     */
    public function index(Request $request): Response
    {
        $attestations = Attestation::with('verifier:id,name')
            ->latest('issued_at')
            ->take(50)
            ->get();

        $stats = [
            'issued' => Attestation::where('status', 'issued')->count(),
            'challenged' => Attestation::where('status', 'challenged')->count(),
            'total' => Attestation::count(),
        ];

        $user = $request->user();

        return Inertia::render('Attestations/Index', [
            'attestations' => $attestations,
            'stats' => $stats,
            'canIssue' => $user ? $user->canIssueAttestations() : false,
        ]);
    }

    /**
     * Manual attestation entry form (issuers only).
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        if (! $user || ! $user->canIssueAttestations()) {
            abort(403, 'Only Glenride editors and orchestrators can issue attestations.');
        }

        $publishedManuscripts = Manuscript::where('status', 'published')
            ->latest('published_at')
            ->get(['id', 'title'])
            ->map(fn ($m) => ['id' => $m->id, 'title' => $m->title])
            ->values();

        return Inertia::render('Attestations/Create', [
            'publishedManuscripts' => $publishedManuscripts,
        ]);
    }

    /**
     * Public verification page for a single attestation.
     */
    public function show(Request $request, string $key, AttestationService $service): Response
    {
        $attestation = Attestation::where('public_id', $key)->first();

        // Only query the uuid primary key when the key is a valid uuid —
        // a public_id lookup against a uuid column errors on Postgres.
        if (! $attestation && Str::isUuid($key)) {
            $attestation = Attestation::find($key);
        }

        if (! $attestation) {
            abort(404, 'Attestation not found.');
        }

        $attestation->load([
            'verifier:id,name',
            'challenges.challenger:id,name',
        ]);

        $user = $request->user();

        return Inertia::render('Attestations/Show', [
            'attestation' => $attestation,
            'signature_valid' => $service->verifySignature($attestation),
            'canIssue' => $user ? $user->canIssueAttestations() : false,
        ]);
    }

    /**
     * Look up an attestation by public ID or subject hash and redirect to it.
     */
    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255',
        ]);

        $code = trim($validated['code']);

        $attestation = Attestation::where('public_id', $code)
            ->orWhere('subject_hash', $code)
            ->first();

        if (! $attestation && Str::isUuid($code)) {
            $attestation = Attestation::find($code);
        }

        if (! $attestation) {
            return back()->withErrors([
                'code' => 'No attestation matches that code. Check the public ID or subject hash and try again.',
            ]);
        }

        return redirect()->route('attestations.show', $attestation->public_id);
    }

    /**
     * Issue an attestation for a manuscript (editor/orchestrator roles only).
     */
    public function store(Request $request, Manuscript $manuscript, AttestationService $service): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->canIssueAttestations()) {
            abort(403, 'Only Glenride editors and orchestrators can issue attestations.');
        }

        $validated = $request->validate([
            'claim' => 'nullable|string|max:5000',
            'evidence_notes' => 'nullable|string|max:5000',
            'evidence_urls' => 'nullable|array|max:20',
            'evidence_urls.*' => 'url|max:2048',
        ]);

        // Plain axios callers (Portfolio Matrix) get JSON; Inertia form posts get a redirect.
        $wantsJson = $request->wantsJson() && ! $request->header('X-Inertia');

        $evidenceExtra = [];
        if (! empty($validated['evidence_notes']) || ! empty($validated['evidence_urls'])) {
            $evidenceExtra = [
                'notes' => $validated['evidence_notes'] ?? null,
                'urls' => $validated['evidence_urls'] ?? [],
            ];
        }

        try {
            $attestation = $service->issue($manuscript, $user, $validated['claim'] ?? null, $evidenceExtra);
        } catch (DomainException $e) {
            if ($wantsJson) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return back()->with('error', $e->getMessage());
        }

        if ($wantsJson) {
            return response()->json([
                'message' => "Attestation issued: {$attestation->public_id}",
                'attestation' => $attestation->load('verifier:id,name'),
            ]);
        }

        return back()->with('success', "Attestation issued: {$attestation->public_id}");
    }

    /**
     * Issue an attestation for a manually entered subject (issuers only).
     * The subject does not need to exist in the manuscript pipeline.
     */
    public function storeManual(Request $request, AttestationService $service): RedirectResponse
    {
        $user = $request->user();

        if (! $user || ! $user->canIssueAttestations()) {
            abort(403, 'Only Glenride editors and orchestrators can issue attestations.');
        }

        $validated = $request->validate([
            'subject_title' => 'required|string|max:500',
            'claim' => 'required|string|min:10',
            'subject_kind' => 'required|string|in:manuscript,report,dataset,external_work,other',
            'evidence_notes' => 'nullable|string|max:5000',
            'evidence_urls' => 'nullable|array|max:20',
            'evidence_urls.*' => 'url|max:2048',
            'subject_hash_override' => 'nullable|string|regex:/^[a-fA-F0-9]{64}$/',
        ]);

        try {
            $attestation = $service->issueManual([
                'subject_title' => $validated['subject_title'],
                'claim' => $validated['claim'],
                'subject_kind' => $validated['subject_kind'],
                'evidence_notes' => $validated['evidence_notes'] ?? null,
                'evidence_urls' => $validated['evidence_urls'] ?? [],
                'subject_hash_override' => $validated['subject_hash_override'] ?? null,
            ], $user);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }

        return redirect()->route('attestations.show', $attestation->public_id)
            ->with('success', "Attestation issued: {$attestation->public_id}");
    }

    /**
     * Record an on-chain anchor for an attestation (issuers only).
     * The anchoring transaction itself is performed via Pearls on Base;
     * this records the resulting tx / contract / chain on the record.
     */
    public function recordAnchor(Request $request, Attestation $attestation, AttestationService $service): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->canIssueAttestations()) {
            abort(403, 'Only Glenride editors and orchestrators can record anchors.');
        }

        $validated = $request->validate([
            'tx' => 'required|string|regex:/^0x[0-9a-fA-F]{64}$/',
            'contract' => 'required|string|regex:/^0x[0-9a-fA-F]{40}$/',
            'chain' => 'nullable|string|in:base,base-sepolia',
            'platform' => 'nullable|string|max:50',
        ]);

        $service->recordAnchor(
            $attestation,
            $validated['tx'],
            $validated['contract'],
            $validated['chain'] ?? 'base',
            $validated['platform'] ?? 'pearls'
        );

        $wantsJson = $request->wantsJson() && ! $request->header('X-Inertia');

        if ($wantsJson) {
            return response()->json([
                'message' => "Anchor recorded for {$attestation->public_id}",
                'attestation' => $attestation->fresh()->load('verifier:id,name'),
            ]);
        }

        return back()->with('success', "Anchor recorded for {$attestation->public_id}");
    }

    /**
     * Challenge an attestation. Any authenticated user may raise a challenge.
     */
    public function challenge(Request $request, Attestation $attestation): RedirectResponse
    {
        if (! $attestation->isActive()) {
            return back()->with('error', 'Only an attestation in force can be challenged.');
        }

        $validated = $request->validate([
            'grounds' => 'required|string|min:10',
        ]);

        $attestation->challenges()->create([
            'challenger_id' => $request->user()->id,
            'grounds' => $validated['grounds'],
            'status' => 'open',
        ]);

        if ($attestation->status === 'issued') {
            $attestation->update(['status' => 'challenged']);
        }

        return back()->with('success', 'Challenge recorded. This attestation is now marked as challenged.');
    }

    /**
     * Revoke an attestation (editor/orchestrator roles only).
     */
    public function revoke(Request $request, Attestation $attestation, AttestationService $service): RedirectResponse
    {
        $user = $request->user();

        if (! $user || ! $user->canIssueAttestations()) {
            abort(403, 'Only Glenride editors and orchestrators can revoke attestations.');
        }

        if (! $attestation->isActive()) {
            return back()->with('error', 'This attestation is already revoked.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:255',
        ]);

        $service->revoke($attestation, $validated['reason']);

        return back()->with('success', "Attestation {$attestation->public_id} revoked.");
    }
}
