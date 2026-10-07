<?php

namespace App\Http\Controllers;

use App\Events\ManuscriptStatusUpdated;
use App\Models\Manuscript;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioMatrixController extends Controller
{
    /**
     * Display the Portfolio Matrix Kanban Dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOrchestrator = $user->canPolishManuscripts();

        // Orchestrators see all institutional manuscripts; scholars see their own
        $query = Manuscript::with('user:id,name,email')
            ->latest();

        if (! $isOrchestrator) {
            $query->where('user_id', $user->id);
        }

        $allManuscripts = $query->get();

        // Organize manuscripts into the four institutional Kanban columns
        $columns = [
            'submitted' => $allManuscripts->where('status', 'submitted')->values(),
            'ai_synthesized' => $allManuscripts->where('status', 'ai_synthesized')->values(),
            'human_polish' => $allManuscripts->where('status', 'human_polish')->values(),
            'published' => $allManuscripts->where('status', 'published')->values(),
        ];

        // Compute institutional portfolio metrics
        $stats = [
            'total_manuscripts' => $allManuscripts->count(),
            'total_grants_allocated' => (float) $allManuscripts->sum('grant_amount'),
            'total_words_synthesized' => (int) $allManuscripts->sum('word_count'),
            'published_count' => $columns['published']->count(),
            'in_review_count' => $columns['human_polish']->count(),
        ];

        return Inertia::render('Portfolio/Matrix', [
            'columns' => $columns,
            'stats' => $stats,
            'isOrchestrator' => $isOrchestrator,
        ]);
    }

    /**
     * Fetch full details of a specific manuscript, including brief content.
     */
    public function show(Manuscript $manuscript): JsonResponse
    {
        $manuscript->load('user:id,name,email');

        $briefContent = '';
        if ($manuscript->synthesized_brief_path && Storage::disk('local')->exists($manuscript->synthesized_brief_path)) {
            $briefContent = Storage::disk('local')->get($manuscript->synthesized_brief_path);
        }

        return response()->json([
            'manuscript' => $manuscript,
            'brief_content' => $briefContent,
        ]);
    }

    /**
     * Transition manuscript status across Kanban columns.
     */
    public function updateStatus(Request $request, Manuscript $manuscript): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:submitted,ai_synthesized,human_polish,published',
        ]);

        $newStatus = $validated['status'];
        $updateData = ['status' => $newStatus];

        if ($newStatus === 'published' && ! $manuscript->published_at) {
            $updateData['published_at'] = now();
        }

        $manuscript->update($updateData);

        // Broadcast real-time transition event
        try {
            broadcast(new ManuscriptStatusUpdated($manuscript->fresh('user')));
        } catch (\Throwable $e) {
            Log::warning('WebSocket broadcast skipped on status update: '.$e->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "Manuscript transitioned to {$newStatus}.",
                'manuscript' => $manuscript->fresh('user'),
            ]);
        }

        return back()->with('success', "Manuscript transitioned to {$newStatus}.");
    }

    /**
     * Save human editorial revisions to the synthesized policy brief during Human Polish.
     */
    public function updateContent(Request $request, Manuscript $manuscript): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'title' => 'nullable|string|max:500',
        ]);

        $content = $validated['content'];
        $path = $manuscript->synthesized_brief_path;

        if (! $path) {
            $path = "manuscripts/synthesized/{$manuscript->id}_vanguard_brief.md";
        }

        Storage::disk('local')->put($path, $content);
        $wordCount = str_word_count(strip_tags($content));

        $updateData = [
            'synthesized_brief_path' => $path,
            'word_count' => $wordCount,
        ];

        if (! empty($validated['title'])) {
            $updateData['title'] = $validated['title'];
        }

        $manuscript->update($updateData);

        // Broadcast real-time content update
        try {
            broadcast(new ManuscriptStatusUpdated($manuscript->fresh('user')));
        } catch (\Throwable $e) {
            Log::warning('WebSocket broadcast skipped on content update: '.$e->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Editorial revisions saved successfully.',
                'manuscript' => $manuscript->fresh('user'),
                'brief_content' => $content,
            ]);
        }

        return back()->with('success', 'Editorial revisions saved successfully.');
    }
}
