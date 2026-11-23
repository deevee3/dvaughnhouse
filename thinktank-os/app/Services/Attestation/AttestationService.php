<?php

namespace App\Services\Attestation;

use App\Models\Attestation;
use App\Models\CreditAccount;
use App\Models\Manuscript;
use App\Models\User;
use App\Services\Credits\CreditService;
use App\Support\SiteConfig;
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
     * Authorization evidence recorded on direct (human-acted) issuances.
     */
    public const DIRECT_AUTHORIZATION = "Direct issuance by D'Vaughn House, human principal, acting in the ThinkTank OS console";

    public function __construct(
        private SigningKeyService $keys,
        private IssuanceChainService $chain,
        private TrustedTimestampService $timestamps,
    ) {}

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
     *
     * New issuances sign with Ed25519 (FIPS 186-5) under the active
     * published key, append to the hash-chained issuance log, and request
     * an independent RFC 3161 timestamp after the transaction commits.
     */
    public function issue(Manuscript $manuscript, User $verifier, ?string $claim = null, array $evidenceExtra = []): Attestation
    {
        $attestation = DB::transaction(function () use ($manuscript, $verifier, $claim, $evidenceExtra) {
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

        if ($attestation->wasRecentlyCreated) {
            $this->requestTimestamp($attestation);
        }

        return $attestation;
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
        $claimText = $claim ?: self::DEFAULT_CLAIM;

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

        // Human source: the record names the principal and the
        // authorization under which the signature was executed.
        $manifest['human_principal'] = IssuanceChainService::HUMAN_PRINCIPAL;
        $manifest['authorization'] = self::DIRECT_AUTHORIZATION;

        $signed = $this->signEd25519(
            publicId: $publicId,
            attestableType: Manuscript::class,
            attestableId: (string) $manuscript->id,
            subjectKind: 'manuscript',
            subjectTitle: (string) $manuscript->title,
            subjectHash: $subjectHash,
            claim: $claimText,
            issuedAt: $issuedAt,
            enteredVia: 'pipeline',
        );

        $attestation = Attestation::create([
            'public_id' => $publicId,
            'attestable_type' => Manuscript::class,
            'attestable_id' => $manuscript->id,
            'subject_kind' => 'manuscript',
            'entered_via' => 'pipeline',
            'subject_title' => $manuscript->title,
            'claim' => $claimText,
            'evidence_manifest' => $manifest,
            'subject_hash' => $subjectHash,
            'signature' => $signed['signature'],
            'signature_method' => $signed['method'],
            'key_id' => $signed['key_id'],
            'timestamp_status' => 'pending',
            'authorization_evidence' => self::DIRECT_AUTHORIZATION,
            'verifier_id' => $verifier->id,
            'issuer_name' => 'Glenride',
            'method' => 'editorial_review_v1',
            'status' => 'issued',
            'issued_at' => $issuedAt,
        ]);

        // Every issuance appends to the chain, inside the same
        // transaction: a failed append rolls the issuance back.
        // The six gates are digest-only; direct issuances pass [].
        $this->chain->append($attestation, [], self::DIRECT_AUTHORIZATION);

        return $attestation;
    }

    /**
     * Issue an attestation for a manually entered subject.
     *
     * The subject does not need to exist in the manuscript pipeline:
     * the verifier enters the title, claim, kind and evidence directly.
     * The subject hash is either the supplied override or a SHA-256 of
     * the canonical entered data. Signing matches issue() exactly.
     *
     * The automated digest path reuses this method with
     * $enteredVia = 'automated' and a $manifestExtra carrying the human
     * principal and the authorization under which the system executed
     * the signature as the principal's instrument. The manual path
     * passes neither and behaves exactly as before.
     *
     * Every new issuance appends to the hash-chained issuance log
     * (inside the same transaction) and requests an independent RFC
     * 3161 timestamp after the commit. $manifestExtra may carry
     * 'gates_passed' (digest path only); it is recorded on the chain
     * entry and in the evidence manifest.
     *
     * @param  array{subject_title: string, claim: string, subject_kind: string, evidence_notes?: ?string, evidence_urls?: array<int, string>, subject_hash_override?: ?string, supersedes_id?: ?string, version?: int, force_new?: bool}  $data
     * @param  array<string, mixed>  $manifestExtra  Extra evidence-manifest keys (automated path only).
     */
    public function issueManual(array $data, User $verifier, string $enteredVia = 'manual', array $manifestExtra = []): Attestation
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

        // Idempotency: an active attestation for the same standalone
        // subject hash is returned instead of duplicated — unless the
        // caller forces a new record (corrections: a claim-only
        // correction keeps the artifact hash and must still mint a
        // new version linked to the original).
        $existing = null;

        if (empty($data['force_new'])) {
            $existing = Attestation::query()
                ->whereNull('attestable_type')
                ->whereNull('attestable_id')
                ->where('subject_hash', $subjectHash)
                ->whereIn('status', ['issued', 'challenged'])
                ->latest('issued_at')
                ->first();
        }

        if ($existing) {
            return $existing;
        }

        $publicId = $this->generatePublicId();
        $issuedAt = now();
        $authorization = $this->authorizationFor($enteredVia);
        $gatesPassed = array_values($manifestExtra['gates_passed'] ?? []);
        $supersedesId = $data['supersedes_id'] ?? null;
        $version = (int) ($data['version'] ?? 1);
        $method = $enteredVia === 'automated' ? 'automated_digest_v1' : ($data['method'] ?? 'manual_entry_v1');

        $manifest = [
            'subject_title' => $subjectTitle,
            'subject_kind' => $subjectKind,
            'entered_via' => $enteredVia,
            'evidence_notes' => $evidenceNotes,
            'evidence_urls' => $evidenceUrls,
            'subject_hash_override' => $override ?: null,
        ] + $manifestExtra;

        // Human source, recorded on every issuance: the principal and
        // the authorization are canonical values, not caller input.
        $manifest['human_principal'] = IssuanceChainService::HUMAN_PRINCIPAL;
        $manifest['authorization'] = $authorization;

        $signed = $this->signEd25519(
            publicId: $publicId,
            attestableType: '',
            attestableId: '',
            subjectKind: $subjectKind,
            subjectTitle: $subjectTitle,
            subjectHash: $subjectHash,
            claim: $claim,
            issuedAt: $issuedAt,
            enteredVia: $enteredVia,
            supersedesId: $supersedesId,
            version: $version,
        );

        $attestation = DB::transaction(function () use (
            $publicId, $subjectKind, $enteredVia, $subjectTitle, $claim,
            $manifest, $subjectHash, $signed, $verifier, $method, $issuedAt,
            $authorization, $gatesPassed, $supersedesId, $version
        ) {
            $record = Attestation::create([
                'public_id' => $publicId,
                'attestable_type' => null,
                'attestable_id' => null,
                'subject_kind' => $subjectKind,
                'entered_via' => $enteredVia,
                'subject_title' => $subjectTitle,
                'claim' => $claim,
                'evidence_manifest' => $manifest,
                'subject_hash' => $subjectHash,
                'signature' => $signed['signature'],
                'signature_method' => $signed['method'],
                'key_id' => $signed['key_id'],
                'timestamp_status' => 'pending',
                'authorization_evidence' => $authorization,
                'verifier_id' => $verifier->id,
                'issuer_name' => 'Glenride',
                'method' => $method,
                'status' => 'issued',
                'supersedes_id' => $supersedesId,
                'version' => $version,
                'issued_at' => $issuedAt,
            ]);

            $this->chain->append($record, $gatesPassed, $authorization);

            return $record;
        });

        $this->requestTimestamp($attestation);

        return $attestation->refresh();
    }

    /**
     * Issue a correction of an existing attestation. The original is
     * NEVER edited or deleted: the correction is a new version (N+1)
     * linked to the original, and the original stays readable and is
     * marked superseded by the link. A revoked record cannot be
     * corrected — a revoked record stays revoked.
     *
     * @param  array{subject_title?: string, subject_hash?: string, claim?: string, subject_kind?: string}  $corrected  The corrected fields; anything not given is carried over.
     */
    public function correct(Attestation $original, array $corrected, User $issuer, string $reason): Attestation
    {
        if ($original->status === 'revoked') {
            throw new DomainException('A revoked attestation cannot be corrected. It stays revoked; issue a new attestation instead.');
        }

        if (trim($reason) === '') {
            throw new DomainException('A correction requires a stated reason.');
        }

        $newHash = $corrected['subject_hash'] ?? $original->subject_hash;

        return $this->issueManual([
            'subject_title' => $corrected['subject_title'] ?? $original->subject_title,
            'claim' => $corrected['claim'] ?? $original->claim,
            'subject_kind' => $corrected['subject_kind'] ?? $original->subject_kind,
            'subject_hash_override' => $newHash,
            'supersedes_id' => $original->id,
            'version' => ($original->version ?? 1) + 1,
            'method' => 'correction_v1',
            'force_new' => true,
        ], $issuer, 'manual', [
            'correction' => [
                'corrects_public_id' => $original->public_id,
                'reason' => $reason,
                'corrected_fields' => array_keys($corrected),
            ],
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
     * Verify an attestation's signature by the method recorded on it:
     * Ed25519 records verify from the published public key; records
     * without a recorded method verify through the legacy HMAC path,
     * exactly as issued. Old records are never re-signed.
     */
    public function verifySignature(Attestation $attestation): bool
    {
        if (! $attestation->signature || ! $attestation->issued_at) {
            return false;
        }

        $method = $attestation->signature_method ?: SigningKeyService::METHOD_HMAC;

        if ($method === SigningKeyService::METHOD_ED25519) {
            if (! $attestation->key_id) {
                return false;
            }

            return $this->keys->verify(
                $this->signedPayload($attestation),
                (string) $attestation->signature,
                (string) $attestation->key_id,
            );
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
     * Verify a record's stored RFC 3161 timestamp token against the
     * exact payload bytes the signature covers. Records without a
     * token return false — absence is reported, never treated as
     * verified. Legacy HMAC records have no timestamp token.
     */
    public function verifyTimestamp(Attestation $attestation): bool
    {
        if (! $attestation->timestamp_token) {
            return false;
        }

        return $this->timestamps->verify(
            $this->signedPayload($attestation),
            (string) $attestation->timestamp_token,
        );
    }

    /**
     * The canonical signed payload for a stored record. Rebuilt from
     * the stored fields, so it matches the bytes signed at issuance
     * exactly when the record is intact, and differs when any covered
     * field — including the statement text — has been altered.
     */
    public function signedPayload(Attestation $attestation): string
    {
        return $this->payloadFor(
            publicId: (string) $attestation->public_id,
            attestableType: (string) ($attestation->attestable_type ?? ''),
            attestableId: (string) ($attestation->attestable_id ?? ''),
            subjectKind: (string) $attestation->subject_kind,
            subjectTitle: (string) $attestation->subject_title,
            subjectHash: (string) $attestation->subject_hash,
            claim: (string) $attestation->claim,
            issuedAtIso: $attestation->issued_at->format('c'),
            issuerName: (string) $attestation->issuer_name,
            enteredVia: (string) $attestation->entered_via,
            statement: $attestation->statement(),
            supersedesId: $attestation->supersedes_id,
            version: (int) ($attestation->version ?? 1),
        );
    }

    /**
     * Sign a new issuance with Ed25519: build the statement from the
     * pending fields, bind it into the canonical payload, and sign.
     *
     * @return array{signature: string, key_id: string, method: string}
     */
    private function signEd25519(
        string $publicId,
        string $attestableType,
        string $attestableId,
        string $subjectKind,
        string $subjectTitle,
        string $subjectHash,
        string $claim,
        \Carbon\Carbon $issuedAt,
        string $enteredVia,
        ?string $supersedesId = null,
        int $version = 1,
    ): array {
        $statement = AttestationStatement::renderFromFields(
            subjectTitle: $subjectTitle,
            subjectKind: $subjectKind,
            publicId: $publicId,
            stableUrl: SiteConfig::canonical('/attestations/'.$publicId),
            subjectHash: $subjectHash,
            issuedAt: $issuedAt,
            enteredVia: $enteredVia,
            claim: $claim,
        );

        $payload = $this->payloadFor(
            publicId: $publicId,
            attestableType: $attestableType,
            attestableId: $attestableId,
            subjectKind: $subjectKind,
            subjectTitle: $subjectTitle,
            subjectHash: $subjectHash,
            claim: $claim,
            issuedAtIso: $issuedAt->format('c'),
            issuerName: 'Glenride',
            enteredVia: $enteredVia,
            statement: $statement,
            supersedesId: $supersedesId,
            version: $version,
        );

        return $this->keys->sign($payload);
    }

    /**
     * The canonical payload encoding. Fixed key order, JSON with
     * unescaped slashes and unicode, no trailing newline. The
     * encoding is part of the protocol: change it only with a
     * protocol amendment, never silently.
     */
    private function payloadFor(
        string $publicId,
        string $attestableType,
        string $attestableId,
        string $subjectKind,
        string $subjectTitle,
        string $subjectHash,
        string $claim,
        string $issuedAtIso,
        string $issuerName,
        string $enteredVia,
        string $statement,
        ?string $supersedesId = null,
        int $version = 1,
    ): string {
        return (string) json_encode([
            'public_id' => $publicId,
            'attestable_type' => $attestableType,
            'attestable_id' => $attestableId,
            'subject_kind' => $subjectKind,
            'subject_title' => $subjectTitle,
            'subject_hash' => $subjectHash,
            'claim' => $claim,
            'issued_at' => $issuedAtIso,
            'issuer_name' => $issuerName,
            'entered_via' => $enteredVia,
            'statement' => $statement,
            'supersedes_id' => $supersedesId,
            'version' => $version,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /**
     * The authorization evidence recorded for an entry path.
     */
    public function authorizationFor(string $enteredVia): string
    {
        return $enteredVia === 'automated'
            ? IssuanceChainService::AUTHORIZATION
            : self::DIRECT_AUTHORIZATION;
    }

    /**
     * Request an independent timestamp for a newly issued record.
     * Runs after the issuing transaction commits. Failure marks the
     * record and never throws: issuance stands, and
     * attestations:timestamp-missing retries later.
     */
    private function requestTimestamp(Attestation $attestation): void
    {
        $result = $this->timestamps->requestFor($this->signedPayload($attestation));

        if ($result === null) {
            $attestation->update(['timestamp_status' => 'failed']);

            return;
        }

        $attestation->update([
            'timestamp_token' => $result['token'],
            'timestamped_at' => $result['time'],
            'timestamp_source' => $result['source'],
            'timestamp_status' => 'timestamped',
        ]);
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
     *
     * Legacy path: records issued before November 17, 2026. Kept
     * byte-exact so those records verify exactly as issued. New
     * issuances never use this path.
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
