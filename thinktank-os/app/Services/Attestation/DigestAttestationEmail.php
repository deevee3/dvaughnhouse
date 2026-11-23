<?php

namespace App\Services\Attestation;

/**
 * Builds the system-sent digest attestation email (PRD §6.6 surfacing).
 *
 * Pure string building — no mail transport here — so the content is
 * testable and the payload can be written to the outbox log when no
 * working mail path exists. The scheduled command sends it; the
 * one-click button path does not (the human is present).
 */
class DigestAttestationEmail
{
    public const RECIPIENT_FALLBACK = 'dvaughnhouse@gmail.com';

    public static function recipient(): string
    {
        return (string) (env('DIGEST_ATTESTATION_NOTIFY_EMAIL') ?: self::RECIPIENT_FALLBACK);
    }

    /**
     * @param  array<int, array>  $outcomes  processRow() outcome arrays
     */
    public static function forRun(array $outcomes, string $runAt, string $baseUrl): array
    {
        $issued = array_values(array_filter($outcomes, fn ($o) => ($o['outcome'] ?? '') === 'issued'));
        $held = array_values(array_filter($outcomes, fn ($o) => ($o['outcome'] ?? '') === 'held'));
        $duplicates = array_values(array_filter($outcomes, fn ($o) => ($o['outcome'] ?? '') === 'duplicate'));
        $waiting = array_values(array_filter($outcomes, fn ($o) => ($o['outcome'] ?? '') === 'waiting'));

        $baseUrl = rtrim($baseUrl, '/');

        if (! empty($held)) {
            $first = $held[0];
            $subject = 'URGENT: Digest attestation HELD — gate '.$first['failed_gate'].' failed for '.$first['edition_date'];
        } elseif (! empty($issued)) {
            $subject = 'Digest attestation issued — '.count($issued).' edition(s), '.substr($runAt, 0, 10);
        } else {
            $subject = 'Digest attestation run — no new issuances, '.substr($runAt, 0, 10);
        }

        $lines = [];
        $lines[] = 'Glenride Witness — automated digest attestation run';
        $lines[] = 'Run at: '.$runAt;
        $lines[] = 'Issued: '.count($issued).' · Held: '.count($held).' · Already attested: '.count($duplicates).' · Waiting on a human: '.count($waiting);
        $lines[] = '';

        foreach ($issued as $o) {
            $figures = $o['figures'] ?? [];
            $lines[] = 'ISSUED: '.($o['subject_title'] ?? $o['edition_date']);
            $lines[] = '  Edition date: '.$o['edition_date'];
            $lines[] = '  Figures: ASHP '.($figures['ashp'] ?? '?').' live bulletins; FDA '.($figures['fda_in_shortage'] ?? '?').' of '.($figures['fda_total'] ?? '?').' entries in shortage; retrieved '.($figures['retrieved_on'] ?? '?');
            $lines[] = '  Gates passed: '.implode(', ', $o['gates_passed'] ?? [1, 2, 3, 4, 5, 6]).' of 6';
            $lines[] = '  Human principal: '.IssuanceChainService::HUMAN_PRINCIPAL.'. Glenride is the issuer of record, acting through him. The system executed the signature as his instrument; it is never the attestor.';
            $lines[] = '  Authorization: '.IssuanceChainService::AUTHORIZATION;
            $lines[] = '  Public ID: '.$o['public_id'];
            $lines[] = '  Registry: '.$baseUrl.'/attestations';
            $lines[] = '  Verify: '.$baseUrl.'/attestations/'.$o['public_id'];
            if (! empty($o['signature_method']) || ! empty($o['key_id'])) {
                $lines[] = '  Signature: '.($o['signature_method'] ?? 'hmac-sha256').' under key '.($o['key_id'] ?? 'legacy-hmac (application key)').'.';
            }
            if (! empty($o['timestamp_status'])) {
                $lines[] = '  Trusted timestamp: '.($o['timestamp_status'] === 'timestamped' ? 'stamped by '.($o['timestamp_source'] ?? 'the timestamp authority') : 'not yet stamped ('.$o['timestamp_status'].') — the retry command will stamp it. The issue time in the record is the system clock until then.');
            }
            $lines[] = '';
        }

        foreach ($held as $o) {
            $lines[] = 'HELD: '.($o['subject_title'] ?? $o['edition_date']).' — NOT SIGNED.';
            $lines[] = '  Edition date: '.$o['edition_date'];
            $lines[] = '  Failed gate: '.$o['failed_gate'].' — '.$o['reason'];
            $lines[] = '  Consecutive failures: '.($o['consecutive_failures'] ?? 1).' of '.DigestAttestationService::MAX_CONSECUTIVE_FAILURES.((($o['waiting_on_human'] ?? false)) ? ' — now waiting on a human.' : '');
            $lines[] = '  What unblocks it: '.self::unblocks((int) $o['failed_gate']);
            $lines[] = '';
        }

        foreach ($duplicates as $o) {
            $lines[] = 'ALREADY ATTESTED: '.$o['edition_date'].' — existing attestation '.$o['public_id'].'. No new attestation, no new sequence number.';
            $lines[] = '';
        }

        foreach ($waiting as $o) {
            $lines[] = 'WAITING ON A HUMAN: '.$o['edition_date'].' — '.$o['reason'];
            $lines[] = '';
        }

        $lines[] = 'This email is sent by the scheduled job itself, not by chat. Held items are never signed past a failed gate. Challenge and revoke remain available on every record.';

        return ['to' => self::recipient(), 'subject' => $subject, 'body' => implode("\n", $lines)];
    }

    private static function unblocks(int $gate): string
    {
        return match ($gate) {
            1 => 'Publish the edition and stage its canonical file, then re-run; or correct the release record if the edition did release.',
            2 => 'Restore the public URL to HTTP 200, or confirm the artifact is the paid digest so checkability rests on the canonical file + hash.',
            3 => 'Re-record the release-time SHA-256 from the published bytes, or restore the canonical file that matches the recorded hash. Never edit the file after release.',
            4 => 'Supply the missing or corrected figures from the digest run itself; the claim is rebuilt from the run, never hand-written.',
            5 => 'Correct the row title to the exact published title and the kind to report.',
            6 => 'No action: the edition is already attested.',
            default => 'Review the held reason and correct the row or the artifact, then re-run.',
        };
    }
}
