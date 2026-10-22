<?php

namespace App\Services\Attestation;

use App\Models\Attestation;
use App\Models\Manuscript;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttestationService
{
    /**
     * Default claim recorded on every manuscript attestation in v1.
     */
    public const DEFAULT_CLAIM = 'Glenride attests that this work was authored as claimed, passed editorial review, and matches the evidence recorded at issuance.';

    /**
     * SHA-256 hash of the attested subject.
     *
     * Prefers the synthesized brief file, falls back to the raw file,
     * and finally to a canonical string built from the manuscript record.
     */
    public function subjectHash(Manuscript $manuscript): string
    {
        $disk = Storage::disk('local');

        if ($manuscript->synthesized_brief_path && $disk->exists($manuscript->synthesized_brief_path)) {
            return hash('sha256', $disk->get($manuscript->synthesized_brief_path));
        }

        if ($manuscript->raw_file_path && $disk->exists($manuscript->raw_file_path)) {
            return hash('sha256', $disk->get($manuscript->raw_file_path));
        }

        $publishedAt = $manuscript->published_at ? $manuscript->published_at->format('c') : '';

        $canonical = implode('|', [
            (string) $manuscript->title,
            (string) $manuscript->abstract,
            (string) $manuscript->user_id,
            $publishedAt,
        ]);

        return hash('sha256', $canonical);
    }

    /**
     * The evidence recorded at issuance: what was checked and what was hashed.
     */
    public function evidenceManifest(Manuscript $manuscript): array
    {
        $disk = Storage::disk('local');

        $manifest = [
            'manuscript_id' => $manuscript->id,
            'compliance' => [
                'ethics_verified' => (bool) $manuscript->compliance_ethics_verified,
                'transparency_verified' => (bool) $manuscript->compliance_transparency_verified,
                'citations_verified' => (bool) $manuscript->compliance_citations_verified,
            ],
            'word_count' => $manuscript->word_count,
            'status' => $manuscript->status,
            'published_at' => $manuscript->published_at ? $manuscript->published_at->format('c') : null,
        ];

        if ($manuscript->raw_file_path && $disk->exists($manuscript->raw_file_path)) {
            $manifest['raw_file_sha256'] = hash('sha256', $disk->get($manuscript->raw_file_path));
        }

        if ($manuscript->synthesized_brief_path && $disk->exists($manuscript->synthesized_brief_path)) {
            $manifest['brief_sha256'] = hash('sha256', $disk->get($manuscript->synthesized_brief_path));
        }

        return $manifest;
    }

    /**
     * Issue a Glenride attestation for a published, compliance-verified manuscript.
     *
     * Idempotent per subject hash: if an active attestation already covers
     * this exact subject, it is returned instead of issuing a duplicate.
     */
    public function issue(Manuscript $manuscript, User $verifier, ?string $claim = null): Attestation
    {
        if ($manuscript->status !== 'published') {
            throw new DomainException('Only published manuscripts can be attested.');
        }

        if (! $manuscript->isComplianceVerified()) {
            throw new DomainException('Manuscript compliance checks must all be verified before attestation.');
        }

        $subjectHash = $this->subjectHash($manuscript);

        $existing = Attestation::query()
            ->where('attestable_type', Manuscript::class)
            ->where('attestable_id', $manuscript->id)
            ->where('subject_hash', $subjectHash)
            ->whereIn('status', ['issued', 'challenged'])
            ->latest('issued_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        $publicId = $this->generatePublicId();
        $issuedAt = now();

        $signature = $this->sign($publicId, Manuscript::class, (string) $manuscript->id, $subjectHash, $issuedAt->format('c'));

        return Attestation::create([
            'public_id' => $publicId,
            'attestable_type' => Manuscript::class,
            'attestable_id' => $manuscript->id,
            'subject_title' => $manuscript->title,
            'claim' => $claim ?: self::DEFAULT_CLAIM,
            'evidence_manifest' => $this->evidenceManifest($manuscript),
            'subject_hash' => $subjectHash,
            'signature' => $signature,
            'verifier_id' => $verifier->id,
            'issuer_name' => 'Glenride',
            'method' => 'editorial_review_v1',
            'status' => 'issued',
            'issued_at' => $issuedAt,
        ]);
    }

    /**
     * Recompute the signature for an attestation and compare it in constant time.
     */
    public function verifySignature(Attestation $attestation): bool
    {
        if (! $attestation->signature || ! $attestation->issued_at) {
            return false;
        }

        $expected = $this->sign(
            $attestation->public_id,
            $attestation->attestable_type,
            (string) $attestation->attestable_id,
            $attestation->subject_hash,
            $attestation->issued_at->format('c')
        );

        return hash_equals($expected, $attestation->signature);
    }

    /**
     * Revoke an attestation, recording when and why.
     */
    public function revoke(Attestation $attestation, string $reason): Attestation
    {
        $attestation->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revocation_reason' => $reason,
        ]);

        return $attestation;
    }

    /**
     * HMAC-SHA256 signature over the canonical attestation payload.
     */
    private function sign(string $publicId, string $attestableType, string $attestableId, string $subjectHash, string $issuedAtIso): string
    {
        $payload = json_encode([
            'public_id' => $publicId,
            'attestable_type' => $attestableType,
            'attestable_id' => $attestableId,
            'subject_hash' => $subjectHash,
            'issued_at' => $issuedAtIso,
        ]);

        return hash_hmac('sha256', $payload, (string) config('app.key'));
    }

    /**
     * Generate a unique public identifier: GLR-AT-<year>-<6 uppercase alphanumerics>.
     */
    private function generatePublicId(): string
    {
        do {
            $suffix = strtoupper(Str::random(6));
            $publicId = 'GLR-AT-'.now()->format('Y').'-'.$suffix;
        } while (Attestation::where('public_id', $publicId)->exists());

        return $publicId;
    }
}
