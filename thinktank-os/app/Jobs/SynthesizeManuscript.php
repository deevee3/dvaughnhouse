<?php

namespace App\Jobs;

use App\Events\ManuscriptStatusUpdated;
use App\Events\ManuscriptSynthesized;
use App\Models\Manuscript;
use App\Services\ContextForge\LlmSynthesisService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SynthesizeManuscript implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(public Manuscript $manuscript)
    {
        $this->onQueue('synthesis');
    }

    /**
     * Execute the job.
     */
    public function handle(?LlmSynthesisService $llmService = null): void
    {
        $llmService = $llmService ?? app(LlmSynthesisService::class);
        Log::info("ContextForge: Starting synthesis for manuscript {$this->manuscript->id} ('{$this->manuscript->title}')");

        // Read raw file content if available in storage, or fallback to metadata
        $rawContent = '';
        if (Storage::disk('local')->exists($this->manuscript->raw_file_path)) {
            $rawContent = Storage::disk('local')->get($this->manuscript->raw_file_path);
        }

        // ContextForge Agentic Synthesis Pipeline:
        // Distill raw academic prose into a structured 4-page Vanguard Policy Brief
        $briefContent = $llmService->synthesize($this->manuscript, $rawContent);

        // Save synthesized brief to storage
        $synthesizedPath = "manuscripts/synthesized/{$this->manuscript->id}_vanguard_brief.md";
        Storage::disk('local')->put($synthesizedPath, $briefContent);

        $wordCount = str_word_count(strip_tags($briefContent));

        // Update manuscript status and artifact path
        $this->manuscript->update([
            'synthesized_brief_path' => $synthesizedPath,
            'status' => 'ai_synthesized',
            'word_count' => $wordCount,
        ]);

        Log::info("ContextForge: Synthesis completed for manuscript {$this->manuscript->id}. Status updated to ai_synthesized.");

        // Broadcast status update in real-time over WebSocket channel
        try {
            ManuscriptSynthesized::dispatch($this->manuscript->fresh());
            broadcast(new ManuscriptStatusUpdated($this->manuscript->fresh()));
        } catch (\Throwable $e) {
            Log::warning('WebSocket broadcast skipped: '.$e->getMessage());
        }
    }
}
