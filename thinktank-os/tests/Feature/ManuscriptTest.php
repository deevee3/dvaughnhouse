<?php

namespace Tests\Feature;

use App\Models\Manuscript;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManuscriptTest extends TestCase
{
    use RefreshDatabase;

    public function test_scholar_can_generate_sanctum_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->assertNotEmpty($token);
        $this->assertCount(1, $user->tokens);
    }

    public function test_scholar_can_submit_manuscript_with_compliance(): void
    {
        $user = User::factory()->create();

        $manuscript = $user->manuscripts()->create([
            'title' => 'The Power-Wisdom Gap in Agentic Systems',
            'abstract' => 'An analysis of institutional stewardship and algorithmic velocity.',
            'raw_file_path' => 'manuscripts/power_wisdom.pdf',
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'grant_amount' => 500.00,
            'status' => 'submitted',
        ]);

        $this->assertDatabaseHas('manuscripts', [
            'id' => $manuscript->id,
            'title' => 'The Power-Wisdom Gap in Agentic Systems',
            'status' => 'submitted',
        ]);

        $this->assertTrue($manuscript->isComplianceVerified());
        $this->assertEquals($user->id, $manuscript->user->id);
    }

    public function test_manuscript_scopes(): void
    {
        $user = User::factory()->create();

        $submitted = $user->manuscripts()->create([
            'title' => 'Draft Policy Brief',
            'raw_file_path' => 'draft.pdf',
            'status' => 'submitted',
        ]);

        $published = $user->manuscripts()->create([
            'title' => 'Final Policy Brief',
            'raw_file_path' => 'final.pdf',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->assertCount(1, Manuscript::pendingSynthesis()->get());
        $this->assertCount(1, Manuscript::published()->get());
        $this->assertEquals($submitted->id, Manuscript::pendingSynthesis()->first()->id);
        $this->assertEquals($published->id, Manuscript::published()->first()->id);
    }
}
