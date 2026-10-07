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
    public function show(Request $request, Manuscript $manuscript): Response
    {
        $user = $request->user();
        $canPreview = $user && ($user->canPolishManuscripts() || $user->id === $manuscript->user_id);

        if ($manuscript->status !== 'published' && ! $canPreview) {
            abort(404, 'Policy brief not found or not yet released for public reading.');
        }

        $manuscript->load('user:id,name,email');

        $content = '';
        if ($manuscript->synthesized_brief_path && Storage::disk('local')->exists($manuscript->synthesized_brief_path)) {
            $content = Storage::disk('local')->get($manuscript->synthesized_brief_path);
        }

        $related = Manuscript::with('user:id,name')
            ->published()
            ->where('id', '!=', $manuscript->id)
            ->latest('published_at')
            ->take(3)
            ->get();

        return Inertia::render('Library/Show', [
            'manuscript' => $manuscript,
            'content' => $content,
            'related' => $related,
            'isPreview' => $manuscript->status !== 'published',
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
