<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VanguardLibraryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_access_vanguard_library_index(): void
    {
        $response = $this->get(route('library.index'));
        $response->assertOk();

        $homeResponse = $this->get(route('home'));
        $homeResponse->assertOk();
    }

    public function test_guest_can_read_published_policy_brief(): void
    {
        Storage::fake('local');
        $briefPath = 'manuscripts/synthesized/test_brief.md';
        Storage::disk('local')->put($briefPath, '# Vanguard Policy Brief Empirical Findings');

        $user = User::factory()->create();
        $manuscript = $user->manuscripts()->create([
            'title' => 'Resilient Industrial Supply Chains',
            'raw_file_path' => 'raw/doc.pdf',
            'synthesized_brief_path' => $briefPath,
            'status' => 'published',
            'published_at' => now(),
            'word_count' => 750,
        ]);

        $response = $this->get(route('briefs.show', $manuscript));
        $response->assertOk();
    }

    public function test_guest_cannot_read_unpublished_draft_brief(): void
    {
        $user = User::factory()->create();
        $manuscript = $user->manuscripts()->create([
            'title' => 'Unpublished Research Draft',
            'raw_file_path' => 'raw/draft.pdf',
            'status' => 'submitted',
        ]);

        $response = $this->get(route('briefs.show', $manuscript));
        $response->assertNotFound();
    }

    public function test_orchestrator_can_preview_unpublished_brief(): void
    {
        $orchestrator = User::factory()->create(['role' => 'orchestrator']);
        $scholar = User::factory()->create(['role' => 'scholar']);

        $manuscript = $scholar->manuscripts()->create([
            'title' => 'In-Review Monograph',
            'raw_file_path' => 'raw/review.pdf',
            'status' => 'human_polish',
        ]);

        $response = $this->actingAs($orchestrator)->get(route('briefs.show', $manuscript));
        $response->assertOk();
    }

    public function test_guest_can_access_institutional_thesis(): void
    {
        $response = $this->get(route('thesis.index'));
        $response->assertOk();
    }
}
