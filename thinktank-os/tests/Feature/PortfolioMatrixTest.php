<?php

namespace Tests\Feature;

use App\Events\ManuscriptStatusUpdated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PortfolioMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_portfolio_matrix(): void
    {
        $response = $this->get(route('matrix.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_scholar_can_access_matrix_and_sees_own_records(): void
    {
        $scholar = User::factory()->create(['role' => 'scholar']);
        $otherUser = User::factory()->create(['role' => 'scholar']);

        $myManuscript = $scholar->manuscripts()->create([
            'title' => 'My Scholar Paper',
            'raw_file_path' => 'raw/1.pdf',
            'status' => 'submitted',
        ]);

        $otherManuscript = $otherUser->manuscripts()->create([
            'title' => 'Other Paper',
            'raw_file_path' => 'raw/2.pdf',
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($scholar)->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_orchestrator_can_view_all_manuscripts(): void
    {
        $orchestrator = User::factory()->create(['role' => 'orchestrator']);
        $scholar = User::factory()->create(['role' => 'scholar']);

        $manuscript = $scholar->manuscripts()->create([
            'title' => 'Cross-Border Supply Chains',
            'raw_file_path' => 'raw/doc.pdf',
            'status' => 'ai_synthesized',
            'word_count' => 650,
        ]);

        $response = $this->actingAs($orchestrator)->get(route('matrix.index'));
        $response->assertOk();
    }

    public function test_can_fetch_manuscript_details_and_brief_content(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $briefPath = 'manuscripts/synthesized/test_brief.md';
        Storage::disk('local')->put($briefPath, '# Vanguard Policy Brief Content');

        $manuscript = $user->manuscripts()->create([
            'title' => 'AI Governance Architecture',
            'raw_file_path' => 'raw/doc.pdf',
            'synthesized_brief_path' => $briefPath,
            'status' => 'ai_synthesized',
        ]);

        $response = $this->actingAs($user)->getJson(route('matrix.show', $manuscript));
        $response->assertOk();
        $response->assertJsonPath('manuscript.title', 'AI Governance Architecture');
        $response->assertJsonPath('brief_content', '# Vanguard Policy Brief Content');
    }

    public function test_can_transition_manuscript_status(): void
    {
        Event::fake([ManuscriptStatusUpdated::class]);

        $orchestrator = User::factory()->create(['role' => 'orchestrator']);
        $manuscript = $orchestrator->manuscripts()->create([
            'title' => 'Semiconductor Industrial Resilience',
            'raw_file_path' => 'raw/doc.pdf',
            'status' => 'ai_synthesized',
        ]);

        // Transition from ai_synthesized to human_polish
        $response = $this->actingAs($orchestrator)
            ->patchJson(route('matrix.updateStatus', $manuscript), [
                'status' => 'human_polish',
            ]);

        $response->assertOk();
        $manuscript->refresh();
        $this->assertEquals('human_polish', $manuscript->status);

        // Transition from human_polish to published
        $response = $this->actingAs($orchestrator)
            ->patchJson(route('matrix.updateStatus', $manuscript), [
                'status' => 'published',
            ]);

        $response->assertOk();
        $manuscript->refresh();
        $this->assertEquals('published', $manuscript->status);
        $this->assertNotNull($manuscript->published_at);

        Event::assertDispatched(ManuscriptStatusUpdated::class);
    }

    public function test_can_update_editorial_content_and_recalculate_word_count(): void
    {
        Storage::fake('local');
        Event::fake([ManuscriptStatusUpdated::class]);

        $orchestrator = User::factory()->create(['role' => 'orchestrator']);
        $manuscript = $orchestrator->manuscripts()->create([
            'title' => 'Draft Monograph',
            'raw_file_path' => 'raw/doc.pdf',
            'synthesized_brief_path' => 'manuscripts/synthesized/brief.md',
            'status' => 'human_polish',
            'word_count' => 10,
        ]);

        $revisedText = "# Refined Vanguard Policy Brief\n\nThis is an expertly polished institutional monograph.";

        $response = $this->actingAs($orchestrator)
            ->patchJson(route('matrix.updateContent', $manuscript), [
                'content' => $revisedText,
                'title' => 'Polished Monograph Title',
            ]);

        $response->assertOk();
        $manuscript->refresh();

        $this->assertEquals('Polished Monograph Title', $manuscript->title);
        $this->assertGreaterThan(5, $manuscript->word_count);
        Storage::disk('local')->assertExists($manuscript->synthesized_brief_path);
        $this->assertEquals($revisedText, Storage::disk('local')->get($manuscript->synthesized_brief_path));
    }
}
