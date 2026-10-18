<?php

namespace App\Http\Controllers;

use App\Models\Manuscript;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class VanguardLibraryController extends Controller
{
    /**
     * Display the public Vanguard Library reading index.
     */
    public function index(Request $request): Response
    {
        $published = Manuscript::with('user:id,name,email')
            ->published()
            ->latest('published_at')
            ->get();

        return Inertia::render('Library/Index', [
            'briefs' => $published,
        ]);
    }

    /**
     * Display a published 4-page Vanguard Policy Brief in high-clarity typography.
     */
    public function show(Request $request, string $manuscript): Response
    {
        $manuscriptModel = null;

        // Support the curated flagship monograph fallback slug / ID
        if ($manuscript === 'featured-monograph-1') {
            $manuscriptModel = Manuscript::with('user:id,name,email')
                ->where('title', 'Autonomous Agentic Governance in High-Assurance Sectors')
                ->first();

            if (! $manuscriptModel) {
                $manuscriptModel = new Manuscript([
                    'title' => 'Autonomous Agentic Governance in High-Assurance Sectors',
                    'abstract' => 'A strategic framework addressing the latency gap between rapid algorithmic decision-making and human moral verification across clinical trial data pipelines and defense infrastructure.',
                    'status' => 'published',
                    'word_count' => 940,
                    'published_at' => '2026-09-15 00:00:00',
                ]);
                $manuscriptModel->id = 'featured-monograph-1';
                $defaultAuthor = \App\Models\User::where('name', "D'Vaughn House")->first()
                    ?? new \App\Models\User(['name' => "D'Vaughn House", 'email' => 'host@centersun21.com']);
                $manuscriptModel->setRelation('user', $defaultAuthor);
            }
        } elseif (\Illuminate\Support\Str::isUuid($manuscript)) {
            $manuscriptModel = Manuscript::with('user:id,name,email')->find($manuscript);
        }

        if (! $manuscriptModel) {
            abort(404, 'Policy brief not found or not yet released for public reading.');
        }

        $user = $request->user();
        $canPreview = $user && ($user->canPolishManuscripts() || ($manuscriptModel->user_id && $user->id === $manuscriptModel->user_id));

        if ($manuscriptModel->status !== 'published' && ! $canPreview) {
            abort(404, 'Policy brief not found or not yet released for public reading.');
        }

        $content = '';
        if ($manuscriptModel->synthesized_brief_path && Storage::disk('local')->exists($manuscriptModel->synthesized_brief_path)) {
            $content = Storage::disk('local')->get($manuscriptModel->synthesized_brief_path);
        }

        $related = Manuscript::with('user:id,name')
            ->published()
            ->when($manuscriptModel->exists, fn ($q) => $q->where('id', '!=', $manuscriptModel->id))
            ->latest('published_at')
            ->take(3)
            ->get();

        return Inertia::render('Library/Show', [
            'manuscript' => $manuscriptModel,
            'content' => $content,
            'related' => $related,
            'isPreview' => $manuscriptModel->status !== 'published',
        ]);
    }

    /**
     * Display foundational essays on the Power-Wisdom Gap and the Agentic Enterprise.
     */
    public function thesis(): Response
    {
        return Inertia::render('Library/Thesis');
    }
}
