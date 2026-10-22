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
    public function index(): Response
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

        return Inertia::render('Attestations/Index', [
            'attestations' => $attestations,
            'stats' => $stats,
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

        // Plain axios callers (Portfolio Matrix) get JSON; Inertia form posts get a redirect.
        $wantsJson = $request->wantsJson() && ! $request->header('X-Inertia');

        try {
            $attestation = $service->issue($manuscript, $user);
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
