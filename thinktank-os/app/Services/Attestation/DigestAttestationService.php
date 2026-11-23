<?php

namespace App\Services\Attestation;

use App\Models\Attestation;
use App\Models\User;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Automated weekly-digest attestation (PRD 2026-10-29, approved 2026-11-17;
 * SOP v1.1; ATTESTATION-PROTOCOL.md).
 *
 * ONE implementation of preparation + gates + signing, shared by the
 * scheduled command (attestations:digest) and the one-click button
 * (AttestationController::attestDigest). No duplicate logic: both paths
 * call processRow() here.
 *
 * Trigger rows are JSON files in storage digest-attestation/queue/,
 * one per edition, written when the edition's artifact releases. A row
 * carries the exact published title, the canonical file path, the
 * release-time subject hash, the public URL where one exists, and the
 * digest run's figures + retrieval date. Nothing is invented here: a
 * missing figure fails preparation and the item is held.
 */
class DigestAttestationService
{
    public const QUEUE_DIR = 'digest-attestation/queue';

    public const STATE_FILE = 'digest-attestation/state.json';

    public const AUDIT_FILE = 'digest-attestation/audit.jsonl';

    public const OUTBOX_DIR = 'digest-attestation/outbox';

    public const MAX_CONSECUTIVE_FAILURES = 3;

    public const CLAIM_TEMPLATE = "Glenride's weekly drug-shortage digest for %s: ASHP tracked %d live shortage bulletins and the FDA listed %d of %d database entries in shortage, retrieved and verified on %s.";

    public function __construct(
        private AttestationService $attestations,
        private IssuanceChainService $chain,
    ) {}

    /**
     * All queued rows, each with its pre-filled display fields, held state,
     * and any existing attestation. Powers both the command and the button.
     */
    public function listQueue(): array
    {
        $disk = Storage::disk('local');

        if (! $disk->exists(self::QUEUE_DIR)) {
            return [];
        }

        $state = $this->loadState();
        $rows = [];

        foreach ($disk->files(self::QUEUE_DIR) as $path) {
            if (! str_ends_with($path, '.json')) {
                continue;
            }

            $row = $this->readRow($path);

            if ($row === null) {
                continue;
            }

            $rows[] = $this->presentRow($row, $state);
        }

        usort($rows, fn ($a, $b) => strcmp((string) ($a['edition_date'] ?? ''), (string) ($b['edition_date'] ?? '')));

        return $rows;
    }

    public function findRow(string $editionDate): ?array
    {
        foreach ($this->listQueue() as $row) {
            if ((string) ($row['edition_date'] ?? '') === $editionDate) {
                return $row;
            }
        }

        return null;
    }

    /**
     * Process one row through preparation, gates, and signing (or hold).
     * Returns an outcome array; never throws for a gate failure.
     */
    public function processRow(array $row, User $verifier, bool $force = false): array
    {
        $edition = (string) ($row['edition_date'] ?? 'unknown');
        $runAt = now()->format('c');

        $invalid = $this->validateRow($row);

        if ($invalid !== null) {
            $outcome = ['outcome' => 'invalid', 'edition_date' => $edition, 'reason' => $invalid, 'run_at' => $runAt];
            $this->audit($outcome);

            return $outcome;
        }

        $state = $this->loadState();
        $held = $state[$edition] ?? null;

        if (! $force && ($held['waiting_on_human'] ?? false)) {
            $outcome = [
                'outcome' => 'waiting',
                'edition_date' => $edition,
                'reason' => 'Held after '.self::MAX_CONSECUTIVE_FAILURES.' consecutive failed runs; waiting on a human. Last failure: gate '.($held['last_failed_gate'] ?? '?').' — '.($held['last_reason'] ?? 'unknown'),
                'run_at' => $runAt,
            ];
            $this->audit($outcome);

            return $outcome;
        }

        // Gate 6 (no duplicates) is checked before signing: a duplicate
        // trigger is a no-op, never a second attestation or sequence number.
        $subjectHash = strtolower((string) ($row['subject_hash'] ?? ''));

        if ($subjectHash !== '') {
            $existing = Attestation::query()
                ->where('subject_hash', $subjectHash)
                ->whereIn('status', ['issued', 'challenged'])
                ->latest('issued_at')
                ->first();

            if ($existing) {
                $outcome = [
                    'outcome' => 'duplicate',
                    'edition_date' => $edition,
                    'public_id' => $existing->public_id,
                    'subject_hash' => $subjectHash,
                    'reason' => 'An active attestation already covers this subject hash; no new attestation, no new sequence number.',
                    'run_at' => $runAt,
                ];
                $this->audit($outcome);

                return $outcome;
            }
        }

        try {
            $claim = $this->buildClaim($row);
        } catch (DomainException $e) {
            return $this->hold($row, 4, $e->getMessage(), $runAt);
        }

        $gates = $this->evaluateGates($row, $claim);
        $failed = null;

        foreach ($gates as $gate) {
            if (! $gate['passed']) {
                $failed = $gate;
                break;
            }
        }

        if ($failed !== null) {
            return $this->hold($row, (int) $failed['gate'], (string) $failed['reason'], $runAt, $gates);
        }

        // The chain append, the Ed25519 signature, and the timestamp
        // request all live in issueManual, shared with every other
        // issuance path; issueManual runs its own transaction. The
        // gates passed travel in the manifest extra so the chain
        // entry records all six.
        $attestation = $this->attestations->issueManual([
            'subject_title' => $row['subject_title'],
            'claim' => $claim,
            'subject_kind' => 'report',
            'evidence_notes' => $row['evidence_notes'] ?? null,
            'evidence_urls' => ! empty($row['public_url']) ? [$row['public_url']] : [],
            'subject_hash_override' => $row['subject_hash'],
        ], $verifier, 'automated', [
            // Human source: the system executes the signature as the
            // human principal's instrument; it is never the attestor.
            'human_principal' => IssuanceChainService::HUMAN_PRINCIPAL,
            'authorization' => IssuanceChainService::AUTHORIZATION,
            'gates_passed' => [1, 2, 3, 4, 5, 6],
        ]);

        if (! $attestation->wasRecentlyCreated) {
            $outcome = [
                'outcome' => 'duplicate',
                'edition_date' => $edition,
                'public_id' => $attestation->public_id,
                'subject_hash' => $attestation->subject_hash,
                'reason' => 'Issuance was idempotent: an active attestation already covers this subject hash.',
                'run_at' => $runAt,
            ];
            $this->audit($outcome);

            return $outcome;
        }

        $this->clearHeldState($edition);

        $outcome = [
            'outcome' => 'issued',
            'edition_date' => $edition,
            'subject_title' => $row['subject_title'],
            'public_id' => $attestation->public_id,
            'subject_hash' => $attestation->subject_hash,
            'claim' => $claim,
            'figures' => $row['digest_run'],
            'gates_passed' => [1, 2, 3, 4, 5, 6],
            'human_principal' => IssuanceChainService::HUMAN_PRINCIPAL,
            'authorization' => IssuanceChainService::AUTHORIZATION,
            'signature_method' => $attestation->signature_method,
            'key_id' => $attestation->key_id,
            'timestamp_status' => $attestation->timestamp_status,
            'timestamp_source' => $attestation->timestamp_source,
            'issued_at' => $attestation->issued_at->format('c'),
            'run_at' => $runAt,
        ];
        $this->audit($outcome);

        return $outcome;
    }

    /**
     * Build the claim from the digest run's figures (PRD §6.2 template).
     * Throws when any figure is missing — preparation fails, never fills.
     */
    public function buildClaim(array $row): string
    {
        $run = $row['digest_run'] ?? [];

        foreach (['ashp', 'fda_in_shortage', 'fda_total', 'retrieved_on'] as $field) {
            if (! isset($run[$field]) || $run[$field] === '' || $run[$field] === null) {
                throw new DomainException("Figure missing from digest run: {$field}. Preparation fails rather than filling a gap.");
            }
        }

        $editionDate = Carbon::parse((string) $row['edition_date'])->format('F j, Y');
        $retrievedOn = Carbon::parse((string) $run['retrieved_on'])->format('F j, Y');

        return sprintf(
            self::CLAIM_TEMPLATE,
            $editionDate,
            (int) $run['ashp'],
            (int) $run['fda_in_shortage'],
            (int) $run['fda_total'],
            $retrievedOn
        );
    }

    /**
     * Evaluate all six gates. Every gate is evaluated (no short-circuit) so
     * the audit record shows the full picture; the hold reason is the
     * first failure in gate order.
     *
     * @return array<int, array{gate: int, passed: bool, reason: ?string, basis: ?string}>
     */
    public function evaluateGates(array $row, string $claim): array
    {
        $disk = Storage::disk('local');
        $canonicalFile = (string) ($row['canonical_file'] ?? '');
        $fileExists = $canonicalFile !== '' && $disk->exists($canonicalFile);
        $subjectHash = strtolower(trim((string) ($row['subject_hash'] ?? '')));

        // Gate 1: finished + fixed — released edition, canonical file on disk.
        $gate1 = ['gate' => 1, 'passed' => true, 'reason' => null, 'basis' => null];

        if (($row['released'] ?? false) !== true) {
            $gate1 = ['gate' => 1, 'passed' => false, 'reason' => 'Edition not released: '.((string) ($row['release_note'] ?? 'no release record.')), 'basis' => null];
        } elseif (! $fileExists) {
            $gate1 = ['gate' => 1, 'passed' => false, 'reason' => "Canonical file not on disk: {$canonicalFile}", 'basis' => null];
        }

        // Gate 2: checkable — public URL returns 200 where public; a paid
        // artifact satisfies this gate through its canonical file + hash
        // (gates 1 + 3), so it does not independently fail here.
        $gate2 = ['gate' => 2, 'passed' => true, 'reason' => null, 'basis' => null];

        if (($row['is_public'] ?? false) === true) {
            $url = (string) ($row['public_url'] ?? '');

            if ($url === '') {
                $gate2 = ['gate' => 2, 'passed' => false, 'reason' => 'Public artifact with no public URL to check.', 'basis' => null];
            } else {
                $status = $this->probeUrl($url);

                if ($status !== 200) {
                    $gate2 = ['gate' => 2, 'passed' => false, 'reason' => "Public URL did not return 200: {$url} (HTTP {$status}).", 'basis' => null];
                } else {
                    $gate2['basis'] = "Public URL returned 200: {$url}";
                }
            }
        } else {
            $gate2['basis'] = 'Paid artifact: checkability via canonical file + hash (gates 1 + 3).';
        }

        // Gate 3: hash parity — file SHA-256 equals the release-time hash.
        $gate3 = ['gate' => 3, 'passed' => true, 'reason' => null, 'basis' => null];

        if ($subjectHash === '' || ! preg_match('/^[a-f0-9]{64}$/', $subjectHash)) {
            $gate3 = ['gate' => 3, 'passed' => false, 'reason' => 'No release-time subject hash on record; hash parity is unprovable.', 'basis' => null];
        } elseif (! $fileExists) {
            $gate3 = ['gate' => 3, 'passed' => false, 'reason' => 'Canonical file missing; cannot verify hash parity.', 'basis' => null];
        } else {
            $actual = hash('sha256', $disk->get($canonicalFile));

            if (! hash_equals($subjectHash, $actual)) {
                $gate3 = ['gate' => 3, 'passed' => false, 'reason' => 'Hash mismatch: canonical file SHA-256 does not equal the recorded subject hash. The file changed after release or the wrong file is staged.', 'basis' => null];
            } else {
                $gate3['basis'] = "SHA-256 of canonical file equals recorded subject hash ({$subjectHash}).";
            }
        }

        // Gate 4: claim fidelity — the claim parses back to exactly the
        // digest run's figures, and matches the row's recorded claim (if any).
        $gate4 = ['gate' => 4, 'passed' => true, 'reason' => null, 'basis' => null];
        $run = $row['digest_run'] ?? [];

        if (! preg_match(
            "/ASHP tracked (\\d+) live shortage bulletins and the FDA listed (\\d+) of (\\d+) database entries in shortage, retrieved and verified on (.+)\\.$/",
            $claim,
            $m
        )) {
            $gate4 = ['gate' => 4, 'passed' => false, 'reason' => 'Claim does not match the §6.2 template shape.', 'basis' => null];
        } elseif ((int) $m[1] !== (int) ($run['ashp'] ?? -1)
            || (int) $m[2] !== (int) ($run['fda_in_shortage'] ?? -1)
            || (int) $m[3] !== (int) ($run['fda_total'] ?? -1)
            || trim($m[4]) !== Carbon::parse((string) ($run['retrieved_on'] ?? 'now'))->format('F j, Y')) {
            $gate4 = ['gate' => 4, 'passed' => false, 'reason' => 'Claim figures do not match the digest run figures exactly.', 'basis' => null];
        } elseif (isset($row['claim']) && $row['claim'] !== '' && $row['claim'] !== $claim) {
            $gate4 = ['gate' => 4, 'passed' => false, 'reason' => 'Recorded claim differs from the claim rebuilt from the digest run figures.', 'basis' => null];
        } else {
            $gate4['basis'] = 'Every figure in the claim matches the digest run exactly.';
        }

        // Gate 5: identity — title exactly as published; kind report.
        $gate5 = ['gate' => 5, 'passed' => true, 'reason' => null, 'basis' => null];

        if ((string) ($row['subject_kind'] ?? '') !== 'report') {
            $gate5 = ['gate' => 5, 'passed' => false, 'reason' => 'Subject kind is not report; automated issuance covers digest reports only.', 'basis' => null];
        } elseif (trim((string) ($row['subject_title'] ?? '')) === '' || trim((string) ($row['published_title'] ?? '')) === '') {
            $gate5 = ['gate' => 5, 'passed' => false, 'reason' => 'Title missing: subject title and published title are both required.', 'basis' => null];
        } elseif ($row['subject_title'] !== $row['published_title']) {
            $gate5 = ['gate' => 5, 'passed' => false, 'reason' => 'Subject title does not match the published title exactly.', 'basis' => null];
        }

        // Gate 6 is enforced as the duplicate pre-check in processRow(); it
        // is listed here as passed so the chain entry records all six gates
        // for an issuance that reached signing.
        $gate6 = ['gate' => 6, 'passed' => true, 'reason' => null, 'basis' => 'No active attestation covers this subject hash (duplicate pre-check).'];

        return [$gate1, $gate2, $gate3, $gate4, $gate5, $gate6];
    }

    private function hold(array $row, int $gate, string $reason, string $runAt, ?array $gates = null): array
    {
        $edition = (string) ($row['edition_date'] ?? 'unknown');
        $state = $this->loadState();
        $failures = (int) ($state[$edition]['consecutive_failures'] ?? 0) + 1;
        $waiting = $failures >= self::MAX_CONSECUTIVE_FAILURES;

        $state[$edition] = [
            'consecutive_failures' => $failures,
            'last_failed_gate' => $gate,
            'last_reason' => $reason,
            'last_run_at' => $runAt,
            'waiting_on_human' => $waiting,
        ];

        $this->saveState($state);

        $outcome = [
            'outcome' => 'held',
            'edition_date' => $edition,
            'subject_title' => $row['subject_title'] ?? null,
            'failed_gate' => $gate,
            'reason' => $reason,
            'consecutive_failures' => $failures,
            'waiting_on_human' => $waiting,
            'gates' => $gates,
            'run_at' => $runAt,
        ];
        $this->audit($outcome);

        return $outcome;
    }

    private function clearHeldState(string $edition): void
    {
        $state = $this->loadState();

        if (isset($state[$edition])) {
            unset($state[$edition]);
            $this->saveState($state);
        }
    }

    private function loadState(): array
    {
        $disk = Storage::disk('local');

        if (! $disk->exists(self::STATE_FILE)) {
            return [];
        }

        $decoded = json_decode($disk->get(self::STATE_FILE), true);

        return is_array($decoded) ? $decoded : [];
    }

    private function saveState(array $state): void
    {
        Storage::disk('local')->put(self::STATE_FILE, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    private function audit(array $outcome): void
    {
        Storage::disk('local')->append(
            self::AUDIT_FILE,
            json_encode($outcome, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }

    private function validateRow(array $row): ?string
    {
        foreach (['edition_date', 'subject_title', 'published_title', 'subject_kind', 'canonical_file', 'digest_run'] as $field) {
            if (! isset($row[$field]) || $row[$field] === '' || $row[$field] === null) {
                return "Row is missing required field: {$field}.";
            }
        }

        if (! is_array($row['digest_run'])) {
            return 'Row digest_run must be an object with the run figures.';
        }

        return null;
    }

    private function readRow(string $path): ?array
    {
        $decoded = json_decode(Storage::disk('local')->get($path), true);

        return is_array($decoded) ? $decoded : null;
    }

    private function presentRow(array $row, array $state): array
    {
        $edition = (string) ($row['edition_date'] ?? '');
        $disk = Storage::disk('local');

        try {
            $claim = $this->buildClaim($row);
            $claimError = null;
        } catch (DomainException $e) {
            $claim = $row['claim'] ?? null;
            $claimError = $e->getMessage();
        }

        $existing = null;
        $subjectHash = strtolower((string) ($row['subject_hash'] ?? ''));

        if ($subjectHash !== '') {
            $found = Attestation::query()
                ->where('subject_hash', $subjectHash)
                ->whereIn('status', ['issued', 'challenged'])
                ->latest('issued_at')
                ->first();

            if ($found) {
                $existing = ['public_id' => $found->public_id, 'status' => $found->status];
            }
        }

        return array_merge($row, [
            'claim_built' => $claim,
            'claim_error' => $claimError,
            'file_exists' => ($row['canonical_file'] ?? '') !== '' && $disk->exists((string) $row['canonical_file']),
            'held' => $state[$edition] ?? null,
            'existing_attestation' => $existing,
        ]);
    }

    /**
     * Probe a public URL for HTTP 200. HEAD first, GET fallback for
     * servers that reject HEAD. Any transport failure returns 0.
     */
    private function probeUrl(string $url): int
    {
        try {
            $response = Http::timeout(10)->head($url);

            if ($response->status() === 405) {
                $response = Http::timeout(10)->get($url);
            }

            return $response->status();
        } catch (\Throwable) {
            return 0;
        }
    }
}
