<?php

namespace Tests\Feature;

use App\Events\ManuscriptStatusUpdated;
use App\Jobs\SynthesizeManuscript;
use App\Models\Manuscript;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ManuscriptIntakeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_manuscript_dropzone(): void
    {
        $response = $this->get(route('manuscripts.create'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_scholar_can_access_dropzone(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('manuscripts.create'));
        $response->assertOk();
    }

    public function test_intake_requires_all_compliance_checklists(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('manuscripts.store'), [
            'title' => 'Test Manuscript Title',
            'manuscript_file' => UploadedFile::fake()->create('manuscript.pdf', 1024, 'application/pdf'),
            'compliance_ethics' => false,
            'compliance_transparency' => false,
            'compliance_citations' => false,
        ]);

        $response->assertSessionHasErrors([
            'compliance_ethics',
            'compliance_transparency',
            'compliance_citations',
        ]);
        $this->assertDatabaseCount('manuscripts', 0);
    }

    public function test_successful_intake_dispatches_synthesize_job_and_returns_202(): void
    {
        Storage::fake('local');
        Queue::fake();
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('manuscripts.store'), [
                'title' => 'Strategic Supply Chains in Advanced Materials',
                'abstract' => 'Comprehensive empirical survey across resilient defense industrial bases.',
                'manuscript_file' => UploadedFile::fake()->create('raw_manuscript.pdf', 2048, 'application/pdf'),
                'compliance_ethics' => true,
                'compliance_transparency' => true,
                'compliance_citations' => true,
            ]);

        $response->assertStatus(202);
        $response->assertJsonPath('manuscript.title', 'Strategic Supply Chains in Advanced Materials');
        $response->assertJsonPath('manuscript.status', 'submitted');

        $this->assertDatabaseHas('manuscripts', [
            'title' => 'Strategic Supply Chains in Advanced Materials',
            'status' => 'submitted',
            'user_id' => $user->id,
        ]);

        Queue::assertPushed(SynthesizeManuscript::class, function ($job) {
            return $job->queue === 'synthesis';
        });
    }

    public function test_synthesize_manuscript_job_executes_and_broadcasts_event(): void
    {
        Storage::fake('local');
        Event::fake([ManuscriptStatusUpdated::class]);

        $user = User::factory()->create();
        $rawPath = 'manuscripts/raw/test_doc.pdf';
        Storage::disk('local')->put($rawPath, 'Sample academic paper content with complex jargon.');

        $manuscript = $user->manuscripts()->create([
            'title' => 'Autonomous Agentic Governance in High-Assurance Sectors',
            'raw_file_path' => $rawPath,
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'status' => 'submitted',
        ]);

        // Execute the job synchronously
        $job = new SynthesizeManuscript($manuscript);
        $job->handle();

        $manuscript->refresh();

        $this->assertEquals('ai_synthesized', $manuscript->status);
        $this->assertNotEmpty($manuscript->synthesized_brief_path);
        $this->assertGreaterThan(50, $manuscript->word_count);
        Storage::disk('local')->assertExists($manuscript->synthesized_brief_path);

        Event::assertDispatched(ManuscriptStatusUpdated::class, function ($event) use ($manuscript) {
            return $event->manuscript->id === $manuscript->id
                && $event->manuscript->status === 'ai_synthesized';
        });
    }
}
