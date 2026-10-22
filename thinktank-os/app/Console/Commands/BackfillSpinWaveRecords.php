<?php

namespace App\Console\Commands;

use App\Models\Manuscript;
use App\Services\SpinWave\RecordService;
use Illuminate\Console\Command;

class BackfillSpinWaveRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'spinwave:backfill-records';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create v1 SpinWave records for manuscripts already published with no record';

    /**
     * Execute the console command.
     *
     * Backfills the permanent record for briefs published before the
     * publish-time recording shipped. Each snapshot keeps the
     * manuscript's existing published_at, and the record hash uses the
     * same computation as attestation subject hashes — so a backfilled
     * record for an attested brief carries the attestation's
     * subject_hash when the content is unchanged.
     */
    public function handle(RecordService $records): int
    {
        $manuscripts = Manuscript::published()
            ->doesntHave('records')
            ->with('user:id,name')
            ->get();

        if ($manuscripts->isEmpty()) {
            $this->info('No published manuscripts are missing a SpinWave record.');

            return self::SUCCESS;
        }

        foreach ($manuscripts as $manuscript) {
            $record = $records->recordPublication($manuscript);

            $this->info("Recorded v{$record->version} for \"{$manuscript->title}\" — {$record->record_hash}");
        }

        $this->info("Backfilled {$manuscripts->count()} SpinWave record(s).");

        return self::SUCCESS;
    }
}
