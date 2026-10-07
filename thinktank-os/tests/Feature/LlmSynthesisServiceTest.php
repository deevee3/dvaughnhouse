<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ContextForge\LlmSynthesisService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LlmSynthesisServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_fake_driver_synthesizes_structured_vanguard_brief(): void
    {
        Config::set('services.contextforge.driver', 'fake');

        $user = User::factory()->create(['name' => 'Dr. Eleanor Vance']);
        $manuscript = $user->manuscripts()->create([
            'title' => 'Decentralized Microgrid Architectures',
            'abstract' => 'Analysis of regional energy distribution resilience.',
            'raw_file_path' => 'manuscripts/raw/fake_manuscript.txt',
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'status' => 'submitted',
        ]);

        $service = app(LlmSynthesisService::class);
        $brief = $service->synthesize($manuscript, 'Raw manuscript text detailing microgrid topology.');

        $this->assertStringContainsString('# THE GLENRIDE INSTITUTE: VANGUARD POLICY BRIEF', $brief);
        $this->assertStringContainsString('Decentralized Microgrid Architectures', $brief);
        $this->assertStringContainsString('Dr. Eleanor Vance', $brief);
        $this->assertStringContainsString('1. Executive Thesis & Problem Formulation', $brief);
        $this->assertStringContainsString('2. De-Jargonized Empirical Findings', $brief);
        $this->assertStringContainsString('3. Actionable Policy Recommendations', $brief);
        $this->assertStringContainsString('4. Economic & Strategic Impact Projection', $brief);
    }

    public function test_openai_driver_calls_chat_completions_endpoint(): void
    {
        Config::set('services.contextforge.driver', 'openai');
        Config::set('services.contextforge.openai_api_key', 'test-openai-key');
        Config::set('services.contextforge.openai_model', 'gpt-4o');

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => "# THE GLENRIDE INSTITUTE: VANGUARD POLICY BRIEF\n\nSynthesized via OpenAI GPT-4o.",
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $manuscript = $user->manuscripts()->create([
            'title' => 'Quantum Algorithmic Risk Models',
            'raw_file_path' => 'test.pdf',
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'status' => 'submitted',
        ]);

        $service = app(LlmSynthesisService::class);
        $brief = $service->synthesize($manuscript, 'Quantum risk equations.');

        $this->assertStringContainsString('Synthesized via OpenAI GPT-4o', $brief);
    }

    public function test_driver_fallback_to_fake_when_api_fails(): void
    {
        Config::set('services.contextforge.driver', 'openai');
        Config::set('services.contextforge.openai_api_key', 'test-openai-key');

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response(['error' => 'Rate limit exceeded'], 429),
        ]);

        $user = User::factory()->create();
        $manuscript = $user->manuscripts()->create([
            'title' => 'Supply Chain Diagnostics',
            'raw_file_path' => 'test.pdf',
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'status' => 'submitted',
        ]);

        $service = app(LlmSynthesisService::class);
        $brief = $service->synthesize($manuscript, 'Content');

        // Should gracefully fallback to synthetic brief without crashing
        $this->assertStringContainsString('# THE GLENRIDE INSTITUTE: VANGUARD POLICY BRIEF', $brief);
        $this->assertStringContainsString('Supply Chain Diagnostics', $brief);
    }

    public function test_lmstudio_driver_calls_local_endpoint(): void
    {
        Config::set('services.contextforge.driver', 'lmstudio');
        Config::set('services.contextforge.lmstudio_base_url', 'http://127.0.0.1:1234/v1');
        Config::set('services.contextforge.lmstudio_model', 'mistral-7b-instruct');

        Http::fake([
            'http://127.0.0.1:1234/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => "# THE GLENRIDE INSTITUTE: VANGUARD POLICY BRIEF\n\nSynthesized locally via LM Studio.",
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $manuscript = $user->manuscripts()->create([
            'title' => 'Sovereign Edge Computing for Regulated Entities',
            'raw_file_path' => 'test.pdf',
            'compliance_ethics_verified' => true,
            'compliance_transparency_verified' => true,
            'compliance_citations_verified' => true,
            'status' => 'submitted',
        ]);

        $service = app(LlmSynthesisService::class);
        $brief = $service->synthesize($manuscript, 'Edge computing architecture notes.');

        $this->assertStringContainsString('Synthesized locally via LM Studio', $brief);
    }
}
