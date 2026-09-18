<?php

namespace App\Http\Controllers;

use App\Jobs\SynthesizeManuscript;
use App\Models\Manuscript;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManuscriptController extends Controller
{
    /**
     * Display a listing of the scholar's submitted manuscripts.
     */
    public function index(Request $request): Response
    {
        $manuscripts = $request->user()
            ->manuscripts()
            ->latest()
            ->get();

        return Inertia::render('Manuscripts/Index', [
            'manuscripts' => $manuscripts,
        ]);
    }

    /**
     * Show the form/dropzone for submitting a new manuscript.
     */
    public function create(Request $request): Response
    {
        $activeManuscripts = $request->user()
            ->manuscripts()
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Manuscripts/Create', [
            'recentManuscripts' => $activeManuscripts,
            'submittedId' => $request->query('submitted_id'),
        ]);
    }

    /**
     * Store an ingested manuscript and dispatch background AI synthesis.
     * Enforces the George Foreman Grill mechanic: immediately returns 202 Accepted.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'abstract' => 'nullable|string',
            'manuscript_file' => 'required|file|mimes:pdf,docx,doc,txt|max:51200',
            'compliance_ethics' => 'accepted',
            'compliance_transparency' => 'accepted',
            'compliance_citations' => 'accepted',
        ], [
            'compliance_ethics.accepted' => 'You must certify compliance with research ethics and human subjects protocols.',
            'compliance_transparency.accepted' => 'You must confirm data transparency and methodology reproducibility.',
            'compliance_citations.accepted' => 'You must verify citation attribution and originality.',
            'manuscript_file.required' => 'Please upload your research manuscript (PDF, DOCX, or TXT up to 50MB).',
        ]);

        // Store raw manuscript file locally
        $storedPath = $request->file('manuscript_file')->store('manuscripts/raw', 'local');

        // Create manuscript record
        $manuscript = $request->user()->manuscripts()->create([
            'title' => $validated['title'],
            'abstract' => $validated['abstract'] ?? null,
            'raw_file_path' => $storedPath,
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'grant_amount' => 500.00,
            'status' => 'submitted',
        ]);

        // Dispatch synthesis to Redis queue
        SynthesizeManuscript::dispatch($manuscript);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Manuscript accepted for asynchronous synthesis (202 Accepted).',
                'manuscript' => $manuscript,
            ], 202);
        }

        return redirect()->route('manuscripts.create', ['submitted_id' => $manuscript->id])
            ->with('success', 'Manuscript received. ContextForge AI synthesis started in background.');
    }
}
