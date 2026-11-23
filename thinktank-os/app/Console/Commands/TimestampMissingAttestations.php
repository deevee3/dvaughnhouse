<?php

namespace App\Console\Commands;

use App\Models\Attestation;
use App\Services\Attestation\AttestationService;
use App\Services\Attestation\TrustedTimestampService;
use Illuminate\Console\Command;

class TimestampMissingAttestations extends Command
{
    protected $signature = 'attestations:timestamp-missing';

    protected $description = 'Retry independent RFC 3161 timestamping for Ed25519 attestations whose timestamp request failed or is still pending';

    public function handle(TrustedTimestampService $timestamps, AttestationService $service): int
    {
        if (! $timestamps->enabled()) {
            $this->info('Trusted timestamping is disabled by configuration. Nothing to retry.');

            return self::SUCCESS;
        }

        $pending = Attestation::query()
            ->where('signature_method', 'ed25519')
            ->whereNull('timestamp_token')
            ->whereIn('timestamp_status', ['pending', 'failed'])
            ->orderBy('issued_at')
            ->get();

        if ($pending->isEmpty()) {
            $this->info('No attestations are waiting on a timestamp.');

            return self::SUCCESS;
        }

        $stamped = 0;

        foreach ($pending as $attestation) {
            $result = $timestamps->requestFor($service->signedPayload($attestation));

            if ($result === null) {
                $this->warn("{$attestation->public_id}: still unreachable — {$timestamps->lastError()}");

                continue;
            }

            $attestation->update([
                'timestamp_token' => $result['token'],
                'timestamped_at' => $result['time'],
                'timestamp_source' => $result['source'],
                'timestamp_status' => 'timestamped',
            ]);

            $stamped++;
            $this->info("{$attestation->public_id}: timestamped ({$result['source']}).");
        }

        $this->info("Done: {$stamped} of {$pending->count()} timestamped.");

        return self::SUCCESS;
    }
}
