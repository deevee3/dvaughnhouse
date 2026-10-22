<?php

namespace App\Services\Attestation;

use App\Models\Attestation;
use App\Models\CreditAccount;
use App\Models\Manuscript;
use App\Models\User;
use App\Services\Credits\CreditService;
use DomainException;
use Illuminate\Support\Facades\DB;
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
     *
     * Credit debit: issuance and the budget debit are one transaction.
     * When the manuscript is linked to a credit account and
     * config('credits.enforce_balance') is on, the account is charged the
     * attestation price for a NEWLY created attestation; an insufficient
     * balance throws and rolls the attestation back with it. Idempotent
     * re-issuance (existing record returned) is never charged, and
     * manuscripts with no credit account are never debited or blocked.
     */
    public function issue(Manuscript $manuscript, User $verifier, ?string $claim = null, array $evidenceExtra = []): Attestation
    {
        return DB::transaction(function () use ($manuscript, $verifier, $claim, $evidenceExtra) {
            $attestation = $this->createAttestation($manuscript, $verifier, $claim, $evidenceExtra);

            if ($attestation->wasRecentlyCreated
                && $manuscript->credit_account_id
                && config('credits.enforce_balance')) {
                $account = CreditAccount::find($manuscript->credit_account_id);

                if ($account) {
                    app(CreditService::class)->debitForAttestation($account, $attestation, $verifier);
                }
            }

            return $attestation;
        });
    }

    /**
     * Create the attestation record itself (the pre-credit issuance body).
     */
    private function createAttestation(Manuscript $manuscript, User $verifier, ?string $claim = null, array $evidenceExtra = []): Attestation
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

        $manifest = $this->evidenceManifest($manuscript);

        // Bind the attestation to the manuscript's permanent SpinWave
        // record: the certificate points at the exact recorded version
        // it was issued against.
        $latestRecord = $manuscript->latestRecord;

        if ($latestRecord) {
            $manifest['spinwave_record'] = [
                'record_id' => $latestRecord->id,
                'version' => $latestRecord->version,
                'record_hash' => $latestRecord->record_hash,
            ];
        }

        if (! empty($evidenceExtra)) {
            $urls = $evidenceExtra['urls'] ?? ($evidenceExtra['evidence_urls'] ?? []);
            $manifest['manual_evidence'] = [
                'notes' => $evidenceExtra['notes'] ?? ($evidenceExtra['evidence_notes'] ?? null),
                'urls' => is_array($urls) ? array_values(array_filter($urls)) : [],
            ];
        }

        return Attestation::create([
            'public_id' => $publicId,
            'attestable_type' => Manuscript::class,
            'attestable_id' => $manuscript->id,
            'subject_kind' => 'manuscript',
            'entered_via' => 'pipeline',
            'subject_title' => $manuscript->title,
            'claim' => $claim ?: self::DEFAULT_CLAIM,
            'evidence_manifest' => $manifest,
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
     * Issue an attestation for a manually entered subject.
     *
     * The subject does not need to exist in the manuscript pipeline:
     * the verifier enters the title, claim, kind and evidence directly.
     * The subject hash is either the supplied override or a SHA-256 of
     * the canonical entered data. Signing matches issue() exactly.
     *
     * @param  array{subject_title: string, claim: string, subject_kind: string, evidence_notes?: ?string, evidence_urls?: array<int, string>, subject_hash_override?: ?string}  $data
     */
    public function issueManual(array $data, User $verifier): Attestation
    {
        $subjectTitle = trim((string) ($data['subject_title'] ?? ''));
        $claim = trim((string) ($data['claim'] ?? ''));
        $subjectKind = (string) ($data['subject_kind'] ?? 'other');
        $evidenceNotes = isset($data['evidence_notes']) ? trim((string) $data['evidence_notes']) : null;
        $evidenceUrls = $data['evidence_urls'] ?? [];
        $evidenceUrls = is_array($evidenceUrls) ? array_values(array_filter(array_map('trim', $evidenceUrls))) : [];

        if ($subjectTitle === '' || $claim === '') {
            throw new DomainException('A subject title and a claim are required for a manual attestation.');
        }

        $override = isset($data['subject_hash_override']) ? trim((string) $data['subject_hash_override']) : null;

        if ($override !== null && $override !== '') {
            if (! preg_match('/^[a-fA-F0-9]{64}$/', $override)) {
                throw new DomainException('The subject hash override must be a 64-character hex SHA-256 value.');
            }
            $subjectHash = strtolower($override);
        } else {
            $sortedUrls = $evidenceUrls;
            sort($sortedUrls);
            $canonical = json_encode([
                'subject_title' => $subjectTitle,
                'claim' => $claim,
                'subject_kind' => $subjectKind,
                'evidence_notes' => $evidenceNotes,
                'evidence_urls' => $sortedUrls,
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $subjectHash = hash('sha256', $canonical);
        }

        $existing = Attestation::query()
            ->whereNull('attestable_type')
            ->whereNull('attestable_id')
            ->where('subject_hash', $subjectHash)
            ->whereIn('status', ['issued', 'challenged'])
            ->latest('issued_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        $publicId = $this->generatePublicId();
        $issuedAt = now();

        $signature = $this->sign($publicId, '', '', $subjectHash, $issuedAt->format('c'));

        $manifest = [
            'subject_title' => $subjectTitle,
            'subject_kind' => $subjectKind,
            'entered_via' => 'manual',
            'evidence_notes' => $evidenceNotes,
            'evidence_urls' => $evidenceUrls,
            'subject_hash_override' => $override ?: null,
        ];

        return Attestation::create([
            'public_id' => $publicId,
            'attestable_type' => null,
            'attestable_id' => null,
            'subject_kind' => $subjectKind,
            'entered_via' => 'manual',
            'subject_title' => $subjectTitle,
            'claim' => $claim,
            'evidence_manifest' => $manifest,
            'subject_hash' => $subjectHash,
            'signature' => $signature,
            'verifier_id' => $verifier->id,
            'issuer_name' => 'Glenride',
            'method' => 'manual_entry_v1',
            'status' => 'issued',
            'issued_at' => $issuedAt,
        ]);
    }

    /**
     * Record an on-chain anchor for an attestation.
     *
     * Anchoring itself is performed externally via the Pearls
     * AttestationRegistry on Base; ThinkTank OS records the resulting
     * transaction, contract and chain so the public record can show it.
     */
    public function recordAnchor(Attestation $attestation, string $txHash, string $contract, string $chain = 'base', string $platform = 'pearls'): Attestation
    {
        $attestation->update([
            'anchor_platform' => $platform,
            'anchor_chain' => $chain,
            'anchor_contract' => $contract,
            'anchor_tx' => $txHash,
            'anchored_at' => now(),
        ]);

        return $attestation;
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
            (string) ($attestation->attestable_type ?? ''),
            (string) ($attestation->attestable_id ?? ''),
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
