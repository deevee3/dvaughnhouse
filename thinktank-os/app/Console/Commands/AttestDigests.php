<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Attestation\DigestAttestationEmail;
use App\Services\Attestation\DigestAttestationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AttestDigests extends Command
{
    protected $signature = 'attestations:digest {--edition= : Only process one edition date (YYYY-MM-DD)} {--force : Re-check rows waiting on a human} {--no-email : Skip the system-sent email}';

    protected $description = 'Attest released weekly-digest editions: build rows, run the six gates, sign, log, and email (SOP v1.1)';

    public function handle(DigestAttestationService $digests): int
    {
        $verifier = User::where('role', 'orchestrator')->first();

        if (! $verifier || ! $verifier->canIssueAttestations()) {
            $this->error('No orchestrator issuer account exists; nothing was signed.');

            return self::FAILURE;
        }

        $rows = $digests->listQueue();
        $edition = (string) $this->option('edition');

        if ($edition !== '') {
            $rows = array_values(array_filter(
                $rows,
                fn (array $row) => ($row['edition_date'] ?? '') === $edition
            ));
        }

        if ($rows === []) {
            $this->info('No digest rows queued.');

            return self::SUCCESS;
        }

        $outcomes = [];

        foreach ($rows as $row) {
            $outcome = $digests->processRow($row, $verifier, (bool) $this->option('force'));
            $outcomes[] = $outcome;
            $this->line($this->describe($outcome));
        }

        if (! $this->option('no-email')) {
            $this->sendRunEmail($outcomes);
        }

        return self::SUCCESS;
    }

    private function describe(array $outcome): string
    {
        $edition = $outcome['edition_date'] ?? 'unknown';

        return match ($outcome['outcome']) {
            'issued' => "[{$edition}] ISSUED {$outcome['public_id']} (gates 1-6 passed)",
            'duplicate' => "[{$edition}] DUPLICATE — already attested as {$outcome['public_id']}; no new issuance",
            'held' => "[{$edition}] HELD gate {$outcome['failed_gate']}: {$outcome['reason']}",
            'waiting' => "[{$edition}] WAITING ON HUMAN: {$outcome['reason']}",
            default => "[{$edition}] {$outcome['outcome']}: ".($outcome['reason'] ?? ''),
        };
    }

    /**
     * Build the run email, always write the payload to the outbox file,
     * then attempt delivery through the configured mail driver. A send
     * failure must never fail the run or roll back issuances: the
     * payload on disk is the deliverable record.
     */
    private function sendRunEmail(array $outcomes): void
    {
        $payload = DigestAttestationEmail::forRun($outcomes, now()->format('c'), (string) config('app.url'));

        $driver = (string) config('mail.default', 'log');
        $attemptedAt = now()->format('c');
        $delivered = false;
        $deliveryNote = '';

        try {
            Mail::raw($payload['body'], function ($message) use ($payload) {
                $message->to($payload['to'])->subject($payload['subject']);
            });
            $delivered = in_array($driver, ['smtp', 'ses', 'mailgun', 'postmark', 'resend', 'sendmail'], true);
            $deliveryNote = $delivered
                ? "sent via the {$driver} driver"
                : "handed to the {$driver} driver (no real delivery; configure MAIL_* for SMTP delivery)";
        } catch (Throwable $e) {
            $deliveryNote = 'send failed: '.$e->getMessage();
        }

        $record = $payload + [
            'mail_driver' => $driver,
            'delivered' => $delivered,
            'delivery_note' => $deliveryNote,
            'attempted_at' => $attemptedAt,
        ];

        $path = 'digest-attestation/outbox/'.now()->format('Y-m-d_His').'_run.json';
        Storage::disk('local')->put($path, json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");

        $this->line('Email to '.$payload['to'].': '.$deliveryNote.'. Payload written to storage/app/private/'.$path.'.');
    }
}
