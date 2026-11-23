<?php

namespace App\Console\Commands;

use App\Models\Attestation;
use App\Services\Attestation\AttestationService;
use Illuminate\Console\Command;

class VerifyTimestamp extends Command
{
    protected $signature = 'attestations:verify-timestamp {public_id : The attestation public ID}';

    protected $description = 'Verify one attestation end to end: signature, trusted timestamp token, and issuance chain entry';

    public function handle(AttestationService $service): int
    {
        $attestation = Attestation::where('public_id', $this->argument('public_id'))->first();

        if (! $attestation) {
            $this->error('No attestation matches that public ID.');

            return self::FAILURE;
        }

        $this->line("Attestation: {$attestation->public_id} — {$attestation->subject_title}");
        $this->line('Status: '.$attestation->status);
        $this->line('Signature method: '.($attestation->signature_method ?: 'hmac-sha256 (legacy)'));
        $this->line('Key ID: '.($attestation->key_id ?: 'legacy-hmac (application key)'));

        $signatureOk = $service->verifySignature($attestation);
        $this->line($signatureOk ? 'Signature: VALID' : 'Signature: INVALID');

        if (! $attestation->timestamp_token) {
            $this->line('Trusted timestamp: NONE ON FILE (status: '.($attestation->timestamp_status ?: 'none').')');
        } else {
            $timestampOk = $service->verifyTimestamp($attestation);
            $this->line($timestampOk
                ? "Trusted timestamp: VALID — {$attestation->timestamp_source}, ".($attestation->timestamped_at?->format('c') ?? 'time unreadable')
                : 'Trusted timestamp: INVALID — the token does not verify against the signed payload.');
        }

        $entry = $attestation->issuanceLogEntry;

        if (! $entry) {
            $this->line('Issuance log: NO ENTRY (records issued before the chain existed have none).');
        } else {
            $this->line("Issuance log: seq {$entry->seq}, entry_hash {$entry->entry_hash}");
        }

        if (! $signatureOk) {
            return self::FAILURE;
        }

        if ($attestation->timestamp_token && ! $service->verifyTimestamp($attestation)) {
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
