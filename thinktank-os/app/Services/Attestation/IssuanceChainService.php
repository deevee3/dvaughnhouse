<?php

namespace App\Services\Attestation;

use App\Models\Attestation;
use App\Models\IssuanceLogEntry;
use Illuminate\Support\Facades\DB;

/**
 * Append-only, hash-chained issuance log for the Witness attestation layer.
 *
 * Scheme (ATTESTATION-PROTOCOL.md §10):
 * - Sequence numbers are monotonic and gap-free, starting at the genesis
 *   entry (seq 0). Every issued attestation gets the next number.
 * - Each entry records seq, the previous entry's hash, public ID, subject
 *   hash, gates passed, issued_at, the human principal, and the
 *   authorization under which the system executed the signature, plus its
 *   own entry hash: SHA-256 over the canonical JSON array
 *   [seq, prev_hash, public_id, subject_hash, gates_passed, issued_at_iso,
 *   human_principal, authorization].
 * - The human principal is D'Vaughn House, principal of Glenride. Glenride
 *   is the issuer of record, acting through him. The system prepares and
 *   executes; it is never named as the attestor. Machines propose; the
 *   human is the source of the attestation decision.
 * - The genesis entry is explicit and deterministic: seq 0, prev_hash of
 *   64 zeros, public_id GENESIS, subject_hash SHA-256 of
 *   'glenride-witness-genesis-v1', gates_passed [], issued_at
 *   2026-11-17T00:00:00+00:00.
 * - Held items get no sequence number. Duplicate triggers create no entry.
 * - The entry hash formula is FIXED by the protocol. It must never change:
 *   changing it would invalidate every existing entry. New record fields
 *   live on the attestation record, never in the chain entry.
 */
class IssuanceChainService
{
    public const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

    public const GENESIS_PUBLIC_ID = 'GENESIS';

    public const GENESIS_SUBJECT_SEED = 'glenride-witness-genesis-v1';

    public const GENESIS_ISSUED_AT = '2026-11-17T00:00:00+00:00';

    /**
     * The human source of every attestation. The system is never named
     * as the attestor.
     */
    public const HUMAN_PRINCIPAL = "D'Vaughn House, principal of Glenride";

    public const AUTHORIZATION = "SOP v1.1 automated issuance, authorized by D'Vaughn House tap 2026-11-17 approving the automated digest attestation PRD defaults";

    public const GENESIS_AUTHORIZATION = 'Genesis entry — chain anchor; no issuance, no authorization exercised.';

    /**
     * The canonical entry hash. The encoding is part of the protocol: change
     * it only with a protocol amendment, never silently.
     */
    public function entryHash(int $seq, string $prevHash, string $publicId, string $subjectHash, array $gatesPassed, string $issuedAtIso, string $humanPrincipal, string $authorization): string
    {
        $canonical = json_encode([
            $seq,
            $prevHash,
            $publicId,
            $subjectHash,
            array_values($gatesPassed),
            $issuedAtIso,
            $humanPrincipal,
            $authorization,
        ], JSON_UNESCAPED_SLASHES);

        return hash('sha256', $canonical);
    }

    /**
     * The current chain head (highest sequence), or null when empty.
     */
    public function head(): ?IssuanceLogEntry
    {
        return IssuanceLogEntry::query()->orderByDesc('seq')->first();
    }

    /**
     * Append the next entry for a newly issued attestation. Creates the
     * genesis entry first when the log is empty. Must be called inside the
     * same transaction as the attestation creation so a failed append rolls
     * the issuance back with it.
     *
     * @param  array<int, int>  $gatesPassed  Gate numbers passed. Digest
     *                                        issuances pass [1..6]; direct
     *                                        issuances pass [] (the six
     *                                        gates are digest-only).
     * @param  string|null  $authorization  The authorization under which
     *                                      the signature was executed.
     *                                      Defaults to the automated
     *                                      standing authorization; direct
     *                                      issuances pass their own.
     */
    public function append(Attestation $attestation, array $gatesPassed, ?string $authorization = null): IssuanceLogEntry
    {
        $authorization ??= self::AUTHORIZATION;

        return DB::transaction(function () use ($attestation, $gatesPassed, $authorization) {
            $last = IssuanceLogEntry::query()
                ->orderByDesc('seq')
                ->lockForUpdate()
                ->first();

            if (! $last) {
                $last = $this->createGenesis();
            }

            $seq = $last->seq + 1;
            $issuedAtIso = $attestation->issued_at->format('c');

            return IssuanceLogEntry::create([
                'seq' => $seq,
                'prev_hash' => $last->entry_hash,
                'public_id' => $attestation->public_id,
                'subject_hash' => $attestation->subject_hash,
                'gates_passed' => array_values($gatesPassed),
                'issued_at' => $attestation->issued_at,
                'human_principal' => self::HUMAN_PRINCIPAL,
                'authorization' => $authorization,
                'entry_hash' => $this->entryHash(
                    $seq,
                    $last->entry_hash,
                    $attestation->public_id,
                    $attestation->subject_hash,
                    array_values($gatesPassed),
                    $issuedAtIso,
                    self::HUMAN_PRINCIPAL,
                    $authorization
                ),
            ]);
        });
    }

    /**
     * Recompute the whole chain from genesis and report any gap, break,
     * or tamper. Returns ['valid' => bool, 'entries' => int, 'errors' => []].
     */
    public function verify(): array
    {
        $entries = IssuanceLogEntry::query()->orderBy('seq')->get();
        $errors = [];

        if ($entries->isEmpty()) {
            return ['valid' => true, 'entries' => 0, 'last_seq' => null, 'errors' => [], 'empty' => true];
        }

        $expectedSeq = 0;
        $prevHash = null;

        foreach ($entries as $entry) {
            if ($entry->seq !== $expectedSeq) {
                $errors[] = "Sequence gap: expected seq {$expectedSeq}, found seq {$entry->seq} (public_id {$entry->public_id}).";
                $expectedSeq = $entry->seq;
            }

            if ($entry->seq === 0) {
                if ($entry->prev_hash !== self::GENESIS_PREV_HASH
                    || $entry->public_id !== self::GENESIS_PUBLIC_ID
                    || $entry->subject_hash !== hash('sha256', self::GENESIS_SUBJECT_SEED)
                    || $entry->gates_passed !== []
                    || $entry->issued_at->format('c') !== self::GENESIS_ISSUED_AT
                    || $entry->human_principal !== self::HUMAN_PRINCIPAL
                    || $entry->authorization !== self::GENESIS_AUTHORIZATION) {
                    $errors[] = 'Genesis entry (seq 0) does not match the defined genesis values.';
                }
            } elseif ($prevHash !== null && $entry->prev_hash !== $prevHash) {
                $errors[] = "Chain break at seq {$entry->seq}: prev_hash does not match seq ".($entry->seq - 1)." entry_hash.";
            }

            $recomputed = $this->entryHash(
                $entry->seq,
                $entry->prev_hash,
                $entry->public_id,
                $entry->subject_hash,
                $entry->gates_passed ?? [],
                $entry->issued_at->format('c'),
                (string) $entry->human_principal,
                (string) $entry->authorization
            );

            if (! hash_equals($recomputed, $entry->entry_hash)) {
                $errors[] = "Tamper detected at seq {$entry->seq} (public_id {$entry->public_id}): entry_hash does not recompute.";
            }

            if ($entry->seq !== 0 && ! Attestation::where('public_id', $entry->public_id)->exists()) {
                $errors[] = "Seq {$entry->seq} references public_id {$entry->public_id}, which has no attestation record.";
            }

            $prevHash = $entry->entry_hash;
            $expectedSeq = $entry->seq + 1;
        }

        return ['valid' => empty($errors), 'entries' => $entries->count(), 'last_seq' => $entries->max('seq'), 'errors' => $errors, 'empty' => false];
    }

    private function createGenesis(): IssuanceLogEntry
    {
        $subjectHash = hash('sha256', self::GENESIS_SUBJECT_SEED);

        return IssuanceLogEntry::create([
            'seq' => 0,
            'prev_hash' => self::GENESIS_PREV_HASH,
            'public_id' => self::GENESIS_PUBLIC_ID,
            'subject_hash' => $subjectHash,
            'gates_passed' => [],
            'issued_at' => self::GENESIS_ISSUED_AT,
            'human_principal' => self::HUMAN_PRINCIPAL,
            'authorization' => self::GENESIS_AUTHORIZATION,
            'entry_hash' => $this->entryHash(0, self::GENESIS_PREV_HASH, self::GENESIS_PUBLIC_ID, $subjectHash, [], self::GENESIS_ISSUED_AT, self::HUMAN_PRINCIPAL, self::GENESIS_AUTHORIZATION),
        ]);
    }
}
