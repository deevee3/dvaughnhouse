<?php

namespace App\Services\Attestation;

use App\Models\IssuanceLogEntry;

/**
 * Independent preservation of the issuance chain: periodic anchoring
 * of the chain head to a public location outside the issuing database.
 *
 * A hash chain detects alteration only if earlier hashes survive
 * independently of the log operator. Each anchor record captures the
 * chain head (sequence, entry hash, chain digest) at anchor time; the
 * anchor log lives in the public repository, committed and pushed by
 * a host-side script on a weekly timer (scripts/anchor-chain.sh), so
 * the anchor's existence and time are witnessed by infrastructure
 * Glenride does not control.
 *
 * What an anchor proves: the chain head recorded in the anchor existed
 * at the anchor's commit time, and the chain up to that sequence
 * recomputes to the recorded digest. What it does NOT prove: anything
 * about entries appended after the anchor.
 */
class ChainAnchorService
{
    public function __construct(
        private IssuanceChainService $chain,
    ) {}

    /**
     * SHA-256 over the concatenated entry hashes for seq 0..$uptoSeq.
     * The digest binds the whole prefix of the chain in one value.
     */
    public function chainDigest(int $uptoSeq): string
    {
        $hashes = IssuanceLogEntry::query()
            ->where('seq', '<=', $uptoSeq)
            ->orderBy('seq')
            ->pluck('entry_hash')
            ->all();

        return hash('sha256', implode('', $hashes));
    }

    /**
     * Build the anchor record for the current chain head, or null when
     * the log is empty (nothing to anchor yet).
     *
     * @return null|array{seq: int, entry_hash: string, public_id: string, issued_at: string, chain_digest: string, anchored_at: string, source: string}
     */
    public function buildAnchor(): ?array
    {
        $head = $this->chain->head();

        if ($head === null) {
            return null;
        }

        return [
            'seq' => $head->seq,
            'entry_hash' => $head->entry_hash,
            'public_id' => $head->public_id,
            'issued_at' => $head->issued_at->format('c'),
            'chain_digest' => $this->chainDigest($head->seq),
            'anchored_at' => now()->format('c'),
            'source' => 'thinktank-os attestation issuance log',
        ];
    }

    /**
     * Verify one anchor record against the live chain: the entry must
     * exist with the recorded hash, and the chain prefix up to its
     * sequence must recompute to the recorded digest.
     *
     * @return array{valid: bool, errors: array<int, string>}
     */
    public function verifyAnchor(array $anchor): array
    {
        $errors = [];
        $seq = (int) ($anchor['seq'] ?? -1);

        $entry = IssuanceLogEntry::query()->where('seq', $seq)->first();

        if ($entry === null) {
            $errors[] = "Anchor names seq {$seq}, which has no log entry.";
        } else {
            if ($entry->entry_hash !== ($anchor['entry_hash'] ?? null)) {
                $errors[] = "Anchor entry_hash for seq {$seq} does not match the live log.";
            }

            if ($entry->public_id !== ($anchor['public_id'] ?? null)) {
                $errors[] = "Anchor public_id for seq {$seq} does not match the live log.";
            }

            if ($this->chainDigest($seq) !== ($anchor['chain_digest'] ?? null)) {
                $errors[] = "Anchor chain_digest for seq {$seq} does not recompute from the live log.";
            }
        }

        $chain = $this->chain->verify();

        if (! $chain['valid']) {
            $errors[] = 'The live chain itself does not verify: '.implode(' ', $chain['errors']);
        }

        return ['valid' => $errors === [], 'errors' => $errors];
    }
}
